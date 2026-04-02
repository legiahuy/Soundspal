import { Metadata } from 'next'
import AboutPageClient from './AboutPageClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    "Learn about Soundspal's mission to connect independent music artists with venues, organizers, and creative opportunities worldwide.",
  alternates: {
    canonical: `${APP_URL}/about`,
  },
  openGraph: {
    title: 'About Soundspal - Our Mission & Values',
    description:
      "Learn about Soundspal's mission to connect independent music artists with venues, organizers, and creative opportunities worldwide.",
    url: `${APP_URL}/about`,
  },
}

export default function AboutPage() {
  return <AboutPageClient />
}
