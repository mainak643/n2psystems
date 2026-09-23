import { NextRequest, NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

interface IndexNowPayload {
  urls?: string[];
  url?: string;
  jobId?: string;
}

/**
 * POST /api/indexnow
 * Submits updated URLs to the IndexNow protocol (Microsoft Bing, Yahoo, Yandex, Seznam, Naver).
 * Instantly queues pages for search engine crawling and indexing.
 *
 * Headers:
 *   Authorization: Bearer <INDEXING_SECRET_KEY> or x-api-key: <INDEXING_SECRET_KEY>
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.INDEXING_SECRET_KEY?.trim();
  const indexNowKey = process.env.INDEXNOW_KEY?.trim() || 'n2psystems-indexnow-key';

  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const apiKey = req.headers.get('x-api-key')?.trim();
  const provided = authHeader || apiKey;

  // Protect by default: require configured secret key in production
  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Endpoint is locked. Set INDEXING_SECRET_KEY in production.' },
        { status: 401 }
      );
    }
  } else if (!provided || provided !== secretKey) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid or missing secret key.' },
      { status: 401 }
    );
  }

  let body: IndexNowPayload = {};
  try {
    body = await req.json();
  } catch {
    // If empty body, default to submitting core site paths
  }

  const host = new URL(SITE_URL).host;
  let urlList: string[] = [];

  if (body.urls && Array.isArray(body.urls) && body.urls.length > 0) {
    urlList = body.urls.map((u) => (u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? u : `/${u}`}`));
  } else if (body.url) {
    urlList = [body.url.startsWith('http') ? body.url : `${SITE_URL}${body.url.startsWith('/') ? body.url : `/${body.url}`}`];
  } else if (body.jobId) {
    urlList = [`${SITE_URL}/jobs/${encodeURIComponent(body.jobId)}`, `${SITE_URL}/jobs`];
  } else {
    // Default priority list
    urlList = [
      `${SITE_URL}/`,
      `${SITE_URL}/jobs`,
      `${SITE_URL}/clients`,
      `${SITE_URL}/hiring-solutions`,
      `${SITE_URL}/resume`,
    ];
  }

  try {
    const indexNowResponse = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host,
        key: indexNowKey,
        keyLocation: `${SITE_URL}/${indexNowKey}.txt`,
        urlList,
      }),
    });

    const isSuccess = indexNowResponse.status === 200 || indexNowResponse.status === 202;
    const responseText = await indexNowResponse.text().catch(() => '');

    return NextResponse.json({
      success: isSuccess,
      status: indexNowResponse.status,
      submittedUrls: urlList,
      host,
      message: isSuccess
        ? 'URLs successfully submitted to IndexNow (Bing/Yahoo/Yandex/Naver).'
        : `IndexNow responded with status ${indexNowResponse.status}: ${responseText}`,
    });
  } catch (error: any) {
    console.error('[IndexNow API] Failed to submit URLs to IndexNow:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit URLs to IndexNow' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/indexnow
 * Diagnostic endpoint to check IndexNow status and configuration.
 */
export async function GET() {
  const isKeyConfigured = !!process.env.INDEXNOW_KEY;
  return NextResponse.json({
    status: 'ready',
    service: 'IndexNow Instant Search Indexing Protocol',
    searchEnginesSupported: ['Microsoft Bing', 'Yahoo', 'Yandex', 'Seznam.cz', 'Naver'],
    isCustomKeyConfigured: isKeyConfigured,
    endpoints: {
      postSubmit: 'POST /api/indexnow',
    },
    documentation: 'https://www.indexnow.org',
  });
}

