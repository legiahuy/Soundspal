'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'
import {
  BookMarked,
  ChevronRight,
  Search,
  Sparkles,
  Loader2,
  ListPlus,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { blogService } from '@/services/blogService'
import { userService } from '@/services/userService'
import type { BlogPost, BookmarkListItem } from '@/types/blog'
import type { User } from '@/types/user'
import { resolveMediaUrl } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlogsPage() {
  const t = useTranslations('BlogsPage')
  const tCommon = useTranslations('Common')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [bookmarkLoadingId, setBookmarkLoadingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'explore' | 'bookmarks'>('explore')
  const [bookmarkLists, setBookmarkLists] = useState<BookmarkListItem[]>([])
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [newListName, setNewListName] = useState('')
  const [creatingList, setCreatingList] = useState(false)
  const listSelectRef = useRef<HTMLSelectElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [userById, setUserById] = useState<Record<string, User>>({})
  const { user: currentUser } = useAuth()
  const userId = currentUser?.id

  const fadeInUp: Variants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    }),
    [],
  )

  const staggerContainer: Variants = useMemo(
    () => ({
      hidden: { opacity: 1 },
      show: { opacity: 1, transition: { staggerChildren: 0.06 } },
    }),
    [],
  )

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    let active = true
    const loadLists = async () => {
      const lists = await blogService.getBookmarkLists()
      if (active) setBookmarkLists(lists)
    }
    loadLists()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const loadBookmarkedIds = async () => {
      try {
        const allBookmarks = await blogService.getBookmarks()
        if (!active) return
        setBookmarkedIds(new Set(allBookmarks.map((item: BlogPost) => item.id).filter(Boolean)))
      } catch (error) {
        console.error(error)
      }
    }
    loadBookmarkedIds()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        let data: BlogPost[] = []
        if (activeTab === 'bookmarks') {
          data = await blogService.getBookmarks(selectedListId || undefined)
        } else if (debouncedSearch.trim()) {
          const res = await blogService.searchBlogs({ q: debouncedSearch, page: 1, page_size: 20 })
          data = res.data.items
        } else {
          data = (await blogService.listPosts({ limit: 12, offset: 0, status: 'published' })).posts
        }
        if (!active) return
        setPosts(data || [])
      } catch (e) {
        console.error(e)
        if (!active) return
        setError(t('error'))
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [t, activeTab, selectedListId, debouncedSearch])

  useEffect(() => {
    let active = true
    const fetchAuthors = async () => {
      const authorIds = Array.from(new Set(posts.map((p: BlogPost) => p.author_id).filter(Boolean) as string[]))
      const missing = authorIds.filter((id: string) => !userById[id] && id !== userId)
      if (missing.length === 0) return
      const fetched = await Promise.all(
        missing.map(async (id: string) => {
          try {
            const u = await userService.getUser(id)
            return [id, u] as const
          } catch { return null }
        }),
      )
      if (!active) return
      const updates: Record<string, User> = {}
      fetched.forEach((pair: readonly [string, User] | null) => {
        if (pair) updates[pair[0]] = pair[1]
      })
      if (Object.keys(updates).length > 0) {
        setUserById((prev) => ({ ...prev, ...updates }))
      }
    }
    fetchAuthors()
    return () => { active = false }
  }, [posts])

  const handleBookmark = async (event: React.MouseEvent, postId: string) => {
    event.preventDefault()
    event.stopPropagation()
    try {
      setBookmarkLoadingId(postId)
      const isCurrentlyBookmarked = bookmarkedIds.has(postId)
      if (isCurrentlyBookmarked) {
        await blogService.unbookmarkPost(postId, selectedListId ? { list_id: selectedListId } : undefined)
        setBookmarkedIds((prev) => { const next = new Set(prev); next.delete(postId); return next })
        toast.success(t('bookmark.remove'))
      } else {
        await blogService.bookmarkPost(postId, selectedListId ? { list_id: selectedListId } : undefined)
        setBookmarkedIds((prev) => { const next = new Set(prev); next.add(postId); return next })
        toast.success(t('bookmark.add'))
      }
      if (activeTab === 'bookmarks') {
        const data = await blogService.getBookmarks(selectedListId || undefined)
        setPosts(data || [])
      }
    } catch (error) {
      console.error(error)
      toast.error(t('bookmark.error'))
    } finally {
      setBookmarkLoadingId(null)
    }
  }

  const handleCreateList = async () => {
    const name = newListName.trim()
    if (!name) { toast.error(t('lists.new')); return }
    try {
      setCreatingList(true)
      const created = await blogService.createBookmarkList(name)
      const lists = await blogService.getBookmarkLists()
      setBookmarkLists(lists)
      setSelectedListId(created.id)
      setNewListName('')
      setActiveTab('bookmarks')
      setTimeout(() => { if (listSelectRef.current) listSelectRef.current.focus() }, 0)
      toast.success(t('lists.success'))
    } catch (error) {
      console.error(error)
      toast.error(t('lists.error'))
    } finally {
      setCreatingList(false)
    }
  }

  const displayNameForUserId = (id?: string) => {
    if (!id) return 'Soundspal Team'
    if (id === userId) {
      const u = currentUser as any
      return u?.display_name || u?.displayName || u?.username || 'You'
    }
    const u = userById[id] as any
    return u?.display_name || u?.displayName || u?.username || id
  }

  const avatarUrlForUserId = (id?: string) => {
    if (!id) return ''
    if (id === userId) {
      const u = currentUser as any
      return u?.avatar_url || u?.avatarUrl || ''
    }
    const u = userById[id] as any
    return u?.avatar_url || u?.avatarUrl || ''
  }

  // Split featured (first) vs rest
  const featuredPost = posts.length > 0 ? posts[0] : null
  const restPosts = posts.length > 1 ? posts.slice(1) : []

  return (
    <div className="min-h-screen relative pb-20">
      {/* Hero Section — matches jobs/discovery */}
      <section className="relative border-b pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden bg-linear-to-br from-primary/15 via-primary/8 to-primary/5">
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-primary/10 to-transparent animate-pulse" />
        <div
          className="absolute inset-0 opacity-30 animate-[gridMove_8s_linear_infinite]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        <div className="absolute top-10 left-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute top-20 right-20 w-52 h-52 bg-primary/25 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-10 left-1/3 w-44 h-44 bg-primary/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-primary/70 to-transparent animate-shimmer" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-primary/50 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1320px] px-4 md:px-6 z-10">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight relative">
              <span className="relative z-10">{t('title')}</span>
              <span className="absolute inset-0 bg-linear-to-r from-primary/40 via-primary/30 to-primary/20 blur-2xl animate-pulse opacity-60" />
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed relative z-10">
              {t('subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main content area */}
      <div className="w-full bg-linear-to-br from-muted/50 via-muted/30 to-muted/40 relative">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6 py-8 md:py-10 relative z-10">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'explore' | 'bookmarks')}>
            {/* Tabs + Search bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <TabsList className="h-11 p-1 bg-muted/50 backdrop-blur-sm border border-border/40">
                <TabsTrigger value="explore" className="px-5 text-sm gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('tabs.all')}
                </TabsTrigger>
                <TabsTrigger value="bookmarks" className="px-5 text-sm gap-2">
                  <BookMarked className="w-3.5 h-3.5" />
                  {t('tabs.bookmarks')}
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm w-[220px] md:w-[280px]"
                  />
                </div>
                <div className="px-4 py-1.5 bg-muted/60 backdrop-blur-sm border border-border/40 rounded-full text-xs font-semibold text-muted-foreground shadow-sm">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                      {tCommon('loading')}
                    </span>
                  ) : (
                    `${posts.length} ${tCommon('results') || 'results'}`
                  )}
                </div>
              </div>
            </div>

            {/* Bookmarks tab — list management panel */}
            <TabsContent value="bookmarks" className="mt-0">
              <Card className="p-5 mb-8 shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ListPlus className="w-5 h-5 text-primary shrink-0" />
                    <Select value={selectedListId} onValueChange={setSelectedListId}>
                      <SelectTrigger className="h-9 text-sm w-[180px]">
                        <SelectValue placeholder={t('lists.all')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t('lists.all')}</SelectItem>
                        {bookmarkLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder={t('lists.new')}
                      className="h-9 text-sm flex-1 sm:w-[200px]"
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateList}
                      disabled={creatingList}
                      className="h-9 px-4 text-sm"
                    >
                      {creatingList ? t('lists.creating') : t('lists.create')}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Bookmarks content */}
              {renderContent()}
            </TabsContent>

            {/* Explore tab */}
            <TabsContent value="explore" className="mt-0">
              {renderContent()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )

  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )
    }

    if (posts.length === 0) {
      return (
        <Card className="p-12 text-center">
          <BookMarked className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">{t('empty')}</p>
          {activeTab === 'bookmarks' && (
            <Button variant="outline" onClick={() => setActiveTab('explore')} className="mt-4">
              {t('exploreAll')}
            </Button>
          )}
        </Card>
      )
    }

    return (
      <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-8">
        {/* Featured post (first post, only on explore tab) */}
        {featuredPost && activeTab === 'explore' && (
          <motion.div variants={fadeInUp}>
            <Link href={`/blogs/${featuredPost.id}`} className="block group">
              <Card className="overflow-hidden shadow-sm border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col md:flex-row">
                  <div className="relative md:w-1/2 aspect-[16/9] md:aspect-auto overflow-hidden bg-muted">
                    <Image
                      src={resolveMediaUrl(featuredPost.cover_image_url || '/images/job/default-job.jpg')}
                      alt={featuredPost.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Bookmark button */}
                    <button
                      disabled={bookmarkLoadingId === featuredPost.id}
                      className="absolute top-4 right-4 z-10 rounded-full p-2.5 bg-background/80 backdrop-blur-sm shadow-sm border border-border/40 hover:bg-background hover:scale-110 transition-all duration-300 disabled:opacity-50"
                      onClick={(e) => handleBookmark(e, featuredPost.id)}
                      aria-label={t('bookmark.label')}
                    >
                      {bookmarkLoadingId === featuredPost.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <BookMarked
                          className={`h-4 w-4 ${bookmarkedIds.has(featuredPost.id) ? 'text-primary' : 'text-muted-foreground'}`}
                          fill={bookmarkedIds.has(featuredPost.id) ? 'currentColor' : 'none'}
                        />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10 md:w-1/2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                      {formatDate(featuredPost.published_at || featuredPost.created_at)}
                    </span>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight mb-3 group-hover:text-primary/90 transition-colors line-clamp-2">
                      {featuredPost.title}
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3 mb-6">
                      {featuredPost.short_description || featuredPost.brief_description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden bg-muted border border-border/50">
                          {avatarUrlForUserId(featuredPost.author_id) ? (
                            <Image
                              src={resolveMediaUrl(avatarUrlForUserId(featuredPost.author_id))}
                              alt={displayNameForUserId(featuredPost.author_id)}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary text-[11px] font-bold text-primary-foreground">
                              {displayNameForUserId(featuredPost.author_id).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium truncate">
                          {displayNameForUserId(featuredPost.author_id)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        {t('readMore')} <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Compact blog cards grid */}
        {(activeTab === 'bookmarks' ? posts : restPosts).length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
          >
            {(activeTab === 'bookmarks' ? posts : restPosts).map((post) => (
              <motion.div key={post.id} variants={fadeInUp} className="h-full">
                <Link href={`/blogs/${post.id}`} className="block h-full group">
                  <Card className="h-full overflow-hidden shadow-sm border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    {/* Compact image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      <Image
                        src={resolveMediaUrl(post.cover_image_url || '/images/job/default-job.jpg')}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <button
                        disabled={bookmarkLoadingId === post.id}
                        className="absolute top-3 right-3 z-10 rounded-full p-2 bg-background/80 backdrop-blur-sm shadow-sm border border-border/40 hover:bg-background hover:scale-110 transition-all duration-300 disabled:opacity-50"
                        onClick={(e) => handleBookmark(e, post.id)}
                        aria-label={t('bookmark.label')}
                      >
                        {bookmarkLoadingId === post.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <BookMarked
                            className={`h-3.5 w-3.5 ${bookmarkedIds.has(post.id) ? 'text-primary' : 'text-muted-foreground'}`}
                            fill={bookmarkedIds.has(post.id) ? 'currentColor' : 'none'}
                          />
                        )}
                      </button>
                    </div>

                    {/* Card body */}
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2">
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                      <h3 className="text-base font-bold tracking-tight mb-2 line-clamp-2 group-hover:text-primary/90 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                        {post.short_description || post.brief_description}
                      </p>

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/30">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative h-6 w-6 shrink-0 rounded-full overflow-hidden bg-muted border border-border/50">
                            {avatarUrlForUserId(post.author_id) ? (
                              <Image
                                src={resolveMediaUrl(avatarUrlForUserId(post.author_id))}
                                alt={displayNameForUserId(post.author_id)}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-primary text-[9px] font-bold text-primary-foreground">
                                {displayNameForUserId(post.author_id).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-muted-foreground truncate">
                            {displayNameForUserId(post.author_id)}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-primary uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
                          {t('readMore')} <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    )
  }
}
