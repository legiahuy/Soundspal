'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'
import { jobService } from '@/services/jobService'
import type { JobPost } from '@/types/job'
import { ArrowLeft, Briefcase, Eye, ExternalLink, RefreshCcw, Users, Edit } from 'lucide-react'

type StatusFilter = 'all' | 'draft' | 'published' | 'closed'

const statusBadges: Record<JobPost['status'], 'default' | 'secondary' | 'outline' | 'destructive'> =
  {
    draft: 'secondary',
    published: 'default',
    closed: 'outline',
    completed: 'outline',
    cancelled: 'destructive',
  }

const formatDate = (value?: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const MyJobPostsPage = () => {
  const router = useRouter()
  const t = useTranslations('MyPosts')
  // const tDetail = useTranslations('JobDetail')
  const tCommon = useTranslations('Common')
  const tOptions = useTranslations('options')
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    setError(null)
    try {
      const response = await jobService.getMyJobs()
      setJobs(response.posts ?? [])
    } catch (err) {
      console.error('Failed to load jobs', err)
      setError('Unable to load your jobs right now.')
      toast.error('Unable to load your jobs.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const filteredJobs = useMemo(() => {
    if (statusFilter === 'all') return jobs
    return jobs.filter((job) => job.status === statusFilter)
  }, [jobs, statusFilter])

  // const emptyState = useMemo(() => {
  //   switch (statusFilter) {
  //     case 'draft':
  //       return {
  //         title: 'No drafts yet',
  //         description: 'Start a post and save it as a draft to finish later.',
  //       }
  //     case 'published':
  //       return {
  //         title: 'No published jobs',
  //         description: 'Publish a job to start receiving applications from artists.',
  //       }
  //     case 'closed':
  //       return {
  //         title: 'No closed jobs',
  //         description: 'Jobs you close will appear here for your records.',
  //       }
  //     default:
  //       return {
  //         title: 'No jobs here yet',
  //         description: 'Post your first job to start receiving applications from artists.',
  //       }
  //   }
  // }, [statusFilter])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchJobs()
  }

  const handleViewJob = (id: string) => {
    router.push(`/jobs/${id}`)
  }

  return (
    <div className="min-h-screen relative">
      <section className="relative border-b pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden bg-linear-to-br from-primary/15 via-primary/8 to-primary/5">
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-primary/10 to-transparent animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-primary/70 to-transparent animate-shimmer" />
        <div className="absolute top-10 left-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute top-20 right-20 w-52 h-52 bg-primary/25 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-10 left-1/3 w-44 h-44 bg-primary/20 rounded-full blur-3xl animate-float-slow" />

        <div className="relative mx-auto w-full max-w-[1320px] px-4 md:px-6 z-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3 text-foreground">
              <p className="text-sm uppercase tracking-wider text-muted-foreground">{t('title')}</p>
              <h1 className="text-3xl md:text-4xl font-semibold">{t('title')}</h1>
              <p className="text-muted-foreground max-w-2xl">
                Track performance, check applications, and keep your listings up to date. Candidates
                only see published jobs.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild size="lg">
                <Link href="/jobs/post">{t('createJob')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full bg-linear-to-br from-muted/50 via-muted/30 to-muted/40 relative">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6 py-8 md:py-12 relative z-10">
          <div className="flex justify-between w-full">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {tCommon('back')}
            </Button>
            <Button
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="justify-start gap-2"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? tCommon('loading') : tCommon('tryAgain')}
            </Button>
          </div>
          <Card className="border-border/60 bg-card/80 shadow-lg backdrop-blur-sm">
            <CardContent className="p-0">
              <Tabs
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <div className="flex flex-col gap-4 border-b border-border/60 p-4 md:flex-row md:items-center md:justify-between">
                  <TabsList className="grid w-full max-w-md grid-cols-4">
                    <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
                    <TabsTrigger value="published">{t('tabs.published')}</TabsTrigger>
                    <TabsTrigger value="draft">{t('tabs.drafts')}</TabsTrigger>
                    <TabsTrigger value="closed">{t('tabs.closed')}</TabsTrigger>
                  </TabsList>
                  <p className="text-sm text-muted-foreground">
                    {filteredJobs.length} {filteredJobs.length === 1 ? 'listing' : 'listings'}
                  </p>
                </div>

                <TabsContent value={statusFilter} className="m-0">
                  {loading ? (
                    <div className="space-y-4 p-4 md:p-6">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-40 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : error ? (
                    <div className="p-10 text-center">
                      <p className="text-base text-muted-foreground mb-4">{error}</p>
                      <Button onClick={handleRefresh} disabled={refreshing}>
                        Try again
                      </Button>
                    </div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="p-10 text-center space-y-4">
                      <Briefcase className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold">
                          {t(`noPosts.title`, { status: statusFilter })}
                        </h3>
                        <p className="text-muted-foreground">{t('noPosts.description')}</p>
                      </div>
                      <Button asChild>
                        <Link href="/jobs/post">{t('createJob')}</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {filteredJobs.map((job) => (
                        <div key={job.id} className="p-4 md:p-6 space-y-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                  {tOptions(`postTypes.${job.post_type}`)}
                                </Badge>
                                {job.genres && job.genres.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {job.genres.slice(0, 2).join(', ')}
                                    {job.genres.length > 2 ? ` +${job.genres.length - 2}` : ''}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xl font-semibold mt-2">{job.title}</h3>
                              {job.brief_description && (
                                <p className="text-sm text-muted-foreground">
                                  {job.brief_description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge variant={statusBadges[job.status] ?? 'outline'}>
                                {job.status === 'draft'
                                  ? t('tabs.drafts')
                                  : t(`tabs.${job.status}`)}
                              </Badge>
                              <Badge variant="secondary" className="capitalize">
                                {job.recruitment_type?.replace('_', ' ') ?? 'Flexible'}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Posted</p>
                              <p className="font-medium">
                                {formatDate(job.published_at || job.created_at)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">
                                Compensation
                              </p>
                              <p className="font-medium">
                                {job.budget_min
                                  ? `${job.budget_currency ?? ''} ${job.budget_min.toLocaleString()}`
                                  : 'Negotiable'}
                                {job.budget_max
                                  ? ` - ${job.budget_currency ?? ''} ${job.budget_max.toLocaleString()}`
                                  : ''}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {job.payment_type?.replace('by', 'per ') ?? 'per session'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">
                                Applications
                              </p>
                              <p className="font-medium flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {job.total_submissions ?? job.applications_count ?? 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Deadline</p>
                              <p className="font-medium">{formatDate(job.submission_deadline)}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 pt-2">
                            <Button variant="ghost" onClick={() => handleViewJob(job.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View listing
                            </Button>
                            <Button variant="outline" asChild>
                              <Link href={`/jobs/${job.id}/applications`}>
                                <Users className="mr-2 h-4 w-4" />
                                View applicants
                              </Link>
                            </Button>
                            <Button variant="outline" asChild>
                              <Link href={`/jobs/${job.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                navigator.clipboard
                                  .writeText(`${window.location.origin}/jobs/${job.id}`)
                                  .then(() => toast.success('Link copied to clipboard'))
                                  .catch(() => toast.error('Unable to copy link'))
                              }}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Share link
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default MyJobPostsPage
