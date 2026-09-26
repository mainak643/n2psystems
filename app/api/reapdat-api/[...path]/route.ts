import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
async function isAuthenticatedCaller(req: NextRequest): Promise<boolean> {
  const header = req.headers.get('authorization') || '';
  if (!/^bearer\s/i.test(header)) return false;
  const token = header.slice(header.indexOf(' ') + 1).trim();
  if (!token) return false;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    return !error && Boolean(data?.user);
  } catch {
    // A transport failure reaching the auth server is not proof of identity.
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
];

function isAllowedRoute(method: string, path: string): boolean {
  return ROUTES.some((r) => r.method === method && r.pattern.test(path));
}

function deny(status: number, detail: string, cors: Record<string, string>): NextResponse {
  // Same `{ detail }` envelope REAPDAT uses, so the ATS client's error handling
  // does not need a second shape for failures that stop here.
  return NextResponse.json({ detail }, { status, headers: cors });
}

async function relay(
  req: NextRequest,
  segments: string[],
  method: 'GET' | 'POST' | 'DELETE'
): Promise<NextResponse> {
  const cors = corsHeaders(req);

  if (!(await isAuthenticatedCaller(req))) {
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

  const isMedia = /\/(recording|report\.pdf)$/.test(path);
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
      signal: AbortSignal.timeout(isMedia ? MEDIA_TIMEOUT_MS : UPSTREAM_TIMEOUT_MS),
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
        ? 'The screening service did not respond in time.'
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
