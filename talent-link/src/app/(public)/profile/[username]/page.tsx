import { Metadata } from 'next'
import ProfileClient from './ProfileClient'
import { resolveMediaUrl } from '@/lib/utils'

// Minimal fetch for metadata to avoid axios interceptor issues on server if any
async function getUserMetadata(username: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    const res = await fetch(`${baseUrl}/users/${username}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const data = await res.json()
    return data?.data ?? data
  } catch (error) {
    console.error('Error fetching user for metadata:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const user = await getUserMetadata(username)

  if (!user) {
    return {
      title: 'Profile Not Found',
    }
  }

  const displayName = user.display_name || username
  const description = user.brief_bio || `Check out ${displayName}'s profile on Soundspal.`
  const images = user.avatar_url ? [resolveMediaUrl(user.avatar_url)] : []

  return {
    title: `${displayName} | Soundspal`,
    description,
    openGraph: {
      title: `${displayName} | Soundspal`,
      description,
      images,
      type: 'profile',
      username: username,
    },
    twitter: {
      card: 'summary',
      title: `${displayName} | Soundspal`,
      description,
      images,
    },
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getUserMetadata(username)

  // Structured Data (JSON-LD)
  let jsonLd = null
  if (user) {
    // Basic Person schema
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': user.role === 'venue' ? 'Organization' : 'Person', // Simple heuristic
      name: user.display_name || username,
      description: user.brief_bio,
      image: user.avatar_url ? resolveMediaUrl(user.avatar_url) : undefined,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${username}`,
      sameAs: Object.values(user.social_links || {}).filter(Boolean),
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProfileClient />
    </>
  )
}
