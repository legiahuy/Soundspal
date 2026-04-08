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
  UserPlus,
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
    <div className="min-h-screen bg-[#FFFFFF] pb-12">
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

          {shortDesc && <p className="text-[#64748B] text-lg leading-relaxed mb-6">{shortDesc}</p>}

          {/* Actions row (should appear directly under short_description) */}
          <div className="mb-6 flex items-center justify-between border-b border-[#E7E7E7] pb-3">
            <div className="flex items-center gap-4 text-xs text-[#64748B]">
              <span>{post.read_time ?? 12} min read</span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" /> {post.upvote_count ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" /> {post.comment_count ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#64748B]">
              <button className="rounded-full p-2 hover:bg-[#F8F9FA]" aria-label="Upvote">
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button className="rounded-full p-2 hover:bg-[#F8F9FA]" aria-label="Bookmark">
                <Bookmark className="h-4 w-4" />
              </button>
              <button className="rounded-full p-2 hover:bg-[#F8F9FA]" aria-label="Share">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[#E7E7E7] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#1E1E1E] text-white text-sm flex items-center justify-center">
                {(post.author_id || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1E1E1E]">{post.author_id || 'Elena Vance'}</p>
                <p className="text-xs text-[#64748B]">Design Lead at Linear Systems</p>
              </div>
            </div>
            <Button variant="outline" className="rounded-full h-8 px-3 text-xs border-[#E7E7E7]">
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Follow
            </Button>
          </div>

          {cover && (
            <div className="relative w-full h-72 md:h-[300px] rounded-2xl overflow-hidden bg-[#F8F9FA] mb-3">
              <Image src={cover} alt={post.title} fill className="object-cover" />
            </div>
          )}

          <article className="max-w-none">
            {post.content ? (
              <div className="text-[#1E1E1E] leading-8 text-[16px] space-y-6 font-normal">
                <p className="text-[#64748B]">
                  In the burgeoning landscape of digital interfaces, we often find ourselves caught in a cycle of visual density.
                </p>
                <blockquote className="border-l-4 border-[#7D3BED] pl-4 py-2 text-[#7D3BED] italic text-3xl leading-tight font-semibold">
                  “Space is the breath of art. It allows the audience to find their own place within the narrative.”
                </blockquote>
                <pre className="whitespace-pre-wrap font-sans leading-8">{post.content}</pre>
                <h2 className="text-4xl font-bold text-[#1E1E1E]">The Cognitive Load of Clutter</h2>
                <div className="rounded-2xl bg-[#F8F9FA] p-5">
                  <h3 className="text-sm font-semibold text-[#1E1E1E] mb-2">Key Takeaways</h3>
                  <ul className="space-y-2 text-sm text-[#64748B]">
                    <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#7D3BED]" />Prioritize information hierarchy over total density.</li>
                    <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#7D3BED]" />Use tonal layering instead of harsh border lines.</li>
                    <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-[#7D3BED]" />Allow typography to provide the primary structure.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Nội dung đang được cập nhật.</p>
            )}
          </article>

          {/* Comment actions at end of article */}
          <div className="mt-8 border-t border-[#E7E7E7] pt-4">
            <div className="flex items-center justify-between">
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
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <Card className="bg-[#F8F9FA] border-0 rounded-2xl">
              <CardContent className="p-4">
                <h3 className="text-xs text-[#64748B] uppercase mb-3">About the author</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center">
                    {(post.author_id || 'E').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E1E1E]">{post.author_id || 'Elena Vance'}</p>
                    <p className="text-xs text-[#64748B]">Design Focused</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full rounded-full border-[#E7E7E7]">View Profile</Button>
              </CardContent>
            </Card>

            <Card className="bg-[#F8F9FA] border-0 rounded-2xl">
              <CardContent className="p-4">
                <h3 className="text-xs text-[#64748B] uppercase mb-3">Related articles</h3>
                <div className="space-y-3">
                  {[post, post, post].slice(0, 3).map((p, idx) => (
                    <Link key={`${p.id}-${idx}`} href={`/blogs/${p.slug}`} className="flex gap-2 group">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                        <Image src={resolveMediaUrl(p.cover_image_url || '/images/job/default-job.jpg')} alt={p.title} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-xs text-[#1E1E1E] line-clamp-2 group-hover:text-[#7D3BED]">{p.title}</p>
                        <p className="text-[10px] text-[#64748B] mt-1">{p.read_time ?? 5} min read</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
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

