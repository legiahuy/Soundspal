'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import {
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Search,
  Eye,
  ShieldCheck,
  ShieldOff,
  Ban,
  CheckCircle,
  MapPin,
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { AdminUser } from '@/types/admin'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

const ROLES = ['singer', 'producer', 'venue', 'admin'] as const
const STATUSES = ['active', 'banned', 'inactive'] as const

export default function AdminUsersPage() {
  const t = useTranslations('Admin.usersPage')
  const tCommon = useTranslations('Common')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
  })
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    userId: string
    userName: string
    action: 'ban' | 'unban' | 'verify' | 'unverify'
  }>({
    open: false,
    userId: '',
    userName: '',
    action: 'ban',
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminService.listUsers({
        limit: pagination.limit,
        offset: pagination.offset,
        role: roleFilter || undefined,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      })
      const usersData = response.data.users
      setUsers(Array.isArray(usersData) ? usersData : usersData?.users || [])
      setPagination((prev) => ({
        ...prev,
        total: response.data.total,
      }))
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error(t('errorLoad'))
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, pagination.offset, roleFilter, debouncedSearch, statusFilter, t])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setPagination((prev) => ({ ...prev, offset: 0 }))
  }, [debouncedSearch, roleFilter, statusFilter])

  const handleAction = (
    userId: string,
    userName: string,
    action: 'ban' | 'unban' | 'verify' | 'unverify',
  ) => {
    setConfirmDialog({ open: true, userId, userName, action })
  }

  const handleConfirmAction = async () => {
    const { userId, action } = confirmDialog
    setActionLoading(userId)
    setConfirmDialog({ ...confirmDialog, open: false })

    try {
      switch (action) {
        case 'ban':
          await adminService.banUser(userId)
          toast.success(t('successBanned'))
          break
        case 'unban':
          await adminService.unbanUser(userId)
          toast.success(t('successUnbanned'))
          break
        case 'verify':
          await adminService.verifyUser(userId)
          toast.success(t('successVerified'))
          break
        case 'unverify':
          await adminService.unverifyUser(userId)
          toast.success(t('successUnverified'))
          break
      }
      await fetchUsers()
    } catch (error) {
      console.error('Failed to perform action:', error)
      toast.error(t('errorAction'))
    } finally {
      setActionLoading(null)
    }
  }

  const getConfirmDialogProps = () => {
    const { action, userName } = confirmDialog
    switch (action) {
      case 'ban':
        return {
          title: t('banUser'),
          description: t('banConfirm', { name: userName }),
          variant: 'destructive' as const,
        }
      case 'unban':
        return {
          title: t('unbanUser'),
          description: t('unbanConfirm', { name: userName }),
          variant: 'default' as const,
        }
      case 'verify':
        return {
          title: t('verifyUser'),
          description: t('verifyConfirm', { name: userName }),
          variant: 'default' as const,
        }
      case 'unverify':
        return {
          title: t('unverifyUser'),
          description: t('unverifyConfirm', { name: userName }),
          variant: 'destructive' as const,
        }
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'producer':
        return 'secondary'
      case 'singer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status?: string | null) => {
    const s = status?.trim().toLowerCase() || 'active'
    switch (s) {
      case 'active':
        return 'text-green-600 bg-green-500/10 border-green-500/20'
      case 'banned':
        return 'text-red-600 bg-red-500/10 border-red-500/20'
      case 'inactive':
        return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1

  const goToPage = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      offset: (page - 1) * prev.limit,
    }))
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  const dialogProps = getConfirmDialogProps()

  return (
    <div>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent mb-2">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        className="mb-6 flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/70 backdrop-blur-sm border-border/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-md border border-border/50 bg-card/70 backdrop-blur-sm px-3 text-sm"
        >
          <option value="">{t('filterByRole')}</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(
                `role${role.charAt(0).toUpperCase() + role.slice(1)}` as
                  | 'roleSinger'
                  | 'roleProducer'
                  | 'roleVenue'
                  | 'roleAdmin',
              )}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-border/50 bg-card/70 backdrop-blur-sm px-3 text-sm"
        >
          <option value="">{t('filterByStatus')}</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(
                `status${status.charAt(0).toUpperCase() + status.slice(1)}` as
                  | 'statusActive'
                  | 'statusBanned'
                  | 'statusInactive',
              )}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="mb-6 flex items-center justify-between p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="text-sm font-medium">
          {loading ? (
            <span className="text-muted-foreground">{tCommon('loading')}</span>
          ) : (
            <span>
              <span className="text-primary font-bold text-lg">{pagination.total}</span>{' '}
              <span className="text-muted-foreground">{t('usersCount')}</span>
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('page')} <span className="font-medium text-foreground">{currentPage}</span> {t('of')}{' '}
          <span className="font-medium text-foreground">{totalPages || 1}</span>
        </div>
      </motion.div>

      {/* Users Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm animate-pulse"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <motion.div
          className="text-center py-16 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <UsersIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground text-lg">{t('noUsers')}</p>
          <p className="text-muted-foreground text-sm mt-1">{t('noUsersDescription')}</p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {users.map((user) => (
            <motion.div key={user.id} variants={fadeInUp}>
              <Card
                className={cn(
                  'group relative border-border/50 bg-card/70 backdrop-blur-sm transition-all duration-300 flex flex-col hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 min-h-[280px] h-full',
                  user.status?.toLowerCase() === 'banned' && 'opacity-75',
                )}
              >
                <CardContent className="p-4 flex flex-col h-full gap-3">
                  {/* User Avatar & Info */}
                  <div className="flex flex-col items-center text-center gap-2 mb-2">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-linear-to-br from-primary/20 to-primary/10 shrink-0 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.display_name || user.username}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-primary">
                          {(user.display_name || user.username || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="w-full">
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors mb-0.5">
                        {user.display_name || user.username}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap justify-center gap-1.5">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize text-xs">
                      {user.role}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('capitalize', getStatusColor(user.status))}
                    >
                      {user.status?.toLowerCase() || 'active'}
                    </Badge>
                    {user.is_verified && (
                      <Badge
                        variant="outline"
                        className="text-xs text-blue-600 bg-blue-500/10 border-blue-500/20"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('verified')}
                      </Badge>
                    )}
                    {user.is_featured && (
                      <Badge
                        variant="outline"
                        className="text-xs text-amber-600 bg-amber-500/10 border-amber-500/20"
                      >
                        {t('featured')}
                      </Badge>
                    )}
                  </div>

                  {/* Bio */}
                  {user.brief_bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{user.brief_bio}</p>
                  )}

                  {/* Location */}
                  {(user.city || user.country) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {[user.city, user.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Genres */}
                  {user.genres && user.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {user.genres.slice(0, 3).map((genre) => (
                        <Badge key={genre.id} variant="secondary" className="text-xs px-2 py-0">
                          {genre.name}
                        </Badge>
                      ))}
                      {user.genres.length > 3 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          +{user.genres.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="grow" />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 group-hover:bg-primary/10 transition-colors"
                    >
                      <Link
                        href={`/admin/users/${user.username}`}
                        className="flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t('viewDetails')}
                      </Link>
                    </Button>
                    {user.status?.toLowerCase() === 'banned' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAction(user.id, user.display_name || user.username, 'unban')
                        }
                        disabled={actionLoading === user.id}
                        className="hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAction(user.id, user.display_name || user.username, 'ban')
                        }
                        disabled={actionLoading === user.id || user.role === 'admin'}
                        className="hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {user.is_verified ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAction(user.id, user.display_name || user.username, 'unverify')
                        }
                        disabled={actionLoading === user.id}
                        className="hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/30 transition-colors"
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAction(user.id, user.display_name || user.username, 'verify')
                        }
                        disabled={actionLoading === user.id}
                        className="hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <motion.div
          className="mt-8 flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="hover:bg-primary/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {tCommon('previous')}
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className="w-10 hover:bg-primary/10 transition-colors"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="hover:bg-primary/10 transition-colors"
          >
            {tCommon('next')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      )}

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
