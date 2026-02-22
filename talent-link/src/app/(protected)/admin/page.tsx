'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Briefcase, ArrowRight } from 'lucide-react'
import { adminService } from '@/services/adminService'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

export default function AdminDashboardPage() {
  const t = useTranslations('Admin')
  const [stats, setStats] = useState({
    totalFeaturedUsers: 0,
    totalFeaturedJobs: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, jobsRes] = await Promise.all([
          adminService.listFeaturedUsers({ limit: 1, offset: 0 }),
          adminService.listFeaturedJobs({ limit: 1, offset: 0 }),
        ])

        setStats({
          totalFeaturedUsers: usersRes.data.total,
          totalFeaturedJobs: jobsRes.data.total,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
        </div>
        <p className="text-muted-foreground text-md">{t('dashboard.subtitle')}</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeInUp}>
          <Card className="border-border/50 bg-card/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {loading ? '...' : stats.totalFeaturedUsers}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('stats.total')}</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('stats.featuredUsers')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('stats.usersDescription')}</p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full group-hover:bg-primary/10 transition-colors"
              >
                <Link
                  href="/admin/featured-users"
                  className="flex items-center justify-center gap-2"
                >
                  {t('manageUsers')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="border-border/50 bg-card/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <Briefcase className="w-7 h-7 text-primary" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {loading ? '...' : stats.totalFeaturedJobs}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('stats.total')}</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('stats.featuredJobs')}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t('stats.jobsDescription')}</p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full group-hover:bg-primary/10 transition-colors"
              >
                <Link
                  href="/admin/featured-jobs"
                  className="flex items-center justify-center gap-2"
                >
                  {t('manageJobs')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="border-border/50 bg-linear-to-br from-muted/50 to-muted/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              {t('quickGuide.title')}
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card/70 transition-colors">
                <span className="text-primary text-lg">•</span>
                <span>{t('quickGuide.featuredUsersGuide')}</span>
              </li>
              <li className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card/70 transition-colors">
                <span className="text-primary text-lg">•</span>
                <span>{t('quickGuide.featuredJobsGuide')}</span>
              </li>
              <li className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card/70 transition-colors">
                <span className="text-primary text-lg">•</span>
                <span>{t('quickGuide.recommendedMax')}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
