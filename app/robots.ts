import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/jobs',
          '/api/jobs',
          '/jobs/feed.xml',
          '/jobs/rss',
          '/llms.txt',
          '/llms-full.txt',
        ],
        disallow: ['/api/reapdat-link', '/api/reapdat-candidate', '/jobs/*/apply'],
      },
      {
        userAgent: [
          'GPTBot',
          'ClaudeBot',
          'PerplexityBot',
          'Google-Extended',
          'Amazonbot',
          'Applebot',
          'CCBot',
        ],
        allow: ['/', '/jobs', '/api/jobs', '/llms.txt', '/llms-full.txt', '/jobs/rss'],
        disallow: ['/api/reapdat-link', '/api/reapdat-candidate', '/jobs/*/apply'],
      },
      {
        userAgent: ['LinkedInBot', 'Twitterbot', 'facebookexternalhit'],
        allow: ['/', '/jobs', '/opengraph-image'],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/jobs/feed.xml`,
      `${SITE_URL}/jobs/rss`,
    ],
    host: SITE_URL,
  }
}
