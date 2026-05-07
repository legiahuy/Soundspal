'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  BookMarked,
  Calendar,
  Loader2,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { blogService } from '@/services/blogService'
import { userService } from '@/services/userService'
import { useAuth } from '@/hooks/useAuth'
import type { BlogComment, BlogPost } from '@/types/blog'
import type { User } from '@/types/user'
import { resolveMediaUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

import 'react-quill-new/dist/quill.snow.css'

export default function BlogDetailPage() {
  const t = useTranslations('BlogDetail')
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id ?? ''

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<BlogComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentValue, setCommentValue] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [postingComment, setPostingComment] = useState(false)
  const [replyValue, setReplyValue] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)
  const [postingReply, setPostingReply] = useState(false)
  const [replyTarget, setReplyTarget] = useState<BlogComment | null>(null)
  const [collapsedCommentIds, setCollapsedCommentIds] = useState<string[]>([])
  const [voting, setVoting] = useState<'like' | 'dislike' | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [myVote, setMyVote] = useState<'like' | 'dislike' | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [userById, setUserById] = useState<Record<string, User>>({})
  const [bookmarking, setBookmarking] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const userId = user?.id
  const username = user?.username

  const displayNameForUserId = (id?: string) => {
    if (!id) return 'Người dùng'
    const currentUser = user as any
    if (id === userId) return currentUser?.display_name || currentUser?.displayName || currentUser?.username || 'Bạn'
    const u = userById[id] as any
    return u?.display_name || u?.displayName || u?.username || id
  }

  const avatarUrlForUserId = (id?: string) => {
    if (!id) return ''
    const currentUser = user as any
    if (id === userId) return currentUser?.avatar_url || currentUser?.avatarUrl || ''
    const u = userById[id] as any
    return u?.avatar_url || u?.avatarUrl || ''
  }

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
  }, [id, t])

  useEffect(() => {
    let active = true
    const loadBookmarkState = async () => {
      if (!isAuthenticated || !post?.id) return
      try {
        const items = await blogService.getBookmarks()
        if (!active) return
        setIsBookmarked(items.some((p: BlogPost) => p.id === post.id))
      } catch (e) {
        console.error(e)
      }
    }
    loadBookmarkState()
    return () => {
      active = false
    }
  }, [isAuthenticated, post?.id])

  useEffect(() => {
    let active = true
    const loadComments = async () => {
      if (!post?.id) return
      try {
        setLoadingComments(true)
        setCommentError(null)
        const data = await blogService.getComments(post.id)
        if (!active) return
        setComments(data)

        const authorIds = Array.from(
          new Set(
            [post.author_id, ...data.map((c) => c.author_id)]
              .filter(Boolean)
              .map((v: unknown) => String(v)),
          ),
        )
        const missing = authorIds.filter((id) => !userById[id] && id !== userId)
        if (missing.length > 0) {
          const fetched = await Promise.all(
            missing.map(async (id) => {
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
          fetched.forEach((pair) => {
            if (pair) updates[pair[0]] = pair[1]
          })
          if (Object.keys(updates).length > 0) {
            setUserById((prev) => ({ ...prev, ...updates }))
          }
        }
      } catch (e) {
        console.error(e)
        if (!active) return
        setCommentError('Không thể tải bình luận')
      } finally {
        if (active) setLoadingComments(false)
      }
    }
    loadComments()
    return () => {
      active = false
    }
  }, [post?.id, userId, userById, post?.author_id])

  useEffect(() => {
    let active = true
    const loadRelated = async () => {
      if (!post?.id || !post?.tags || post.tags.length === 0) return
      try {
        setLoadingRelated(true)
        // Lấy tag đầu tiên để tìm bài liên quan (hoặc có thể cải tiến lấy nhiều hơn)
        const firstTag = post.tags[0]
        const res = await blogService.listPosts({
          tag_id: firstTag,
          limit: 4,
          status: 'published'
        })
        if (!active) return
        // Lọc bỏ bài hiện tại
        const filtered = res.posts.filter(p => p.id !== post.id)
        setRelatedPosts(filtered.slice(0, 3))
      } catch (e) {
        console.error('Failed to load related posts:', e)
      } finally {
        if (active) setLoadingRelated(false)
      }
    }
    loadRelated()
    return () => {
      active = false
    }
  }, [post?.id, post?.tags])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white pt-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {t('loading')}
          </p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 pt-24">
        <div className="text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
            <XCircle className="h-10 w-10" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {t('error')}
          </h2>
          <p className="mb-8 text-gray-500">{error || 'Article not found'}</p>
          <Button asChild className="rounded-full px-8" variant="outline">
            <Link href="/blogs">{t('back')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  const cover = post.cover_image_url ? resolveMediaUrl(post.cover_image_url) : ''
  const shortDesc = post.short_description || post.brief_description
  const content = post.content || ''
  const hasHtmlContent = /<\/?[a-z][\s\S]*>/i.test(content)

  const handleBookmark = async () => {
    if (!post?.id || bookmarking) return
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
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
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    try {
      setVoting(voteType)
      setVoteError(null)
      const isTogglingOff = myVote === voteType

      setMyVote(isTogglingOff ? null : voteType)
      setPost((current: BlogPost | null) => {
        if (!current) return current
        const up = current.upvote_count ?? 0
        const down = current.downvote_count ?? 0

        if (isTogglingOff) {
          return voteType === 'like'
            ? { ...current, upvote_count: Math.max(0, up - 1) }
            : { ...current, downvote_count: Math.max(0, down - 1) }
        }

        if (voteType === 'like') {
          return {
            ...current,
            upvote_count: myVote === 'like' ? up : up + 1,
            downvote_count: myVote === 'dislike' ? Math.max(0, down - 1) : down,
          }
        }
        return {
          ...current,
          downvote_count: myVote === 'dislike' ? down : down + 1,
          upvote_count: myVote === 'like' ? Math.max(0, up - 1) : up,
        }
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

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!post?.id) return

    const contentValue = commentValue.trim()
    if (!contentValue) {
      setCommentError(t('commentEmpty'))
      return
    }

    try {
      setPostingComment(true)
      setCommentError(null)
      const createdComment = await blogService.createComment(post.id, {
        content: contentValue,
      })
      setComments((previous) => [createdComment, ...previous])
      setCommentValue('')
      setPost({ ...post, comment_count: (post.comment_count ?? 0) + 1 })
    } catch (e) {
      console.error(e)
      setCommentError(t('commentError'))
    } finally {
      setPostingComment(false)
    }
  }

  const topComments = comments.filter((comment) => !comment.parent_id)

  const handleReplyClick = (comment: BlogComment) => {
    setReplyTarget(comment)
    setReplyValue('')
    setReplyError(null)
  }

  const handleEditClick = (comment: BlogComment) => {
    setEditingCommentId(comment.id)
    setEditValue(comment.content || '')
    setEditError(null)
    setReplyTarget(null)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditValue('')
    setEditError(null)
  }

  const handleSaveEdit = async (commentId: string) => {
    const nextValue = editValue.trim()
    if (!nextValue) {
      setEditError(t('commentEmpty'))
      return
    }
    try {
      setSavingEdit(true)
      setEditError(null)
      const updated = await blogService.updateComment(commentId, { content: nextValue })
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)))
      setEditingCommentId(null)
      setEditValue('')
    } catch (e) {
      console.error(e)
      setEditError(t('commentError'))
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!post?.id) return
    const ok = window.confirm(t('deleteConfirm'))
    if (!ok) return
    try {
      setDeletingCommentId(commentId)
      await blogService.deleteComment(commentId)
      const fresh = await blogService.getComments(post.id)
      setComments(fresh)
      setPost((current: BlogPost | null) =>
        current ? { ...current, comment_count: fresh.length } : current,
      )
      if (editingCommentId === commentId) handleCancelEdit()
      if (replyTarget?.id === commentId) setReplyTarget(null)
    } catch (e) {
      console.error(e)
      setCommentError(t('commentError'))
    } finally {
      setDeletingCommentId(null)
    }
  }

  const toggleReplies = (commentId: string) => {
    setCollapsedCommentIds((current) =>
      current.includes(commentId)
        ? current.filter((id) => id !== commentId)
        : [...current, commentId],
    )
  }

  const handleSubmitReply = async (
    event: FormEvent<HTMLFormElement>,
    parentComment: BlogComment,
  ) => {
    event.preventDefault()
    if (!post?.id) return

    const contentValue = replyValue.trim()
    if (!contentValue) {
      setReplyError(t('commentEmpty'))
      return
    }

    try {
      setPostingReply(true)
      setReplyError(null)
      const createdComment = await blogService.createComment(post.id, {
        content: contentValue,
        parent_id: parentComment.id,
      })
      setComments((previous) => [createdComment, ...previous])
      setReplyValue('')
      setReplyTarget(null)
      setPost({ ...post, comment_count: (post.comment_count ?? 0) + 1 })
    } catch (e) {
      console.error(e)
      setReplyError(t('commentError'))
    } finally {
      setPostingReply(false)
    }
  }

  const countAllDescendants = (commentId: string): number => {
    const directReplies = comments.filter((child) => child.parent_id === commentId)
    return directReplies.length + directReplies.reduce((total, reply) => total + countAllDescendants(reply.id), 0)
  }

  const renderCommentForm = (targetComment: BlogComment | null = null) => {
    const isActiveReply = targetComment?.id === replyTarget?.id

    if (!targetComment || !isActiveReply) {
      return null
    }

    return (
      <form
        onSubmit={(event) => handleSubmitReply(event, targetComment)}
        className="space-y-3 rounded-2xl border border-[#E7E7E7] bg-[#F8F9FA] p-4"
      >
        <Textarea
          value={replyValue}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setReplyValue(event.target.value)}
          placeholder={t('replyTo', { name: targetComment.author_id || 'User' })}
          className="min-h-[88px] bg-white"
          autoFocus
        />
        {replyError && <p className="text-sm text-destructive">{replyError}</p>}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setReplyTarget(null)
              setReplyValue('')
              setReplyError(null)
            }}
            className="rounded-full"
          >
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={postingReply} className="rounded-full">
            {postingReply ? t('sending') : t('reply')}
          </Button>
        </div>
      </form>
    )
  }

  const renderCommentTree = (parentComments: BlogComment[], level = 0) => {
    return parentComments.map((comment) => {
      const replies = comments.filter((child) => child.parent_id === comment.id)
      const totalReplyCount = countAllDescendants(comment.id)
      const hasReplies = replies.length > 0
      const areRepliesCollapsed = collapsedCommentIds.includes(comment.id)
      const isCommentOwner = !!userId && userId === comment.author_id
      const canEdit = isCommentOwner
      const canDelete = isCommentOwner
      const isEditing = editingCommentId === comment.id
      return (
        <div
          key={comment.id}
          className={`rounded-2xl border border-[#E7E7E7] bg-white p-4 ${level > 0 ? 'ml-6 border-l-4 border-[#7D3BED]/20' : ''}`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden bg-[#F1F5F9] border border-[#E7E7E7]">
              {avatarUrlForUserId(comment.author_id) ? (
                <Image
                  src={resolveMediaUrl(avatarUrlForUserId(comment.author_id))}
                  alt={displayNameForUserId(comment.author_id)}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#1E1E1E] text-xs font-medium text-white">
                  {displayNameForUserId(comment.author_id).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col min-w-0 gap-0.5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-[#1E1E1E] truncate">
                  {displayNameForUserId(comment.author_id)}
                </span>
                {comment.created_at && (
                  <span className="text-[10px] text-[#64748B]">{formatDate(comment.created_at)}</span>
                )}
              </div>
            </div>
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editValue}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setEditValue(event.target.value)}
                className="min-h-[96px] bg-white"
                autoFocus
              />
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" className="rounded-full" onClick={handleCancelEdit}>
                  {t('cancel')}
                </Button>
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={savingEdit}
                  onClick={() => handleSaveEdit(comment.id)}
                >
                  {savingEdit ? t('saving') : t('saveComment')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-[#1E1E1E]">{comment.content || ''}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {isAuthenticated && (
              <button
                type="button"
                className="text-sm text-[#7D3BED] hover:text-[#5B21B6]"
                onClick={() => handleReplyClick(comment)}
              >
                Trả lời
              </button>
            )}
            {isAuthenticated && (canEdit || canDelete) && (
              <div className="flex items-center gap-3">
                {canEdit && (
                  <button
                    type="button"
                    className="text-sm text-[#475569] hover:text-[#1E1E1E]"
                    onClick={() => handleEditClick(comment)}
                    disabled={deletingCommentId !== null}
                  >
                    {t('edit')}
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="text-sm text-destructive hover:opacity-80 disabled:opacity-50"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingCommentId === comment.id || savingEdit}
                  >
                    {deletingCommentId === comment.id ? t('deleting') : t('delete')}
                  </button>
                )}
              </div>
            )}
            {hasReplies && (
              <button
                type="button"
                className="text-sm text-[#475569] hover:text-[#1E1E1E]"
                onClick={() => toggleReplies(comment.id)}
              >
                {areRepliesCollapsed ? t('viewAllComments', { count: totalReplyCount }) : t('collapse')}
              </button>
            )}
          </div>
          {isAuthenticated && replyTarget?.id === comment.id && (
            <div className="mt-4">
              {renderCommentForm(comment)}
            </div>
          )}
          {hasReplies && !areRepliesCollapsed && (
            <div className="mt-4 space-y-4">{renderCommentTree(replies, level + 1)}</div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-12">
      <section className="pt-24 pb-8">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
          <Button variant="ghost" onClick={() => router.back()} className="-ml-2 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,760px)_320px] gap-8">
        <main>
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-[#B39EF5] text-[#1E1E1E] hover:bg-[#B39EF5] rounded-full">
              {post.tags?.[0] || 'Blog'}
            </Badge>
            {post.published_at && (
              <div className="flex items-center gap-1 text-sm text-[#64748B]">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.published_at)}</span>
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] text-[#1E1E1E] mb-6">{post.title}</h1>

          {shortDesc && <p className="text-[#64748B] text-lg leading-relaxed mb-8">{shortDesc}</p>}

          {cover && (
            <div className="relative w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden bg-[#F8F9FA] mb-10 shadow-sm">
              <Image src={cover} alt={post.title} fill className="object-cover" priority />
            </div>
          )}

          <div className="mb-6 flex items-center gap-4 border-b border-[#E7E7E7] pb-3 text-xs text-[#64748B]">
            <span>{t('readTime', { minutes: post.read_time ?? 12 })}</span>
            <span>{t('upvotes', { count: post.upvote_count ?? 0 })}</span>
            <span>{t('comments', { count: post.comment_count ?? 0 })}</span>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#E7E7E7] bg-white px-3 py-1.5 text-xs text-[#475569] hover:bg-[#F8F9FA] disabled:opacity-50"
              onClick={handleBookmark}
              disabled={bookmarking}
              aria-label={t('save')}
            >
              <BookMarked
                className={isBookmarked ? 'h-4 w-4 text-[#7D3BED]' : 'h-4 w-4 text-[#64748B]'}
                fill={isBookmarked ? 'currentColor' : 'none'}
              />
              {isBookmarked ? t('saved') : t('save')}
            </button>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={myVote === 'like' ? 'default' : 'outline'}
              className={`rounded-full border-[#E7E7E7] ${myVote === 'like' ? 'bg-[#7D3BED] text-white hover:bg-[#5B21B6]' : ''}`}
              disabled={voting !== null}
              onClick={() => handleVote('like')}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              {t('like')} ({post.upvote_count ?? 0})
            </Button>
            <Button
              type="button"
              variant={myVote === 'dislike' ? 'default' : 'outline'}
              className={`rounded-full border-[#E7E7E7] ${myVote === 'dislike' ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]' : ''}`}
              disabled={voting !== null}
              onClick={() => handleVote('dislike')}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              {t('dislike')} ({post.downvote_count ?? 0})
            </Button>
            {voteError && <span className="text-sm text-destructive">{voteError}</span>}
          </div>

          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[#E7E7E7] px-4 py-3">
            <div className="flex items-center gap-4 text-xs text-[#64748B]">
              <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-[#F1F5F9] border border-[#E7E7E7]">
                {avatarUrlForUserId(post.author_id) ? (
                  <Image
                    src={resolveMediaUrl(avatarUrlForUserId(post.author_id))}
                    alt={displayNameForUserId(post.author_id)}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#1E1E1E] text-sm font-medium text-white">
                    {displayNameForUserId(post.author_id).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1E1E1E]">{displayNameForUserId(post.author_id)}</p>
                <p className="text-xs text-[#64748B]">{t('authorInfo')}</p>
              </div>
            </div>
          </div>


          <article className="max-w-none w-full break-words overflow-visible">
            {content ? (
              <div className="blog-content-renderer">
                <div className="ql-editor !p-0 !overflow-visible !h-auto">
                  {hasHtmlContent ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans leading-relaxed text-[17px] break-words">{content}</pre>
                  )}
                </div>
                <style jsx global>{`
                  .blog-content-renderer {
                    font-family: inherit;
                    color: #1E1E1E;
                    line-height: 1.8;
                  }
                  
                  /* Core Formatting */
                  .ql-editor {
                    padding: 0 !important;
                    height: auto !important;
                    font-size: 1.1rem;
                    line-height: 1.8;
                    color: #1E1E1E;
                  }
                  .ql-editor p {
                    margin-bottom: 1.5rem;
                  }
                  .ql-editor h1, .ql-editor h2, .ql-editor h3 {
                    color: #1E1E1E;
                    font-weight: 700;
                    line-height: 1.3;
                    margin-top: 2.5rem;
                    margin-bottom: 1.25rem;
                  }
                  .ql-editor h1 { font-size: 2.25rem; }
                  .ql-editor h2 { font-size: 1.875rem; }
                  .ql-editor h3 { font-size: 1.5rem; }
                  
                  /* Lists */
                  .ql-editor ul, .ql-editor ol {
                    margin-left: 0;
                    padding-left: 1.5rem;
                    margin-bottom: 1.5rem;
                  }
                  .ql-editor ul { list-style-type: disc; }
                  .ql-editor ol { list-style-type: decimal; }
                  .ql-editor li {
                    margin-bottom: 0.5rem;
                    padding-left: 0.5rem;
                  }
                  
                  /* Alignments */
                  .ql-align-center { text-align: center; }
                  .ql-align-right { text-align: right; }
                  .ql-align-justify { text-align: justify; }
                  
                  /* Images & Media */
                  .ql-editor img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 1rem;
                    margin: 2.5rem 0;
                    display: block;
                  }
                  
                  /* Blockquotes */
                  .ql-editor blockquote {
                    border-left: 4px solid #7D3BED;
                    padding-left: 1.5rem;
                    margin: 2rem 0;
                    font-style: italic;
                    color: #475569;
                  }
                  
                  /* Indentation */
                  .ql-indent-1 { padding-left: 3rem; }
                  .ql-indent-2 { padding-left: 6rem; }
                  .ql-indent-3 { padding-left: 9rem; }
                `}</style>
              </div>
            ) : (
              <p className="text-muted-foreground italic">{t('contentUpdating')}</p>
            )}
          </article>

          <section className="mt-10">
            <Card className="rounded-3xl border border-[#E7E7E7] bg-[#F8F9FA]">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-[#1E1E1E]">{t('reply')}</h2>
                    <p className="text-sm text-[#64748B]">{t('comments', { count: comments.length })}</p>
                  </div>
                </div>

                {isAuthenticated ? (
                  <form onSubmit={handleSubmitComment} className="space-y-3">
                    <Textarea
                      value={commentValue}
                      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setCommentValue(event.target.value)}
                      placeholder={t('writeComment')}
                      className="min-h-[120px]"
                    />
                    {commentError && <p className="text-sm text-destructive">{commentError}</p>}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button type="submit" disabled={postingComment} className="rounded-full">
                        {postingComment ? t('sending') : t('postComment')}
                      </Button>
                      {loadingComments && <span className="text-sm text-[#64748B]">{t('loading')}</span>}
                    </div>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white p-4 text-sm text-[#475569]">
                    <p className="mb-2">Bạn cần đăng nhập để viết bình luận.</p>
                    <Link href="/auth/login" className="text-[#7D3BED] underline">
                      Đăng nhập ngay
                    </Link>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  {loadingComments ? (
                    <div className="text-sm text-[#64748B]">Đang tải bình luận...</div>
                  ) : comments.length > 0 ? (
                    renderCommentTree(topComments, 0)
                  ) : (
                    <p className="text-sm text-[#64748B]">Chưa có bình luận nào. Hãy là người đầu tiên bình luận.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <Card className="bg-[#F8F9FA] border-0 rounded-2xl">
              <CardContent className="p-4">
                <h3 className="text-xs text-[#64748B] uppercase mb-3">About the author</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-[#F1F5F9] border border-[#E7E7E7]">
                    {avatarUrlForUserId(post.author_id) ? (
                      <Image
                        src={resolveMediaUrl(avatarUrlForUserId(post.author_id))}
                        alt={displayNameForUserId(post.author_id)}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#1E1E1E] text-white text-base font-medium">
                        {displayNameForUserId(post.author_id).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E1E1E]">{displayNameForUserId(post.author_id)}</p>
                    <p className="text-xs text-[#64748B]">Design Focused</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full rounded-full border-[#E7E7E7]">View Profile</Button>
              </CardContent>
            </Card>

            {relatedPosts.length > 0 && (
              <Card className="bg-[#F8F9FA] border-0 rounded-2xl">
                <CardContent className="p-4">
                  <h3 className="text-xs text-[#64748B] uppercase mb-3">Related articles</h3>
                  <div className="space-y-3">
                    {relatedPosts.map((p) => (
                      <Link key={p.id} href={`/blogs/${p.id}`} className="flex gap-2 group">
                        <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={resolveMediaUrl(p.cover_image_url || '/images/job/default-job.jpg')}
                            alt={p.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-[#1E1E1E] line-clamp-2 group-hover:text-[#7D3BED]">
                            {p.title}
                          </p>
                          <p className="text-[10px] text-[#64748B] mt-1">{p.read_time ?? 5} min read</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

