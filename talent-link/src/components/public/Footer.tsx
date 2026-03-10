import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Facebook, Instagram, Youtube } from 'lucide-react'

const Footer = () => {
  const t = useTranslations('Footer')
  return (
    <footer className="py-10 cursor-default border-t border-border/40 bg-card flex justify-center z-10">
      <div className="mx-auto max-w-[1320px] px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/Soundspal.svg"
                alt="Soundspal Logo"
                width={120}
                height={32}
                className="h-6 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('aboutUs')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-foreground transition-colors">
                  {t('careers')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('support')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://docs.google.com/forms/d/e/1FAIpQLSe66NkLKGnXth2ZytcHePkFRtj0o7E_0B8RBmPdyTp6q3svMQ/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {t('feedback')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('connect')}</h3>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>{t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
