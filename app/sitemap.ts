import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://n2psystems.com'

  // Define all static routes
  const routes = [
    '',
    '/about',
    '/jobs',
    '/clients',
    '/resume',
    '/hiring-solutions',
    '/privacy-policy',
    '/terms-of-service',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/jobs' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
