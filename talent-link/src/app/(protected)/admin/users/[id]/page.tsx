'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldOff,
  Ban,
  Star,
  Globe,
  ExternalLink,
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { AdminUser } from '@/types/admin'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export default function AdminUserDetailPage() {
  const t = useTranslations('Admin.userDetailPage')
  const tUsers = useTranslations('Admin.usersPage')
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: 'ban' | 'unban' | 'verify' | 'unverify'
  }>({
    open: false,
    action: 'ban',
  })

  const fetchUser = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminService.getUser(userId)
      setUser(response)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      toast.error(t('errorLoad'))
    } finally {
      setLoading(false)
    }
  }, [userId, t])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleAction = (action: 'ban' | 'unban' | 'verify' | 'unverify') => {
    setConfirmDialog({ open: true, action })
  }

  const handleConfirmAction = async () => {
    if (!user) return
    setActionLoading(true)
    setConfirmDialog({ ...confirmDialog, open: false })

    try {
      switch (confirmDialog.action) {
        case 'ban':
          await adminService.banUser(user.id)
          toast.success(tUsers('successBanned'))
          break
        case 'unban':
          await adminService.unbanUser(user.id)
          toast.success(tUsers('successUnbanned'))
          break
        case 'verify':
          await adminService.verifyUser(user.id)
          toast.success(tUsers('successVerified'))
          break
        case 'unverify':
          await adminService.unverifyUser(user.id)
          toast.success(tUsers('successUnverified'))
          break
      }
      await fetchUser()
    } catch (error) {
      console.error('Failed to perform action:', error)
      toast.error(tUsers('errorAction'))
    } finally {
      setActionLoading(false)
    }
  }

  const getConfirmDialogProps = () => {
    const name = user?.display_name || user?.username || ''
    switch (confirmDialog.action) {
      case 'ban':
        return {
          title: tUsers('banUser'),
          description: tUsers('banConfirm', { name }),
          variant: 'destructive' as const,
        }
      case 'unban':
        return {
          title: tUsers('unbanUser'),
          description: tUsers('unbanConfirm', { name }),
          variant: 'default' as const,
        }
      case 'verify':
        return {
          title: tUsers('verifyUser'),
          description: tUsers('verifyConfirm', { name }),
          variant: 'default' as const,
        }
      case 'unverify':
        return {
          title: tUsers('unverifyUser'),
          description: tUsers('unverifyConfirm', { name }),
          variant: 'destructive' as const,
        }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-500/10 border-green-500/20'
      case 'banned':
        return 'text-red-600 bg-red-500/10 border-red-500/20'
      default:
        return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20'
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const dialogProps = getConfirmDialogProps()

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 w-32 rounded bg-card/50 animate-pulse mb-4" />
          <div className="h-10 w-64 rounded bg-card/50 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-96 rounded-xl border border-border/50 bg-card/50 animate-pulse" />
          <div className="lg:col-span-2 h-96 rounded-xl border border-border/50 bg-card/50 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <motion.div
        className="text-center py-16"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <XCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground text-lg">{t('userNotFound')}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/admin/users')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToUsers')}
        </Button>
      </motion.div>
    )
  }

  const socialLinks = [
    { label: t('facebook'), url: user.facebook_url, icon: Globe },
    { label: t('instagram'), url: user.instagram_url, icon: Globe },
    { label: t('youtube'), url: user.youtube_url, icon: Globe },
    { label: t('website'), url: user.website_url, icon: Globe },
  ].filter((link) => link.url)

  return (
    <div>
      {/* Back Button */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button asChild variant="ghost" size="sm" className="gap-2 hover:bg-primary/10">
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4" />
            {t('backToUsers')}
          </Link>
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          {t('title')}
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              {/* Avatar */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-linear-to-br from-primary/20 to-primary/10 ring-4 ring-border/50">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.display_name || user.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">
                    {(user.display_name || user.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name & Username */}
              <div>
                <h2 className="text-xl font-bold">{user.display_name || user.username}</h2>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="default" className="capitalize">
                  {user.role}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('capitalize', getStatusColor(user.status))}
                >
                  {user.status}
                </Badge>
                {user.is_verified && (
                  <Badge variant="outline" className="text-blue-600 bg-blue-500/10 border-blue-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('verification')}
                  </Badge>
                )}
                {user.is_featured && (
                  <Badge variant="outline" className="text-amber-600 bg-amber-500/10 border-amber-500/20">
                    <Star className="w-3 h-3 mr-1" />
                    {t('featuredStatus')}
                  </Badge>
                )}
              </div>

              {/* Bio */}
              {user.brief_bio ? (
                <p className="text-sm text-muted-foreground">{user.brief_bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t('noBio')}</p>
              )}

              {/* Location */}
              {(user.city || user.country) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{[user.city, user.country].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {/* Joined Date */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{t('joinedDate')}: {formatDate(user.created_at)}</span>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2 pt-4 border-t border-border/50">
                <h3 className="text-sm font-semibold mb-3">{t('actions')}</h3>
                {user.status === 'banned' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30"
                    onClick={() => handleAction('unban')}
                    disabled={actionLoading}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {tUsers('unbanUser')}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30"
                    onClick={() => handleAction('ban')}
                    disabled={actionLoading || user.role === 'admin'}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    {tUsers('banUser')}
                  </Button>
                )}
                {user.is_verified ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/30"
                    onClick={() => handleAction('unverify')}
                    disabled={actionLoading}
                  >
                    <ShieldOff className="w-4 h-4 mr-2" />
                    {tUsers('unverifyUser')}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30"
                    onClick={() => handleAction('verify')}
                    disabled={actionLoading}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {tUsers('verifyUser')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column - Details */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Account Information */}
          <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('accountInfo')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('email')}</p>
                  <p className="text-sm font-medium">{user.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('username')}</p>
                  <p className="text-sm font-medium">@{user.username}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('displayName')}</p>
                  <p className="text-sm font-medium">{user.display_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('role')}</p>
                  <Badge variant="default" className="capitalize">{user.role}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('status')}</p>
                  <Badge variant="outline" className={cn('capitalize', getStatusColor(user.status))}>
                    {user.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('verification')}</p>
                  <div className="flex items-center gap-1.5">
                    {user.is_verified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">{tUsers('verified')}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{tUsers('notVerified')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('joinedDate')}</p>
                  <p className="text-sm font-medium">{formatDate(user.created_at)}</p>
                </div>
                {user.updated_at && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('lastUpdated')}</p>
                    <p className="text-sm font-medium">{formatDate(user.updated_at)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('profileInfo')}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('bio')}</p>
                  <p className="text-sm">{user.brief_bio || <span className="italic text-muted-foreground">{t('noBio')}</span>}</p>
                </div>
                {user.detail_bio && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('detailBio')}</p>
                    <p className="text-sm whitespace-pre-wrap">{user.detail_bio}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('location')}</p>
                  <p className="text-sm">
                    {user.city || user.country
                      ? [user.city, user.country].filter(Boolean).join(', ')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t('genres')}</p>
                  {user.genres && user.genres.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.genres.map((genre) => (
                        <Badge key={genre.id} variant="secondary">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">{t('noGenres')}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('socialLinks')}</h3>
              {socialLinks.length > 0 ? (
                <div className="space-y-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 border border-border/50 transition-colors group"
                    >
                      <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{link.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">{t('noSocialLinks')}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={dialogProps.title}
        description={dialogProps.description}
        onConfirm={handleConfirmAction}
        variant={dialogProps.variant}
      />
    </div>
  )
}
