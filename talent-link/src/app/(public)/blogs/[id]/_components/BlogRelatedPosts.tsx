'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { resolveMediaUrl } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { BlogPost } from '@/types/blog'

interface BlogRelatedPostsProps {
  posts: BlogPost[]
}

function formatDate(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BlogRelatedPosts({ posts }: BlogRelatedPostsProps) {
  const t = useTranslations('BlogDetail')
  if (posts.length === 0) return null

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2.5 rounded-full ring-4 ring-primary/5">
          <ChevronRight className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{t('relatedArticles')}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <Link href={`/blogs/${post.id}`} className="block group h-full">
              <Card className="h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  <Image
                    src={resolveMediaUrl(post.cover_image_url || '/images/job/default-job.jpg')}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block mb-2">
                    {formatDate(post.published_at || post.created_at)}
                  </span>
                  <h3 className="text-base font-bold leading-snug line-clamp-2 group-hover:text-primary/90 transition-colors mb-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                    {post.short_description || post.brief_description}
                  </p>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-primary uppercase tracking-wider mt-4 group-hover:translate-x-0.5 transition-transform">
                    Read <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
