/**
 * The canonical public origin for this site.
 *
 * Every absolute URL we emit for machines — canonicals, OpenGraph, sitemap
 * entries, and the `url` field of the JobPosting JSON-LD — is built from this.
 * Google rejects a JobPosting whose `url` does not resolve to the posting, so
 * this has to match wherever the app is actually served from.
 *
 * n2psystems.ca is the real domain — every contact point on the site
 * (email addresses, phone numbers) already points there. n2psystems.com
 * currently serves a separate WordPress site where /jobs returns 404, so it
 * must never be used as the fallback. Set NEXT_PUBLIC_SITE_URL to override
 * this (e.g. a Vercel preview URL) when the app isn't served from .ca.
 *
 * Vercel injects VERCEL_PROJECT_PRODUCTION_URL on production builds, which is
 * a sane middle default: it is at least an origin that serves this app.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`

  return 'https://n2psystems.ca'
}

export const SITE_URL = resolveSiteUrl()

/** Absolute URL for a site-relative path, for metadata and structured data. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
