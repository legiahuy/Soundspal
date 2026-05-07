'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, MessageSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { blogService } from '@/services/blogService'
import { userService } from '@/services/userService'
import { useAuth } from '@/hooks/useAuth'
import type { BlogComment } from '@/types/blog'
import type { User } from '@/types/user'
import { resolveMediaUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface BlogCommentSectionProps {
  postId: string
  onCommentCountChange?: (count: number) => void
}

export default function BlogCommentSection({ postId, onCommentCountChange }: BlogCommentSectionProps) {
  const t = useTranslations('BlogDetail')
  const { isAuthenticated, user } = useAuth()
  const userId = user?.id

  const [comments, setComments] = useState<BlogComment[]>([])
  const [loading, setLoading] = useState(false)
  const [commentValue, setCommentValue] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [replyTarget, setReplyTarget] = useState<BlogComment | null>(null)
  const [replyValue, setReplyValue] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)
  const [postingReply, setPostingReply] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<string[]>([])
  const [userById, setUserById] = useState<Record<string, User>>({})

  const displayName = (id?: string) => {
    if (!id) return 'User'
    if (id === userId) {
      const u = user as any
      return u?.display_name || u?.displayName || u?.username || 'You'
    }
    const u = userById[id] as any
    return u?.display_name || u?.displayName || u?.username || id
  }

  const avatarUrl = (id?: string) => {
    if (!id) return ''
    if (id === userId) {
      const u = user as any
      return u?.avatar_url || u?.avatarUrl || ''
    }
    const u = userById[id] as any
    return u?.avatar_url || u?.avatarUrl || ''
  }

  const loadComments = async () => {
    try {
      setLoading(true)
      const data = await blogService.getComments(postId)
      setComments(data)
      onCommentCountChange?.(data.length)
      const ids = Array.from(new Set(data.map((c) => c.author_id).filter(Boolean) as string[]))
      const missing = ids.filter((id) => !userById[id] && id !== userId)
      if (missing.length > 0) {
        const fetched = await Promise.all(
          missing.map(async (id) => {
            try { return [id, await userService.getUser(id)] as const } catch { return null }
          }),
        )
        const updates: Record<string, User> = {}
        fetched.forEach((p) => { if (p) updates[p[0]] = p[1] })
        if (Object.keys(updates).length > 0) setUserById((prev) => ({ ...prev, ...updates }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadComments() }, [postId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const content = commentValue.trim()
    if (!content) { setCommentError(t('commentEmpty')); return }
    try {
      setPosting(true); setCommentError(null)
      const created = await blogService.createComment(postId, { content })
      setComments((prev) => [created, ...prev])
      setCommentValue('')
      onCommentCountChange?.(comments.length + 1)
    } catch (e) {
      console.error(e); setCommentError(t('commentError'))
    } finally { setPosting(false) }
  }

  const handleSubmitReply = async (e: FormEvent, parent: BlogComment) => {
    e.preventDefault()
    const content = replyValue.trim()
    if (!content) { setReplyError(t('commentEmpty')); return }
    try {
      setPostingReply(true); setReplyError(null)
      const created = await blogService.createComment(postId, { content, parent_id: parent.id })
      setComments((prev) => [created, ...prev])
      setReplyValue(''); setReplyTarget(null)
      onCommentCountChange?.(comments.length + 1)
    } catch (e) {
      console.error(e); setReplyError(t('commentError'))
    } finally { setPostingReply(false) }
  }

  const handleSaveEdit = async (id: string) => {
    const content = editValue.trim()
    if (!content) { setEditError(t('commentEmpty')); return }
    try {
      setSavingEdit(true); setEditError(null)
      const updated = await blogService.updateComment(id, { content })
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)))
      setEditingId(null); setEditValue('')
    } catch (e) {
      console.error(e); setEditError(t('commentError'))
    } finally { setSavingEdit(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return
    try {
      setDeletingId(id)
      await blogService.deleteComment(id)
      const fresh = await blogService.getComments(postId)
      setComments(fresh)
      onCommentCountChange?.(fresh.length)
      if (editingId === id) { setEditingId(null) }
      if (replyTarget?.id === id) { setReplyTarget(null) }
    } catch (e) {
      console.error(e)
    } finally { setDeletingId(null) }
  }

  const countDescendants = (id: string): number => {
    const direct = comments.filter((c) => c.parent_id === id)
    return direct.length + direct.reduce((n, c) => n + countDescendants(c.id), 0)
  }

  const renderTree = (nodes: BlogComment[], level = 0): React.ReactNode =>
    nodes.map((comment) => {
      const replies = comments.filter((c) => c.parent_id === comment.id)
      const collapsed = collapsedIds.includes(comment.id)
      const isOwner = !!userId && userId === comment.author_id
      const isEditing = editingId === comment.id

      return (
        <div
          key={comment.id}
          className={`rounded-2xl border border-border/50 bg-card/50 p-4 ${level > 0 ? 'ml-6 border-l-4 border-primary/20' : ''}`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden bg-muted border border-border/50">
              {avatarUrl(comment.author_id) ? (
                <Image src={resolveMediaUrl(avatarUrl(comment.author_id))} alt={displayName(comment.author_id)} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-xs font-bold">
                  {displayName(comment.author_id).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-1 items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{displayName(comment.author_id)}</span>
              <span className="text-[11px] text-muted-foreground">{formatDate(comment.created_at)}</span>
            </div>
          </div>

          {/* Body */}
          {isEditing ? (
            <div className="space-y-3">
              <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="min-h-[96px]" autoFocus />
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setEditingId(null)}>{t('cancel')}</Button>
                <Button type="button" size="sm" className="rounded-full" disabled={savingEdit} onClick={() => handleSaveEdit(comment.id)}>
                  {savingEdit ? t('saving') : t('saveComment')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{comment.content}</p>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            {isAuthenticated && (
              <button className="text-primary hover:opacity-70 font-medium transition-opacity" onClick={() => { setReplyTarget(comment); setReplyValue(''); setReplyError(null) }}>
                {t('reply')}
              </button>
            )}
            {isOwner && (
              <>
                <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => { setEditingId(comment.id); setEditValue(comment.content || '') }}>{t('edit')}</button>
                <button className="text-destructive hover:opacity-70 disabled:opacity-40 transition-opacity" disabled={deletingId === comment.id} onClick={() => handleDelete(comment.id)}>
                  {deletingId === comment.id ? t('deleting') : t('delete')}
                </button>
              </>
            )}
            {replies.length > 0 && (
              <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setCollapsedIds((p) => collapsed ? p.filter((i) => i !== comment.id) : [...p, comment.id])}>
                {collapsed ? t('viewAllComments', { count: countDescendants(comment.id) }) : t('collapse')}
              </button>
            )}
          </div>

          {/* Reply form */}
          {isAuthenticated && replyTarget?.id === comment.id && (
            <form onSubmit={(e) => handleSubmitReply(e, comment)} className="mt-4 space-y-3 rounded-xl border border-border/50 bg-muted/30 p-4">
              <Textarea value={replyValue} onChange={(e) => setReplyValue(e.target.value)} placeholder={t('replyTo', { name: displayName(comment.author_id) })} className="min-h-[80px] bg-card" autoFocus />
              {replyError && <p className="text-sm text-destructive">{replyError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setReplyTarget(null)}>{t('cancel')}</Button>
                <Button type="submit" size="sm" className="rounded-full" disabled={postingReply}>{postingReply ? t('sending') : t('reply')}</Button>
              </div>
            </form>
          )}

          {/* Nested replies */}
          {replies.length > 0 && !collapsed && (
            <div className="mt-4 space-y-3">{renderTree(replies, level + 1)}</div>
          )}
        </div>
      )
    })

  const topComments = comments.filter((c) => !c.parent_id)

  return (
    <section className="mt-10">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">{t('reply')}</h2>
            <span className="text-sm text-muted-foreground ml-1">({comments.length})</span>
          </div>

          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="space-y-3 mb-8">
              <Textarea value={commentValue} onChange={(e) => setCommentValue(e.target.value)} placeholder={t('writeComment')} className="min-h-[120px]" />
              {commentError && <p className="text-sm text-destructive">{commentError}</p>}
              <div className="flex justify-end">
                <Button type="submit" disabled={posting} className="rounded-full px-6">
                  {posting ? t('sending') : t('postComment')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm mb-8">
              <p className="text-muted-foreground mb-2">{t('loginRequired')}</p>
              <Link href="/auth/login" className="text-primary font-medium hover:underline">{t('loginNow')}</Link>
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : topComments.length > 0 ? (
              renderTree(topComments, 0)
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t('noComments')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
