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
 * Origins allowed to call this proxy.
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'https://n2-p-operations.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
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

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  // Match any localhost or 127.0.0.1 (any port, http or https)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.hostname.endsWith('.vercel.app') || parsed.hostname === 'n2psystems.ca') {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    Vary: 'Origin',
  };

  const origin = req.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

// In-memory token cache to prevent hitting Reapdat login rate limits
let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let inflightLogin: Promise<string> | null = null;

async function login(): Promise<string> {
  const email = process.env.REAPDAT_EMAIL;
  const password = process.env.REAPDAT_PASSWORD;

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

/**
 * Returns authentication headers: prefer Admin API Key (X-API-Key) if provided in env,
 * otherwise fall back to authenticated bearer token session.
 */
async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const adminKey = process.env.REAPDAT_ADMIN_API_KEY || process.env.REAPDAT_API_KEY;
  if (adminKey && adminKey.trim().startsWith('ua_admin_')) {
    return { 'X-API-Key': adminKey.trim() };
  }
  const token = await getReapdatToken(forceRefresh);
  return { Authorization: `Bearer ${token}` };
}

interface ReapdatLink {
  id: string;
  label?: string;
  tags?: string[];
  status?: string;
  url?: string;
  token?: string;
  channels?: string[];
  is_active?: boolean;
  kb_docs?: number;
  kb_chunks?: number;
  kb_sources?: Record<string, number>;
  created_at?: string;
}

/**
 * Reclaims the slot a superseded link is holding.
 */
async function revokeSupersededLinks(authHeaders: Record<string, string>, referenceCode: string): Promise<void> {
  const listRes = await fetch(`${REAPDAT_API}/chat-links`, {
    headers: authHeaders,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!listRes.ok) {
    console.warn(`Reapdat link inventory unavailable (status ${listRes.status}); skipping cleanup.`);
    return;
  }

  const data = await listRes.json();
  const links: ReapdatLink[] = Array.isArray(data.links) ? data.links : [];
  const wanted = referenceCode.toLowerCase();
  const superseded = links.filter(
    (link) =>
      link.status === 'active' &&
      (link.tags || []).some((tag) => String(tag).toLowerCase() === wanted)
  );

  for (const link of superseded) {
    const delRes = await fetch(`${REAPDAT_API}/chat-links/${link.id}`, {
      method: 'DELETE',
      headers: authHeaders,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (delRes.ok) {
      console.info(`Deleted superseded Reapdat link ${link.id} for ${referenceCode}.`);
    } else {
      await fetch(`${REAPDAT_API}/chat-links/${link.id}/revoke`, {
        method: 'POST',
        headers: authHeaders,
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      }).catch(() => {});
    }
  }
}

interface QuestionItem {
  question?: string;
  idealAnswer?: string;
  answer?: string;
}

/**
 * Loads requisition context and screening questions onto the link's knowledge base.
 */
async function ingestKnowledgeForLink(
  authHeaders: Record<string, string>,
  linkId: string,
  referenceCode: string,
  title: string,
  department: string,
  screeningQuestions: unknown[],
  details?: {
    description?: string;
    location?: string;
    workMode?: string;
    experienceLevel?: string;
    minExperienceYears?: number;
    mandatorySkills?: string[];
  }
): Promise<number> {
  const sections: string[] = [];

  sections.push(`# Candidate Pre-Screening Guidelines: ${title || 'Open Position'} (${referenceCode})`);

  const roleSpecs: string[] = [];
  if (department) roleSpecs.push(`- Department: ${department}`);
  if (details?.location) roleSpecs.push(`- Location: ${details.location}`);
  if (details?.workMode) roleSpecs.push(`- Work Mode: ${details.workMode}`);
  if (details?.experienceLevel || details?.minExperienceYears) {
    const exp = [details.experienceLevel, details.minExperienceYears ? `${details.minExperienceYears}+ years` : null]
      .filter(Boolean)
      .join(' / ');
    roleSpecs.push(`- Required Experience: ${exp}`);
  }
  if (details?.mandatorySkills && details.mandatorySkills.length > 0) {
    roleSpecs.push(`- Key Mandatory Skills: ${details.mandatorySkills.join(', ')}`);
  }

  if (roleSpecs.length > 0) {
    sections.push(`## Role Specifications:\n${roleSpecs.join('\n')}`);
  }

  sections.push(
    `## Role Scope & Screening Mission:\nYou are the AI screening assistant for N2P Systems. Screen candidates politely, verify their qualifications against the required criteria, and evaluate their responses to the mandatory pre-screening questions.`
  );

  if (details?.description) {
    sections.push(`## Job Description & Responsibilities:\n${details.description}`);
  }

  const formattedQuestions: string[] = [];
  screeningQuestions.forEach((q, idx) => {
    let questionText = '';
    let targetText = 'Candidate must meet or confirm this requirement during screening.';

    if (typeof q === 'string') {
      questionText = q.trim();
    } else if (typeof q === 'object' && q !== null) {
      const item = q as QuestionItem;
      questionText = String(item.question ?? '').trim();
      if (item.idealAnswer || item.answer) {
        targetText = `Target / Ideal response: ${String(item.idealAnswer || item.answer).trim()}`;
      }
    }

    if (questionText) {
      formattedQuestions.push(`${idx + 1}. Question: ${questionText}\n   Evaluation Criteria: ${targetText}`);
    }
  });

  if (formattedQuestions.length > 0) {
    sections.push(`## Mandatory Pre-Screening Questions & Dealbreakers:\n${formattedQuestions.join('\n\n')}`);
  }

  const unifiedDoc = sections.join('\n\n');

  try {
    const res = await fetch(`${REAPDAT_API}/knowledge/portal/ingest`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        link_id: linkId,
        content: unifiedDoc,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (res.ok) {
      return 1;
    } else {
      const errText = await res.text().catch(() => '');
      console.warn(`Could not ingest knowledge for link ${linkId}: status ${res.status}`, errText);
      return 0;
    }
  } catch (err) {
    console.warn(`Failed to ingest knowledge for link ${linkId}:`, err);
    return 0;
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}

/**
 * GET /api/reapdat-link?referenceCode=REQ-XXXXX
 * Fetches the specific active link for a single requisition.
 */
export async function GET(req: NextRequest) {
  const cors = corsHeaders(req);
  const ref = req.nextUrl.searchParams.get('referenceCode')?.trim();

  if (!ref) {
    return NextResponse.json(
      { status: 'ok', service: 'reapdat-link-provisioner' },
      { headers: cors }
    );
  }

  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${REAPDAT_API}/chat-links`, {
      headers: authHeaders,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, success: false, error: `Reapdat returned status ${res.status}` },
        { status: res.status, headers: cors }
      );
    }

    const data = await res.json();
    const links: ReapdatLink[] = Array.isArray(data.links) ? data.links : [];
    const wanted = ref.toLowerCase();

    // Match by tag (e.g. "req-43674") or matching reference in label
    const matched = links.find(
      (l) =>
        (l.tags || []).some((t) => String(t).toLowerCase() === wanted) ||
        (l.label && l.label.toLowerCase().includes(wanted))
    );

    if (!matched) {
      return NextResponse.json(
        { ok: true, success: true, found: false, message: `No active link found for ${ref}` },
        { status: 200, headers: cors }
      );
    }

    return NextResponse.json(
      { ok: true, success: true, found: true, link: matched },
      { status: 200, headers: cors }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query link';
    return NextResponse.json(
      { ok: false, success: false, error: msg },
      { status: 500, headers: cors }
    );
  }
}

/**
 * PATCH /api/reapdat-link
 * Updates channels (chat/call/book) or active state for a specific link.
 */
export async function PATCH(req: NextRequest) {
  const cors = corsHeaders(req);

  try {
    const body = await req.json().catch(() => ({}));
    const linkId = String(body.linkId ?? '').trim();

    if (!linkId) {
      return NextResponse.json(
        { ok: false, success: false, error: 'Missing linkId' },
        { status: 400, headers: cors }
      );
    }

    const payload: Record<string, unknown> = {};
    if (Array.isArray(body.channels) && body.channels.length > 0) {
      payload.channels = body.channels;
    }
    if (typeof body.label === 'string') {
      payload.label = body.label.slice(0, 120);
    }
    if (typeof body.is_active === 'boolean') {
      payload.is_active = body.is_active;
    }

    const authHeaders = await getAuthHeaders();
    const patchRes = await fetch(`${REAPDAT_API}/chat-links/${linkId}`, {
      method: 'PATCH',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, success: false, error: err.detail || `Update failed (${patchRes.status})` },
        { status: patchRes.status, headers: cors }
      );
    }

    const updated = await patchRes.json();
    return NextResponse.json(
      { ok: true, success: true, link: updated },
      { status: 200, headers: cors }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating link';
    return NextResponse.json(
      { ok: false, success: false, error: msg },
      { status: 500, headers: cors }
    );
  }
}

/**
 * POST /api/reapdat-link
 * Handles:
 * 1. multipart/form-data: Document uploads to link knowledge base (/knowledge/portal/upload)
 * 2. action="revoke": Revokes an active link
 * 3. Default: Provisions a new screening link and syncs knowledge
 */
export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);
  const contentType = req.headers.get('content-type') || '';

  try {
    const authHeaders = await getAuthHeaders();

    // 1. Handle File Upload (Multipart Form Data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const linkId = formData.get('link_id') as string | null;

      if (!file || !linkId) {
        return NextResponse.json(
          { ok: false, success: false, error: 'Both file and link_id are required' },
          { status: 400, headers: cors }
        );
      }

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('link_id', linkId);

      const uploadRes = await fetch(`${REAPDAT_API}/knowledge/portal/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: uploadData,
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        return NextResponse.json(
          { ok: false, success: false, error: err.detail || `Upload failed (${uploadRes.status})` },
          { status: uploadRes.status, headers: cors }
        );
      }

      const uploadResult = await uploadRes.json();
      return NextResponse.json(
        { ok: true, success: true, result: uploadResult },
        { status: 200, headers: cors }
      );
    }

    // 2. JSON Request Handling
    const body = await req.json().catch(() => ({}));

    // Action: Revoke Link
    if (body.action === 'revoke' && body.linkId) {
      const revokeRes = await fetch(`${REAPDAT_API}/chat-links/${body.linkId}/revoke`, {
        method: 'POST',
        headers: authHeaders,
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      if (!revokeRes.ok) {
        const err = await revokeRes.json().catch(() => ({}));
        return NextResponse.json(
          { ok: false, success: false, error: err.detail || 'Failed to revoke link' },
          { status: revokeRes.status, headers: cors }
        );
      }

      return NextResponse.json(
        { ok: true, success: true, message: 'Link successfully revoked' },
        { status: 200, headers: cors }
      );
    }

    // Action: Ingest Text / Q&A Knowledge
    if (body.action === 'ingest' && body.linkId && body.content) {
      const ingestRes = await fetch(`${REAPDAT_API}/knowledge/portal/ingest`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          link_id: body.linkId,
          content: body.content,
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      if (!ingestRes.ok) {
        const err = await ingestRes.json().catch(() => ({}));
        return NextResponse.json(
          { ok: false, success: false, error: err.detail || 'Knowledge ingest failed' },
          { status: ingestRes.status, headers: cors }
        );
      }

      const ingestResult = await ingestRes.json();
      return NextResponse.json(
        { ok: true, success: true, result: ingestResult },
        { status: 200, headers: cors }
      );
    }

    // Default: Provision link & sync knowledge
    const referenceCode = String(body.referenceCode ?? '').trim().slice(0, 20);
    const title = String(body.title ?? '').trim().slice(0, 100);
    const department = String(body.department ?? '').trim().slice(0, 40);
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim().slice(0, 100) : '';
    const workMode = typeof body.workMode === 'string' ? body.workMode.trim().slice(0, 50) : '';
    const experienceLevel = typeof body.experienceLevel === 'string' ? body.experienceLevel.trim().slice(0, 50) : '';
    const minExperienceYears = typeof body.minExperienceYears === 'number' ? body.minExperienceYears : undefined;
    const mandatorySkills = Array.isArray(body.mandatorySkills)
      ? body.mandatorySkills.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 20)
      : [];
    const screeningQuestions = Array.isArray(body.screeningQuestions)
      ? body.screeningQuestions
      : [];

    if (!referenceCode) {
      return NextResponse.json(
        { ok: false, success: false, error: 'Missing referenceCode in request body' },
        { status: 400, headers: cors }
      );
    }

    // Best-effort cleanup of previous superseded link for this reference code
    try {
      await revokeSupersededLinks(authHeaders, referenceCode);
    } catch (cleanupErr) {
      console.warn('Reapdat link cleanup skipped:', cleanupErr);
    }

    const linkLabel = title ? `${title} (${referenceCode})` : `Requisition ${referenceCode}`;
    const tags: string[] = [referenceCode];
    if (department) tags.push(department);

    const payload = {
      label: linkLabel.slice(0, 120),
      tags: tags.slice(0, 8),
      channels: Array.isArray(body.channels) && body.channels.length > 0 ? body.channels : ['chat', 'call'],
      inherit_main_kb: true,
    };

    let createRes = await fetch(`${REAPDAT_API}/chat-links`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (createRes.status === 401) {
      console.warn('Reapdat rejected cached token; re-authenticating once.');
      const freshHeaders = await getAuthHeaders(true);
      createRes = await fetch(`${REAPDAT_API}/chat-links`, {
        method: 'POST',
        headers: {
          ...freshHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
    }

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}));
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

    let ingestedItems = 0;
    if (linkId) {
      try {
        ingestedItems = await ingestKnowledgeForLink(
          authHeaders,
          linkId,
          referenceCode,
          title,
          department,
          screeningQuestions,
          {
            description,
            location,
            workMode,
            experienceLevel,
            minExperienceYears,
            mandatorySkills,
          }
        );
      } catch (ingestErr) {
        console.warn(`Reapdat knowledge ingest skipped for ${referenceCode}:`, ingestErr);
      }
    }

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
        linkId: linkData.id,
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
