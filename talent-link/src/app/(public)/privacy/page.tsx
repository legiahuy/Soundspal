import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'
const LAST_UPDATED = 'April 1, 2025'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('PrivacyPage')
  return {
    title: t('title'),
    description:
      'Read the Soundspal Privacy Policy. Learn how we collect, use, and protect your personal information when you use our platform.',
    alternates: { canonical: `${APP_URL}/privacy` },
    openGraph: { title: `${t('title')} - Soundspal`, url: `${APP_URL}/privacy` },
  }
}

export default async function PrivacyPage() {
  const t = await getTranslations('PrivacyPage')

  const sections = [
    {
      heading: t('s1'),
      content: (
        <p>
          Soundspal (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use our platform at{' '}
          <Link href="/" className="text-primary hover:underline">soundspal.com</Link>.
        </p>
      ),
    },
    {
      heading: t('s2'),
      content: (
        <>
          <p>We may collect the following types of information:</p>
          <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
            <li><strong className="text-foreground">Account Information:</strong> Name, email address, username, and password when you register.</li>
            <li><strong className="text-foreground">Profile Information:</strong> Bio, profile photo, genres, location, portfolio links, and other information you choose to add.</li>
            <li><strong className="text-foreground">Usage Data:</strong> Pages visited, features used, search queries, and interaction patterns on the Platform.</li>
            <li><strong className="text-foreground">Communications:</strong> Messages you send through our messaging features.</li>
            <li><strong className="text-foreground">Device Information:</strong> IP address, browser type, and operating system for security and analytics purposes.</li>
          </ul>
        </>
      ),
    },
    {
      heading: t('s3'),
      content: (
        <>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
            <li>Provide, operate, and improve the Platform</li>
            <li>Enable communication between users</li>
            <li>Send you relevant notifications and updates</li>
            <li>Maintain security and prevent fraud</li>
            <li>Comply with legal obligations</li>
            <li>Analyze usage patterns to improve our services</li>
          </ul>
        </>
      ),
    },
    {
      heading: t('s4'),
      content: (
        <>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
            <li><strong className="text-foreground">Other Users:</strong> Profile information you choose to make public is visible to other users.</li>
            <li><strong className="text-foreground">Service Providers:</strong> Third-party vendors who assist in operating our Platform (e.g., hosting, analytics).</li>
            <li><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our legal rights.</li>
          </ul>
        </>
      ),
    },
    {
      heading: t('s5'),
      content: (
        <p>
          We use third-party services including Firebase (analytics), Vercel (hosting and analytics), and Sentry (error monitoring).
          These services have their own privacy policies that govern how they handle data.
        </p>
      ),
    },
    {
      heading: t('s6'),
      content: (
        <p>
          We implement appropriate technical and organizational security measures to protect your information against unauthorized access,
          alteration, disclosure, or destruction. However, no method of internet transmission is 100% secure.
        </p>
      ),
    },
    {
      heading: t('s7'),
      content: (
        <>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
            <li>Access and update your personal information via your account settings</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of non-essential communications</li>
            <li>Request a copy of the data we hold about you</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, contact us at{' '}
            <a href="mailto:support@soundspal.com" className="text-primary hover:underline">support@soundspal.com</a>.
          </p>
        </>
      ),
    },
    {
      heading: t('s8'),
      content: (
        <p>
          We use cookies and similar tracking technologies to maintain your session, remember your preferences, and analyze Platform usage.
          You can control cookie settings through your browser, though disabling cookies may affect Platform functionality.
        </p>
      ),
    },
    {
      heading: t('s9'),
      content: (
        <p>
          Soundspal is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.
          If you believe we have inadvertently collected such information, please contact us immediately.
        </p>
      ),
    },
    {
      heading: t('s10'),
      content: (
        <p>
          We may update this Privacy Policy periodically. We will notify you of significant changes by posting a notice on the Platform.
          Your continued use of the Platform after changes constitutes acceptance of the updated policy.
        </p>
      ),
    },
    {
      heading: t('s11'),
      content: (
        <p>
          If you have questions or concerns about this Privacy Policy, please contact us at{' '}
          <a href="mailto:support@soundspal.com" className="text-primary hover:underline">support@soundspal.com</a>{' '}
          or visit our{' '}
          <Link href="/contact" className="text-primary hover:underline">Contact page</Link>.
        </p>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-[800px] px-4 py-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-muted-foreground">{t('lastUpdated', { date: LAST_UPDATED })}</p>
        </div>

        <div className="space-y-10 text-muted-foreground leading-relaxed">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold text-foreground mb-3">{section.heading}</h2>
              {section.content}
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border/40">
          <p className="text-sm text-muted-foreground">
            {t('seeAlso')}{' '}
            <Link href="/terms" className="text-primary hover:underline">
              {t('termsOfService')}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
