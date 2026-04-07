'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'
import {
  BookMarked,
  Calendar,
  ChevronRight,
  MessageCircle,
  ThumbsUp,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { blogService } from '@/services/blogService'
import type { BlogPost } from '@/types/blog'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    let active = true
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await blogService.listPosts({ limit: 12, offset: 0, status: 'published' })
        if (!active) return
        setPosts(res.posts || [])
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
  }, [t])

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-20 pt-24 md:pt-28">
      <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
        <main>
          <div className="mb-5 flex items-center gap-6 text-sm">
            <span className="text-[#7D3BED] font-medium border-b-2 border-[#7D3BED] pb-1">Explore</span>
            <span className="text-[#64748B]">Bookmarks</span>
            <span className="text-[#64748B]">Following</span>
          </div>

          {loading && <p className="text-[#64748B]">{t('loading')}</p>}
          {!loading && error && <p className="text-destructive">{error}</p>}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-20 rounded-2xl bg-[#F8F9FA]">
              <p className="text-[#64748B] text-lg">{t('empty')}</p>
            </div>
          )}

          {!loading && !error && posts.length > 0 && (
            <>
              {posts[0] && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                  <Card className="bg-[#F8F9FA] border-0 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative h-64 md:h-[340px]">
                        <Image
                          src={resolveMediaUrl(posts[0].cover_image_url || '/images/job/default-job.jpg')}
                          alt={posts[0].title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-8 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="rounded-full bg-[#f2d9ee] text-[#8a4f79] px-3 py-1 font-medium">
                            CURATOR&apos;S CHOICE
                          </span>
                          <span className="text-[#64748B]">{posts[0].read_time ?? 12} min read</span>
                        </div>
                        <h2 className="text-5xl leading-[1.05] font-bold text-[#1E1E1E]">
                          {posts[0].title}
                        </h2>
                        <p className="text-[18px] text-[#64748B] leading-relaxed">
                          {posts[0].short_description || posts[0].brief_description}
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <div className="h-10 w-10 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center text-sm font-medium">
                            {(posts[0].author_id || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm">
                            <p className="font-medium text-[#1E1E1E]">{posts[0].author_id || 'Soundspal Team'}</p>
                            <p className="text-[#64748B]">{formatDate(posts[0].published_at || posts[0].created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <div className="mb-5">
                <h3 className="text-[32px] font-bold text-[#1E1E1E] border-b-2 border-[#7D3BED] inline-block pb-1">
                  Latest Insights
                </h3>
              </div>

              <motion.div className="space-y-4" initial="hidden" animate="show" variants={staggerContainer}>
                {posts.slice(1).map((post) => (
                  <motion.div key={post.id} variants={fadeInUp}>
                    <Link href={`/blogs/${post.slug}`} className="block">
                      <Card className="border-0 bg-transparent hover:bg-[#F8F9FA] transition-all rounded-2xl hover:shadow-sm">
                        <CardContent className="p-4 grid grid-cols-[120px_1fr] gap-5 items-start">
                          <div className="relative h-[120px] w-[100px] rounded-2xl overflow-hidden">
                            <Image
                              src={resolveMediaUrl(post.cover_image_url || '/images/job/default-job.jpg')}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-xs tracking-wide text-[#b06ca1] font-medium uppercase mb-2">
                              {post.tags?.[0] || 'Technology'}
                            </p>
                            <h3 className="text-lg font-semibold text-[#1E1E1E] line-clamp-2">{post.title}</h3>
                            <p className="text-sm text-[#64748B] mt-1">
                              {post.short_description || post.brief_description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-[#64748B] mt-3">
                              <span className="font-medium text-[#1E1E1E]">{post.author_id || 'Soundspal'}</span>
                              <span>{formatDate(post.published_at || post.created_at)}</span>
                              <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{post.upvote_count ?? 0}</span>
                              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.comment_count ?? 0}</span>
                              <span className="ml-auto"><BookMarked className="h-3.5 w-3.5" /></span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            <Card className="bg-[#F8F9FA] border-0 rounded-2xl">
              <CardContent className="p-4">
                <h3 className="font-semibold text-[#1E1E1E] mb-3 text-2xl">Trending Now</h3>
                <div className="space-y-4 text-sm">
                  {posts.slice(0, 3).map((post, idx) => (
                    <Link key={post.id} href={`/blogs/${post.slug}`} className="flex gap-3 group">
                      <span className="text-3xl text-[#D3D6DB] font-semibold">{`0${idx + 1}`}</span>
                      <div>
                        <p className="text-[#1E1E1E] group-hover:text-[#7D3BED] line-clamp-2">{post.title}</p>
                        <p className="text-xs text-[#64748B] mt-1">
                          {post.read_time ?? 10} min read • {formatDate(post.published_at || post.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#F8F9FA] border-0 rounded-2xl">
              <CardContent className="p-4">
                <h3 className="font-semibold text-[#1E1E1E] mb-3 text-2xl">Who to follow</h3>
                <div className="space-y-3">
                  {['Sarah Drasner', 'Tobias van S.', 'Amelie Laurent'].map((name) => (
                    <div key={name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center text-xs">
                          {name.charAt(0)}
                        </div>
                        <span className="text-sm text-[#1E1E1E]">{name}</span>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-full h-7 text-xs">Follow</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#F8F9FA] border-0 rounded-2xl">
              <CardContent className="p-4">
                <h3 className="font-semibold text-[#1E1E1E] mb-3 text-2xl">Top Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {['#AI', '#Productivity', '#WebDesign', '#Psychology', '#RemoteWork'].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-md text-xs bg-[#F1F5F9] text-[#64748B]">
                      {tag}
                    </span>
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

