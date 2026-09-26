import { NextRequest, NextResponse } from 'next/server';

/**
 * Is the REAPDAT questionnaires relay actually able to reach REAPDAT?
 *
 * The relay itself authenticates the caller before it looks at anything else,
 * which is correct — but it means a misconfigured key is indistinguishable from
 * a bad session when you are debugging from outside with no token to hand. This
 * answers the one question that ambiguity hides.
 *
 * It reports booleans, a status code and a count. Never the key, never its
 * length or prefix, and never a candidate's name, email or answers. "The
 * integration is configured" is the whole disclosure, and an operator can learn
 * as much by watching the feature work.
 *
 * A static segment, so Next resolves it ahead of the `[...path]` catch-all.
 */

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const key = process.env.REAPDAT_ADMIN_API_KEY || process.env.REAPDAT_API_KEY;
  const configured = Boolean(key?.trim());
  // The relay requires this prefix, so a key that lacks it is configured and
  // still unusable — a distinction worth reporting separately.
  const usable = Boolean(key?.trim().startsWith('ua_admin_'));

  if (!usable) {
    return NextResponse.json(
      {
        configured,
        usable,
        upstream: null,
        hint: configured
          ? 'A key is set but does not begin with ua_admin_. The relay only accepts an admin key.'
          : 'Set REAPDAT_ADMIN_API_KEY in the Vercel project (Production) and redeploy — env vars are captured per deployment.',
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const res = await fetch('https://api.reapdat.com/api/v1/questionnaires', {
      headers: { 'X-API-Key': key!.trim() },
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
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        configured: true,
        usable: true,
        upstream: { status: null, error: err instanceof Error ? err.name : 'unknown' },
        hint: 'Key is present but REAPDAT was unreachable from the function.',
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
