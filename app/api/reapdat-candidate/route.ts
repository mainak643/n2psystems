import { NextRequest, NextResponse } from 'next/server';
import { supabaseUrl } from '@/lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-reapdat-secret, idempotency-key',
};

/** 15 MB — a resume with room to spare, far below what a body can otherwise be. */
const MAX_BODY_BYTES = 15 * 1024 * 1024;

/**
 * Statuses the Fetch spec forbids a body on. Constructing a Response with one
 * (even an empty string) throws, and the throw landed in the catch below — so
 * an upstream 204 was reported to the caller as a 502 gateway failure for a
 * request that had actually succeeded.
 */
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

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
    // Must stay in step with Access-Control-Allow-Headers above. `apikey` was
    // advertised in the preflight but missing here, so a client authenticating
    // the standard Supabase way passed preflight and then got a 401 from the
    // function, with nothing to explain it.
    const allowedHeaders = [
      'content-type',
      'authorization',
      'apikey',
      'x-client-info',
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

    // A CV plus its form fields; anything past this is not a candidate intake.
    // Without a ceiling an unauthenticated caller could make this function
    // buffer an arbitrarily large body into memory before forwarding it.
    if (bodyBuffer.byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'payload_too_large', message: 'Candidate submission exceeds the size limit.' },
        { status: 413, headers: corsHeaders }
      );
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: forwardedHeaders,
      body: bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
    });

    const responseBody = await response.text();

    return new NextResponse(NULL_BODY_STATUSES.has(response.status) ? null : responseBody, {
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

