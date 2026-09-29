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
    // /jobs/feed.xml is deliberately absent: it is an Indeed/LinkedIn
    // <source><job> aggregator feed, not a sitemap, and declaring it here made
    // Search Console fail to parse it on every fetch. It stays crawlable via
    // the allow rules above.
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/jobs/rss`,
    ],
    host: SITE_URL,
  }
}
