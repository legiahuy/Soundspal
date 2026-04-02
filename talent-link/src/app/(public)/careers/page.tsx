import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Briefcase, Code2, Megaphone, Music2 } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('CareersPage')
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: `${APP_URL}/careers` },
    openGraph: { title: t('title'), url: `${APP_URL}/careers` },
  }
}

export default async function CareersPage() {
  const t = await getTranslations('CareersPage')

  const values = [
    { title: t('impactDrivenTitle'), description: t('impactDrivenDesc') },
    { title: t('remoteFriendlyTitle'), description: t('remoteFriendlyDesc') },
    { title: t('fastAmbitiousTitle'), description: t('fastAmbitiousDesc') },
  ]

  const openRoles = [
    { title: t('role1Title'), team: t('role1Team'), type: t('role1Type'), icon: Code2 },
    { title: t('role2Title'), team: t('role2Team'), type: t('role2Type'), icon: Megaphone },
    { title: t('role3Title'), team: t('role3Team'), type: t('role3Type'), icon: Music2 },
    { title: t('role4Title'), team: t('role4Team'), type: t('role4Type'), icon: Briefcase },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-primary/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-primary/10 blur-[130px] rounded-full" />
      </div>

      <div className="relative z-10 container mx-auto max-w-[1200px] px-4 py-24">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 pb-2 bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {values.map((v) => (
            <div
              key={v.title}
              className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all"
            >
              <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>

        {/* Open Roles */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8">{t('openPositions')}</h2>
          <div className="space-y-4">
            {openRoles.map((role) => (
              <div
                key={role.title}
                className="flex items-center gap-6 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <role.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{role.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {role.team} · {role.type}
                  </div>
                </div>
                <a
                  href="mailto:careers@soundspal.com"
                  className="text-sm font-medium text-primary hover:underline shrink-0"
                >
                  {t('apply')}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-12 rounded-3xl bg-primary/5 border border-primary/20">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('ctaTitle')}</h2>
          <p className="text-muted-foreground mb-6">{t('ctaSubtitle')}</p>
          <a
            href="mailto:careers@soundspal.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            {t('ctaButton')}
          </a>
          <p className="mt-6 text-sm text-muted-foreground">
            {t('ctaOr')}{' '}
            <Link href="/contact" className="text-primary hover:underline">
              {t('ctaContactUs')}
            </Link>{' '}
            {t('ctaForInquiries')}
          </p>
        </div>
      </div>
    </div>
  )
}
