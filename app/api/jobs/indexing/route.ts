import { NextRequest, NextResponse } from 'next/server';
import {
  notifyJobUpdated,
  notifyJobDeleted,
  publishUrlNotification,
  getJobNotificationStatus,
  getJobCanonicalUrl,
  IndexingActionType,
  getServiceAccountCredentials,
} from '@/lib/google-indexing';

export const dynamic = 'force-dynamic';

function verifySecret(req: NextRequest): boolean {
  const configuredSecret = process.env.INDEXING_SECRET_KEY?.trim();
  // If not configured in production, protect by default
  if (!configuredSecret) {
    // Only allow unauthenticated in local development if explicitly running in dev
    return process.env.NODE_ENV === 'development';
  }

  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const apiKeyHeader = req.headers.get('x-api-key')?.trim();
  const querySecret = req.nextUrl.searchParams.get('secret')?.trim();

  const candidate = bearerToken || apiKeyHeader || querySecret;
  return candidate === configuredSecret;
}

/**
 * GET /api/jobs/indexing?jobId=REQ-101 (or ?url=https://...)
 * Query Google Indexing API metadata for a given job URL.
 */
export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid or missing INDEXING_SECRET_KEY.' },
      { status: 401 }
    );
  }

  const { searchParams } = req.nextUrl;
  const jobId = searchParams.get('jobId') || searchParams.get('id');
  const url = searchParams.get('url');

  const target = url || jobId;
  if (!target) {
    return NextResponse.json(
      { error: 'Missing required query parameter: jobId or url' },
      { status: 400 }
    );
  }

  const credentials = getServiceAccountCredentials();
  if (!credentials) {
    return NextResponse.json(
      {
        error: 'Google Service Account credentials are not configured on the server.',
        help: 'Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.',
      },
      { status: 503 }
    );
  }

  try {
    const metadata = await getJobNotificationStatus(target);
    return NextResponse.json({
      target,
      canonicalUrl: getJobCanonicalUrl(target),
      googleMetadata: metadata,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to query Google Indexing API',
      },
      { status: 500 }
    );
  }
}

interface IndexingRequestBody {
  jobId?: string;
  url?: string;
  action?: IndexingActionType;
  requests?: Array<{
    jobId?: string;
    url?: string;
    action: IndexingActionType;
  }>;
}

/**
 * POST /api/jobs/indexing
 * Notify Google Indexing API when a job is published, updated, or deleted.
 *
 * Payload examples:
 * 1. Single: { "jobId": "REQ-101", "action": "URL_UPDATED" }
 * 2. Delete: { "jobId": "REQ-101", "action": "URL_DELETED" }
 * 3. Batch:  { "requests": [ { "jobId": "REQ-101", "action": "URL_UPDATED" }, ... ] }
 */
export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid or missing INDEXING_SECRET_KEY.' },
      { status: 401 }
    );
  }

  const credentials = getServiceAccountCredentials();
  if (!credentials) {
    return NextResponse.json(
      {
        error: 'Google Service Account credentials are not configured on the server.',
        help: 'Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.',
      },
      { status: 503 }
    );
  }

  let body: IndexingRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const itemsToProcess: Array<{ target: string; action: IndexingActionType }> = [];

  if (Array.isArray(body.requests) && body.requests.length > 0) {
    for (const item of body.requests) {
      const target = item.url || item.jobId;
      if (target && item.action) {
        itemsToProcess.push({ target, action: item.action });
      }
    }
  } else {
    const target = body.url || body.jobId;
    const action = body.action || 'URL_UPDATED';
    if (target) {
      itemsToProcess.push({ target, action });
    }
  }

  if (itemsToProcess.length === 0) {
    return NextResponse.json(
      {
        error: 'No valid jobs or URLs provided in request body.',
        expected: '{ jobId: string, action: "URL_UPDATED" | "URL_DELETED" } or { requests: [...] }',
      },
      { status: 400 }
    );
  }

  const results = [];
  for (const item of itemsToProcess) {
    const canonicalUrl = getJobCanonicalUrl(item.target);
    const result = await publishUrlNotification(canonicalUrl, item.action);
    results.push({
      target: item.target,
      ...result,
    });
  }

  const allSuccessful = results.every((r) => r.success);

  return NextResponse.json(
    {
      success: allSuccessful,
      processed: results.length,
      results,
    },
    { status: allSuccessful ? 200 : 207 }
  );
}

