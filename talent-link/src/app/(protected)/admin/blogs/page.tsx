'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Lightbulb,
  Moon,
  Pencil,
  Plus,
  Search,
  Bell,
  UploadCloud,
} from 'lucide-react'

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
  const publishedCount = useMemo(
    () => posts.filter((post) => (post.status || 'draft').toLowerCase() === 'published').length,
    [posts],
  )

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
    <div className="space-y-6">
      <motion.div
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="min-w-0">
          <h1 className="text-4xl font-semibold tracking-tight">{t('sidebar.blogs')}</h1>
          <p className="mt-1 text-muted-foreground">Manage your creative intellectual property.</p>
        </div>

        <div className="flex w-full items-center gap-3 lg:w-auto">
          <div className="relative flex-1 lg:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-full border-border/60 bg-card pl-10 pr-4"
            />
          </div>
          <Button variant="ghost" size="icon" className="hidden rounded-full lg:inline-flex">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden rounded-full lg:inline-flex">
            <Moon className="h-5 w-5" />
          </Button>
          <Button asChild className="h-11 rounded-full px-6">
            <Link href="/admin/blogs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Blog
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <motion.div
            className="mb-5 rounded-2xl border border-border/60 bg-card/60 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {loading ? tCommon('loading') : `Showing ${posts.length} of ${pagination.total} publications`}
              </span>
              <span className="text-muted-foreground">
                Trang <span className="font-medium text-foreground">{currentPage}</span> /{' '}
                <span className="font-medium text-foreground">{totalPages || 1}</span>
              </span>
            </div>
          </motion.div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-border/40 bg-card/60"
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              className="rounded-2xl border border-border/50 bg-card/40 py-16 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <FileText className="mx-auto mb-4 h-14 w-14 text-muted-foreground/50" />
              <p className="text-muted-foreground text-lg">Chưa có bài viết nào</p>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {posts.map((post) => {
                const cover = post.cover_image_url ? resolveMediaUrl(post.cover_image_url) : ''
                const status = (post.status || 'draft').toLowerCase()
                const isPublished = status === 'published'
                const statusLabel = isPublished ? 'published' : 'draft'
                return (
                  <motion.div key={post.id} variants={fadeInUp}>
                    <Card className="group overflow-hidden rounded-2xl border-border/50 bg-card/80 transition-colors hover:border-primary/30">
                      <CardContent className="flex flex-col gap-4 p-4 md:flex-row">
                        <div className="relative h-32 w-full overflow-hidden rounded-xl bg-muted md:h-28 md:w-52 md:shrink-0">
                          {cover ? (
                            <Image
                              src={cover}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="h-full w-full bg-linear-to-br from-primary/15 to-transparent" />
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant={isPublished ? 'default' : 'secondary'} className="capitalize">
                              {statusLabel}
                            </Badge>
                            {post.published_at && (
                              <span className="text-muted-foreground">{formatDate(post.published_at)}</span>
                            )}
                          </div>

                          <h3 className="line-clamp-2 text-xl font-semibold leading-tight">{post.title}</h3>
                          <p className="mt-1 truncate text-xs text-muted-foreground">/{post.slug}</p>
                          {post.brief_description && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {post.brief_description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Button asChild variant="ghost" size="sm" className="h-8 gap-1 px-2">
                              <Link href={`/admin/blogs/${post.id}/edit`}>
                                <Pencil className="h-3.5 w-3.5" />
                                Sửa
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm" className="h-8 gap-1 px-2">
                              <Link href={`/blogs/${post.slug}`} target="_blank">
                                <Eye className="h-3.5 w-3.5" />
                                Xem
                              </Link>
                            </Button>
                            <Button
                              variant={isPublished ? 'secondary' : 'outline'}
                              size="sm"
                              disabled={isPublished || actionLoading === post.id}
                              onClick={() => handlePublish(post.id)}
                              className="ml-auto h-8 gap-1 rounded-full px-3"
                            >
                              <UploadCloud className="h-3.5 w-3.5" />
                              {actionLoading === post.id ? '...' : isPublished ? 'Đã publish' : 'Xuất bản ngay'}
                            </Button>
                          </div>
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
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 3) pageNum = i + 1
                else if (currentPage <= 2) pageNum = i + 1
                else if (currentPage >= totalPages - 1) pageNum = totalPages - 2 + i
                else pageNum = currentPage - 1 + i

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => goToPage(pageNum)}
                    className="rounded-full"
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="rounded-3xl border border-primary/20 bg-card/80">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Quick overview</p>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-4xl font-bold">{pagination.total}</p>
                  <p className="text-xs uppercase text-muted-foreground">Total posts</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold">{publishedCount}</p>
                  <p className="text-xs uppercase text-muted-foreground">Published</p>
                </div>
                <p className="text-sm font-medium text-primary">+24% this week</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/60 bg-card/80">
            <CardContent className="p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lightbulb className="h-4 w-4" />
              </div>
              <h3 className="font-semibold">Editor&apos;s Insight</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ưu tiên ALT rõ ràng và danh mục phù hợp để tăng khả năng tiếp cận bài viết từ tìm kiếm.
              </p>
              <p className="mt-3 text-sm font-medium text-primary">Optimize now</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 bg-linear-to-r from-[#6D28D9] to-[#7C3AED] text-white">
            <CardContent className="p-5">
              <h3 className="text-2xl font-semibold leading-tight">Schedule your next masterpiece</h3>
              <p className="mt-2 text-sm text-white/80">
                Lên lịch đăng bài để giữ nhịp độ xuất bản đều đặn cho team content.
              </p>
              <Button className="mt-5 w-full rounded-full bg-white text-[#6D28D9] hover:bg-white/90">
                Try Smart Schedule
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

