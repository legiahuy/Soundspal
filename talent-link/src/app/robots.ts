import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block private/auth routes and internal paths from crawlers
        disallow: [
          '/admin',
          '/api',
          '/auth/',
          '/settings/',
          '/messages',
          '/monitoring',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
