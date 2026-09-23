/**
 * Escapes special HTML characters to prevent HTML/XSS injection attacks
 * when user-supplied input is embedded in emails or rendered views.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safely converts an unknown input into a trimmed, bounded string with a hard character ceiling.
 */
export function clampString(val: unknown, maxLength = 1000, fallback = ''): string {
  if (typeof val !== 'string') {
    if (val === null || val === undefined) return fallback;
    return String(val).trim().slice(0, maxLength);
  }
  return val.trim().slice(0, maxLength);
}

