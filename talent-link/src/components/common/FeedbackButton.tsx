'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

export const FeedbackButton = () => {
  const t = useTranslations('Footer')
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        asChild
        className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
        size="lg"
      >
        <Link
          href="https://docs.google.com/forms/d/e/1FAIpQLScsjq8G5ish9640ma213FJ-vaQQDoOh5p7PjmMPys5pdiEnFw/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{t('feedback')}</span>
        </Link>
      </Button>
    </div>
  )
}
