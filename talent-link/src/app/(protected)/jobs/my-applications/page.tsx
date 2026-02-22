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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import { jobService } from '@/services/jobService'
import type { MySubmissionItem, SubmissionDetailResponse } from '@/types/job'
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCcw,
  ExternalLink,
  FileText,
  Eye,
} from 'lucide-react'

type StatusFilter = 'all' | 'pending_review' | 'under_review' | 'accepted' | 'rejected'

const statusBadgeConfig: Record<
  string,
  {
    variant: 'default' | 'secondary' | 'outline' | 'destructive'
    label: string
    icon: React.ReactNode
  }
> = {
  pending_review: {
    variant: 'secondary',
    label: 'Pending Review',
    icon: <Clock className="w-3 h-3" />,
  },
  under_review: {
    variant: 'default',
    label: 'Under Review',
    icon: <Clock className="w-3 h-3" />,
  },
  accepted: {
    variant: 'default',
    label: 'Accepted',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  rejected: {
    variant: 'destructive',
    label: 'Rejected',
    icon: <XCircle className="w-3 h-3" />,
  },
  skipped: {
    variant: 'outline',
    label: 'Skipped',
    icon: <FileText className="w-3 h-3" />,
  },
  withdrawn: {
    variant: 'outline',
    label: 'Withdrawn',
    icon: <FileText className="w-3 h-3" />,
  },
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// const getStatusBadge = (status: string) => {
//   const config = statusBadgeConfig[status] || {
//     variant: 'outline' as const,
//     label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
//     icon: <FileText className="w-3 h-3" />,
//   }
//   return (
//     <Badge variant={config.variant} className="gap-1.5">
//       {config.icon}
//       {config.label}
//     </Badge>
//   )
// }

const MyApplicationsPage = () => {
  const router = useRouter()
  const t = useTranslations('MyApplications')
  const tDetail = useTranslations('JobDetail')
  const tCommon = useTranslations('Common')
  const [submissions, setSubmissions] = useState<MySubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    total: number
    pending: number
    accepted: number
    rejected: number
  }>({ total: 0, pending: 0, accepted: 0, rejected: 0 })
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingSubmission, setViewingSubmission] = useState<SubmissionDetailResponse | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const fetchSubmissions = useCallback(async () => {
    setError(null)
    try {
      const response = await jobService.getMySubmissions()
      setSubmissions(response.submissions ?? [])
      setStats({
        total: response.total ?? 0,
        pending: response.pending_count ?? 0,
        accepted: response.accepted_count ?? 0,
        rejected: response.rejected_count ?? 0,
      })
    } catch (err) {
      console.error('Failed to load submissions', err)
      setError(t('error.loadFailed'))
      toast.error(t('error.toast'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === 'all') return submissions
    return submissions.filter((sub) => sub.status === statusFilter)
  }, [submissions, statusFilter])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSubmissions()
  }

  const handleViewJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  const handleViewSubmission = async (submissionId: string) => {
    setViewDialogOpen(true)
    setViewLoading(true)
    setViewingSubmission(null)
    try {
      const detail = await jobService.getSubmissionById(submissionId)
      setViewingSubmission(detail)
    } catch (err) {
      console.error('Failed to load submission detail', err)
      toast.error(tCommon('error'))
      setViewDialogOpen(false)
    } finally {
      setViewLoading(false)
    }
  }

  const getStatusBadgeLocal = (status: string) => {
    const config = statusBadgeConfig[status] || {
      variant: 'outline' as const,
      label: status,
      icon: <FileText className="w-3 h-3" />,
    }
    return (
      <Badge variant={config.variant} className="gap-1.5">
        {config.icon}
        {t('tabs.' + status)}
      </Badge>
    )
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
              <p className="text-muted-foreground max-w-2xl">{t('subtitle')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full bg-linear-to-br from-muted/50 via-muted/30 to-muted/40 relative">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6 py-8 md:py-12 relative z-10">
          <div className="flex justify-between w-full mb-6">
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

          {/* Stats Summary */}
          {!loading && stats.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">{t('stats.total')}</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">{t('stats.pending')}</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">{t('stats.accepted')}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">{t('stats.rejected')}</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-border/60 bg-card/80 shadow-lg backdrop-blur-sm">
            <CardContent className="p-0">
              <Tabs
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <div className="flex flex-col gap-4 border-b border-border/60 p-4 md:flex-row md:items-center md:justify-between">
                  <TabsList className="grid w-full max-w-md grid-cols-4">
                    <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
                    <TabsTrigger value="pending_review">{t('tabs.pending_review')}</TabsTrigger>
                    {/* <TabsTrigger value="under_review">Reviewing</TabsTrigger> */}
                    <TabsTrigger value="accepted">{t('tabs.accepted')}</TabsTrigger>
                    <TabsTrigger value="rejected">{t('tabs.rejected')}</TabsTrigger>
                  </TabsList>
                  <p className="text-sm text-muted-foreground">
                    {t('summary.count', { count: filteredSubmissions.length })}
                  </p>
                </div>

                <TabsContent value={statusFilter} className="m-0">
                  {loading ? (
                    <div className="space-y-4 p-4 md:p-6">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-32 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : error ? (
                    <div className="p-10 text-center">
                      <p className="text-base text-muted-foreground mb-4">{error}</p>
                      <Button onClick={handleRefresh} disabled={refreshing}>
                        {tCommon('tryAgain')}
                      </Button>
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="p-10 text-center space-y-4">
                      <Briefcase className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold">{t('noApplications.title')}</h3>
                        <p className="text-muted-foreground">
                          {statusFilter === 'all'
                            ? t('noApplications.description')
                            : t('noApplications.filtered', {
                                status: t('tabs.' + statusFilter),
                              })}
                        </p>
                      </div>
                      <Button asChild>
                        <Link href="/jobs">{t('noApplications.exploreButton')}</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {filteredSubmissions.map((submission) => (
                        <div key={submission.id} className="p-4 md:p-6 space-y-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1">
                              {submission.job ? (
                                <>
                                  <h3 className="text-xl font-semibold mb-2">
                                    {submission.job.title}
                                  </h3>
                                </>
                              ) : (
                                <h3 className="text-xl font-semibold mb-2">
                                  {t('jobUnavailable')}
                                </h3>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-3 mt-2">
                                  {getStatusBadgeLocal(submission.status)}
                                  <span className="text-xs text-muted-foreground">
                                    {tDetail('postedOn', {
                                      date: formatDate(submission.created_at),
                                    })}
                                  </span>
                                  {submission.reviewed_at && (
                                    <span className="text-xs text-muted-foreground">
                                      •{' '}
                                      {tDetail('updatedOn', {
                                        timeAgo: formatDate(submission.reviewed_at),
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {submission.rejection_reason && (
                            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                              <p className="text-sm font-medium text-destructive mb-1">
                                {t('rejectionReasonTitle')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {submission.rejection_reason}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3 pt-2">
                            {submission.job && (
                              <Button
                                variant="ghost"
                                onClick={() => handleViewJob(submission.job!.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t('actions.viewJob')}
                              </Button>
                            )}
                            <Button variant="outline" asChild>
                              <span
                                onClick={() => handleViewSubmission(submission.id)}
                                className="flex items-center"
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                {t('actions.viewApplication')}
                              </span>
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

      {/* Submission Detail Dialog */}
      <Dialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open)
          if (!open) {
            setViewingSubmission(null)
            setViewLoading(false)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('dialog.title')}</DialogTitle>
            <DialogDescription>{t('dialog.description')}</DialogDescription>
          </DialogHeader>

          {viewLoading ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{tCommon('loading')}</p>
            </div>
          ) : viewingSubmission ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{viewingSubmission.full_name || 'You'}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {viewingSubmission.email && <span>{viewingSubmission.email}</span>}
                    {viewingSubmission.phone_number && (
                      <span>{viewingSubmission.phone_number}</span>
                    )}
                    <span>
                      {t('dialog.appliedOn', {
                        date: formatDate(viewingSubmission.created_at),
                      })}
                    </span>
                  </div>
                </div>
                {getStatusBadgeLocal(viewingSubmission.status)}
              </div>

              {viewingSubmission.review_notes && (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                  <p className="text-xs uppercase text-muted-foreground mb-1">
                    {t('dialog.reviewNotes')}
                  </p>
                  <p className="text-sm text-foreground">{viewingSubmission.review_notes}</p>
                </div>
              )}

              {viewingSubmission.cover_letter && (
                <div className="space-y-2">
                  <p className="text-xs uppercase text-muted-foreground">
                    {t('dialog.coverLetter')}
                  </p>
                  <p className="text-sm leading-relaxed">{viewingSubmission.cover_letter}</p>
                </div>
              )}

              {viewingSubmission.portfolio_links &&
                viewingSubmission.portfolio_links.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase text-muted-foreground">
                      {t('dialog.portfolio')}
                    </p>
                    <div className="flex flex-col gap-1">
                      {viewingSubmission.portfolio_links.map((link) => (
                        <Link
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {link}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                <p className="text-xs uppercase text-muted-foreground">{t('dialog.demoFile')}</p>
                <Link
                  href={viewingSubmission.demo_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('dialog.viewDemo')}
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('dialog.noDetails')}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MyApplicationsPage
