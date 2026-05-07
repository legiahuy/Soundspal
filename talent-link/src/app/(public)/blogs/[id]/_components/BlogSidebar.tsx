'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { resolveMediaUrl } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TocItem {
  id: string
  text: string
  level: number
}

interface BlogSidebarProps {
  authorName: string
  authorAvatar: string
  authorLabel: string
  authorProfileHref?: string
  content: string
}

function extractToc(html: string): TocItem[] {
  if (typeof window === 'undefined') return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = Array.from(doc.querySelectorAll('h2, h3'))
  return headings.map((el, i) => {
    const id = el.id || `toc-heading-${i}`
    el.id = id
    return { id, text: el.textContent || '', level: el.tagName === 'H2' ? 2 : 3 }
  })
}

export default function BlogSidebar({
  authorName,
  authorAvatar,
  authorLabel,
  authorProfileHref,
  content,
}: BlogSidebarProps) {
  const t = useTranslations('BlogDetail')
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(content)
    if (hasHtml) setToc(extractToc(content))
  }, [content])

  // Highlight active heading on scroll
  useEffect(() => {
    if (toc.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )
    toc.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [toc])

  return (
    <div className="sticky top-28 space-y-4">
      {/* Author card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {t('aboutAuthor')}
          </p>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-muted border border-border/50">
              {authorAvatar ? (
                <Image
                  src={resolveMediaUrl(authorAvatar)}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-base font-bold">
                  {authorName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{authorName}</p>
              <p className="text-xs text-muted-foreground">{authorLabel}</p>
            </div>
          </div>
          {authorProfileHref && (
            <Button variant="outline" className="w-full text-sm" asChild>
              <Link href={authorProfileHref}>{t('viewProfile')}</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table of contents */}
      {toc.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardContent className="p-5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {t('onThisPage')}
            </p>
            <nav className="space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`block text-sm py-1 transition-colors truncate ${
                    item.level === 3 ? 'pl-3 text-[13px]' : ''
                  } ${
                    activeId === item.id
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
