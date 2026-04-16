// components/auth/RedirectAuthenticated.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import LoadingScreen from '@/components/public/LoadingScreen'

export default function RedirectAuthenticated({
  children,
  redirectTo,
}: {
  children: React.ReactNode
  redirectTo?: string
}) {
  const router = useRouter()
  const { user, isInitialized } = useAuthStore()
  const normalizedRole = user?.role?.toLowerCase()
  const destination =
    redirectTo ?? (normalizedRole === 'admin' ? '/admin' : user?.username ? `/profile/${user.username}` : '/')

  useEffect(() => {
    if (isInitialized && user) {
      router.push(destination)
    }
  }, [isInitialized, user, router, destination])

  if (!isInitialized) {
    return <LoadingScreen />
  }

  if (user) {
    return null // Đang redirect
  }

  return <>{children}</>
}
