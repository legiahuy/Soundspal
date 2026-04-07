'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Calendar, ChevronLeft, ChevronRight, FileText, Pencil, Plus, UploadCloud } from 'lucide-react'

import { blogService } from '@/services/blogService'
import type { BlogPost } from '@/types/blog'
import { resolveMediaUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

export default function AdminBlogsPage() {
  const tCommon = useTranslations('Common')
  const t = useTranslations('Admin')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 12,
    offset: 0,
  })

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await blogService.listPosts({
        limit: pagination.limit,
        offset: pagination.offset,
        search: debouncedSearch || undefined,
      })
      setPosts(res.posts || [])
      setPagination((prev) => ({ ...prev, total: res.total }))
    } catch (e) {
      console.error(e)
      toast.error('Không thể tải danh sách blog')
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, pagination.offset, debouncedSearch])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    setPagination((prev) => ({ ...prev, offset: 0 }))
  }, [debouncedSearch])

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, offset: (page - 1) * prev.limit }))
  }

  const handlePublish = async (id: string) => {
    setActionLoading(id)
    try {
      await blogService.publish(id)
      toast.success('Đã publish bài viết')
      await fetchPosts()
    } catch (e) {
      console.error(e)
      toast.error('Publish thất bại')
    } finally {
      setActionLoading(null)
    }
  }

  const staggerContainer = useMemo(
    () => ({
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { staggerChildren: 0.05 } },
    }),
    [],
  )

  const fadeInUp = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    }),
    [],
  )

  return (
    <div>
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              {t('sidebar.blogs')}
            </h1>
            <p className="text-muted-foreground text-lg">Tạo, chỉnh sửa và publish bài viết</p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/admin/blogs/new">
              <Plus className="w-4 h-4" />
              Tạo bài viết
            </Link>
          </Button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Tìm kiếm theo tiêu đề/slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card/70 backdrop-blur-sm border-border/50"
            />
          </div>
        </div>
      </motion.div>

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
              <span className="text-muted-foreground">bài viết</span>
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Trang <span className="font-medium text-foreground">{currentPage}</span> /{' '}
          <span className="font-medium text-foreground">{totalPages || 1}</span>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          className="text-center py-16 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground text-lg">Chưa có bài viết nào</p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {posts.map((post) => {
            const cover = post.cover_image_url ? resolveMediaUrl(post.cover_image_url) : ''
            const status = (post.status || 'draft').toLowerCase()
            const isPublished = status === 'published'
            return (
              <motion.div key={post.id} variants={fadeInUp} className="h-full">
                <Card className="group relative border-border/50 bg-card/70 backdrop-blur-sm transition-all duration-300 flex flex-col hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 overflow-hidden h-full">
                  {cover ? (
                    <div className="relative h-40 w-full">
                      <Image
                        src={cover}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : (
                    <div className="h-40 w-full bg-linear-to-br from-primary/12 via-primary/6 to-transparent" />
                  )}

                  <CardContent className="p-4 flex flex-col gap-3 h-full">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={isPublished ? 'default' : 'secondary'} className="capitalize">
                        {status}
                      </Badge>
                      {post.published_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(post.published_at)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">/{post.slug}</p>
                    </div>

                    {post.brief_description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.brief_description}
                      </p>
                    )}

                    <div className="grow" />

                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1 gap-2">
                        <Link href={`/admin/blogs/${post.id}/edit`}>
                          <Pencil className="w-4 h-4" />
                          Sửa
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPublished || actionLoading === post.id}
                        onClick={() => handlePublish(post.id)}
                        className="gap-2 hover:bg-primary/10"
                      >
                        <UploadCloud className="w-4 h-4" />
                        {actionLoading === post.id ? '...' : 'Publish'}
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/blogs/${post.slug}`} target="_blank">
                          Xem
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

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
              if (totalPages <= 5) pageNum = i + 1
              else if (currentPage <= 3) pageNum = i + 1
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
              else pageNum = currentPage - 2 + i

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

