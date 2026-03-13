'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { adminService } from '@/services/adminService'
import { resolveMediaUrl } from '@/lib/utils'
import ImageCropper from '@/components/common/ImageCropper'
import type { FeaturedUser } from '@/types/admin'
import type { Media } from '@/types/media'
import { toast } from 'sonner'
import {
  Upload,
  Loader2,
  Trash2,
  ImageIcon,
  User as UserIcon,
  Frame,
  Images,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface AdminMediaUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: FeaturedUser | null
  onMediaUpdated?: () => void
}

const VALID_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_AVATAR_SIZE_MB = 5
const MAX_COVER_SIZE_MB = 10
const MAX_PORTFOLIO_SIZE_MB = 10

function validateImageFile(file: File, maxSizeMB: number): string | null {
  if (!VALID_MIMES.includes(file.type)) {
    return 'File must be JPEG, PNG, GIF, or WebP'
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File must be less than ${maxSizeMB}MB`
  }
  return null
}

export function AdminMediaUploadDialog({
  open,
  onOpenChange,
  user,
  onMediaUpdated,
}: AdminMediaUploadDialogProps) {
  const t = useTranslations('Admin.mediaUpload')

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [cropType, setCropType] = useState<'avatar' | 'cover' | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Cover state
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Portfolio state
  const [portfolioMedia, setPortfolioMedia] = useState<Media[]>([])
  const [loadingPortfolio, setLoadingPortfolio] = useState(false)
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false)
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null)
  const portfolioInputRef = useRef<HTMLInputElement>(null)

  // Reset state when dialog closes or user changes
  useEffect(() => {
    if (!open) {
      setAvatarPreview(null)
      setAvatarFile(null)
      setCoverPreview(null)
      setCoverFile(null)
      setCropImage(null)
      setCropType(null)
      setPortfolioMedia([])
    }
  }, [open])

  // Load portfolio when dialog opens
  useEffect(() => {
    if (open && user) {
      fetchPortfolio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id])

  const fetchPortfolio = useCallback(async () => {
    if (!user) return
    setLoadingPortfolio(true)
    try {
      const res = await adminService.getUserMedia(user.id)
      setPortfolioMedia(res.media)
    } catch {
      // Portfolio may not be available for all users
      setPortfolioMedia([])
    } finally {
      setLoadingPortfolio(false)
    }
  }, [user])

  // --- Avatar ---
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file, MAX_AVATAR_SIZE_MB)
    if (err) {
      toast.error(err)
      return
    }
    const url = URL.createObjectURL(file)
    setCropImage(url)
    setCropType('avatar')
    // Reset input so same file can be re-selected
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  const handleAvatarCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(croppedBlob))
  }

  const handleUploadAvatar = async () => {
    if (!user || !avatarFile) return
    setUploadingAvatar(true)
    try {
      await adminService.uploadUserAvatar(user.id, avatarFile)
      toast.success(t('avatarSuccess'))
      setAvatarFile(null)
      setAvatarPreview(null)
      onMediaUpdated?.()
    } catch {
      toast.error(t('avatarError'))
    } finally {
      setUploadingAvatar(false)
    }
  }

  // --- Cover ---
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file, MAX_COVER_SIZE_MB)
    if (err) {
      toast.error(err)
      return
    }
    const url = URL.createObjectURL(file)
    setCropImage(url)
    setCropType('cover')
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const handleCoverCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' })
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(croppedBlob))
  }

  const handleUploadCover = async () => {
    if (!user || !coverFile) return
    setUploadingCover(true)
    try {
      await adminService.uploadUserCover(user.id, coverFile)
      toast.success(t('coverSuccess'))
      setCoverFile(null)
      setCoverPreview(null)
      onMediaUpdated?.()
    } catch {
      toast.error(t('coverError'))
    } finally {
      setUploadingCover(false)
    }
  }

  // --- Portfolio ---
  const handlePortfolioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !user) return
    setUploadingPortfolio(true)
    let successCount = 0
    let failCount = 0

    for (const file of Array.from(files)) {
      const err = validateImageFile(file, MAX_PORTFOLIO_SIZE_MB)
      if (err) {
        toast.error(`${file.name}: ${err}`)
        failCount++
        continue
      }
      try {
        await adminService.uploadUserMedia(user.id, file)
        successCount++
      } catch {
        failCount++
      }
    }

    if (successCount > 0) {
      toast.success(t('portfolioUploadSuccess', { count: successCount }))
      await fetchPortfolio()
      onMediaUpdated?.()
    }
    if (failCount > 0) {
      toast.error(t('portfolioUploadError', { count: failCount }))
    }

    setUploadingPortfolio(false)
    if (portfolioInputRef.current) portfolioInputRef.current.value = ''
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (!user) return
    setDeletingMediaId(mediaId)
    try {
      await adminService.deleteUserMedia(user.id, mediaId)
      toast.success(t('portfolioDeleteSuccess'))
      setPortfolioMedia((prev) => prev.filter((m) => m.id !== mediaId))
      onMediaUpdated?.()
    } catch {
      toast.error(t('portfolioDeleteError'))
    } finally {
      setDeletingMediaId(null)
    }
  }

  const handleCropComplete = (croppedBlob: Blob) => {
    if (cropType === 'avatar') {
      handleAvatarCropComplete(croppedBlob)
    } else if (cropType === 'cover') {
      handleCoverCropComplete(croppedBlob)
    }
  }

  if (!user) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border-border/50 bg-card/95 backdrop-blur-md p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-xl">
              {t('title', { name: user.display_name || user.username })}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {t('subtitle', { username: user.username })}
            </p>
          </DialogHeader>

          <Tabs defaultValue="avatar" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="w-full">
                <TabsTrigger value="avatar" className="flex-1 gap-2">
                  <UserIcon className="w-4 h-4" />
                  {t('avatarTab')}
                </TabsTrigger>
                <TabsTrigger value="cover" className="flex-1 gap-2">
                  <Frame className="w-4 h-4" />
                  {t('coverTab')}
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="flex-1 gap-2">
                  <Images className="w-4 h-4" />
                  {t('portfolioTab')}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Avatar Tab */}
            <TabsContent value="avatar" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  {/* Current avatar */}
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted ring-2 ring-border/50">
                    {avatarPreview || user.avatar_url ? (
                      <Image
                        src={avatarPreview || resolveMediaUrl(user.avatar_url)}
                        alt={user.display_name || user.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">
                        {(user.display_name || user.username || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {avatarPreview && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                          {t('preview')}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{t('avatarHint')}</p>

                  <div className="flex gap-3">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                    <Button
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                      className="gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {t('selectImage')}
                    </Button>
                    {avatarFile && (
                      <Button
                        onClick={handleUploadAvatar}
                        disabled={uploadingAvatar}
                        className="gap-2"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {uploadingAvatar ? t('uploading') : t('uploadAvatar')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Cover Tab */}
            <TabsContent value="cover" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  {/* Cover preview */}
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted ring-2 ring-border/50">
                    {coverPreview ? (
                      <Image
                        src={coverPreview}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Frame className="w-12 h-12" />
                      </div>
                    )}
                    {coverPreview && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                          {t('preview')}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{t('coverHint')}</p>

                  <div className="flex gap-3">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleCoverSelect}
                    />
                    <Button
                      variant="outline"
                      onClick={() => coverInputRef.current?.click()}
                      className="gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {t('selectImage')}
                    </Button>
                    {coverFile && (
                      <Button
                        onClick={handleUploadCover}
                        disabled={uploadingCover}
                        className="gap-2"
                      >
                        {uploadingCover ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {uploadingCover ? t('uploading') : t('uploadCover')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t('portfolioHint')}</p>
                  <div>
                    <input
                      ref={portfolioInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={handlePortfolioSelect}
                    />
                    <Button
                      variant="outline"
                      onClick={() => portfolioInputRef.current?.click()}
                      disabled={uploadingPortfolio}
                      className="gap-2"
                    >
                      {uploadingPortfolio ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploadingPortfolio ? t('uploading') : t('addImages')}
                    </Button>
                  </div>
                </div>

                {/* Portfolio grid */}
                {loadingPortfolio ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : portfolioMedia.length === 0 ? (
                  <div className="text-center py-12 rounded-lg border border-dashed border-border/50">
                    <Images className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground">{t('noPortfolioImages')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {portfolioMedia.map((media) => (
                      <div
                        key={media.id}
                        className="group relative aspect-square rounded-lg overflow-hidden bg-muted border border-border/50"
                      >
                        <Image
                          src={resolveMediaUrl(media.file_url)}
                          alt={media.file_name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                            onClick={() => handleDeleteMedia(media.id)}
                            disabled={deletingMediaId === media.id}
                          >
                            {deletingMediaId === media.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            {t('delete')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      <ImageCropper
        image={cropImage}
        open={!!cropImage && !!cropType}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCropImage(null)
            setCropType(null)
          }
        }}
        onCropComplete={handleCropComplete}
        aspectRatio={cropType === 'cover' ? 16 / 5 : 1}
        title={cropType === 'cover' ? t('cropCover') : t('cropAvatar')}
      />
    </>
  )
}
