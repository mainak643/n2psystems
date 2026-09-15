import { NextRequest, NextResponse } from 'next/server';
import { supabaseUrl } from '@/lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-reapdat-secret, idempotency-key',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const targetUrl = `${supabaseUrl}/functions/v1/reapdat-candidate`;

    // Forward headers
    const forwardedHeaders = new Headers();
    const allowedHeaders = [
      'content-type',
      'authorization',
      'x-reapdat-secret',
      'idempotency-key',
      'accept',
    ];

    for (const key of allowedHeaders) {
      const val = req.headers.get(key);
      if (val) forwardedHeaders.set(key, val);
    }

    // Forward body as arrayBuffer to support both multipart/form-data (CV file) and JSON
    const bodyBuffer = await req.arrayBuffer();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: forwardedHeaders,
      body: bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Forwarding error';
    return NextResponse.json(
      { ok: false, error: 'gateway_error', message: `Failed to forward candidate intake: ${message}` },
      { status: 502, headers: corsHeaders }
    );
  }
}

