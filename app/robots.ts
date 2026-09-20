import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/jobs', '/api/jobs'],
        disallow: ['/api/reapdat-link', '/api/reapdat-candidate', '/jobs/*/apply'],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Amazonbot', 'Applebot'],
        allow: ['/', '/jobs', '/api/jobs', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/reapdat-link', '/api/reapdat-candidate', '/jobs/*/apply'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
