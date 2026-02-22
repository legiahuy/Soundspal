'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, Variants } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Briefcase, User as UserIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ArtistCard from '@/components/artist/ArtistCard'
import JobCard from '@/components/jobs/JobCard'
import { searchService } from '@/services/searchService'
import { useTranslations } from 'next-intl'
import { analytics } from '@/lib/analytics'
import { resolveMediaUrl } from '@/lib/utils'
import type {
  JobPostSearchDto,
  JobSearchResultDto,
  UserSearchDto,
  UserSearchResultDto,
} from '@/types/search'
import type { JobPost } from '@/types/job'
import { useSavedJobs } from '@/hooks/useSavedJobs'

export default function SearchPage() {
  const t = useTranslations('SearchPage')
  const tOptions = useTranslations('options')
  const tCommon = useTranslations('Common')
  const searchParams = useSearchParams()
  const { isJobSaved, toggleSave } = useSavedJobs()
  const initialQuery = searchParams.get('query') || ''
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [jobs, setJobs] = useState<JobSearchResultDto | null>(null)
  const [users, setUsers] = useState<UserSearchResultDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'jobs' | 'users'>('all')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  }

  const staggerContainer: Variants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  // Debounce query input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  // Fetch data when debounced query changes
  useEffect(() => {
    const q = debouncedQuery.trim()

    // Update URL to match search query
    // Use replace to avoid history stack overflow while typing
    if (q !== initialQuery) {
      const newUrl = q ? `/search?query=${encodeURIComponent(q)}` : '/search'
      router.replace(newUrl, { scroll: false })
    }

    if (!q) {
      setJobs(null)
      setUsers(null)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await searchService.searchAll(q)
        setJobs(result.jobs)
        setUsers(result.users)

        // Track search event
        analytics.logSearch(q, 'all').catch(console.error)
        analytics
          .logViewSearchResults(q, result.jobs.totalCount + result.users.totalCount, 'all')
          .catch(console.error)
      } catch (err) {
        console.error(err)
        setError(t('error'))
        // Track search error
        analytics
          .logError('search_error', err instanceof Error ? err.message : 'Unknown error', '/search')
          .catch(console.error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [debouncedQuery, t]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync query state with URL search params (handle back/forward navigation)
  useEffect(() => {
    // Only update if the URL query is different from current state
    // AND different from the debounced query we just set (to avoid race conditions while typing)
    if (initialQuery !== query && initialQuery !== debouncedQuery) {
      setQuery(initialQuery)
      setDebouncedQuery(initialQuery)
    }
  }, [initialQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    setDebouncedQuery(query)
  }

  // Map API response to JobPost — API returns snake_case; camelCase as fallback for search service
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapJobSearchToJobPost = (job: any): JobPost => {
    return {
      id: job.id,
      title: job.title,
      description: job.description ?? '',
      brief_description: job.brief_description ?? undefined,
      post_type: (job.post_type ?? job.postType) as 'job_offer' | 'gig' | 'availability',
      type: job.type as 'producer' | 'singer' | 'venue' | undefined,
      status: job.status as 'draft' | 'published' | 'closed' | 'completed' | 'cancelled',
      visibility: job.visibility as 'public' | 'private' | 'invite_only',
      creator_id: job.creator_id ?? job.creatorId,
      creator_role: job.creator_role ?? job.creatorRole,
      creator_display_name: job.creator_display_name ?? job.creatorDisplayName,
      creator_username: job.creator_username ?? job.creatorUsername,
      creator_avatar: job.creator_avatar_url ?? job.creatorAvatarUrl,
      location: job.location ?? job.locationText,
      location_type: (job.location_type ?? job.locationType) as
        | 'remote'
        | 'onsite'
        | 'hybrid'
        | undefined,
      budget_min: job.budget_min ?? job.budgetMin,
      budget_max: job.budget_max ?? job.budgetMax,
      budget_currency: (job.budget_currency ?? job.budgetCurrency) as
        | 'USD'
        | 'EUR'
        | 'JPY'
        | 'VND'
        | undefined,
      payment_type: (job.payment_type ?? job.paymentType) as
        | 'bySession'
        | 'byHour'
        | 'byProject'
        | 'byMonth'
        | undefined,
      recruitment_type: (job.recruitment_type ?? job.recruitmentType) as
        | 'full_time'
        | 'part_time'
        | 'contract'
        | 'one_time'
        | undefined,
      experience_level: (job.experience_level ?? job.experienceLevel) as
        | 'beginner'
        | 'intermediate'
        | 'expert'
        | 'any'
        | undefined,
      required_skills: job.required_skills ?? job.requiredSkills,
      genres: job.genres,
      benefits: job.benefits,
      submission_deadline: job.deadline,
      created_at: job.createdAt,
      updated_at: job.updatedAt,
      published_at: job.publishedAt,
      closed_at: job.closedAt,
      total_submissions: job.applicationsCount,
      applications_count: job.applicationsCount,
      bookings_count: job.bookingsCount,
      views_count: job.viewsCount,
    }
  }

  const handleViewJobDetails = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  const renderJobs = (items?: JobPostSearchDto[]) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground">{t('jobs.noResults')}</p>
        </div>
      )
    }

    return (
      <motion.div
        className="grid gap-6 grid-cols-1"
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        {items.map((job) => {
          const jobPost = mapJobSearchToJobPost(job)
          return (
            <motion.div key={job.id} variants={fadeInUp}>
              <Link href={`/jobs/${job.id}`} className="block cursor-pointer">
                <div className="[&_button[aria-label*='bookmark']]:hidden [&_button[aria-label*='Save']]:hidden [&_button[aria-label*='Remove']]:hidden [&>div>div:last-child]:hidden">
                  <JobCard
                    job={jobPost}
                    onViewDetails={handleViewJobDetails}
                    onToggleSave={toggleSave}
                    isSaved={isJobSaved(jobPost.id)}
                  />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    )
  }

  const renderUsers = (items?: UserSearchDto[]) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground">{t('users.noResults')}</p>
        </div>
      )
    }

    return (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        {items.map((user) => (
          <motion.div key={user.id} variants={fadeInUp} className="h-full">
            <ArtistCard
              id={user.id}
              name={user.displayName || user.username}
              username={user.username}
              image={
                user.avatarUrl
                  ? resolveMediaUrl(user.avatarUrl)
                  : '/images/artist/default-avatar.jpeg'
              }
              genres={
                user.genres?.map((g: { name?: string } | string) =>
                  typeof g === 'string' ? g : g.name || '',
                ) || []
              }
              location={user.location || tCommon('unknown')}
              description={user.briefBio}
              roleLabel={tOptions(`roles.${user.role}`)}
            />
          </motion.div>
        ))}
      </motion.div>
    )
  }

  const availableGenres = useMemo(() => {
    const set = new Set<string>()
    if (jobs?.jobPosts) {
      jobs.jobPosts.forEach((job) => {
        job.genres?.forEach((genre) => {
          if (genre) set.add(genre)
        })
      })
    }
    if (users?.userProfiles) {
      users.userProfiles.forEach((u) => {
        u.genres?.forEach((g) => {
          if (g?.name) set.add(g.name)
        })
      })
    }
    return Array.from(set).sort()
  }, [jobs, users])

  return (
    <div className="min-h-screen relative pb-20">
      {/* Hero Section - reuse Discovery style */}
      <section className="relative border-b pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden bg-linear-to-br from-primary/15 via-primary/8 to-primary/5">
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-primary/10 to-transparent animate-pulse" />
        <div
          className="absolute inset-0 opacity-30 animate-[gridMove_8s_linear_infinite]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        <div className="absolute top-10 left-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute top-20 right-20 w-52 h-52 bg-primary/25 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-10 left-1/3 w-44 h-44 bg-primary/20 rounded-full blur-3xl animate-float-slow" />

        <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-primary/70 to-transparent animate-shimmer" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-primary/50 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1320px] px-4 md:px-6 z-10">
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight relative">
              <span className="relative z-10">{t('title')}</span>
              <span className="absolute inset-0 bg-linear-to-r from-primary/40 via-primary/30 to-primary/20 blur-2xl animate-pulse opacity-60" />
            </h1>

            {initialQuery && (
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed relative z-10 mb-6">
                {t('showingResults', { query: initialQuery })}
              </p>
            )}

            <div className="mt-10 w-full relative z-10">
              <form onSubmit={handleSubmit} className="relative group max-w-[1320px] mx-auto">
                <div className="relative flex items-center">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-primary/60 w-6 h-6 z-10 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-16 pr-44 h-16 text-xl bg-card/90 backdrop-blur-xl border-primary/20 focus:border-primary shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-full transition-all focus:ring-4 focus:ring-primary/10"
                  />
                  <div className="absolute right-2 top-2 bottom-2 flex items-center p-1">
                    <Button
                      type="submit"
                      size="lg"
                      className="h-full px-10 rounded-full font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground hover:shadow-primary/40"
                    >
                      {t('searchButton')}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="w-full bg-linear-to-br from-muted/50 via-muted/30 to-muted/40 relative">
        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6 py-8 md:py-10 relative z-10">
          {error && <p className="text-destructive mb-4">{error}</p>}
          {loading && <p className="text-muted-foreground mb-4">{t('loading')}</p>}

          {!loading && !error && (
            <div className="w-full relative">
              {/* Main Content with Tabs */}
              <div className="w-full">
                <Tabs
                  value={activeTab}
                  onValueChange={(val) => setActiveTab(val as 'all' | 'jobs' | 'users')}
                >
                  <div className="flex items-center justify-between mb-8">
                    <TabsList className="bg-muted/60 p-1.5 h-12 inline-flex shrink-0 border border-border/40">
                      <TabsTrigger
                        value="all"
                        className="px-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md font-semibold"
                      >
                        {t('tabs.all')}
                      </TabsTrigger>
                      <TabsTrigger
                        value="jobs"
                        className="px-8 rounded-lg gap-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md font-semibold"
                      >
                        <Briefcase className="w-4 h-4" />
                        {t('tabs.jobs')}
                      </TabsTrigger>
                      <TabsTrigger
                        value="users"
                        className="px-8 rounded-lg gap-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md font-semibold"
                      >
                        <UserIcon className="w-4 h-4" />
                        {t('tabs.users')}
                      </TabsTrigger>
                    </TabsList>
                    <div className="text-sm text-muted-foreground hidden sm:block font-medium bg-card/30 px-3 py-1.5 rounded-full border border-border/50">
                      {activeTab === 'all'
                        ? (jobs?.jobPosts.length ?? 0) + (users?.userProfiles.length ?? 0)
                        : activeTab === 'jobs'
                          ? (jobs?.jobPosts.length ?? 0)
                          : (users?.userProfiles.length ?? 0)}{' '}
                      {tCommon('results')}
                    </div>
                  </div>

                  <TabsContent value="all" className="mt-0 space-y-10 focus-visible:outline-none">
                    {(!users?.userProfiles || users.userProfiles.length === 0) &&
                    (!jobs?.jobPosts || jobs.jobPosts.length === 0) ? (
                      <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-2xl bg-card/20 backdrop-blur-sm">
                        <p className="text-muted-foreground text-lg">{tCommon('noResults')}</p>
                      </div>
                    ) : (
                      <>
                        {users?.userProfiles && users.userProfiles.length > 0 && (
                          <section>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="bg-primary/10 p-2.5 rounded-xl shadow-inner">
                                <UserIcon className="h-5 w-5 text-primary" />
                              </div>
                              <h3 className="text-2xl font-bold tracking-tight">
                                {t('users.title')}
                              </h3>
                              <Badge
                                variant="secondary"
                                className="rounded-full px-2.5 py-0.5 font-semibold"
                              >
                                {users.userProfiles.length}
                              </Badge>
                            </div>
                            {renderUsers(users.userProfiles)}
                          </section>
                        )}

                        {jobs?.jobPosts && jobs.jobPosts.length > 0 && (
                          <section>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="bg-primary/10 p-2.5 rounded-xl shadow-inner">
                                <Briefcase className="h-5 w-5 text-primary" />
                              </div>
                              <h3 className="text-2xl font-bold tracking-tight">
                                {t('jobs.title')}
                              </h3>
                              <Badge
                                variant="secondary"
                                className="rounded-full px-2.5 py-0.5 font-semibold"
                              >
                                {jobs.jobPosts.length}
                              </Badge>
                            </div>
                            {renderJobs(jobs.jobPosts)}
                          </section>
                        )}
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="jobs" className="mt-0 focus-visible:outline-none">
                    {renderJobs(jobs?.jobPosts)}
                  </TabsContent>

                  <TabsContent value="users" className="mt-0 focus-visible:outline-none">
                    {renderUsers(users?.userProfiles)}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
