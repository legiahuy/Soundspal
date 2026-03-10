'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { LayoutDashboard, Users, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Frown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { resolveMediaUrl } from '@/lib/utils'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const t = useTranslations('Admin')
  const pathname = usePathname()
  const { user } = useAuthStore()

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] w-full relative flex items-center justify-center">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `
        linear-gradient(to right, rgba(229,231,235,0.8) 0.3px, transparent 1px),
        linear-gradient(to bottom, rgba(229,231,235,0.8) 0.3px, transparent 1px),
        radial-gradient(circle 500px at 0% 20%, rgba(139,92,246,0.3), transparent),
        radial-gradient(circle 500px at 100% 0%, rgba(59,130,246,0.3), transparent)
      `,
            backgroundSize: '48px 48px, 48px 48px, 100% 100%, 100% 100%',
          }}
        />

        <div className="min-h-screen flex items-center justify-center items-center">
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <Frown className="z-10 size-10" />
            <h1 className="text-2xl font-bold z-10">{t('accessDenied.title')}</h1>
            <p className="text-muted-foreground z-10">
              {t('accessDenied.description')}
            </p>
            <Button
              onClick={() => router.replace('/')}
              variant="link"
              size="lg"
              className="z-10 text-md"
            >
              {t('accessDenied.goBack')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const navItems = [
    {
      href: '/admin',
      label: t('sidebar.overview'),
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: '/admin/featured-users',
      label: t('sidebar.featuredUsers'),
      icon: Users,
    },
    {
      href: '/admin/featured-jobs',
      label: t('sidebar.featuredJobs'),
      icon: Briefcase,
    },
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated background elements */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-primary/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="fixed top-1/2 left-0 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex relative z-10">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-64 min-h-screen border-r border-border/50 bg-card/70 backdrop-blur-sm"
        >
          <div className="p-6 sticky top-0">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="mb-8 px-4">
                <Link href="/">
                  <Image
                    src="/Soundspal.svg"
                    alt="Soundspal Logo"
                    width={120}
                    height={32}
                    className="h-8 w-auto"
                  />
                </Link>
              </div>
            </motion.div>

            <nav className="space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const active = isActive(item.href, item.exact)

                return (
                  <motion.div
                    key={item.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        'hover:bg-primary/10 hover:translate-x-1',
                        active
                          ? 'bg-primary/15 text-primary font-medium shadow-sm border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className={cn('w-5 h-5', active && 'text-primary')} />
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            {/* Mock Data Indicator - Subtle corner badge */}
            {process.env.NEXT_PUBLIC_USE_MOCK_ADMIN_DATA === 'true' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-8 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Mock Data Mode
                </p>
                <p className="text-xs text-muted-foreground mt-1">Using test data</p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg  bg-primary/15 p-1 text-light-100 lg:justify-start lg:p-3 text-primary font-medium border border-primary/20">
                <div className="relative h-9 w-9 rounded-full p-0 hover:opacity-80">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={user?.avatar_url ? resolveMediaUrl(user.avatar_url) : undefined}
                      alt={user?.display_name || user?.username || 'User'}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.display_name?.charAt(0).toUpperCase() ||
                        user?.username?.charAt(0).toUpperCase() ||
                        'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="hidden lg:block">
                  <p className="text-[14px] font-semibold leading-[20px] capitalize">
                    {user?.display_name}
                  </p>
                  <p className="text-[12px] font-normal leading-[16px]">{user?.email}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
