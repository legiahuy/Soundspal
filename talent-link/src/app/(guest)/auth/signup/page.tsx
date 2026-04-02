import { SignupForm } from '@/components/auth/signup-form'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.signup')

  return {
    title: t('pageTitle'),
    alternates: {
      canonical: `${APP_URL}/signup`,
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default function SignupPage() {
  return <SignupForm />
}
