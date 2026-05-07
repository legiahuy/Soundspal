'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  BookMarked,
  Calendar,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

import { blogService } from '@/services/blogService'
import { userService } from '@/services/userService'
import { useAuth } from '@/hooks/useAuth'
import type { BlogPost } from '@/types/blog'
import type { User } from '@/types/user'
import { resolveMediaUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import BlogArticle from './_components/BlogArticle'
import BlogSidebar from './_components/BlogSidebar'
import BlogCommentSection from './_components/BlogCommentSection'
import BlogRelatedPosts from './_components/BlogRelatedPosts'

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlogDetailPage() {
  const t = useTranslations('BlogDetail')
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id ?? ''

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentCount, setCommentCount] = useState(0)
  const [bookmarking, setBookmarking] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [voting, setVoting] = useState<'like' | 'dislike' | null>(null)
  const [myVote, setMyVote] = useState<'like' | 'dislike' | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [authorUser, setAuthorUser] = useState<User | null>(null)

  const { isAuthenticated, user } = useAuth()
  const userId = user?.id

  // ── Fetch post ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    const run = async () => {
      if (!id) return
      try {
        setLoading(true)
        setError(null)
        const data = await blogService.getPostById(id)
        if (!active) return
        setPost(data)
        setCommentCount(data.comment_count ?? 0)
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
  }, [id, t])

  // ── Fetch author ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    const run = async () => {
      if (!post?.author_id || post.author_id === userId) return
      try {
        const u = await userService.getUser(post.author_id)
        if (active) setAuthorUser(u)
      } catch (e) {
        console.error(e)
      }
    }
    run()
    return () => { active = false }
  }, [post?.author_id, userId])

  // ── Bookmark state ───────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    const run = async () => {
      if (!isAuthenticated || !post?.id) return
      try {
        const items = await blogService.getBookmarks()
        if (!active) return
        setIsBookmarked(items.some((p: BlogPost) => p.id === post.id))
      } catch (e) {
        console.error(e)
      }
    }
    run()
    return () => { active = false }
  }, [isAuthenticated, post?.id])

  // ── Related posts ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true
    const run = async () => {
      if (!post?.id || !post?.tags?.length) return
      try {
        const res = await blogService.listPosts({ tag_id: post.tags[0], limit: 4, status: 'published' })
        if (!active) return
        setRelatedPosts(res.posts.filter((p) => p.id !== post.id).slice(0, 3))
      } catch (e) {
        console.error(e)
      }
    }
    run()
    return () => { active = false }
  }, [post?.id, post?.tags])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const authorName = (() => {
    if (!post?.author_id) return 'Soundspal Team'
    if (post.author_id === userId) {
      const u = user as any
      return u?.display_name || u?.displayName || u?.username || 'You'
    }
    const u = authorUser as any
    return u?.display_name || u?.displayName || u?.username || 'Soundspal Team'
  })()

  const authorAvatar = (() => {
    if (!post?.author_id) return ''
    if (post.author_id === userId) {
      const u = user as any
      return u?.avatar_url || u?.avatarUrl || ''
    }
    const u = authorUser as any
    return u?.avatar_url || u?.avatarUrl || ''
  })()

  const handleBookmark = async () => {
    if (!post?.id || bookmarking) return
    if (!isAuthenticated) { router.push('/auth/login'); return }
    try {
      setBookmarking(true)
      if (isBookmarked) {
        await blogService.unbookmarkPost(post.id)
        setIsBookmarked(false)
        toast.success(t('bookmark.remove'))
      } else {
        await blogService.bookmarkPost(post.id)
        setIsBookmarked(true)
        toast.success(t('bookmark.add'))
      }
    } catch (e) {
      console.error(e)
      toast.error(t('bookmark.error'))
    } finally {
      setBookmarking(false)
    }
  }

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!post?.id) return
    if (!isAuthenticated) { router.push('/auth/login'); return }
    try {
      setVoting(voteType)
      setVoteError(null)
      const isTogglingOff = myVote === voteType
      setMyVote(isTogglingOff ? null : voteType)
      setPost((cur) => {
        if (!cur) return cur
        const up = cur.upvote_count ?? 0
        const down = cur.downvote_count ?? 0
        if (isTogglingOff) {
          return voteType === 'like'
            ? { ...cur, upvote_count: Math.max(0, up - 1) }
            : { ...cur, downvote_count: Math.max(0, down - 1) }
        }
        return voteType === 'like'
          ? { ...cur, upvote_count: up + 1, downvote_count: myVote === 'dislike' ? Math.max(0, down - 1) : down }
          : { ...cur, downvote_count: down + 1, upvote_count: myVote === 'like' ? Math.max(0, up - 1) : up }
      })
      const updated = isTogglingOff
        ? await blogService.removeVote(post.id)
        : await blogService.votePost(post.id, voteType)
      setPost(updated)
    } catch (e) {
      console.error(e)
      setVoteError(t('commentError'))
    } finally {
      setVoting(null)
    }
  }

  // ── Loading / error states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-24">
        <div className="text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="h-10 w-10" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">{t('error')}</h2>
          <p className="mb-8 text-muted-foreground">{error || 'Article not found'}</p>
          <Button asChild variant="outline" className="rounded-full px-8">
            <Link href="/blogs">{t('back')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  const cover = post.cover_image_url ? resolveMediaUrl(post.cover_image_url) : ''
  const content = post.content || ''
  const shortDesc = post.short_description || post.brief_description

  return (
    <div className="min-h-screen pb-20">
      {/* ── Hero / Cover ──────────────────────────────────────────────────────── */}
      <div className="relative w-full bg-muted overflow-hidden" style={{ minHeight: '340px' }}>
        {cover ? (
          <>
            <Image src={cover} alt={post.title} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-primary/8 to-primary/5">
            <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-primary/10 to-transparent animate-pulse" />
            <div className="absolute top-10 left-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl animate-float" />
            <div className="absolute top-20 right-20 w-52 h-52 bg-primary/25 rounded-full blur-3xl animate-float-delayed" />
          </div>
        )}

        {/* Back link */}
        <div className="absolute top-0 left-0 right-0 pt-28 pb-8 px-4 md:px-6">
          <div className="mx-auto w-full max-w-[1200px]">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('back')}
            </Link>
          </div>
        </div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-6 pb-10">
          <div className="mx-auto w-full max-w-[1200px]">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div className="flex items-center gap-3 mb-4">
                {(post.tags?.[0]) && (
                  <Badge className="bg-primary/90 text-primary-foreground hover:bg-primary rounded-full text-xs">
                    {post.tags[0]}
                  </Badge>
                )}
                {post.published_at && (
                  <span className="flex items-center gap-1.5 text-xs text-white/70">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.published_at)}
                  </span>
                )}
                <span className="text-xs text-white/70">
                  {t('readTime', { minutes: post.read_time ?? 5 })}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl">
                {post.title}
              </h1>
              {shortDesc && (
                <p className="mt-3 text-white/70 text-base md:text-lg max-w-2xl leading-relaxed">
                  {shortDesc}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-10 xl:gap-16">

          {/* ── Left: article + actions + comments ───────────────────────────── */}
          <main className="min-w-0">
            {/* Author row */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-muted border border-border/50">
                  {authorAvatar ? (
                    <Image src={resolveMediaUrl(authorAvatar)} alt={authorName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-sm font-bold">
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{authorName}</p>
                  <p className="text-xs text-muted-foreground">{t('authorInfo')}</p>
                </div>
              </div>
              {/* Bookmark */}
              <button
                onClick={handleBookmark}
                disabled={bookmarking}
                className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-50"
              >
                {bookmarking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookMarked className={`h-4 w-4 ${isBookmarked ? 'text-primary' : 'text-muted-foreground'}`} fill={isBookmarked ? 'currentColor' : 'none'} />
                )}
                {isBookmarked ? t('saved') : t('save')}
              </button>
            </div>

            {/* Article body */}
            {content ? (
              <BlogArticle content={content} />
            ) : (
              <p className="text-muted-foreground italic">{t('contentUpdating')}</p>
            )}

            {/* ── Vote bar — after article ─────────────────────────────────── */}
            <div className="mt-10 pt-8 border-t border-border/50">
              <p className="text-sm font-medium text-muted-foreground mb-4">
                {t('upvotes', { count: post.upvote_count ?? 0 })} · {t('comments', { count: commentCount })}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant={myVote === 'like' ? 'default' : 'outline'}
                  className="rounded-full gap-2"
                  disabled={voting !== null}
                  onClick={() => handleVote('like')}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {t('like')} ({post.upvote_count ?? 0})
                </Button>
                <Button
                  variant={myVote === 'dislike' ? 'default' : 'outline'}
                  className={`rounded-full gap-2 ${myVote === 'dislike' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}
                  disabled={voting !== null}
                  onClick={() => handleVote('dislike')}
                >
                  <ThumbsDown className="h-4 w-4" />
                  {t('dislike')} ({post.downvote_count ?? 0})
                </Button>
                {voteError && <span className="text-sm text-destructive">{voteError}</span>}
              </div>
            </div>

            {/* Comments */}
            <BlogCommentSection postId={post.id} onCommentCountChange={setCommentCount} />

            {/* Related posts — bottom */}
            <BlogRelatedPosts posts={relatedPosts} />
          </main>

          {/* ── Right: sticky sidebar ─────────────────────────────────────────── */}
          <aside className="hidden lg:block">
            <BlogSidebar
              authorName={authorName}
              authorAvatar={authorAvatar}
              authorLabel={t('authorInfo')}
              authorProfileHref={post.author_id ? `/profile/${post.author_id}` : undefined}
              content={content}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
