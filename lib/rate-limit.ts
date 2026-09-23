import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window rate-limit cache.
// Automatically pruned on access or when capacity threshold is reached.
const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_ENTRIES = 10_000;

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now >= record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Extracts a reliable client IP address from request headers.
 * Prioritizes Cloudflare CF-Connecting-IP, then the first IP in X-Forwarded-For, then X-Real-IP.
 */
export function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Seconds until reset
}

/**
 * Enforces sliding-window rate limiting for a given identifier (e.g. IP or IP+route).
 *
 * @param identifier Unique key (e.g. `ip + ":" + endpoint`)
 * @param limit Maximum allowed requests within the time window
 * @param windowSeconds Window length in seconds (default 60s)
 */
export function checkRateLimit(
  identifier: string,
  limit = 20,
  windowSeconds = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (rateLimitMap.size > MAX_ENTRIES) {
    pruneExpired();
  }

  const existing = rateLimitMap.get(identifier);

  if (!existing || now >= existing.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: windowSeconds,
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    reset: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

