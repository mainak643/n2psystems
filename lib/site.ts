/**
 * The canonical public origin for this site.
 *
 * Every absolute URL we emit for machines — canonicals, OpenGraph, sitemap
 * entries, and the `url` field of the JobPosting JSON-LD — is built from this.
 * Google rejects a JobPosting whose `url` does not resolve to the posting, so
 * this has to match wherever the app is actually served from.
 *
 * n2psystems.com is the permanent production domain for N2P Systems.
 * Every canonical, sitemap, OpenGraph, and JobPosting JSON-LD URL resolves
 * through this origin. Set NEXT_PUBLIC_SITE_URL to override this in staging
 * or preview environments.
 *
 * Vercel injects VERCEL_PROJECT_PRODUCTION_URL on production builds, which is
 * a sane middle default: it is at least an origin that serves this app.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`

  return 'https://n2psystems.com'
}

export const SITE_URL = resolveSiteUrl()

/** Absolute URL for a site-relative path, for metadata and structured data. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Is this route for someone applying for a job, rather than for an employer?
 *
 * /resume and /jobs (including the job detail and apply sub-pages) are
 * candidate-facing, so the employer-facing "Partner With Us" call to action is
 * dropped from the navbar, the mobile drawer and the footer on those paths.
 * Shared from here because the navbar and footer both need it and had drifted
 * into keeping their own verbatim copies.
 */
export function isCandidateFacing(pathname: string): boolean {
  return pathname.startsWith('/resume') || pathname.startsWith('/jobs')
}
