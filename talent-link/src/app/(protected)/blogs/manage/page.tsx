'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'
import { blogService } from '@/services/blogService'
import type { BlogPost } from '@/types/blog'
import { resolveMediaUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Eye, Pencil, Plus, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

export default function UserBlogsManagePage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [pagination, setPagination] = useState({ total: 0, limit: 12, offset: 0 })
  const authorId = useAuthStore((state) => state.user?.id)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await blogService.listPosts({
        limit: pagination.limit,
        offset: pagination.offset,
        search: debouncedSearch || undefined,
        author_id: authorId,
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

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit))
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1

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

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, offset: (page - 1) * prev.limit }))
  }

  return (
    <div className="space-y-6 pt-24 md:pt-28 px-4 max-w-7xl mx-auto">
      <motion.div
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="min-w-0">
          <h1 className="text-4xl font-semibold tracking-tight">Manage Blogs</h1>
          <p className="mt-1 text-muted-foreground">Quản lý các bài viết của bạn tại một nơi.</p>
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
          <Button asChild className="h-11 rounded-full px-6">
            <Link href="/blogs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Blog
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <motion.div
            className="mb-5 rounded-2xl border border-border/60 bg-card/60 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {loading ? 'Đang tải...' : `Showing ${posts.length} of ${pagination.total} posts`}
              </span>
              <span className="text-muted-foreground">
                Trang <span className="font-medium text-foreground">{currentPage}</span> /{' '}
                <span className="font-medium text-foreground">{totalPages}</span>
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
              <p className="text-muted-foreground text-lg">Chưa có bài viết nào</p>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-4"
              initial="hidden"
              animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
            >
              {posts.map((post) => {
                const cover = post.cover_image_url ? resolveMediaUrl(post.cover_image_url) : ''
                const status = (post.status || 'draft').toLowerCase()
                const isPublished = status === 'published'
                const statusLabel = isPublished ? 'published' : 'draft'
                return (
                  <motion.div
                    key={post.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                  >
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
                              <Link href={`/blogs/edit/${post.id}`}>
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
                            >
                              {isPublished ? 'Published' : 'Publish'}
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

          {!loading && pagination.total > pagination.limit && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <button
                className="rounded-lg border border-border/60 px-3 py-2 hover:bg-muted"
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                className="rounded-lg border border-border/60 px-3 py-2 hover:bg-muted"
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
