'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import Link from 'next/link'

import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/userService'
import { videoService } from '@/services/videoService'
import type { User, UserRole } from '@/types/user'
import type { Media } from '@/types/media'
import type { Experience } from '@/types/experience'
import type { VideoItem } from '@/types/video'
import { ArtistProfileView } from '@/components/profile/ArtistProfileView'
import { VenueProfileView } from '@/components/profile/VenueProfileView'
import { isArtist } from '@/types/user'
const ProfilePage = () => {
  const params = useParams<{ username: string }>()
  const t = useTranslations('NotFound')
  const username = params?.username ?? ''
  const router = useRouter()
  const { user: currentUser } = useAuthStore()

  const [profile, setProfile] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [gallery, setGallery] = useState<Media[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [loadingExperiences, setLoadingExperiences] = useState(true)
  const [loadingGallery, setLoadingGallery] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOwnProfile = useMemo(
    () => currentUser?.username === username,
    [currentUser?.username, username],
  )

  // Set page title dynamically
  useEffect(() => {
    if (profile) {
      const displayName = profile.display_name
      document.title = `${displayName} | Soundspal`
    }
  }, [profile])

  useEffect(() => {
    let active = true

    if (!username) {
      // set error flags after this synchronous effect
      Promise.resolve().then(() => {
        setError(t('description'))
        setLoading(false)
      })
      return
    }

    const loadProfile = async () => {
      setLoading(true)
      setLoadingVideos(true)
      setLoadingExperiences(true)
      setLoadingGallery(true)
      setError(null)
      try {
        const userData = await userService.getUserByUsername(username)
        if (!active) return
        setProfile(userData)
        setAvatarUrl(userData.avatar_url ?? null)
        setCoverUrl(userData.cover_url ?? null)
        setLoading(false)
        // Profile data is loaded, so loadingProfile is false

        // Load additional data in parallel
        const loadMedia = userService
          .getUserMediaByUsername(userData.username)
          .catch(() => ({ media: [], total: 0 }))
        const loadExperiences = userService.listUserExperiences(userData.username).catch(() => [])
        const loadVideos = videoService
          .getUserVideos(userData.username)
          .catch(() => ({ items: [], total: 0 }))

        const [mediaRes, experiencesRes, videosRes] = await Promise.all([
          loadMedia,
          loadExperiences,
          loadVideos,
        ])
        if (!active) return
        setGallery(mediaRes.media ?? [])
        setExperiences(experiencesRes)
        setVideos(videosRes.items ?? [])
        setLoadingGallery(false)
        setLoadingExperiences(false)
        setLoadingVideos(false)
      } catch (e) {
        console.error('Error loading profile', e)
        if (!active) return
        const message = e instanceof Error ? e.message : t('description')
        setError(message)
        toast.error(message)
        setLoading(false)
        setLoadingVideos(false)
        setLoadingExperiences(false)
        setLoadingGallery(false)
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [username])

  const handleEdit = () => {
    if (!profile) return
    router.push('/settings/my-profile')
  }

  if (error || (!loading && !profile)) {
    return (
      <div className="min-h-[70vh] w-full relative flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-primary/10 blur-[130px] rounded-full" />
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[400px] bg-primary/15 blur-[100px] rounded-full" />
        </div>

        <div className="w-full max-w-lg p-6">
          <div className="text-center max-w-2xl mx-auto space-y-8">
            <div className="relative">
              <h1 className="text-9xl font-bold text-primary/10 select-none">404</h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  {t('profileNotFound')}
                </h2>
              </div>
            </div>
            <p className="text-xl text-muted-foreground">{t('description')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm dark:hover:from-primary/80 hover:from-primary/70 dark:hover:to-primary/70 hover:to-primary/90 from-primary/60 to-primary/100 dark:from-primary/100 dark:to-primary/70 border-t-primary h-10 rounded-md px-5 bg-primary text-primary-foreground hover:bg-primary/90"
                href="/"
              >
                {t('backToHome')}
              </Link>
              <Link
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-xs hover:text-accent-foreground h-10 rounded-md px-5 border-primary/20 hover:bg-primary/10"
                href="/jobs"
              >
                {t('exploreJobs')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin" size={24} />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const renderProfile = () => {
    if (isArtist(profile.role as UserRole)) {
      return (
        <ArtistProfileView
          profile={profile}
          avatarUrl={avatarUrl}
          coverUrl={coverUrl}
          gallery={gallery}
          experiences={experiences}
          videos={videos}
          isOwner={isOwnProfile}
          onEdit={handleEdit}
          loadingVideos={loadingVideos}
          loadingExperiences={loadingExperiences}
          loadingGallery={loadingGallery}
        />
      )
    }

    return (
      <VenueProfileView
        profile={profile}
        avatarUrl={avatarUrl}
        coverUrl={coverUrl}
        isOwner={isOwnProfile}
        onEdit={handleEdit}
        loadingProfile={loading}
        loadingGallery={loadingGallery}
      />
    )
  }

  return renderProfile()
}

export default ProfilePage
