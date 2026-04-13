'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Calendar,
  Loader2,
} from 'lucide-react'
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
  const content = post.content || ''
  const hasHtmlContent = /<\/?[a-z][\s\S]*>/i.test(content)

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-12">
      <section className="border-b border-[#E7E7E7] pt-24 pb-8">
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

          {shortDesc && <p className="text-[#64748B] text-lg leading-relaxed mb-6">{shortDesc}</p>}

          <div className="mb-6 flex items-center gap-4 border-b border-[#E7E7E7] pb-3 text-xs text-[#64748B]">
            <span>{post.read_time ?? 12} min read</span>
            <span>{post.upvote_count ?? 0} upvotes</span>
            <span>{post.comment_count ?? 0} comments</span>
          </div>

          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[#E7E7E7] px-4 py-3">
            <div className="flex items-center gap-4 text-xs text-[#64748B]">
              <div className="h-10 w-10 rounded-full bg-[#1E1E1E] text-white text-sm flex items-center justify-center">
                {(post.author_id || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1E1E1E]">{post.author_id || 'Elena Vance'}</p>
                <p className="text-xs text-[#64748B]">Design Lead at Linear Systems</p>
              </div>
            </div>
          </div>

          {cover && (
            <div className="relative w-full h-72 md:h-[300px] rounded-2xl overflow-hidden bg-[#F8F9FA] mb-3">
              <Image src={cover} alt={post.title} fill className="object-cover" />
            </div>
          )}

          <article className="max-w-none">
            {content ? (
              <div className="text-[#1E1E1E] leading-8 text-[16px] font-normal">
                {hasHtmlContent ? (
                  <div className="prose prose-neutral max-w-none prose-headings:text-[#1E1E1E] prose-p:text-[#1E1E1E] prose-blockquote:border-[#7D3BED] prose-blockquote:text-[#5b21b6]">
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans leading-8">{content}</pre>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nội dung đang được cập nhật.</p>
            )}
          </article>
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
    </div>
  )
}

