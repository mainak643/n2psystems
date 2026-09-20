import crypto from 'node:crypto';
import { SITE_URL } from './site';

export type IndexingActionType = 'URL_UPDATED' | 'URL_DELETED';

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let cachedToken: TokenCache | null = null;

/**
 * Retrieve Google Service Account credentials from environment variables.
 * Supports either a single JSON string (GOOGLE_SERVICE_ACCOUNT_KEY)
 * or separate email and private key variables.
 */
export function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  // Option 1: Full JSON string
  const jsonKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (jsonKey) {
    try {
      const parsed = JSON.parse(jsonKey);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key.replace(/\\n/g, '\n'),
        };
      }
    } catch (e) {
      console.error('[Google Indexing] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON:', e);
    }
  }

  // Option 2: Separate environment variables
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (email && privateKey) {
    return {
      client_email: email.trim(),
      private_key: privateKey.replace(/\\n/g, '\n').trim(),
    };
  }

  return null;
}

/**
 * Create and sign a JWT assertion for Google OAuth 2.0.
 */
function createSignedJwt(credentials: ServiceAccountCredentials): string {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const claimSet = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaimSet = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
  const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(credentials.private_key, 'base64url');

  return `${unsignedToken}.${signature}`;
}

/**
 * Exchange JWT assertion for a Google OAuth2 access token, with caching.
 */
export async function getGoogleAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 300_000) {
    return cachedToken.accessToken;
  }

  const credentials = getServiceAccountCredentials();
  if (!credentials) {
    throw new Error(
      'Missing Google Service Account credentials. Please configure GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.'
    );
  }

  const assertion = createSignedJwt(credentials);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google OAuth2 token request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const expiresInMs = (data.expires_in || 3600) * 1000;

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + expiresInMs,
  };

  return data.access_token;
}

export interface IndexingNotificationResult {
  url: string;
  action: IndexingActionType;
  success: boolean;
  metadata?: any;
  error?: string;
  statusCode?: number;
}

/**
 * Send a single URL notification (URL_UPDATED or URL_DELETED) to the Google Indexing API.
 */
export async function publishUrlNotification(
  url: string,
  type: IndexingActionType
): Promise<IndexingNotificationResult> {
  try {
    const accessToken = await getGoogleAccessToken();

    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url,
        type,
      }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = body?.error?.message || `HTTP ${response.status}`;
      return {
        url,
        action: type,
        success: false,
        statusCode: response.status,
        error: errorMessage,
        metadata: body,
      };
    }

    return {
      url,
      action: type,
      success: true,
      statusCode: response.status,
      metadata: body?.urlNotificationMetadata || body,
    };
  } catch (err: any) {
    return {
      url,
      action: type,
      success: false,
      error: err?.message || 'Unknown error notifying Google Indexing API',
    };
  }
}

/**
 * Query the Google Indexing API for the metadata/status of a URL.
 */
export async function getUrlNotificationMetadata(url: string): Promise<any> {
  const accessToken = await getGoogleAccessToken();

  const response = await fetch(
    `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(url)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to query Google Indexing metadata (${response.status}): ${errorBody}`);
  }

  return await response.json();
}

/**
 * Helper to construct the canonical job URL from a job ID / reference code.
 */
export function getJobCanonicalUrl(jobIdOrUrl: string): string {
  if (jobIdOrUrl.startsWith('http://') || jobIdOrUrl.startsWith('https://')) {
    return jobIdOrUrl;
  }
  return `${SITE_URL}/jobs/${encodeURIComponent(jobIdOrUrl)}`;
}

/**
 * Convenience helper to notify Google that a job has been published or updated.
 */
export async function notifyJobUpdated(jobIdOrUrl: string) {
  const url = getJobCanonicalUrl(jobIdOrUrl);
  return publishUrlNotification(url, 'URL_UPDATED');
}

/**
 * Convenience helper to notify Google that a job has been closed or removed.
 */
export async function notifyJobDeleted(jobIdOrUrl: string) {
  const url = getJobCanonicalUrl(jobIdOrUrl);
  return publishUrlNotification(url, 'URL_DELETED');
}

/**
 * Convenience helper to query Google for the latest crawl notification status for a job.
 */
export async function getJobNotificationStatus(jobIdOrUrl: string) {
  const url = getJobCanonicalUrl(jobIdOrUrl);
  return getUrlNotificationMetadata(url);
}

