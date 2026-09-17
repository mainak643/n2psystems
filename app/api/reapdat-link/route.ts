import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const REAPDAT_API = 'https://api.reapdat.com/api/v1';

/**
 * Outbound ceiling. The portal gives up on us at 12s, so anything slower than
 * this is a spinner the recruiter is already staring at; failing here at least
 * produces a logged reason instead of a severed connection.
 */
const UPSTREAM_TIMEOUT_MS = 10_000;

/**
 * Origins allowed to call this proxy. `*` cannot be combined with credentials,
 * so the matched origin is echoed back and `Vary: Origin` keeps a CDN from
 * serving one caller's CORS headers to another.
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'https://n2-p-operations.vercel.app',
  'http://localhost:5173',
];

const allowedOrigins = new Set(
  [
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.REAPDAT_ALLOWED_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  ]
);

function corsHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };

  const origin = req.headers.get('origin');
  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

// In-memory token cache to prevent hitting Reapdat login rate limits
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * A single in-flight login shared by concurrent callers.
 *
 * Without it, two recruiters pressing "Create REAPDAT Link" in the same second
 * on a cold instance each start their own login, which is exactly the burst
 * Reapdat answers with "Too many login attempts" — and then neither request
 * has a token.
 */
let inflightLogin: Promise<string> | null = null;

async function login(): Promise<string> {
  const email = process.env.REAPDAT_EMAIL || 'karthik@n2psystems.ca';
  const password = process.env.REAPDAT_PASSWORD || 'ReapN2P123!';

  if (!email || !password) {
    throw new Error(
      'REAPDAT credentials are not configured. Set REAPDAT_EMAIL and REAPDAT_PASSWORD.'
    );
  }

  const loginRes = await fetch(`${REAPDAT_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), password: password.trim() }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!loginRes.ok) {
    const errData = await loginRes.json().catch(() => ({}));
    const errorMsg = errData.detail || `Reapdat login failed with status ${loginRes.status}`;
    console.error('Reapdat auth failed:', errorMsg);
    throw new Error(errorMsg);
  }

  const data = await loginRes.json();
  if (!data.access_token) {
    throw new Error('Reapdat login succeeded but returned no access_token');
  }

  const token = String(data.access_token);
  cachedToken = token;
  tokenExpiresAt = Date.now() + (data.expires_in || 14400) * 1000;

  return token;
}

async function getReapdatToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    cachedToken = null;
    tokenExpiresAt = 0;
  }

  // Reuse token if valid for at least 5 more minutes
  if (cachedToken && tokenExpiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken;
  }

  if (!inflightLogin) {
    inflightLogin = login().finally(() => {
      inflightLogin = null;
    });
  }

  return inflightLogin;
}

function createChatLink(token: string, payload: unknown): Promise<Response> {
  return fetch(`${REAPDAT_API}/chat-links`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
}

interface ReapdatLink {
  id: string;
  label?: string;
  tags?: string[];
  status?: string;
}

/**
 * Reclaims the slot a superseded link is holding.
 *
 * The tenant is capped at 20 links, so re-provisioning a requisition that
 * already has one would otherwise walk the account into a 403 that no recruiter
 * can resolve from the portal. Links carrying this requisition's reference code
 * are revoked, not deleted: revoking 404s the public URL immediately — which is
 * the point, an old screening link must stop taking candidates — and is
 * reversible, while DELETE also destroys the link's knowledge base.
 *
 * Best-effort throughout. A failure here must not block provisioning; it is
 * logged and the create proceeds.
 */
async function revokeSupersededLinks(token: string, referenceCode: string): Promise<void> {
  const listRes = await fetch(`${REAPDAT_API}/chat-links`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!listRes.ok) {
    console.warn(`Reapdat link inventory unavailable (status ${listRes.status}); skipping cleanup.`);
    return;
  }

  const data = await listRes.json();
  const links: ReapdatLink[] = Array.isArray(data.links) ? data.links : [];
  const count = typeof data.count === 'number' ? data.count : links.length;
  const limit = typeof data.limit === 'number' ? data.limit : 20;

  const wanted = referenceCode.toLowerCase();
  const superseded = links.filter(
    (link) =>
      link.status === 'active' &&
      (link.tags || []).some((tag) => String(tag).toLowerCase() === wanted)
  );

  for (const link of superseded) {
    const revokeRes = await fetch(`${REAPDAT_API}/chat-links/${link.id}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (revokeRes.ok) {
      console.info(`Revoked superseded Reapdat link ${link.id} for ${referenceCode}.`);
    } else {
      console.warn(`Could not revoke Reapdat link ${link.id} (status ${revokeRes.status}).`);
    }
  }

  // `-1` is unlimited. Warn while there is still room to act on the warning.
  const remaining = limit - count + superseded.length;
  if (limit !== -1 && remaining <= 3) {
    console.warn(
      `Reapdat link quota nearly exhausted: ${count}/${limit} used, ~${remaining} slot(s) free.`
    );
  }
}

interface QuestionItem {
  question?: string;
  idealAnswer?: string;
  answer?: string;
}

/**
 * Loads the requisition context and screening questions onto the link's knowledge base.
 *
 * Calls POST /knowledge/portal/ingest per item. Best-effort throughout: an
 * ingestion glitch must never abort returning a working chat/call link.
 */
async function ingestKnowledgeForLink(
  token: string,
  linkId: string,
  referenceCode: string,
  title: string,
  department: string,
  screeningQuestions: unknown[]
): Promise<number> {
  let ingestedCount = 0;

  // 1. Ingest role context
  try {
    const roleOverview = `Job Requisition: ${title || 'Open Position'} (${referenceCode}).${
      department ? ` Department: ${department}.` : ''
    } You are the AI screening assistant for N2P Systems. Screen candidates politely and verify all role criteria and pre-screening questions.`;

    const overviewRes = await fetch(`${REAPDAT_API}/knowledge/portal/ingest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        link_id: linkId,
        content: roleOverview,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (overviewRes.ok) {
      ingestedCount++;
    } else {
      console.warn(`Could not ingest role overview for link ${linkId}: status ${overviewRes.status}`);
    }
  } catch (err) {
    console.warn(`Failed to ingest role overview for link ${linkId}:`, err);
  }

  // 2. Ingest screening questions
  for (const q of screeningQuestions) {
    try {
      let questionText = '';
      let answerText = 'Candidate must meet or confirm this requirement during screening.';

      if (typeof q === 'string') {
        questionText = q.trim();
      } else if (typeof q === 'object' && q !== null) {
        const item = q as QuestionItem;
        questionText = String(item.question ?? '').trim();
        if (item.idealAnswer || item.answer) {
          answerText = `Ideal response / target requirement: ${String(item.idealAnswer || item.answer).trim()}`;
        }
      }

      if (!questionText) continue;

      const qRes = await fetch(`${REAPDAT_API}/knowledge/portal/ingest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          link_id: linkId,
          question: questionText.slice(0, 500),
          answer: answerText.slice(0, 500),
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      if (qRes.ok) {
        ingestedCount++;
      } else {
        console.warn(`Could not ingest question for link ${linkId}: status ${qRes.status}`);
      }
    } catch (err) {
      console.warn(`Failed to ingest question for link ${linkId}:`, err);
    }
  }

  return ingestedCount;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { status: 'ok', service: 'reapdat-link-provisioner' },
    { headers: corsHeaders(req) }
  );
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);

  try {
    const body = await req.json().catch(() => ({}));

    // Trim and cap before anything is built from these: they reach a vendor
    // payload with its own length limits (label 120, tags 8x40), and a 422 from
    // Reapdat is a worse error than a truncation we chose.
    const referenceCode = String(body.referenceCode ?? '').trim().slice(0, 20);
    const title = String(body.title ?? '').trim().slice(0, 100);
    const department = String(body.department ?? '').trim().slice(0, 40);
    const screeningQuestions = Array.isArray(body.screeningQuestions)
      ? body.screeningQuestions
      : [];

    if (!referenceCode) {
      return NextResponse.json(
        { ok: false, success: false, error: 'Missing referenceCode in request body' },
        { status: 400, headers: cors }
      );
    }

    let token = await getReapdatToken();

    // Best-effort, and deliberately before the create so the freed slot is
    // available to it.
    try {
      await revokeSupersededLinks(token, referenceCode);
    } catch (cleanupErr) {
      console.warn('Reapdat link cleanup skipped:', cleanupErr);
    }

    const linkLabel = title ? `${title} (${referenceCode})` : `Requisition ${referenceCode}`;

    const tags: string[] = [referenceCode];
    if (department) tags.push(department);

    const payload = {
      label: linkLabel.slice(0, 120),
      tags: tags.slice(0, 8),
      channels: ['chat', 'call'],
      inherit_main_kb: true,
    };

    let createRes = await createChatLink(token, payload);

    // A token can be revoked on Reapdat's side before its stated expiry, which
    // leaves a cached token that looks fresh and is not. One forced re-auth and
    // one retry; a second 401 is a real authorization problem, not staleness.
    if (createRes.status === 401) {
      console.warn('Reapdat rejected cached token; re-authenticating once.');
      token = await getReapdatToken(true);
      createRes = await createChatLink(token, payload);
    }

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}));
      if (createRes.status === 401) {
        cachedToken = null;
        tokenExpiresAt = 0;
      }
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: errData.detail || `Link creation failed with status ${createRes.status}`,
        },
        { status: createRes.status, headers: cors }
      );
    }

    const linkData = await createRes.json();
    const linkUrl = linkData.url;
    const linkId = String(linkData.id ?? '');

    // Ingest the role context and screening questions into the link's isolated knowledge base
    let ingestedItems = 0;
    if (linkId) {
      try {
        ingestedItems = await ingestKnowledgeForLink(
          token,
          linkId,
          referenceCode,
          title,
          department,
          screeningQuestions
        );
      } catch (ingestErr) {
        console.warn(`Reapdat knowledge ingest skipped for ${referenceCode}:`, ingestErr);
      }
    }

    /*
      Mirror the link onto the requisition.

      This runs on the public anon key, which RLS grants SELECT and not UPDATE,
      so it is expected to be refused until a service-role key is configured
      here. The portal performs the authoritative write itself once this
      response returns, so a refusal costs nothing — but supabase-js reports it
      in `error` rather than throwing, and the previous try/catch could not see
      that, which made a permanent no-op look like a working write.
    */
    if (supabase) {
      const { error: dbError } = await supabase
        .from('requirements')
        .update({ reapdat_chat_link: linkUrl, reapdat_enabled: true })
        .eq('reference_code', referenceCode);

      if (dbError) {
        console.warn(
          `Proxy-side requirement mirror skipped for ${referenceCode}: ${dbError.message}`
        );
      }
    }

    return NextResponse.json(
      {
        ok: true,
        success: true,
        status: 'provisioned',
        link: linkUrl,
        message: `REAPDAT chat & voice screening link provisioned for ${referenceCode}`,
        details: {
          id: linkData.id,
          token: linkData.token,
          channels: linkData.channels,
          ingested_knowledge_items: ingestedItems,
        },
      },
      { status: 200, headers: cors }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    console.error('Reapdat link provisioning failed:', errorMsg);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: isTimeout ? 'Reapdat did not respond in time. Please try again.' : errorMsg,
      },
      { status: isTimeout ? 504 : 500, headers: cors }
    );
  }
}
