'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Camera, Save, UploadCloud, X, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import type { Media } from '@/types/media'
import type { User } from '@/types/user'
import type { AdminUser } from '@/types/admin'
import type { Experience } from '@/types/experience'
import { adminService } from '@/services/adminService'
import { videoService } from '@/services/videoService'
import type { VideoItem } from '@/types/video'
import VideoModal from '@/components/portfolio/VideoModal'
import ImageCropper from '@/components/common/ImageCropper'

const artistTabs = (t: (key: string) => string) => [
  { id: 'overview', label: t('profile.tabs.overview') },
  { id: 'media', label: t('profile.tabs.media') },
  { id: 'experience', label: t('profile.tabs.experience') },
  { id: 'contact', label: t('profile.tabs.contact') },
]

interface SectionCardProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}

const SectionCard = ({ title, description, action, children }: SectionCardProps) => (
  <Card>
    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
      {action}
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
)

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const maybe = error as { response?: { data?: { message?: string } } }
    const apiMessage = maybe.response?.data?.message
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export default function AdminProfileEditor({
  targetUser,
  onUpdate,
}: {
  targetUser: AdminUser
  onUpdate: () => void
}) {
  const t = useTranslations('Settings')
  const tCommon = useTranslations('Common')
  const tProfile = useTranslations('Profile')

  const [loading, setLoading] = useState(true)

  const [me, setMe] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [cacheBust, setCacheBust] = useState<number>(Date.now())
  const [gallery, setGallery] = useState<Media[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)

  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null)
  const [deleteExpDialogOpen, setDeleteExpDialogOpen] = useState(false)
  const [expToDelete, setExpToDelete] = useState<string | null>(null)

  // Cropping State
  const [cropperOpen, setCropperOpen] = useState(false)
  const [croppingImage, setCroppingImage] = useState<string | null>(null)
  const [cropType, setCropType] = useState<'avatar' | 'cover' | null>(null)

  const [openAddVideo, setOpenAddVideo] = useState(false)
  const [editVideoData, setEditVideoData] = useState<{ id: string; title: string } | null>(null)
  const [openEditVideo, setOpenEditVideo] = useState(false)

  const [savingBasic, setSavingBasic] = useState(false)
  const [savingImages, setSavingImages] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [savingSocial, setSavingSocial] = useState(false)
  const [savingExp, setSavingExp] = useState(false)
  const [deletingExpId, setDeletingExpId] = useState<string | null>(null)
  const [availableGenres, setAvailableGenres] = useState<Option[]>([])

  // Initial values for change detection
  const [initialFormBasic, setInitialFormBasic] = useState({
    display_name: '',
    brief_bio: '',
    detail_bio: '',
    city: '',
    country: '',
    genres: [] as string[],
  })

  const [initialFormContact, setInitialFormContact] = useState({
    email: '',
    phone_number: '',
  })

  const [initialFormSocial, setInitialFormSocial] = useState({
    youtube_url: '',
    instagram_url: '',
    facebook_url: '',
  })

  const [formBasic, setFormBasic] = useState({
    display_name: '',
    brief_bio: '',
    detail_bio: '',
    city: '',
    country: '',
    genres: [] as string[],
  })

  const [formContact, setFormContact] = useState({
    email: '',
    phone_number: '',
  })

  const [formSocial, setFormSocial] = useState({
    youtube_url: '',
    instagram_url: '',
    facebook_url: '',
  })

  const [expForm, setExpForm] = useState<{
    id?: string
    title: string
    description: string
    portfolio_url: string
    start_date: string
    end_date: string
    genres: string[]
  }>({
    title: '',
    description: '',
    portfolio_url: '',
    start_date: '',
    end_date: '',
    genres: [],
  })

  const heroName = me?.display_name || me?.username || 'Artist'

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true)
        if (targetUser) {
          setMe(targetUser)
          const normalizedGenres = (targetUser.genres ?? [])
            .map((genre: { name: string }) => genre.name)
            .filter(Boolean)
          const basicData = {
            display_name: targetUser.display_name ?? '',
            brief_bio: targetUser.brief_bio ?? '',
            detail_bio: targetUser.detail_bio ?? '',
            city: targetUser.city ?? '',
            country: targetUser.country ?? '',
            genres: normalizedGenres,
          }
          const contactData = {
            email: targetUser.email ?? '',
            phone_number: targetUser.phone_number ?? '',
          }
          const socialData = {
            youtube_url: targetUser.youtube_url ?? '',
            instagram_url: targetUser.instagram_url ?? '',
            facebook_url: targetUser.facebook_url ?? '',
          }
          setInitialFormBasic(basicData)
          setInitialFormContact(contactData)
          setInitialFormSocial(socialData)
          setFormBasic(basicData)
          setFormContact(contactData)
          setFormSocial(socialData)

          setAvatarUrl(targetUser.avatar_url || null)
          setCoverUrl(targetUser.cover_url || null)

          // Let's assume experiences and videos aren't supported via admin yet or are loaded differently
        }
      } catch (error) {
        console.error(error)
        toast.error(t('profile.loadError'))
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [t, targetUser])

  const validateImageFile = (file: File, maxSizeMB: number, type: 'avatar' | 'cover'): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        `${type === 'avatar' ? 'Avatar' : 'Cover'} image must be JPEG, PNG, GIF, or WebP format`,
      )
      return false
    }

    if (file.size > maxSizeBytes) {
      toast.error(
        `${type === 'avatar' ? 'Avatar' : 'Cover'} image must be less than ${maxSizeMB}MB`,
      )
      return false
    }

    return true
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (validateImageFile(file, 5, 'avatar')) {
      const url = URL.createObjectURL(file)
      setCroppingImage(url)
      setCropType('avatar')
      setCropperOpen(true)
    }
    e.target.value = ''
  }

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (validateImageFile(file, 10, 'cover')) {
      const url = URL.createObjectURL(file)
      setCroppingImage(url)
      setCropType('cover')
      setCropperOpen(true)
    }
    e.target.value = ''
  }

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' })
    if (cropType === 'avatar') {
      setAvatarFile(file)
    } else if (cropType === 'cover') {
      setCoverFile(file)
    }
    setCropperOpen(false)
    setCroppingImage(null)
    setCropType(null)
  }

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile)
      setAvatarPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setAvatarPreviewUrl(null)
  }, [avatarFile])

  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile)
      setCoverPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setCoverPreviewUrl(null)
  }, [coverFile])

  const onBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormBasic((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  const onContactChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormContact((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  const onSocialChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormSocial((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  // Helper functions to check for changes
  const hasBasicChanges = useMemo(() => {
    return (
      formBasic.display_name.trim() !== (initialFormBasic.display_name ?? '').trim() ||
      formBasic.brief_bio.trim() !== (initialFormBasic.brief_bio ?? '').trim() ||
      formBasic.detail_bio.trim() !== (initialFormBasic.detail_bio ?? '').trim() ||
      formBasic.city.trim() !== (initialFormBasic.city ?? '').trim() ||
      formBasic.country.trim() !== (initialFormBasic.country ?? '').trim() ||
      JSON.stringify([...formBasic.genres].sort()) !==
        JSON.stringify([...initialFormBasic.genres].sort())
    )
  }, [formBasic, initialFormBasic])

  const hasContactChanges = useMemo(() => {
    return (
      formContact.email.trim() !== (initialFormContact.email ?? '').trim() ||
      formContact.phone_number.trim() !== (initialFormContact.phone_number ?? '').trim()
    )
  }, [formContact, initialFormContact])

  const hasSocialChanges = useMemo(() => {
    return (
      formSocial.youtube_url.trim() !== (initialFormSocial.youtube_url ?? '').trim() ||
      formSocial.instagram_url.trim() !== (initialFormSocial.instagram_url ?? '').trim() ||
      formSocial.facebook_url.trim() !== (initialFormSocial.facebook_url ?? '').trim()
    )
  }, [formSocial, initialFormSocial])

  const handleSaveBasic = async (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!hasBasicChanges) return

    try {
      setSavingBasic(true)

      // Save basic info (excluding genres)
      const payload = {
        display_name: formBasic.display_name.trim() || undefined,
        brief_bio: formBasic.brief_bio.trim() || undefined,
        detail_bio: formBasic.detail_bio.trim() || undefined,
        city: formBasic.city.trim() || undefined,
        country: formBasic.country.trim() || undefined,
      }
      const updated = await adminService.updateUserProfile(targetUser.id, payload)

      // Save genres if changed
      if (
        JSON.stringify([...formBasic.genres].sort()) !==
        JSON.stringify([...initialFormBasic.genres].sort())
      ) {
        if (me?.id) {
          await adminService.updateUserGenres(targetUser.id, formBasic.genres)
          // Refresh user data to get updated genres
          onUpdate()
          const refreshed = targetUser
          setMe(refreshed)
          const normalizedGenres = (refreshed.genres ?? [])
            .map((genre) => genre.name)
            .filter(Boolean)
          setFormBasic((prev) => ({ ...prev, genres: normalizedGenres }))
          setInitialFormBasic((prev) => ({ ...prev, genres: normalizedGenres }))
        }
      }

      toast.success('Basic information saved')
      setMe((prev) => (prev ? { ...prev, ...updated } : prev))

      // Sync with global auth store
      onUpdate()

      // Update initial values after save
      setInitialFormBasic({
        display_name: updated.display_name ?? '',
        brief_bio: updated.brief_bio ?? '',
        detail_bio: updated.detail_bio ?? '',
        city: updated.city ?? '',
        country: updated.country ?? '',
        genres: formBasic.genres, // Use current genres after update
      })
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Update failed')
      toast.error(message)
    } finally {
      setSavingBasic(false)
    }
  }

  const handleSaveImages = async () => {
    try {
      setSavingImages(true)
      let changed = false
      let newAvatarUrl = avatarUrl
      let newCoverUrl = coverUrl

      if (avatarFile) {
        newAvatarUrl = await adminService.uploadUserAvatar(targetUser.id, avatarFile)
        changed = true
      }
      if (coverFile) {
        newCoverUrl = await adminService.uploadUserCover(targetUser.id, coverFile)
        changed = true
      }

      if (changed) {
        toast.success('Profile images updated')
        setAvatarFile(null)
        setCoverFile(null)
        setAvatarPreviewUrl(null)
        setCoverPreviewUrl(null)
        setCacheBust(Date.now())

        // Update local state with returned URLs
        setAvatarUrl(newAvatarUrl)
        setCoverUrl(newCoverUrl)

        // Sync with global auth store
        onUpdate()

        window.dispatchEvent(
          new CustomEvent('profile:updated', { detail: { what: 'avatar:cover' } }),
        )
      } else {
        toast.message('No image changes')
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to save images')
      toast.error(message)
    } finally {
      setSavingImages(false)
    }
  }

  const handleAddGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    try {
      setUploadingGallery(true)
      for (const file of files) {
        const media = await adminService.uploadUserMedia(targetUser.id, file)
        setGallery((prev) => [media, ...prev])
      }
      toast.success(`Uploaded ${files.length} images`)
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: { what: 'media:add' } }))
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to upload images')
      toast.error(message)
    } finally {
      setUploadingGallery(false)
      e.target.value = ''
    }
  }

  const handleDeleteMedia = async (id: string) => {
    setMediaToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteMedia = async () => {
    if (!mediaToDelete) return
    const id = mediaToDelete
    const prev = gallery
    setDeletingId(id)
    setGallery((g) => g.filter((m) => m.id !== id))
    setDeleteDialogOpen(false)
    setMediaToDelete(null)
    try {
      await adminService.deleteUserMedia(targetUser.id, id)
      toast.success('Image deleted')
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: { what: 'media:delete' } }))
    } catch (error: unknown) {
      console.error(error)
      setGallery(prev)
      const message = getErrorMessage(error, 'Failed to delete image')
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaveContact = async () => {
    if (!hasContactChanges) return

    try {
      setSavingContact(true)
      const updated = await adminService.updateUserProfile(targetUser.id, {
        email: formContact.email?.trim() || undefined,
        phone_number: formContact.phone_number?.trim() || undefined,
      })
      toast.success('Contact information saved')
      const newContact = {
        email: updated.email ?? formContact.email,
        phone_number: updated.phone_number ?? formContact.phone_number,
      }
      setFormContact(newContact)
      setInitialFormContact(newContact)
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: { what: 'contact' } }))
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to update contact')
      toast.error(message)
    } finally {
      setSavingContact(false)
    }
  }

  const handleSaveSocial = async () => {
    if (!hasSocialChanges) return

    try {
      setSavingSocial(true)
      const updated = await adminService.updateUserProfile(targetUser.id, {
        youtube_url: formSocial.youtube_url?.trim() || undefined,
        instagram_url: formSocial.instagram_url?.trim() || undefined,
        facebook_url: formSocial.facebook_url?.trim() || undefined,
      })
      toast.success('Social media links saved')
      const newSocial = {
        youtube_url: updated.youtube_url ?? formSocial.youtube_url,
        instagram_url: updated.instagram_url ?? formSocial.instagram_url,
        facebook_url: updated.facebook_url ?? formSocial.facebook_url,
      }
      setFormSocial(newSocial)
      setInitialFormSocial(newSocial)
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: { what: 'social' } }))
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to update social media')
      toast.error(message)
    } finally {
      setSavingSocial(false)
    }
  }

  const handleSaveExperience = async () => {
    if (!targetUser?.id) {
      toast.error('You need to log in')
      return
    }
    if (!expForm.description.trim() && !expForm.title.trim()) {
      toast.error('Enter at least a description or specialty')
      return
    }
    try {
      setSavingExp(true)

      // Convert YYYY-MM-DD to ISO 8601 with timezone offset (e.g., "2025-12-12T00:00:00+07:00")
      const formatDateToISO = (dateStr: string): string | undefined => {
        if (!dateStr) return undefined
        try {
          // Parse the date string (YYYY-MM-DD)
          const [year, month, day] = dateStr.split('-').map(Number)
          // Create date at midnight in local timezone
          const date = new Date(year, month - 1, day, 0, 0, 0)

          // Get timezone offset in minutes (negative means ahead of UTC)
          const offsetMinutes = date.getTimezoneOffset()
          const offsetHours = Math.abs(Math.floor(offsetMinutes / 60))
          const offsetMins = Math.abs(offsetMinutes % 60)
          // getTimezoneOffset returns positive for behind UTC, so we invert the sign
          const offsetSign = offsetMinutes > 0 ? '-' : '+'
          const offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`

          // Format as YYYY-MM-DDTHH:mm:ss+offset
          const formattedYear = date.getFullYear()
          const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0')
          const formattedDay = date.getDate().toString().padStart(2, '0')

          return `${formattedYear}-${formattedMonth}-${formattedDay}T00:00:00${offset}`
        } catch {
          return undefined
        }
      }

      const payload = {
        title: expForm.title.trim() || undefined,
        description: expForm.description.trim() || undefined,
        portfolio_url: expForm.portfolio_url.trim() || undefined,
        start_date: formatDateToISO(expForm.start_date),
        end_date: formatDateToISO(expForm.end_date),
        genre_names: expForm.genres,
      }
      let experienceId = expForm.id

      if (expForm.id) {
        // Update basic experience info
        throw new Error('Updating experiences is not supported for admins yet.')
      } else {
        // Create new experience
        const created = await adminService.createUserExperience(targetUser.id, payload)
        experienceId = created.id

        // If we created with genres, we need to map them for local display as the backend might return just IDs or assume success
        if (created && expForm.genres.length > 0) {
          created.genres = expForm.genres.map((g) => ({ id: g, name: g }))
        }

        setExperiences((prev) => [created, ...prev])
        toast.success('Experience added')
      }
      setExpForm({
        id: undefined,
        title: '',
        description: '',
        portfolio_url: '',
        start_date: '',
        end_date: '',
        genres: [],
      })
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: { what: 'experience' } }))
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to save experience')
      toast.error(message)
    } finally {
      setSavingExp(false)
    }
  }

  const handleEditExperience = (exp: Experience) => {
    // Convert ISO date strings to YYYY-MM-DD format for date inputs
    const formatDateForInput = (dateStr: string | null | undefined): string => {
      if (!dateStr) return ''
      try {
        const date = new Date(dateStr)
        return date.toISOString().split('T')[0]
      } catch {
        return ''
      }
    }
    setExpForm({
      id: exp.id,
      title: exp.title || '',
      description: exp.description || '',
      portfolio_url: exp.portfolio_url || '',
      start_date: formatDateForInput(exp.start_date),
      end_date: formatDateForInput(exp.end_date),
      genres: exp.genres?.map((g) => g.name) || [],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEditExperience = () => {
    setExpForm({
      id: undefined,
      title: '',
      description: '',
      portfolio_url: '',
      start_date: '',
      end_date: '',
      genres: [],
    })
  }

  const handleDeleteExperience = async (id: string) => {
    setExpToDelete(id)
    setDeleteExpDialogOpen(true)
  }

  const confirmDeleteExperience = async () => {
    if (!expToDelete) return
    const id = expToDelete
    setDeleteExpDialogOpen(false)
    setExpToDelete(null)
    try {
      setDeletingExpId(id)
      throw new Error('Deleting experiences is not supported for admins.')
      if (expForm.id === id)
        setExpForm({
          id: undefined,
          title: '',
          description: '',
          portfolio_url: '',
          start_date: '',
          end_date: '',
          genres: [],
        })
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to delete experience')
      toast.error(message)
    } finally {
      setDeletingExpId(null)
    }
  }

  const handleVideoDeleted = async (videoId: string) => {
    try {
      throw new Error('Deleting videos is not supported for admins.')
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to delete video')
      toast.error(message)
    }
  }

  const refreshVideos = useCallback(async () => {
    if (!me?.username) return
    const res = await videoService.getUserVideos(me.username)
    setVideos(res.items)
  }, [me?.username])

  useEffect(() => {
    if (!openAddVideo && !openEditVideo) {
      refreshVideos()
    }
  }, [openAddVideo, openEditVideo, refreshVideos])

  const genresToRender = useMemo(() => {
    // Use actual genres from the user profile, following ArtistProfileView pattern
    if (me?.genres && me.genres.length > 0) {
      return me.genres.map((g) => g.name)
    }
    return formBasic.genres
  }, [me?.genres, formBasic.genres])

  if (loading) {
    return (
      <div className="w-full relative">
        {/* Tabs - Static Content Always Visible */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="flex flex-wrap gap-2">
            {artistTabs(t).map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="px-4 py-2 capitalize">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Dynamic Content Skeletons */}
          <div className="space-y-8">
            {/* Profile Card Skeleton */}
            <Card>
              <Skeleton className="h-52 w-full rounded-t-xl" />
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <Skeleton className="h-32 w-32 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-3 w-full">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-14" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Section Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="w-full relative">
      <div className="space-y-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="flex flex-wrap gap-2">
            {artistTabs(t).map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="px-4 py-2 capitalize">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <Card>
              <div className="overflow-hidden rounded-xl">
                <div className="relative h-52 w-full">
                  <Image
                    unoptimized
                    src={
                      coverPreviewUrl
                        ? coverPreviewUrl
                        : coverUrl
                          ? `${coverUrl}?v=${cacheBust}`
                          : '/images/profile/background-default.jpg'
                    }
                    alt="Cover"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-background/80 via-background/30 to-transparent" />
                  <div className="absolute inset-x-4 top-4 flex justify-end">
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium shadow">
                        <UploadCloud className="h-4 w-4" />
                        <span>{tProfile('editor.changeCover')}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleCoverFileChange}
                        />
                      </label>
                      {(avatarFile || coverFile) && (
                        <Button size="sm" onClick={handleSaveImages} disabled={savingImages}>
                          {savingImages ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          {savingImages ? tProfile('editor.saving') : tProfile('editor.savePhotos')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Image
                        unoptimized
                        src={
                          avatarPreviewUrl
                            ? avatarPreviewUrl
                            : avatarUrl
                              ? `${avatarUrl}?v=${cacheBust}`
                              : '/images/profile/avatar-default.svg'
                        }
                        alt={heroName}
                        width={128}
                        height={128}
                        className="h-32 w-32 rounded-2xl border-4 border-background object-cover shadow-lg"
                      />
                      <label className="absolute bottom-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                        <Camera className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={handleAvatarFileChange}
                        />
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('profile.artistProfile')}
                        </p>
                        <h2 className="text-2xl font-semibold">{heroName}</h2>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formBasic.city || formBasic.country
                          ? `${formBasic.city}, ${formBasic.country}`
                          : t('profile.locationNotUpdated')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {genresToRender.map((genre) => (
                          <Badge key={genre} variant="secondary">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>

            <SectionCard
              title={tProfile('artist.mainInformation')}
              description={tProfile('artist.mainInformationDesc')}
              action={
                <Button onClick={handleSaveBasic} disabled={savingBasic || !hasBasicChanges}>
                  {savingBasic ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tProfile('editor.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {tProfile('editor.saveChanges')}
                    </>
                  )}
                </Button>
              }
            >
              <form className="space-y-4" onSubmit={handleSaveBasic}>
                <div>
                  <Label htmlFor="display_name">{tProfile('editor.stageName')} *</Label>
                  <Input
                    id="display_name"
                    name="display_name"
                    value={formBasic.display_name}
                    onChange={onBasicChange}
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="city">{t('city')} *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formBasic.city}
                      onChange={onBasicChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">{t('country')} *</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formBasic.country}
                      onChange={onBasicChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="brief_bio">{tProfile('editor.briefIntroduction')} *</Label>
                  <textarea
                    id="brief_bio"
                    name="brief_bio"
                    rows={3}
                    value={formBasic.brief_bio}
                    onChange={onBasicChange}
                    placeholder={tProfile('artist.briefIntroductionPlaceholder')}
                    className="w-full rounded-md border bg-background p-3"
                  />
                </div>
                <div>
                  <Label htmlFor="detail_bio">{tProfile('editor.detailedIntroduction')}</Label>
                  <textarea
                    id="detail_bio"
                    name="detail_bio"
                    rows={5}
                    value={formBasic.detail_bio}
                    onChange={onBasicChange}
                    placeholder={tProfile('artist.detailedIntroductionPlaceholder')}
                    className="w-full rounded-md border bg-background p-3"
                  />
                </div>
                <div>
                  <Label htmlFor="genres">{tProfile('editor.genres')}</Label>
                  <MultiSelect
                    options={availableGenres}
                    selected={formBasic.genres}
                    onChange={(selected) => setFormBasic((prev) => ({ ...prev, genres: selected }))}
                    placeholder={tProfile('editor.genresPlaceholder')}
                    className="w-full"
                  />
                </div>
              </form>
            </SectionCard>
          </TabsContent>

          <TabsContent value="media" className="space-y-8">
            <SectionCard
              title={tProfile('editor.profilePhotos')}
              description={tProfile('editor.profilePhotosDesc')}
              action={
                <Button
                  onClick={handleSaveImages}
                  disabled={savingImages || (!avatarFile && !coverFile)}
                >
                  {savingImages ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tProfile('editor.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {tProfile('editor.savePhotos')}
                    </>
                  )}
                </Button>
              }
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>{tProfile('editor.profilePicture')}</Label>
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="h-20 w-20 overflow-hidden rounded-full border bg-muted">
                      {avatarPreviewUrl || avatarUrl ? (
                        <Image
                          unoptimized
                          src={avatarPreviewUrl || `${avatarUrl}?v=${cacheBust}`}
                          alt="Avatar preview"
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Camera className="mx-auto my-5 h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <label className="flex flex-1 cursor-pointer flex-col gap-1 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      {tProfile('editor.avatarFileDesc')}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>{tProfile('editor.coverPhoto')}</Label>
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="h-20 w-32 overflow-hidden rounded-lg border bg-muted">
                      {coverPreviewUrl || coverUrl ? (
                        <Image
                          unoptimized
                          src={coverPreviewUrl || `${coverUrl}?v=${cacheBust}`}
                          alt="Cover preview"
                          width={160}
                          height={100}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Camera className="mx-auto my-5 h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <label className="flex flex-1 cursor-pointer flex-col gap-1 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      {tProfile('editor.coverFileDesc')}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleCoverFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title={tProfile('editor.photoGallery')}
              description={tProfile('editor.photoGalleryArtistDesc')}
              action={
                <>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleAddGallery}
                    disabled={uploadingGallery}
                    id="gallery-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingGallery}
                    onClick={() => document.getElementById('gallery-upload')?.click()}
                  >
                    {uploadingGallery ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {tProfile('editor.uploading')}
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        {tProfile('editor.addPhotos')}
                      </>
                    )}
                  </Button>
                </>
              }
            >
              {gallery.length === 0 ? (
                <p className="text-muted-foreground">{tProfile('editor.noPhotos')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {gallery.map((m) => (
                    <div key={m.id} className="group relative overflow-hidden rounded-xl border">
                      <Image
                        unoptimized
                        src={`${m.file_url}?v=${m.updated_at ?? ''}`}
                        alt={m.file_name}
                        width={300}
                        height={300}
                        className="h-44 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(m.id)}
                        disabled={deletingId === m.id}
                        className="absolute right-2 top-2 hidden rounded-full bg-background/80 p-2 text-destructive shadow transition group-hover:flex"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title={tProfile('artist.videoPortfolio')}
              description={tProfile('artist.videoPortfolioDesc')}
              action={
                <Button onClick={() => setOpenAddVideo(true)}>{tProfile('artist.addVideo')}</Button>
              }
            >
              {videos.length === 0 ? (
                <p className="text-muted-foreground">{tProfile('artist.noVideos')}</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {videos.map((video) => (
                    <Card key={video.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted">
                        <video
                          src={video.video_url}
                          controls
                          className="h-full w-full object-cover"
                          poster={video.thumbnail_url || undefined}
                        />
                      </div>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{video.title || tProfile('editor.noTitle')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(video.created_at).toLocaleDateString(tCommon('locale'))}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setEditVideoData({ id: video.id, title: video.title })
                              setOpenEditVideo(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleVideoDeleted(video.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="experience" className="space-y-8">
            <SectionCard
              title={tProfile('editor.experienceServices')}
              description={tProfile('editor.experienceServicesDesc')}
              action={
                <div className="flex gap-2">
                  {expForm.id && (
                    <Button
                      variant="outline"
                      onClick={handleCancelEditExperience}
                      disabled={savingExp}
                    >
                      <X className="mr-2 h-4 w-4" />
                      {tProfile('editor.cancel')}
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveExperience}
                    disabled={savingExp || !expForm.title.trim()}
                  >
                    {savingExp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {expForm.id ? tProfile('editor.updating') : tProfile('editor.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {expForm.id ? tProfile('editor.update') : tProfile('editor.saveNewItem')}
                      </>
                    )}
                  </Button>
                </div>
              }
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="exp_title">{tProfile('artist.expTitle')} *</Label>
                  <Input
                    id="exp_title"
                    name="title"
                    value={expForm.title}
                    onChange={(e) => setExpForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder={tProfile('artist.expTitlePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="exp_description">{tProfile('artist.expDescription')}</Label>
                  <textarea
                    id="exp_description"
                    name="description"
                    rows={5}
                    value={expForm.description}
                    onChange={(e) =>
                      setExpForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder={tProfile('artist.expDescriptionPlaceholder')}
                    className="w-full rounded-md border bg-background p-3"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="exp_start_date">{tProfile('artist.startDate')}</Label>
                    <Input
                      id="exp_start_date"
                      name="start_date"
                      type="date"
                      value={expForm.start_date}
                      onChange={(e) =>
                        setExpForm((prev) => ({ ...prev, start_date: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="exp_end_date">{tProfile('artist.endDate')}</Label>
                    <Input
                      id="exp_end_date"
                      name="end_date"
                      type="date"
                      value={expForm.end_date}
                      onChange={(e) =>
                        setExpForm((prev) => ({ ...prev, end_date: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="genres">{tProfile('editor.genres')}</Label>
                  <MultiSelect
                    options={availableGenres}
                    selected={expForm.genres}
                    onChange={(selected) => setExpForm((prev) => ({ ...prev, genres: selected }))}
                    placeholder={tProfile('editor.genresPlaceholder')}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="exp_portfolio_url">{tProfile('artist.portfolioLink')}</Label>
                  <Input
                    id="exp_portfolio_url"
                    name="portfolio_url"
                    type="url"
                    value={expForm.portfolio_url}
                    onChange={(e) =>
                      setExpForm((prev) => ({ ...prev, portfolio_url: e.target.value }))
                    }
                    placeholder={tProfile('artist.portfolioLinkPlaceholder')}
                  />
                </div>
              </div>
            </SectionCard>

            <Card>
              <CardHeader>
                <CardTitle>{tProfile('artist.experienceList')}</CardTitle>
                <CardDescription>{tProfile('artist.experienceListDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {experiences.length === 0 ? (
                  <p className="text-muted-foreground">{tProfile('artist.noItems')}</p>
                ) : (
                  experiences.map((experience, index) => (
                    <div
                      key={experience.id || `experience-${index}`}
                      className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
                    >
                      <div className="pr-3 space-y-1">
                        <p className="font-medium">
                          {experience.title || tProfile('editor.noTitle')}
                        </p>
                        {(experience.start_date || experience.end_date) && (
                          <p className="text-xs text-muted-foreground">
                            {experience.start_date
                              ? new Date(experience.start_date).toLocaleDateString(
                                  tCommon('locale'),
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                  },
                                )
                              : tProfile('artist.startDateNotSet')}{' '}
                            -{' '}
                            {experience.end_date
                              ? new Date(experience.end_date).toLocaleDateString(
                                  tCommon('locale'),
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                  },
                                )
                              : tProfile('artist.present')}
                          </p>
                        )}
                        {experience.description ? (
                          <p className="text-sm text-muted-foreground">{experience.description}</p>
                        ) : null}
                        {experience.genres && experience.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {experience.genres.map((g) => (
                              <Badge
                                key={g.id || g.name}
                                variant="secondary"
                                className="text-[10px] px-1 py-0 h-5"
                              >
                                {g.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {experience.portfolio_url ? (
                          <a
                            href={experience.portfolio_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline"
                          >
                            {experience.portfolio_url}
                          </a>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEditExperience(experience)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDeleteExperience(experience.id)}
                          disabled={deletingExpId === experience.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-8">
            <SectionCard
              title={tProfile('editor.contact')}
              description={tProfile('editor.contactDesc')}
              action={
                <Button onClick={handleSaveContact} disabled={savingContact || !hasContactChanges}>
                  {savingContact ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {tProfile('editor.saveContact')}
                    </>
                  )}
                </Button>
              }
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">{tCommon('email')} *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formContact.email}
                    onChange={onContactChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">{tCommon('phoneNumber')} *</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formContact.phone_number}
                    onChange={onContactChange}
                    required
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title={tProfile('editor.socialMedia')}
              description={tProfile('editor.socialMediaDesc')}
              action={
                <Button onClick={handleSaveSocial} disabled={savingSocial || !hasSocialChanges}>
                  {savingSocial ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tProfile('editor.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {tProfile('editor.saveLinks')}
                    </>
                  )}
                </Button>
              }
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="youtube_url">YouTube</Label>
                  <Input
                    id="youtube_url"
                    name="youtube_url"
                    placeholder="https://youtube.com/..."
                    value={formSocial.youtube_url}
                    onChange={onSocialChange}
                  />
                </div>
                <div>
                  <Label htmlFor="instagram_url">Instagram</Label>
                  <Input
                    id="instagram_url"
                    name="instagram_url"
                    placeholder="https://instagram.com/..."
                    value={formSocial.instagram_url}
                    onChange={onSocialChange}
                  />
                </div>
                <div>
                  <Label htmlFor="facebook_url">Facebook</Label>
                  <Input
                    id="facebook_url"
                    name="facebook_url"
                    placeholder="https://facebook.com/..."
                    value={formSocial.facebook_url}
                    onChange={onSocialChange}
                  />
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>

        <VideoModal open={openAddVideo} setOpen={setOpenAddVideo} onUploaded={refreshVideos} />
        <VideoModal
          open={openEditVideo}
          setOpen={setOpenEditVideo}
          onUploaded={refreshVideos}
          init={editVideoData || undefined}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tProfile('editor.deleteImageTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{tProfile('editor.deleteImageDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteMedia}>
                {tCommon('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteExpDialogOpen} onOpenChange={setDeleteExpDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tProfile('editor.deleteExpTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{tProfile('editor.deleteExpDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteExperience}>
                {tCommon('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ImageCropper
          open={cropperOpen}
          onOpenChange={(open) => {
            setCropperOpen(open)
            if (!open) {
              setCroppingImage(null)
              setCropType(null)
            }
          }}
          image={croppingImage}
          onCropComplete={handleCropComplete}
          aspectRatio={cropType === 'avatar' ? 1 : 16 / 5} // 16:5 ratio for cover
          title={cropType === 'avatar' ? 'Crop Avatar' : 'Crop Cover Photo'}
        />
      </div>
    </div>
  )
}
