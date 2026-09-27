import { SITE_URL } from './site';

/**
 * IndexNow — one POST notifies Bing, Yahoo, Yandex, Seznam and Naver (and,
 * through Bing, the answer engines that search on its index: Copilot,
 * ChatGPT search, DuckDuckGo). Engines verify ownership by fetching
 * `keyLocation`, which is the key file in /public.
 */
export function getIndexNowKey(): string {
  return process.env.INDEXNOW_KEY?.trim() || 'n2psystems-indexnow-key';
}

export interface IndexNowResult {
  success: boolean;
  status?: number;
  submitted: string[];
  error?: string;
}

export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  const urlList = Array.from(new Set(urls)).slice(0, 10000);
  if (urlList.length === 0) return { success: true, submitted: [] };

  const key = getIndexNowKey();
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList,
      }),
    });
    const success = response.status === 200 || response.status === 202;
    return {
      success,
      status: response.status,
      submitted: urlList,
      ...(success ? {} : { error: (await response.text().catch(() => '')).slice(0, 300) }),
    };
  } catch (err) {
    return {
      success: false,
      submitted: urlList,
      error: err instanceof Error ? err.message : 'IndexNow request failed',
    };
  }
}
