import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Mail, MapPin, MessageSquare, Facebook } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ContactPage')
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: `${APP_URL}/contact` },
    openGraph: { title: t('title'), url: `${APP_URL}/contact` },
  }
}

export default async function ContactPage() {
  const t = await getTranslations('ContactPage')

  const contactMethods = [
    {
      label: t('emailLabel'),
      description: t('emailDescription'),
      icon: Mail,
      content: (
        <a href="mailto:support@soundspal.com" className="text-primary hover:underline font-medium">
          support@soundspal.com
        </a>
      ),
    },
    {
      label: t('socialLabel'),
      description: t('socialDescription'),
      icon: Facebook,
      content: (
        <a
          href="https://www.facebook.com/SoundspalHQ"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          facebook.com/SoundspalHQ
        </a>
      ),
    },
    {
      label: t('feedbackLabel'),
      description: t('feedbackDescription'),
      icon: MessageSquare,
      content: (
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLScsjq8G5ish9640ma213FJ-vaQQDoOh5p7PjmMPys5pdiEnFw/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          {t('feedbackLink')}
        </a>
      ),
    },
    {
      label: t('locationLabel'),
      description: t('locationValue'),
      icon: MapPin,
      content: null,
    },
  ]

  const quickLinks = [
    { href: '/help', label: t('helpCenter'), sub: t('helpCenterSub') },
    { href: '/about', label: t('aboutUs'), sub: t('aboutUsSub') },
    { href: '/jobs', label: t('browseJobs'), sub: t('browseJobsSub') },
    { href: '/discovery', label: t('discoverTalent'), sub: t('discoverTalentSub') },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-primary/10 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto max-w-[1200px] px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 pb-2 bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            {contactMethods.map((method) => (
              <div key={method.label} className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg mb-1">{method.label}</h2>
                    <p className="text-muted-foreground text-sm mb-2">{method.description}</p>
                    {method.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border/50 space-y-6">
            <h2 className="text-2xl font-bold">{t('quickLinksTitle')}</h2>
            <p className="text-muted-foreground">{t('quickLinksSubtitle')}</p>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div>
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {link.label}
                      </div>
                      <div className="text-sm text-muted-foreground">{link.sub}</div>
                    </div>
                    <span className="text-muted-foreground group-hover:text-primary transition-colors">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
