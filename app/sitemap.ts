import { MetadataRoute } from 'next'
import { fetchPublishedJobs } from '@/lib/jobs-service'
import { SITE_URL } from '@/lib/job-schema'

/** Matches the boards' ISR window so newly published roles are discoverable. */
export const revalidate = 60

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/jobs',
    '/clients',
    '/resume',
    '/hiring-solutions',
    '/privacy-policy',
    '/terms-of-service',
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/jobs' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))

  // Individual postings were missing entirely, so every role published from the
  // portal was reachable only by crawling /jobs — the pages that carry the
  // JobPosting markup were the ones search engines were least likely to find.
  let jobRoutes: MetadataRoute.Sitemap = []
  try {
    const jobs = await fetchPublishedJobs()
    jobRoutes = jobs.map((job) => ({
      url: `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`,
      lastModified: job.datePostedISO ? new Date(job.datePostedISO) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }))
  } catch {
    // A sitemap missing its job entries beats a 500 that costs us the whole file.
  }

  return [...staticRoutes, ...jobRoutes]
}
