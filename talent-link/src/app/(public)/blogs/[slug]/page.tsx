'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, Clock3, Eye, Loader2, MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { blogService } from '@/services/blogService'
import type { BlogPost } from '@/types/blog'
import { resolveMediaUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

export default function BlogDetailPage() {
  const t = useTranslations('BlogDetail')
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params?.slug ?? ''

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!slug) return
      try {
        setLoading(true)
        setError(null)
        const data = await blogService.getPostBySlug(slug)
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
  }, [slug, t])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t('loading')}</span>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-xl border-border/50 bg-card/70 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-medium mb-4">{error || t('error')}</p>
            <Button variant="outline" asChild>
              <Link href="/blogs">{t('back')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cover = post.cover_image_url ? resolveMediaUrl(post.cover_image_url) : ''
  const shortDesc = post.short_description || post.brief_description

  return (
    <div className="min-h-screen relative pb-20">
      <section className="relative border-b pt-24 pb-10 md:pt-32 md:pb-12 overflow-hidden bg-linear-to-br from-primary/15 via-primary/8 to-primary/5">
        <div className="relative mx-auto w-full max-w-[900px] px-4 md:px-6 z-10">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="capitalize">
              {post.status || 'published'}
            </Badge>
            {post.published_at && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.published_at)}</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            {post.title}
          </h1>

          {shortDesc && (
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              {shortDesc}
            </p>
          )}
        </div>
      </section>

      <div className="w-full bg-linear-to-br from-muted/50 via-muted/30 to-muted/40 relative">
        <div className="mx-auto w-full max-w-[900px] px-4 md:px-6 py-10 relative z-10">
          {cover && (
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden border border-border/50 bg-card/70 backdrop-blur-sm mb-8">
              <Image src={cover} alt={post.title} fill className="object-cover" />
            </div>
          )}

          {/* Engagement section */}
          <Card className="mb-6 border-border/50 bg-card/70 backdrop-blur-sm">
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                <span>Upvote: {post.upvote_count ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-red-600" />
                <span>Downvote: {post.downvote_count ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <span>Comments: {post.comment_count ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-600" />
                <span>Views: {post.view_count ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-violet-600" />
                <span>Read time: {post.read_time ?? 0} min</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Bookmarks:</span>
                <span>{post.bookmark_count ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <article className="prose prose-neutral dark:prose-invert max-w-none">
            {post.content ? (
              <pre className="whitespace-pre-wrap font-sans">{post.content}</pre>
            ) : (
              <p className="text-muted-foreground">Nội dung đang được cập nhật.</p>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}

