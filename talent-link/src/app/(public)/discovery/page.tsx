import { getTranslations } from 'next-intl/server'
import DiscoveryPageClient from './DiscoveryPageClient'
import { searchService } from '@/services/searchService'
import { resolveMediaUrl } from '@/lib/utils'
import { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'

export const metadata: Metadata = {
  title: 'Discover Music Talent',
  description:
    'Connect with top creative talent and venues. Explore profiles of producers, singers, and venues on Soundspal.',
  alternates: {
    canonical: `${APP_URL}/discovery`,
  },
  openGraph: {
    url: `${APP_URL}/discovery`,
  },
}

interface DiscoveryItem {
  id: string
  name: string
  username: string
  image: string
  genres: string[]
  location: string
  description: string
  role: string
}

export default async function DiscoveryPage() {
  const tCommon = await getTranslations('Common')

  let initialArtists: DiscoveryItem[] = []
  let initialVenues: DiscoveryItem[] = []

  try {
    // Fetch initial data server-side
    // We fetch a reasonable amount to populate the initial view for SEO
    const result = await searchService.searchUsers({
        page: 1,
        pageSize: 100, 
    })
    const allUsers = result.userProfiles

    // Transform Artists
    initialArtists = allUsers
        .filter((user) => user.role !== 'venue')
        .map((user) => ({
        id: user.id,
        name: user.displayName || tCommon('unknown'),
        username: user.username,
        image: user.avatarUrl ? resolveMediaUrl(user.avatarUrl) : '/images/artist/default-avatar.jpeg',
        genres: (user.genres || [])
            .map((g: { name?: string } | string) => (typeof g === 'string' ? g : g.name || ''))
            .filter(Boolean),
        location: user.location || tCommon('unknown'),
        description: user.briefBio || '',
        role: user.role,
        }))

    // Transform Venues
    initialVenues = allUsers
        .filter((user) => user.role === 'venue')
        .map((user) => ({
        id: user.id,
        name: user.displayName || tCommon('unknown'),
        username: user.username,
        image: user.avatarUrl ? resolveMediaUrl(user.avatarUrl) : '/images/artist/default-avatar.jpeg',
        genres: (user.genres || [])
            .map((g: { name?: string } | string) => (typeof g === 'string' ? g : g.name || ''))
            .filter(Boolean),
        location: user.location || tCommon('unknown'),
        description: user.briefBio || '',
        role: user.role,
        }))

  } catch (error) {
    console.error('Failed to fetch initial discovery data:', error)
  }

  return (
    <DiscoveryPageClient initialArtists={initialArtists} initialVenues={initialVenues} />
  )
}
