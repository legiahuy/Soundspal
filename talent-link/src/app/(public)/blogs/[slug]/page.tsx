'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock3,
  Loader2,
  MessageCircle,
  Mic,
  Send,
  Share2,
  ThumbsUp,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { blogService } from '@/services/blogService'
import type { BlogPost } from '@/types/blog'
import { resolveMediaUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

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
  const [commentOpen, setCommentOpen] = useState(false)

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
    <div className="min-h-screen bg-[#FFFFFF] pb-28">
      <section className="border-b border-[#E7E7E7] pt-24 pb-8">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
            <button className="rounded-full p-2 hover:bg-[#F8F9FA] transition-colors">
              <Bookmark className="h-5 w-5 text-[#64748B]" />
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,720px)_300px] gap-8">
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

          <h1 className="text-3xl md:text-4xl font-bold leading-tight text-[#1E1E1E] mb-4">{post.title}</h1>

          {shortDesc && <p className="text-[#64748B] text-lg leading-relaxed mb-6">{shortDesc}</p>}

          {cover && (
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-[#F8F9FA] mb-8">
              <Image src={cover} alt={post.title} fill className="object-cover" />
            </div>
          )}

          <article className="max-w-none">
            {post.content ? (
              <div className="text-[#1E1E1E] leading-8 text-[16px] space-y-4 font-normal">
                <blockquote className="border-l-4 border-[#7D3BED] bg-[#F8F9FA] px-4 py-3 rounded-r-lg text-[#64748B]">
                  Chia se kien thuc, xay dung cong dong chat luong.
                </blockquote>
                <pre className="whitespace-pre-wrap font-sans leading-8">{post.content}</pre>
              </div>
            ) : (
              <p className="text-muted-foreground">Nội dung đang được cập nhật.</p>
            )}
          </article>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <Card className="bg-[#F8F9FA] border-0">
              <CardContent className="p-4">
                <h3 className="font-semibold text-[#1E1E1E] mb-3">Post insights</h3>
                <div className="space-y-2 text-sm text-[#64748B]">
                  <p className="flex items-center gap-2"><ThumbsUp className="h-4 w-4" /> {post.upvote_count ?? 0} upvotes</p>
                  <p className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> {post.comment_count ?? 0} comments</p>
                  <p className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {post.read_time ?? 3} min read</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#F8F9FA] border-0">
              <CardContent className="p-4">
                <h3 className="font-semibold text-[#1E1E1E] mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(post.tags || ['music']).map((tag) => (
                    <span key={tag} className="rounded-full bg-[#B39EF5] text-[#1E1E1E] text-xs px-3 py-1">
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#E7E7E7] bg-white z-30">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full border-[#E7E7E7]">
              <ThumbsUp className="h-4 w-4 mr-1" />
              Upvote
            </Button>
            <Button variant="outline" className="rounded-full border-[#E7E7E7]">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
          <Button className="rounded-full bg-[#7D3BED] hover:bg-[#6c30d6]" onClick={() => setCommentOpen(true)}>
            <Mic className="h-4 w-4 mr-2" />
            Add Voice Comment
          </Button>
        </div>
      </div>

      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent className="max-w-[600px] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-[#E7E7E7]">
            <DialogTitle>Multimedia Comments</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4 bg-white">
            <div className="rounded-xl bg-[#F8F9FA] p-3">
              <p className="text-sm font-medium text-[#1E1E1E]">Anna</p>
              <p className="text-sm text-[#64748B] mt-1">Bai viet rat huu ich, cam on ban!</p>
              <p className="text-xs text-[#64748B] mt-2">2h ago</p>
            </div>
            <div className="rounded-xl bg-[#F8F9FA] p-3">
              <p className="text-sm font-medium text-[#1E1E1E]">Minh</p>
              <div className="mt-2 flex items-center gap-2">
                <Button size="icon" className="h-8 w-8 rounded-full bg-[#7D3BED] hover:bg-[#6c30d6]">
                  <Mic className="h-4 w-4" />
                </Button>
                <div className="flex-1 h-2 rounded-full bg-[#E7E7E7]" />
                <span className="text-xs text-[#64748B]">0:45</span>
              </div>
            </div>
          </div>
          <div className="border-t border-[#E7E7E7] bg-[#F1F5F9] p-3 flex items-end gap-2">
            <Textarea placeholder="Write or record a reply..." className="min-h-[44px] bg-transparent border-0 shadow-none" />
            <Button size="icon" className="rounded-full bg-[#F471B7] hover:bg-[#dd5fa8]">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

