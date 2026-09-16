import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// In-memory token cache to prevent hitting Reapdat login rate limits
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getReapdatToken(): Promise<string> {
  const now = Date.now();
  // Reuse token if valid for at least 5 more minutes
  if (cachedToken && tokenExpiresAt > now + 5 * 60 * 1000) {
    return cachedToken;
  }

  const email = process.env.REAPDAT_EMAIL || 'karthik@n2psystems.ca';
  const password = process.env.REAPDAT_PASSWORD || 'ReapN2P123!';

  const loginRes = await fetch('https://api.reapdat.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), password: password.trim() }),
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
  const expiresInMs = (data.expires_in || 14400) * 1000;
  tokenExpiresAt = now + expiresInMs;

  return token;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  return NextResponse.json(
    { status: 'ok', service: 'reapdat-link-provisioner' },
    { headers: corsHeaders }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { referenceCode, title, department } = body;

    if (!referenceCode) {
      return NextResponse.json(
        { ok: false, success: false, error: 'Missing referenceCode in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const token = await getReapdatToken();

    const linkLabel = title
      ? `${title} (${referenceCode})`
      : `Requisition ${referenceCode}`;

    const tags: string[] = [referenceCode];
    if (department && typeof department === 'string') {
      tags.push(department.slice(0, 40));
    }

    const createRes = await fetch('https://api.reapdat.com/api/v1/chat-links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        label: linkLabel.slice(0, 120),
        tags: tags.slice(0, 8),
        channels: ['chat', 'call'],
        inherit_main_kb: true,
      }),
    });

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}));
      // If 401, invalidate cached token so next request attempts fresh login
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
        { status: createRes.status, headers: corsHeaders }
      );
    }

    const linkData = await createRes.json();
    const linkUrl = linkData.url;

    // Persist link directly into Supabase requirements if accessible
    if (supabase) {
      try {
        await supabase
          .from('requirements')
          .update({
            reapdat_chat_link: linkUrl,
            reapdat_enabled: true,
          })
          .eq('reference_code', referenceCode);
      } catch (dbErr) {
        console.warn('Direct database update notice:', dbErr);
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
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { ok: false, success: false, error: errorMsg },
      { status: 500, headers: corsHeaders }
    );
  }
}
