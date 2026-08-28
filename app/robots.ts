import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The apply form is noindex per-page; keeping it out of the crawl budget
      // here too avoids crawlers walking every requisition's form.
      disallow: ['/api/', '/jobs/*/apply'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
