'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'
import { Calendar, ChevronRight, FileText } from 'lucide-react'
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
    <div className="min-h-screen relative pb-20">
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
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-primary/10 p-2.5 rounded-xl shadow-inner">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
            </div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {t('subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="w-full bg-linear-to-br from-muted/50 via-muted/30 to-muted/40 relative">
        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6 py-10 relative z-10">
          {loading && <p className="text-muted-foreground">{t('loading')}</p>}
          {!loading && error && <p className="text-destructive">{error}</p>}

          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-2xl bg-card/20 backdrop-blur-sm">
              <p className="text-muted-foreground text-lg">{t('empty')}</p>
            </div>
          )}

          {!loading && !error && posts.length > 0 && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="show"
              variants={staggerContainer}
            >
              {posts.map((post) => {
                const cover = post.cover_image_url ? resolveMediaUrl(post.cover_image_url) : ''
                const shortDesc = post.short_description || post.brief_description
                return (
                  <motion.div key={post.id} variants={fadeInUp} className="h-full">
                    <Card className="group h-full border-border/50 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 overflow-hidden">
                      {cover ? (
                        <div className="relative h-44 w-full">
                          <Image
                            src={cover}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : (
                        <div className="h-44 w-full bg-linear-to-br from-primary/12 via-primary/6 to-transparent" />
                      )}

                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-end gap-3">
                          {post.published_at && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDate(post.published_at)}</span>
                            </div>
                          )}
                        </div>

                        <h3 className="font-semibold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>

                        {shortDesc && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {shortDesc}
                          </p>
                        )}

                        <div className="pt-2">
                          <Button asChild variant="outline" className="w-full group-hover:bg-primary/10">
                            <Link href={`/blogs/${post.slug}`} className="flex items-center justify-center gap-2">
                              Xem bài viết
                              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

