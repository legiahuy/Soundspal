'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Star,
  Shield,
  ShieldOff,
  Ban,
  ShieldCheck,
  Trash2,
  Globe,
  ExternalLink,
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { AdminUser } from '@/types/admin'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/utils'

const AVAILABLE_ROLES = ['singer', 'producer', 'venue', 'admin'] as const

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-600 border-red-500/30',
  producer: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  singer: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  venue: 'bg-green-500/10 text-green-600 border-green-500/30',
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('Admin.userDetailPage')
  const userId = params.id as string

  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmText: string
    variant: 'default' | 'destructive'
    action: () => Promise<void>
  }>({
    open: false,
    title: '',
    description: '',
    confirmText: '',
    variant: 'default',
    action: async () => {},
  })

  const fetchUser = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminService.getUser(userId)
      setUser(response.data)
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

  const handleRoleChange = (newRole: string) => {
    if (!user || newRole === user.role) return
    setConfirmDialog({
      open: true,
      title: t('changeRole'),
      description: t('changeRoleConfirm', {
        name: user.display_name || user.username,
        role: newRole,
      }),
      confirmText: t('changeRoleAction'),
      variant: 'default',
      action: async () => {
        setActionLoading(true)
        try {
          await adminService.updateUserRole(userId, newRole)
          toast.success(t('successRoleChanged'))
          await fetchUser()
        } catch (error) {
          console.error('Failed to update role:', error)
          toast.error(t('errorUpdate'))
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleBanToggle = () => {
    if (!user) return
    const isBanned = user.status === 'banned'
    setConfirmDialog({
      open: true,
      title: isBanned ? t('unbanUser') : t('banUser'),
      description: isBanned
        ? t('unbanConfirm', { name: user.display_name || user.username })
        : t('banConfirm', { name: user.display_name || user.username }),
      confirmText: isBanned ? t('unbanAction') : t('banAction'),
      variant: isBanned ? 'default' : 'destructive',
      action: async () => {
        setActionLoading(true)
        try {
          if (isBanned) {
            await adminService.unbanUser(userId)
            toast.success(t('successUnbanned'))
          } else {
            await adminService.banUser(userId)
            toast.success(t('successBanned'))
          }
          await fetchUser()
        } catch (error) {
          console.error('Failed to toggle ban:', error)
          toast.error(t('errorUpdate'))
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleVerifyToggle = () => {
    if (!user) return
    setConfirmDialog({
      open: true,
      title: user.is_verified ? t('unverifyUser') : t('verifyUser'),
      description: user.is_verified
        ? t('unverifyConfirm', { name: user.display_name || user.username })
        : t('verifyConfirm', { name: user.display_name || user.username }),
      confirmText: user.is_verified ? t('unverifyAction') : t('verifyAction'),
      variant: user.is_verified ? 'destructive' : 'default',
      action: async () => {
        setActionLoading(true)
        try {
          if (user.is_verified) {
            await adminService.unverifyUser(userId)
            toast.success(t('successUnverified'))
          } else {
            await adminService.verifyUser(userId)
            toast.success(t('successVerified'))
          }
          await fetchUser()
        } catch (error) {
          console.error('Failed to toggle verification:', error)
          toast.error(t('errorUpdate'))
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleDelete = () => {
    if (!user) return
    setConfirmDialog({
      open: true,
      title: t('deleteUser'),
      description: t('deleteConfirm', { name: user.display_name || user.username }),
      confirmText: t('deleteAction'),
      variant: 'destructive',
      action: async () => {
        setActionLoading(true)
        try {
          await adminService.deleteUser(userId)
          toast.success(t('successDeleted'))
          router.push('/admin/users')
        } catch (error) {
          console.error('Failed to delete user:', error)
          toast.error(t('errorDelete'))
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const avatarUrl = user?.avatar_url ? resolveMediaUrl(user.avatar_url) : undefined

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 rounded bg-card/50 animate-pulse" />
        <div className="h-64 rounded-xl border border-border/50 bg-card/50 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 rounded-xl border border-border/50 bg-card/50 animate-pulse" />
          <div className="h-48 rounded-xl border border-border/50 bg-card/50 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">{t('userNotFound')}</p>
        <Button variant="outline" onClick={() => router.push('/admin/users')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToUsers')}
        </Button>
      </div>
    )
  }

  const socialLinks = [
    { url: user.facebook_url, label: 'Facebook' },
    { url: user.instagram_url, label: 'Instagram' },
    { url: user.youtube_url, label: 'YouTube' },
    { url: user.website_url, label: 'Website' },
  ].filter((link) => link.url)

  return (
    <div>
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/users')}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToUsers')}
        </Button>
      </motion.div>

      {/* User Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-border/50 bg-card/70 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 ring-2 ring-border/50">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
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
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl font-bold">
                    {user.display_name || user.username}
                  </h1>
                  {user.is_verified && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                  {user.is_featured && (
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  )}
                  {user.status === 'banned' && (
                    <Badge variant="destructive">Banned</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-3">@{user.username}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {user.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {(user.city || user.country) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{[user.city, user.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {user.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {user.brief_bio && (
                  <p className="mt-3 text-sm text-muted-foreground">{user.brief_bio}</p>
                )}
              </div>

              {/* Role Badge */}
              <div className="flex-shrink-0">
                <Badge
                  variant="outline"
                  className={cn(
                    'capitalize text-base px-4 py-1',
                    roleColors[user.role] || 'border-primary/30 text-primary',
                  )}
                >
                  {user.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {t('roleManagement')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{t('roleDescription')}</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ROLES.map((role) => (
                  <Button
                    key={role}
                    variant={user.role === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRoleChange(role)}
                    disabled={actionLoading || user.role === role}
                    className="capitalize"
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Verify/Unverify */}
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleVerifyToggle}
                disabled={actionLoading}
              >
                {user.is_verified ? (
                  <>
                    <ShieldOff className="w-4 h-4 text-amber-500" />
                    {t('unverifyUser')}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    {t('verifyUser')}
                  </>
                )}
              </Button>

              {/* Ban/Unban */}
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start gap-2',
                  user.status !== 'banned' && 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30',
                )}
                onClick={handleBanToggle}
                disabled={actionLoading}
              >
                <Ban className="w-4 h-4" />
                {user.status === 'banned' ? t('unbanUser') : t('banUser')}
              </Button>

              {/* Delete */}
              <Button
                variant="outline"
                className="w-full justify-start gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                <Trash2 className="w-4 h-4" />
                {t('deleteUser')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detail Bio */}
        {user.detail_bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">{t('detailBio')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {user.detail_bio}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Genres */}
        {user.genres && user.genres.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">{t('genres')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.genres.map((genre) => (
                    <Badge key={genre.id} variant="secondary" className="text-sm">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  {t('socialLinks')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-medium">{link.label}</span>
                    <span className="truncate text-xs opacity-70">{link.url}</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.action}
        variant={confirmDialog.variant}
      />
    </div>
  )
}
