import { LoginForm } from '@/components/auth/login-form'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.soundspal.com'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.login')

  return {
    title: t('pageTitle'),
    alternates: {
      canonical: `${APP_URL}/login`,
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default function LoginPage() {
  return <LoginForm />
}
