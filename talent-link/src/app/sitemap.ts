import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface JobStub {
  id: string
  created_at: string
  updated_at: string
}

interface UserStub {
  username: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const routes = [
    '',
    '/about',
    '/contact',
    '/jobs',
    '/discovery',
    '/login',
    '/signup',
    '/careers',
    '/help',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic routes: Jobs
  let jobRoutes: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${apiUrl}/posts?page=1&page_size=1000&status=published`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const data = await res.json()
      const jobs = data.data?.posts || data.posts || []

      jobRoutes = jobs.map((job: JobStub) => ({
        url: `${baseUrl}/jobs/${job.id}`,
        lastModified: new Date(job.updated_at || job.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Error generating job sitemap:', error)
  }

  // Dynamic routes: Profiles
  let profileRoutes: MetadataRoute.Sitemap = []
  try {
    // Note: Search endpoint is often POST, check if GET /users works or use POST
    // Assuming search is POST based on service
    const res = await fetch(`${apiUrl}/search/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page: 1, pageSize: 1000 }),
      next: { revalidate: 3600 },
    })

    if (res.ok) {
      const data = await res.json()
      const users = data.data?.userProfiles || data.userProfiles || []

      profileRoutes = users.map((user: UserStub) => ({
        url: `${baseUrl}/profile/${user.username}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Error generating profile sitemap:', error)
  }

  return [...routes, ...jobRoutes, ...profileRoutes]
}
