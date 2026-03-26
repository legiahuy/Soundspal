import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Lora, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { AuthInitializer } from '@/components/auth/AuthInitializer'
import { FirebaseAnalytics } from '@/components/analytics/FirebaseAnalytics'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { FeedbackButton } from '@/components/common/FeedbackButton'

const sans = Plus_Jakarta_Sans({ variable: '--font-sans', subsets: ['latin'] })
const serif = Lora({ variable: '--font-serif', subsets: ['latin'] })
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plexmono',
  weight: ['100', '200', '300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'),
  alternates: {
    canonical: './',
  },
  title: {
    template: '%s | Soundspal',
    default: 'Soundspal - Connect with Top Music Talent & Venues',
  },
  description:
    'The premier platform connecting independent music artists with venues and organizers. Find gigs, hire talent, and build your music career.',
  keywords: [
    'music',
    'talent',
    'booking',
    'artist',
    'venue',
    'gig',
    'performance',
    'musician',
    'singer',
    'producer',
  ],
  authors: [{ name: 'Soundspal Team' }],
  openGraph: {
    title: 'Soundspal - Connect with Top Music Talent & Venues',
    description:
      'The premier platform connecting independent music artists with venues and organizers.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com',
    siteName: 'Soundspal',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg', // Ensure this exists or use a default
        width: 1200,
        height: 630,
        alt: 'Soundspal - Music Talent Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soundspal - Connect with Top Music Talent & Venues',
    description:
      'The premier platform connecting independent music artists with venues and organizers.',
    images: ['/og-image.jpg'], // Same as OG
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body
        className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased`}
        suppressHydrationWarning
      >
        <FirebaseAnalytics />
        <AuthInitializer>
          <NextIntlClientProvider messages={messages}>
            {children}
            <FeedbackButton />
          </NextIntlClientProvider>
          <Toaster position="top-right" richColors />
        </AuthInitializer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
