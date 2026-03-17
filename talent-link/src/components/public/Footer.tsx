import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Facebook, Instagram, Youtube } from 'lucide-react'

const Footer = () => {
  const t = useTranslations('Footer')
  return (
    <footer className="py-10 cursor-default border-t border-border/40 bg-card flex justify-center z-10">
      <div className="mx-auto max-w-[1320px] px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* 1. Brand & Socials */}
          <div className="md:col-span-5 lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/Soundspal.svg"
                alt="Soundspal Logo"
                width={120}
                height={32}
                className="h-6 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground pr-4 lg:pr-8">{t('description')}</p>
            
            <div className="flex gap-4 pt-2">
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

          {/* 2. About Us */}
          <div className="md:col-span-3 lg:col-span-2">
            <h3 className="font-semibold mb-4">{t('aboutUs')}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
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

          {/* 3. Support */}
          <div className="md:col-span-4 lg:col-span-2">
            <h3 className="font-semibold mb-4">{t('support')}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://docs.google.com/forms/d/e/1FAIpQLScsjq8G5ish9640ma213FJ-vaQQDoOh5p7PjmMPys5pdiEnFw/viewform"
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

          {/* 4. Get the App */}
          <div className="md:col-span-12 lg:col-span-4 lg:flex lg:flex-col lg:items-end">
            <div className="space-y-4">
              <h3 className="font-semibold">{t('getApp')}</h3>
              <a
                href="https://play.google.com/store/apps/details?id=com.jonasaugust12.talent_link&utm_source=soundspal_web&utm_medium=footer&utm_campaign=app_download"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col items-start gap-1 px-4 py-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/80 backdrop-blur-sm transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path
                      d="M3.18 23.5c.37.2.8.21 1.2-.02L17.7 16.1l-3.5-3.5L3.18 23.5z"
                      fill="#EA4335"
                    />
                    <path
                      d="M21.5 10.26A1.98 1.98 0 0 0 20.35 8.5L17.7 7.03l-3.87 3.87 3.87 3.87 2.64-1.47c.7-.4 1.06-1.1 1.06-1.04z"
                      fill="#FBBC04"
                    />
                    <path
                      d="M3.18.5C2.79.72 2.5 1.14 2.5 1.7v20.6c0 .56.3.97.68 1.2l11.04-11.04L3.18.5z"
                      fill="#4285F4"
                    />
                    <path
                      d="M14.2 12 3.18.5c.37-.2.83-.18 1.2.02l12.62 7.24-.8.8L14.2 12z"
                      fill="#34A853"
                    />
                  </svg>
                  <div>
                    <p className="text-[9px] text-muted-foreground leading-none tracking-wider font-semibold">
                      GET IT ON
                    </p>
                    <p className="text-sm font-bold text-foreground leading-tight mt-0.5">
                      Google Play
                    </p>
                  </div>
                </div>
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
