import { timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { fetchPublishedJobs } from '@/lib/jobs-service';
import { getServiceAccountCredentials, publishUrlNotification, type IndexingActionType } from '@/lib/google-indexing';
import { submitToIndexNow } from '@/lib/indexnow';
import { SITE_URL } from '@/lib/site';

/**
 * Pushes new, changed and closed job postings to search engines without
 * anyone having to remember to.
 *
 * Two callers:
 *
 *  1. Supabase Database Webhook (instant) — POST, on INSERT/UPDATE/DELETE of
 *     `requirements`. Configure it in Supabase → Database → Webhooks with the
 *     header `Authorization: Bearer <INDEXING_SECRET_KEY>`. A posting is then
 *     live on the site and submitted to Google and IndexNow within seconds of
 *     a recruiter publishing it; closing it tells Google to drop it.
 *
 *  2. Vercel Cron (safety net) — GET, daily (vercel.json). Re-submits every
 *     posting created or edited in the last `hours` (default 25), in case a
 *     webhook delivery was missed. Vercel signs it with CRON_SECRET.
 *
 * Google's Indexing API is used only when service-account credentials are
 * configured; IndexNow needs nothing beyond the key file in /public.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LIVE_STATUSES = new Set(['active', 'open']);
/** Google's default Indexing API quota is 200 publishes a day. */
const MAX_GOOGLE_PER_RUN = 100;

function safeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
}

function authorized(req: NextRequest): boolean {
  const secrets = [process.env.CRON_SECRET, process.env.INDEXING_SECRET_KEY]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  if (secrets.length === 0) return process.env.NODE_ENV === 'development';

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const apiKey = req.headers.get('x-api-key')?.trim();
  const provided = bearer || apiKey;
  return !!provided && secrets.some((secret) => safeEquals(provided, secret));
}

const jobUrl = (ref: string) => `${SITE_URL}/jobs/${encodeURIComponent(ref)}`;

async function notifyGoogle(entries: { url: string; action: IndexingActionType }[]) {
  if (!getServiceAccountCredentials()) return { configured: false as const, results: [] };
  const results = [];
  for (const entry of entries.slice(0, MAX_GOOGLE_PER_RUN)) {
    const r = await publishUrlNotification(entry.url, entry.action);
    results.push({ url: r.url, action: r.action, success: r.success, ...(r.error ? { error: r.error } : {}) });
  }
  return { configured: true as const, results };
}

/**
 * Refresh the ISR pages a posting appears on, so it shows now rather than when
 * their day-long window lapses. Per posting rather than
 * revalidatePath('/jobs', 'layout'), which would re-render every role's page
 * and apply page on each requisition edit.
 */
function refreshPages(refs: string[]) {
  try {
    revalidatePath('/jobs');
    revalidatePath('/sitemap.xml');
    revalidatePath('/jobs/feed.xml');
    revalidatePath('/jobs/rss');
    revalidatePath('/llms.txt');
    for (const ref of refs) {
      revalidatePath(`/jobs/${ref}`);
      revalidatePath(`/jobs/${ref}/apply`);
    }
  } catch (err) {
    console.warn('[auto-index] revalidate failed:', err);
  }
}

async function run(entries: { ref: string; action: IndexingActionType }[], source: string) {
  const unique = Array.from(new Map(entries.map((e) => [`${e.ref}:${e.action}`, e])).values());
  refreshPages(unique.map((e) => e.ref));

  const pageUrls = unique.map((e) => jobUrl(e.ref));
  const [indexNow, google] = await Promise.all([
    // IndexNow takes removed URLs as well; the engine re-crawls and sees the 404.
    submitToIndexNow(pageUrls.length ? [...pageUrls, `${SITE_URL}/jobs`] : []),
    notifyGoogle(unique.map((e) => ({ url: jobUrl(e.ref), action: e.action }))),
  ]);

  console.info(
    `[auto-index] source=${source} jobs=${unique.length} indexnow=${indexNow.success ? 'ok' : indexNow.status ?? 'error'} ` +
      `google=${google.configured ? `${google.results.filter((r) => r.success).length}/${google.results.length}` : 'not_configured'}`
  );

  return NextResponse.json({ source, jobs: unique, indexNow, google });
}

/** Vercel Cron: everything published or edited within the look-back window. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hours = Math.min(Math.max(Number(req.nextUrl.searchParams.get('hours')) || 25, 1), 24 * 30);
  const since = Date.now() - hours * 60 * 60 * 1000;

  const jobs = await fetchPublishedJobs(true);
  const recent = jobs.filter((job) => {
    const changed = Date.parse(job.dateModifiedISO || job.datePostedISO || '');
    return Number.isFinite(changed) && changed >= since;
  });

  return run(
    recent.map((job) => ({ ref: job.id, action: 'URL_UPDATED' as const })),
    `cron:${hours}h`
  );
}

interface SupabaseWebhookPayload {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  record?: { id?: string; reference_code?: string | null; status?: string | null } | null;
  old_record?: { id?: string; reference_code?: string | null; status?: string | null } | null;
}

/** Supabase Database Webhook on `requirements`. */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let payload: SupabaseWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 });
  }

  const row = payload.record ?? payload.old_record;
  const ref = row?.reference_code || row?.id;
  if (!ref) return NextResponse.json({ skipped: 'no requisition reference in payload' });

  const isLive = (r?: { status?: string | null } | null) => LIVE_STATUSES.has((r?.status || '').toLowerCase());
  const liveNow = payload.type !== 'DELETE' && isLive(payload.record);
  const wasLive = isLive(payload.old_record);

  // An edit to a posting that was never public (a draft) is nobody's business.
  if (!liveNow && !wasLive && payload.type !== 'DELETE') {
    return NextResponse.json({ skipped: 'requisition is not public', ref });
  }

  const entries: { ref: string; action: IndexingActionType }[] = [
    { ref, action: liveNow ? 'URL_UPDATED' : 'URL_DELETED' },
  ];
  // The public URL is keyed on reference_code; if a recruiter renamed it, the
  // old URL is gone and should be dropped from the index.
  const oldRef = payload.old_record?.reference_code;
  if (oldRef && oldRef !== ref && wasLive) entries.push({ ref: oldRef, action: 'URL_DELETED' });

  return run(entries, `webhook:${payload.type ?? 'unknown'}`);
}
