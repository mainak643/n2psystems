import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

/**
 * REAPDAT Questionnaires API — production proxy for the RecruitOps ATS.
 *
 * The ATS (`ops.n2psystems.com`) is a static SPA, so it has no server of its own
 * and its Vite dev proxy does not exist in a build. This is the production half
 * of that path: the browser calls `/api/reapdat-api/<upstream path>` and we
 * forward it to REAPDAT with the admin key attached here.
 *
 * The key never reaches the browser, and that is a functional requirement as
 * much as a security one — REAPDAT refuses a browser-embedded key with a 403,
 * and `api.reapdat.com` sends no CORS headers, so a direct call from the SPA
 * could not work even if we were willing to publish the credential.
 *
 * Deliberately a thin pass-through rather than a per-endpoint wrapper like
 * `/api/reapdat-link`. That route builds knowledge documents and enforces
 * ingest ceilings because it *composes* upstream calls; this one relays a REST
 * API the ATS already models in `src/types/reapdat.ts`. Re-declaring every
 * questionnaire endpoint here would mean two places to change whenever REAPDAT
 * adds a field. What it does add is the three things a relay must own: caller
 * authentication, an allowlist of upstream paths, and a response passthrough
 * that handles binary as well as JSON.
 */

const REAPDAT_API = 'https://api.reapdat.com/api/v1';

/** Reads and metadata writes: one upstream call. */
const UPSTREAM_TIMEOUT_MS = 15_000;

/** A recording is tens of megabytes and a PDF is rendered per request. */
const MEDIA_TIMEOUT_MS = 60_000;

/**
 * Outbound messaging writes. A send that times out here may still have gone
 * out upstream, and the recruiter's natural response to an error is to press
 * Send again — so it gets the room to finish rather than a fast failure.
 */
const SEND_TIMEOUT_MS = 30_000;

const DEFAULT_ALLOWED_ORIGINS = [
  'https://ops.n2psystems.com',
  'https://n2psystems.com',
  'https://www.n2psystems.com',
  'https://n2-p-operations.vercel.app',
];

const DEV_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
];

const allowedOrigins = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...(process.env.NODE_ENV !== 'production' ? DEV_ALLOWED_ORIGINS : []),
  ...(process.env.REAPDAT_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
]);

/** Mirrors `/api/reapdat-link`'s check, including its two narrowing fixes. */
function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return true;
  }
  try {
    const { hostname } = new URL(origin);
    // Two trailing segments required: a bare `.vercel.app` suffix, or a
    // `n2-p-operations-` prefix, both match projects anyone can claim.
    if (/^n2-p-operations-[a-z0-9]+-[a-z0-9-]+\.vercel\.app$/.test(hostname)) return true;
    return (
      hostname === 'ops.n2psystems.com' ||
      hostname === 'n2psystems.com' ||
      hostname === 'www.n2psystems.com'
    );
  } catch {
    return false;
  }
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Range',
    // Without this the player cannot read the size of what it is streaming.
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Range, Accept-Ranges, Content-Length',
    Vary: 'Origin',
  };
  const origin = req.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

/**
 * Caller authentication.
 *
 * Everything past this point spends the operator's REAPDAT account — minting
 * sessions, reading candidates' recorded answers, and deleting media. CORS does
 * not gate any of it: it is advisory, browser-only, and a request that omits
 * `Origin` was never subject to it.
 *
 * The bearer token is the Supabase session the ATS already holds, so this adds
 * no new secret to distribute, and `auth.getUser` validates it against the
 * project rather than trusting its claims.
 */
async function authenticatedCaller(
  req: NextRequest
): Promise<{ id: string; token: string } | null> {
  const header = req.headers.get('authorization') || '';
  if (!/^bearer\s/i.test(header)) return null;
  const token = header.slice(header.indexOf(' ') + 1).trim();
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    return !error && data?.user ? { id: data.user.id, token } : null;
  } catch {
    // A transport failure reaching the auth server is not proof of identity.
    return null;
  }
}

/** The roles that triage applicants — the same list screen-application admits. */
const STAFF_ROLES = ['Admin', 'Manager', 'Recruiter'];

/**
 * Whether the caller may send messages on the operator's account.
 *
 * Being signed in is enough to read a questionnaire result; it is not enough
 * to send mail. `/communication/send-one` bills the account, records consent
 * for the recipient on its own, and delivers from the business's sending
 * reputation — so a signed-in account with no staff role (a client login, or a
 * fresh sign-up, which 00013 parks on a role with no access) could otherwise
 * mail anyone as N2P.
 *
 * The role is read with the caller's own token rather than a service key:
 * `authenticated` may read `profiles`, and 00013 removed a user's ability to
 * write their own role, so the value cannot be self-promoted.
 */
async function isStaffCaller(caller: { id: string; token: string }): Promise<boolean> {
  try {
    const asCaller = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${caller.token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await asCaller.from('profiles').select('role').eq('id', caller.id).maybeSingle();
    return STAFF_ROLES.includes(String(data?.role ?? ''));
  } catch {
    return false;
  }
}

function getApiKey(): string | null {
  const key = process.env.REAPDAT_ADMIN_API_KEY || process.env.REAPDAT_API_KEY;
  return key && key.trim().startsWith('ua_admin_') ? key.trim() : null;
}

/**
 * Upstream paths this relay will forward, and with which methods.
 *
 * An open relay carrying an admin key would let any signed-in user reach every
 * endpoint on the REAPDAT account — including `/chat-links`, whose listing
 * returns the tokens behind every candidate URL the other integration has ever
 * minted. So the surface is enumerated rather than pattern-matched loosely, and
 * a token segment is matched as one path component so it cannot carry a slash.
 *
 * A token is 32 URL-safe base64 characters and may begin with `-`, hence the
 * leading hyphen in the class.
 */
const TOKEN = '[A-Za-z0-9_-]{1,64}';
const ROUTES: Array<{ method: string; pattern: RegExp }> = [
  { method: 'GET', pattern: new RegExp('^/questionnaires$') },
  { method: 'GET', pattern: new RegExp('^/questionnaires/links/all$') },
  { method: 'GET', pattern: new RegExp(`^/questionnaires/links/${TOKEN}/result$`) },
  { method: 'GET', pattern: new RegExp(`^/questionnaires/links/${TOKEN}/recording$`) },
  { method: 'GET', pattern: new RegExp(`^/questionnaires/links/${TOKEN}/report\\.pdf$`) },
  { method: 'POST', pattern: new RegExp('^/questionnaires/bundle$') },
  { method: 'POST', pattern: new RegExp('^/questionnaires/parse$') },
  { method: 'POST', pattern: new RegExp(`^/questionnaires/links/${TOKEN}/revoke$`) },
  { method: 'DELETE', pattern: new RegExp(`^/questionnaires/links/${TOKEN}/recording$`) },

  // Outbound candidate messaging, and only the part the ATS uses: whether a
  // channel can send, the templates it sends from, one message to one person,
  // and the log of what went. Broadcasts, audiences and suppression stay shut.
  // Staff only — see isStaffCaller.
  { method: 'GET', pattern: new RegExp('^/communication/readiness$') },
  { method: 'GET', pattern: new RegExp('^/communication/templates$') },
  { method: 'POST', pattern: new RegExp('^/communication/templates$') },
  // WhatsApp only: Meta approves the exact wording before it can send, and
  // review is pulled rather than pushed, so the ATS submits a new wording and
  // re-reads its status from the listing above. Scoped to one id segment, so
  // it cannot be walked onto another template path.
  { method: 'POST', pattern: new RegExp(`^/communication/templates/${TOKEN}/submit$`) },
  { method: 'POST', pattern: new RegExp('^/communication/send-one$') },
  { method: 'GET', pattern: new RegExp('^/communication/messages$') },
];

function isAllowedRoute(method: string, path: string): boolean {
  return ROUTES.some((r) => r.method === method && r.pattern.test(path));
}

function deny(status: number, detail: string, cors: Record<string, string>): NextResponse {
  // Same `{ detail }` envelope REAPDAT uses, so the ATS client's error handling
  // does not need a second shape for failures that stop here.
  return NextResponse.json({ detail }, { status, headers: cors });
}

/**
 * Is the relay actually able to reach REAPDAT?
 *
 * Authentication runs before everything else below, which is correct — but it
 * means that from outside, with no session to hand, a missing key and an
 * expired token are the same 401. This answers the question that ambiguity
 * hides, and is the one path deliberately reachable without a session.
 *
 * It reports booleans, a status code and a count. Never the key, never its
 * length or prefix, and never a candidate's name, email or answers. "The
 * integration is configured" is the whole disclosure.
 *
 * Handled here rather than as its own `_health` segment because the catch-all
 * shadows sibling routes on this path.
 */
async function health(cors: Record<string, string>): Promise<NextResponse> {
  const raw = process.env.REAPDAT_ADMIN_API_KEY || process.env.REAPDAT_API_KEY;
  const configured = Boolean(raw?.trim());
  const usable = Boolean(raw?.trim().startsWith('ua_admin_'));
  const headers = { ...cors, 'Cache-Control': 'no-store' };

  if (!usable) {
    return NextResponse.json(
      {
        configured,
        usable,
        upstream: null,
        hint: configured
          ? 'A key is set but does not begin with ua_admin_. The relay accepts only an admin key.'
          : 'Set REAPDAT_ADMIN_API_KEY on the Vercel project (Production) and redeploy — env vars are captured per deployment.',
      },
      { headers }
    );
  }

  try {
    const res = await fetch(`${REAPDAT_API}/questionnaires`, {
      headers: { 'X-API-Key': raw!.trim() },
      signal: AbortSignal.timeout(10_000),
    });
    const body = res.ok ? ((await res.json()) as { questionnaires?: unknown[] }) : null;
    return NextResponse.json(
      {
        configured: true,
        usable: true,
        upstream: { status: res.status, questionnaires: body?.questionnaires?.length ?? null },
        hint: res.ok ? 'Relay can reach REAPDAT.' : 'REAPDAT rejected the configured key.',
      },
      { headers }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        configured: true,
        usable: true,
        upstream: { status: null, error: err instanceof Error ? err.name : 'unknown' },
        hint: 'Key is present but REAPDAT was unreachable from the function.',
      },
      { headers }
    );
  }
}

async function relay(
  req: NextRequest,
  segments: string[],
  method: 'GET' | 'POST' | 'DELETE'
): Promise<NextResponse> {
  const cors = corsHeaders(req);

  if (method === 'GET' && segments.length === 1 && segments[0] === '_health') {
    return health(cors);
  }

  const caller = await authenticatedCaller(req);
  if (!caller) {
    return deny(401, 'Authentication required.', cors);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return deny(
      503,
      'REAPDAT_ADMIN_API_KEY is not configured on the server.',
      cors
    );
  }

  // Rebuilt from the parsed segments rather than taken from the raw URL, so a
  // `..` or an encoded slash cannot walk outside the allowlisted surface.
  const path = `/${segments.map(encodeURIComponent).join('/')}`
    // `report.pdf` is one segment and its dot must survive encoding.
    .replace(/%2E/gi, '.');

  if (!isAllowedRoute(method, path)) {
    return deny(404, 'No such endpoint.', cors);
  }

  const isMessaging = path.startsWith('/communication/');
  if (isMessaging && !(await isStaffCaller(caller))) {
    return deny(403, 'Only recruiting staff can send messages to candidates.', cors);
  }

  const isMedia = /\/(recording|report\.pdf)$/.test(path);
  const timeoutMs = isMedia
    ? MEDIA_TIMEOUT_MS
    : isMessaging && method === 'POST'
    ? SEND_TIMEOUT_MS
    : UPSTREAM_TIMEOUT_MS;
  const search = req.nextUrl.search || '';

  try {
    const upstream = await fetch(`${REAPDAT_API}${path}${search}`, {
      method,
      headers: {
        'X-API-Key': apiKey,
        ...(req.headers.get('content-type')
          ? { 'Content-Type': req.headers.get('content-type') as string }
          : {}),
        // Forwarded so a player can seek rather than refetch the whole file.
        ...(req.headers.get('range') ? { Range: req.headers.get('range') as string } : {}),
      },
      body: method === 'POST' ? await req.text() : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const headers = new Headers(cors);
    for (const name of [
      'content-type',
      'content-disposition',
      'content-range',
      'accept-ranges',
      'content-length',
    ]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    // Recorded answers are not cacheable by anything between here and the
    // recruiter's browser.
    headers.set('Cache-Control', 'no-store');

    // Streamed rather than buffered: a 60MB recording should not be held in
    // function memory in full before the first byte reaches the player.
    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    console.error('reapdat-api relay failed:', path, err);
    return deny(
      isTimeout ? 504 : 502,
      isTimeout
        ? isMessaging
          ? 'REAPDAT did not answer in time.'
          : 'The screening service did not respond in time.'
        : isMessaging
        ? 'Could not reach REAPDAT.'
        : 'Could not reach the screening service.',
      cors
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return relay(req, (await ctx.params).path ?? [], 'GET');
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return relay(req, (await ctx.params).path ?? [], 'POST');
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return relay(req, (await ctx.params).path ?? [], 'DELETE');
}
