'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminUserManagementCard } from '@/components/admin/AdminUserManagementCard'
import {
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Search,
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { AdminUser } from '@/types/admin'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

const ROLES = ['all', 'singer', 'producer', 'venue', 'admin'] as const

export default function AdminUsersPage() {
  const t = useTranslations('Admin.usersPage')
  const tCommon = useTranslations('Common')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
  })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPagination((prev) => ({ ...prev, offset: 0 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminService.listUsers({
        limit: pagination.limit,
        offset: pagination.offset,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        search: debouncedSearch || undefined,
      })
      setUsers(response.data.users)
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
  }, [pagination.limit, pagination.offset, selectedRole, debouncedSearch, t])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role)
    setPagination((prev) => ({ ...prev, offset: 0 }))
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

  return (
    <div>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            {t('title')}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">{t('description')}</p>
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
            className="pl-10 bg-card/50 backdrop-blur-sm border-border/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {ROLES.map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRoleFilter(role)}
              className="capitalize"
            >
              {role === 'all' ? t('allRoles') : role}
            </Button>
          ))}
        </div>
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
              <AdminUserManagementCard user={user} />
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
    </div>
  )
}
