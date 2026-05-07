'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'
import {
  BookMarked,
  Calendar,
  ChevronRight,
  MessageCircle,
  Search,
  ThumbsUp,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { blogService } from '@/services/blogService'
import { userService } from '@/services/userService'
import type { BlogPost, BookmarkListItem } from '@/types/blog'
import type { User } from '@/types/user'
import { resolveMediaUrl } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

export default function BlogsPage() {
  const t = useTranslations('BlogsPage')
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
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    let active = true
    const loadLists = async () => {
      const lists = await blogService.getBookmarkLists()
      if (active) setBookmarkLists(lists)
    }
    loadLists()
    return () => {
      active = false
    }
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
    return () => {
      active = false
    }
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
    return () => {
      active = false
    }
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
          } catch {
            return null
          }
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
    return () => {
      active = false
    }
  }, [posts])

  const handleBookmark = async (event: React.MouseEvent, postId: string) => {
    event.preventDefault()
    event.stopPropagation()
    try {
      setBookmarkLoadingId(postId)
      const isCurrentlyBookmarked = bookmarkedIds.has(postId)

      if (isCurrentlyBookmarked) {
        await blogService.unbookmarkPost(postId, selectedListId ? { list_id: selectedListId } : undefined)
        setBookmarkedIds((prev) => {
          const next = new Set(prev)
          next.delete(postId)
          return next
        })
        toast.success(t('bookmark.remove'))
      } else {
        await blogService.bookmarkPost(postId, selectedListId ? { list_id: selectedListId } : undefined)
        setBookmarkedIds((prev) => {
          const next = new Set(prev)
          next.add(postId)
          return next
        })
        toast.success(t('bookmark.add'))
      }

      // Refresh posts if in bookmarks tab
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
    if (!name) {
      toast.error(t('lists.new'))
      return
    }
    try {
      setCreatingList(true)
      const created = await blogService.createBookmarkList(name)
      const lists = await blogService.getBookmarkLists()
      setBookmarkLists(lists)
      setSelectedListId(created.id)
      setNewListName('')
      setActiveTab('bookmarks')
      setTimeout(() => {
        if (listSelectRef.current) listSelectRef.current.focus()
      }, 0)
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
      return u?.display_name || u?.displayName || u?.username || 'Bạn'
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

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-20 pt-24 md:pt-32">
      <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6">
        {/* Header section with Tabs and Search */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#F1F1F1] pb-1">
          <div className="flex items-center gap-10">
            {(['explore', 'bookmarks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-4 text-[15px] font-bold tracking-tight transition-colors duration-300 ${activeTab === tab ? 'text-[#1E1E1E]' : 'text-[#94A3B8] hover:text-[#64748B]'
                  }`}
              >
                {tab === 'explore' ? t('tabs.all') : t('tabs.bookmarks')}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#1E1E1E] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-[340px] pb-3 md:pb-0">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-11 w-full rounded-xl border border-[#E7E7E7] bg-white pl-11 pr-4 text-sm focus:border-[#1E1E1E] focus:ring-1 focus:ring-[#1E1E1E]/10 focus:outline-none transition-all"
            />
          </div>
        </div>

        {activeTab === 'bookmarks' && (
          <div className="mb-10 rounded-2xl border border-[#E7E7E7] bg-[#F8F9FA] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <select
                ref={listSelectRef}
                className="h-11 rounded-xl border border-[#E7E7E7] bg-white px-4 text-sm font-medium text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#1E1E1E]/5"
                value={selectedListId}
                onChange={(event) => setSelectedListId(event.target.value)}
              >
                <option value="">{t('lists.all')}</option>
                {bookmarkLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>

              <div className="flex flex-1 items-center gap-3">
                <input
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  placeholder={t('lists.new')}
                  className="h-11 flex-1 rounded-xl border border-[#E7E7E7] bg-white px-4 text-sm focus:outline-none"
                />
                <Button type="button" onClick={handleCreateList} disabled={creatingList} className="h-11 px-6 rounded-xl bg-[#1E1E1E] hover:bg-[#000000]">
                  {creatingList ? t('lists.creating') : t('lists.create')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] bg-[#F1F5F9] rounded-2xl mb-4" />
                <div className="h-4 w-24 bg-[#F1F5F9] rounded mb-3" />
                <div className="h-8 w-full bg-[#F1F5F9] rounded mb-3" />
                <div className="h-4 w-2/3 bg-[#F1F5F9] rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-24 rounded-3xl bg-[#F8F9FA] border border-dashed border-[#E7E7E7]">
            <p className="text-[#64748B] text-lg">{t('empty')}</p>
            <Button variant="link" onClick={() => setActiveTab('explore')} className="mt-2 text-[#1E1E1E]">
              {t('exploreAll')}
            </Button>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16"
            initial="hidden"
            animate="show"
            variants={staggerContainer}
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={fadeInUp}>
                <div className="group relative h-full bg-[#FBFBFB] border border-[#F1F1F1] rounded-[32px] overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all duration-500">
                  <Link href={`/blogs/${post.id}`} className="block h-full">
                    {/* Image Header */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#F1F5F9]">
                      <Image
                        src={resolveMediaUrl(post.cover_image_url || '/images/job/default-job.jpg')}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-col flex-1 p-8 pt-7 md:p-10 md:pt-8">
                      <p className="text-[12px] font-bold tracking-[0.08em] text-[#94A3B8] uppercase mb-4">
                        {formatDate(post.published_at || post.created_at)}
                      </p>

                      <h3 className="text-[28px] md:text-[32px] font-bold text-[#1E1E1E] leading-[1.25] mb-5 group-hover:text-[#000] transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-[16px] text-[#64748B] leading-relaxed line-clamp-3 mb-10">
                        {post.short_description || post.brief_description}
                      </p>

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between pt-8 border-t border-[#F1F1F1]">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-[#F1F5F9] border border-[#E7E7E7]">
                            {avatarUrlForUserId(post.author_id) ? (
                              <Image
                                src={resolveMediaUrl(avatarUrlForUserId(post.author_id))}
                                alt={displayNameForUserId(post.author_id)}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[#1E1E1E] text-[12px] font-bold text-white">
                                {displayNameForUserId(post.author_id).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[15px] font-bold text-[#1E1E1E] truncate">
                              {displayNameForUserId(post.author_id)}
                            </span>
                            <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider">Author</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[12px] font-bold tracking-widest text-[#1E1E1E] uppercase group-hover:translate-x-2 transition-transform">
                          {t('readMore')} <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Floating Bookmark Button */}
                  <button
                    disabled={bookmarkLoadingId === post.id}
                    className="absolute top-6 right-6 z-10 rounded-full p-3 bg-white/80 backdrop-blur-md shadow-lg border border-white/20 hover:bg-white hover:scale-110 transition-all duration-300 disabled:opacity-50"
                    onClick={(event) => handleBookmark(event, post.id)}
                    aria-label={t('bookmark.label')}
                  >
                    {bookmarkLoadingId === post.id ? (
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <BookMarked
                        className={`h-5 w-5 ${bookmarkedIds.has(post.id) ? 'text-[#7D3BED]' : 'text-[#1E1E1E]'}`}
                        fill={bookmarkedIds.has(post.id) ? 'currentColor' : 'none'}
                      />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
