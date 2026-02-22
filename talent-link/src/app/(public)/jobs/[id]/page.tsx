import { ArrowLeft, MapPin, Calendar, Briefcase, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { jobService } from '@/services/jobService'
import { resolveMediaUrl } from '@/lib/utils'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import JobInteractions from '@/components/jobs/JobInteractions'
import { Metadata } from 'next'
import { JobPost } from '@/types/job'

interface JobWithCreator extends JobPost {
  creator_display_name?: string
  creator_avatar_url?: string
  creator_username?: string
}

// Helper functions (moved outside component)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTimeAgo = (dateString: string, t: any) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  if (diffInMinutes < 60) {
    return diffInMinutes === 1
      ? t('timeAgo.minute', { count: 1 })
      : t('timeAgo.minutes', { count: diffInMinutes })
  }
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return diffInHours === 1
      ? t('timeAgo.hour', { count: 1 })
      : t('timeAgo.hours', { count: diffInHours })
  }
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 0) return t('today')
  if (diffInDays === 1) return t('yesterday')
  if (diffInDays < 7) return t('timeAgo.days', { count: diffInDays })
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return weeks === 1 ? t('timeAgo.week', { count: 1 }) : t('timeAgo.weeks', { count: weeks })
  }
  const months = Math.floor(diffInDays / 30)
  return months === 1 ? t('timeAgo.month', { count: 1 }) : t('timeAgo.months', { count: months })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatSalary = (job: JobWithCreator, tOptions: any, t: any) => {
  if (job.budget_min && job.budget_max && job.budget_currency && job.payment_type) {
    const formatNumber = (num: number) => {
      if (job.budget_currency === 'VND') {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0,
        }).format(num)
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: job.budget_currency,
        maximumFractionDigits: 0,
      }).format(num)
    }

    type PaymentType = NonNullable<JobWithCreator['payment_type']>
    const periodMap: Record<PaymentType, string> = {
      bySession: tOptions('payment.bySession'),
      byHour: tOptions('payment.byHour'),
      byProject: tOptions('payment.byProject'),
      byMonth: tOptions('payment.byMonth'),
    }

    const paymentType = job.payment_type
    if (!paymentType) return ''

    const range = `${formatNumber(job.budget_min)} - ${formatNumber(job.budget_max)}`
    return `${range} / ${periodMap[paymentType]}${job.is_negotiable ? ` (${t('negotiable')})` : ''}`
  }
  return ''
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const job = (await jobService.getJobById(id, 'assets,tags')) as JobWithCreator
    if (!job) return { title: 'Job Not Found' }

    return {
      title: `${job.title}`,
      description: job.brief_description || job.description?.slice(0, 160),
      openGraph: {
        title: job.title,
        description: job.brief_description || job.description?.slice(0, 160),
        images: job.creator_avatar_url ? [resolveMediaUrl(job.creator_avatar_url)] : [],
      },
    }
  } catch (error) {
    return { title: 'Job Detail' }
  }
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTranslations('JobDetail')
  const tCommon = await getTranslations('Common')
  const tOptions = await getTranslations('options')

  let job: JobWithCreator | null = null
  let error: string | null = null

  try {
    if (!id) throw new Error('Invalid Job ID')
    job = (await jobService.getJobById(id, 'assets,tags')) as JobWithCreator
  } catch (e) {
    error = e instanceof Error ? e.message : t('jobNotFoundDesc')
  }

  if (error || !job) {
    return (
      <div className="min-h-[70vh] w-full relative flex items-center justify-center">
        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6">
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <h2 className="text-2xl font-bold">{t('jobNotFound')}</h2>
            <p className="text-muted-foreground">{error || t('jobNotFoundDesc')}</p>
            <Button asChild variant="outline">
              <Link href="/jobs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToJobs')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.created_at,
    validThrough: job.deadline || job.submission_deadline,
    employmentType: job.recruitment_type?.toUpperCase().replace('-', '_'),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.creator_display_name || 'Confidential',
      sameAs: job.creator_username
        ? `${process.env.NEXT_PUBLIC_APP_URL}/profile/${job.creator_username}`
        : undefined,
      logo: job.creator_avatar_url ? resolveMediaUrl(job.creator_avatar_url) : undefined,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Vietnam',
        addressCountry: 'VN',
      },
    },
    baseSalary:
      job.budget_min && job.budget_max
        ? {
            '@type': 'MonetaryAmount',
            currency: job.budget_currency || 'VND',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.budget_min,
              maxValue: job.budget_max,
              unitText: job.payment_type === 'byHour' ? 'HOUR' : 'MONTH',
            },
          }
        : undefined,
  }

  return (
    <div className="min-h-screen relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Full-width background wrapper */}
      <div className="w-full min-h-screen bg-linear-to-br from-muted/50 via-muted/30 to-muted/40 relative">
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        {/* Decorative blur orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6 pt-24 pb-8 md:pt-28 md:pb-10 relative z-10">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/jobs">
              {/* Note: Original used router.back(), which is client-side. Link to /jobs is a safe server-side fallback/replacement, or we can use a client component for a back button if strictly needed. Preferring implicit link to list for SSR friendliness. */}
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  {/* Company Header */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center sm:items-start">
                    <Link
                      href={job.creator_username ? `/profile/${job.creator_username}` : '#'}
                      className="shrink-0 cursor-pointer"
                    >
                      <Avatar className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-border hover:border-primary transition-colors">
                        <AvatarImage
                          src={resolveMediaUrl(job.creator_avatar_url)}
                          alt={job.creator_display_name || 'Unknown'}
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                          {(job.creator_display_name || tCommon('unknown'))
                            .split(' ')
                            .map((word) => word[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 text-center sm:text-left">
                      <h1 className="text-2xl sm:text-3xl font-bold mb-2">{job.title}</h1>
                      <Link
                        href={job.creator_username ? `/profile/${job.creator_username}` : '#'}
                        className="text-lg text-muted-foreground font-medium hover:underline hover:text-primary transition-colors"
                      >
                        {job.creator_display_name || tCommon('unknown')}
                      </Link>
                    </div>
                  </div>

                  {/* Job Meta */}
                  <div className="flex flex-wrap gap-4 mb-6 text-sm">
                    {job.recruitment_type && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize">
                          {tOptions(`employment.${job.recruitment_type}`)}
                        </span>
                      </div>
                    )}
                    {(job.location || job.location_type) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {job.location
                            ? job.location_type
                              ? `${job.location} (${job.location_type})`
                              : job.location
                            : job.location_type || t('remote')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-primary">
                        {formatSalary(job, tOptions, t)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{getTimeAgo(job.created_at, t)}</span>
                    </div>
                  </div>

                  {/* Genres */}
                  {job.genres && job.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {job.genres.map((genre, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Separator className="my-6" />

                  {/* Description */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">{t('descriptionTitle')}</h2>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>

                  {/* Work Time / Schedule */}
                  {job.work_time && (
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-3">{t('schedule')}</h2>
                      <p className="text-foreground/80">{job.work_time}</p>
                    </div>
                  )}

                  {/* Required Skills */}
                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-3">{t('requiredSkills')}</h2>
                      <ul className="space-y-2">
                        {job.required_skills.map((skill, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="text-foreground/80">{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Benefits */}
                  {job.benefits && job.benefits.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-3">{t('benefits')}</h2>
                      <ul className="space-y-2">
                        {job.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span className="text-foreground/80">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Additional Info */}
                  {(job.experience_level ||
                    job.recruitment_type ||
                    job.deadline ||
                    job.submission_deadline) && (
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-3">{t('additionalInfo')}</h2>
                      <div className="space-y-2 text-sm">
                        {job.experience_level && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('experienceLevel')}:</span>
                            <span className="font-medium capitalize">
                              {tOptions(`experience.${job.experience_level}`)}
                            </span>
                          </div>
                        )}
                        {job.recruitment_type && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('employmentType')}:</span>
                            <span className="font-medium capitalize">
                              {tOptions(`employment.${job.recruitment_type}`)}
                            </span>
                          </div>
                        )}
                        {job.deadline && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('projectDeadline')}:</span>
                            <span className="font-medium">
                              {new Date(job.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {job.submission_deadline && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {t('applicationDeadline')}:
                            </span>
                            <span className="font-medium">
                              {new Date(job.submission_deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Interactive Sidebar (Client Component) */}
            <JobInteractions job={job} />
          </div>
        </div>
      </div>
    </div>
  )
}
