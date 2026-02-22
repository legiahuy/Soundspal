'use client'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, Variants } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import JobCard from '@/components/jobs/JobCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Search, Plus, Briefcase, X, Sparkles, Loader2, Mic, Disc } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from 'next-intl'
import { jobService } from '@/services/jobService'
import { userService } from '@/services/userService'
import type { JobPost, JobSearchRequest, JobPostSearchDto } from '@/types/job'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import ApplicationDialog from '@/components/jobs/ApplicationDialog'

type JobType = 'all' | 'producer' | 'singer' | 'saved'

// Backend now returns creator_name, creator_username, creator_avatar directly
type JobWithCreator = JobPost

const SAVED_JOBS_KEY = 'talentlink_saved_jobs'

interface JobPoolClientProps {
  initialJobs: JobWithCreator[]
}

const JobPoolClient = ({ initialJobs = [] }: JobPoolClientProps) => {
  const router = useRouter()
  const t = useTranslations('JobPool')
  const tCommon = useTranslations('Common')
  const tDetail = useTranslations('JobDetail')
  const tOptions = useTranslations('options')

  // -- Search State --
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedLocationType, setSelectedLocationType] = useState<
    'all' | 'remote' | 'onsite' | 'hybrid'
  >('all')
  const [selectedExperience, setSelectedExperience] = useState<
    'all' | 'beginner' | 'intermediate' | 'expert' | 'any'
  >('all')
  const [selectedRecruitment, setSelectedRecruitment] = useState<
    'all' | 'full_time' | 'part_time' | 'contract' | 'one_time'
  >('all')
  const BUDGET_RANGE_DEFAULT: [number, number] = [0, 20000000]
  const [budgetRange, setBudgetRange] = useState<[number, number]>([...BUDGET_RANGE_DEFAULT])
  const [activeTab, setActiveTab] = useState<JobType>('all')
  const { savedJobs, toggleSave, isJobSaved } = useSavedJobs()

  // Initialize jobs with initialJobs
  const [jobs, setJobs] = useState<JobWithCreator[]>(initialJobs)
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  // Loading state:
  // If we have initialJobs and no filters changed yet, we might not need to show loading initially.
  // However, the original logic fetched on mount. We should respect initialJobs if provided.
  const [loading, setLoading] = useState(false)

  // Track if it's the first render to avoid double fetching if initialJobs are present
  const isFirstRender = useRef(true)

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Animations - optimized for faster display
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

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500) // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Fetch jobs from API using Search and Matching Service
  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      // Build search request
      const searchRequest: JobSearchRequest = {
        query: debouncedSearch.trim() || undefined,
        status: 'published', // Only show active jobs
        isActive: true,
        page: 1,
        pageSize: 20,
        sortBy: 'created_at',
        sortOrder: 'desc',
      }

      if (activeTab !== 'all' && activeTab !== 'saved') {
        searchRequest.type = activeTab
      }

      // Add genre filter
      if (selectedGenre !== 'all') {
        searchRequest.genres = [selectedGenre.toLowerCase()]
      }

      // Add location filter
      if (selectedLocation !== 'all') {
        searchRequest.location = selectedLocation
      }

      if (selectedLocationType !== 'all') {
        searchRequest.locationType = selectedLocationType
      }

      if (selectedExperience !== 'all') {
        searchRequest.experienceLevel = selectedExperience
      }

      if (selectedRecruitment !== 'all') {
        searchRequest.recruitmentType = selectedRecruitment
      }

      const isBudgetFiltered =
        budgetRange[0] > BUDGET_RANGE_DEFAULT[0] || budgetRange[1] < BUDGET_RANGE_DEFAULT[1]

      if (isBudgetFiltered) {
        searchRequest.budgetMin = budgetRange[0]
        searchRequest.budgetMax = budgetRange[1]
      }

      const searchResult = await jobService.searchJobsAdvanced(searchRequest)

      // Map JobPostSearchDto to JobPost format
      // Note: the /search/jobs endpoint returns snake_case fields matching the /posts endpoint
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedJobs: JobPost[] = searchResult.jobPosts.map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description ?? job.briefDescription ?? '',
        brief_description: job.brief_description ?? job.briefDescription,
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
        submission_deadline: job.submission_deadline ?? job.deadline ?? undefined,
        created_at: job.created_at ?? job.createdAt,
        updated_at: job.updated_at ?? job.updatedAt,
        published_at: job.published_at ?? job.publishedAt ?? undefined,
        closed_at: job.closed_at ?? job.closedAt ?? undefined,
        total_submissions: job.total_submissions ?? job.applicationsCount,
        applications_count: job.applications_count ?? job.applicationsCount,
        bookings_count: job.bookings_count ?? job.bookingsCount,
        views_count: job.views_count ?? job.viewsCount,
        is_deadline_passed: job.is_deadline_passed ?? job.isDeadlinePassed,
        can_accept_submissions: job.can_accept_submissions ?? job.canAcceptSubmissions,
      }))

      setJobs(mappedJobs)
    } catch (error) {
      console.error('Failed to fetch jobs', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [
    debouncedSearch,
    selectedGenre,
    selectedLocation,
    selectedLocationType,
    selectedExperience,
    selectedRecruitment,
    activeTab,
    budgetRange,
  ])

  // Fetch jobs when filters or search change
  useEffect(() => {
    // Skip initial fetch if we have initial data and it's the first render
    // CAUTION: If initialData is filtered/sorted differently than default state, we might mismatch.
    // Assuming page.tsx provides data matching default 'all' state.
    if (isFirstRender.current && initialJobs.length > 0) {
      isFirstRender.current = false
      return
    }

    if (activeTab !== 'saved') {
      fetchJobs()
    } else {
      setLoading(false)
    }
  }, [activeTab, fetchJobs, initialJobs.length])

  // Load genres from API (independent of current job list)
  useEffect(() => {
    let active = true
    const loadGenres = async () => {
      try {
        const genres = await userService.getGenres()
        if (!active) return
        setAvailableGenres(genres.map((g) => g.name).sort())
      } catch (error) {
        console.error('Failed to load genres', error)
      }
    }
    loadGenres()
    return () => {
      active = false
    }
  }, [])

  const filteredJobs = useMemo(() => {
    let filtered = jobs

    // Filter by tab (type field - looking for roles)
    if (activeTab === 'saved') {
      filtered = jobs.filter((j) => savedJobs.has(j.id))
    } else if (activeTab !== 'all') {
      filtered = jobs.filter((j) => {
        return j.type === activeTab
      })
    }

    return filtered
  }, [jobs, activeTab, savedJobs])

  const isBudgetFiltered =
    budgetRange[0] > BUDGET_RANGE_DEFAULT[0] || budgetRange[1] < BUDGET_RANGE_DEFAULT[1]

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedGenre !== 'all' ||
    selectedLocation !== 'all' ||
    selectedLocationType !== 'all' ||
    selectedExperience !== 'all' ||
    selectedRecruitment !== 'all' ||
    isBudgetFiltered

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedGenre('all')
    setSelectedLocation('all')
    setSelectedLocationType('all')
    setSelectedExperience('all')
    setSelectedRecruitment('all')
    setBudgetRange([...BUDGET_RANGE_DEFAULT])
  }

  const handleViewDetails = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  // State for application dialog
  const [applicationDialogJob, setApplicationDialogJob] = useState<JobWithCreator | null>(null)

  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section className="relative border-b pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden bg-linear-to-br from-primary/15 via-primary/8 to-primary/5">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-primary/10 to-transparent animate-pulse" />

        {/* Animated grid pattern */}
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

        {/* Animated floating orbs */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute top-20 right-20 w-52 h-52 bg-primary/25 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-10 left-1/3 w-44 h-44 bg-primary/20 rounded-full blur-3xl animate-float-slow" />

        {/* Glowing accent lines */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-primary/70 to-transparent animate-shimmer" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-primary/50 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1320px] px-4 md:px-6 z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight relative">
                <span className="relative z-10">{t('title')}</span>
                <span className="absolute inset-0 bg-linear-to-r from-primary/40 via-primary/30 to-primary/20 blur-2xl animate-pulse opacity-60" />
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed relative z-10">
                {t('subtitle')}
              </p>
            </div>
            <div className="shrink-0 relative z-10">
              <Button size="lg" className="w-full md:w-auto" asChild>
                <Link href="/jobs/post">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('postJob')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width background wrapper */}
      <div className="w-full bg-linear-to-br from-muted/50 via-muted/30 to-muted/40 relative">
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        {/* Decorative blur orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
        <div className="mx-auto w-full max-w-[1320px] px-4 md:px-6 py-8 md:py-10 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 relative">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 lg:shrink-0">
              <Card className="p-4 lg:sticky lg:top-24 shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-sm uppercase tracking-wide">
                      {t('filters.title')}
                    </h2>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        {t('filters.clear')}
                      </Button>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        {t('searchPlaceholder')}
                      </label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder={t('searchPlaceholder')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        {t('filters.genre')}
                      </label>
                      <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder={t('filters.genreAll')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('filters.genreAll')}</SelectItem>
                          {availableGenres.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        {tDetail('locationType')}
                      </label>
                      <Select
                        value={selectedLocationType}
                        onValueChange={(v) =>
                          setSelectedLocationType(v as typeof selectedLocationType)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder={t('filters.locationAll')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('filters.locationAll')}</SelectItem>
                          <SelectItem value="remote">{t('filters.remote')}</SelectItem>
                          <SelectItem value="onsite">{t('filters.onsite')}</SelectItem>
                          <SelectItem value="hybrid">{t('filters.hybrid')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        {tDetail('experienceLevel')}
                      </label>
                      <Select
                        value={selectedExperience}
                        onValueChange={(v) => setSelectedExperience(v as typeof selectedExperience)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder={t('filters.experienceAll')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('filters.experienceAll')}</SelectItem>
                          <SelectItem value="any">{tOptions('experience.any')}</SelectItem>
                          <SelectItem value="beginner">
                            {tOptions('experience.beginner')}
                          </SelectItem>
                          <SelectItem value="intermediate">
                            {tOptions('experience.intermediate')}
                          </SelectItem>
                          <SelectItem value="expert">{tOptions('experience.expert')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        {tDetail('employmentType')}
                      </label>
                      <Select
                        value={selectedRecruitment}
                        onValueChange={(v) =>
                          setSelectedRecruitment(v as typeof selectedRecruitment)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder={t('filters.employmentAll')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('filters.employmentAll')}</SelectItem>
                          <SelectItem value="full_time">
                            {tOptions('employment.full_time')}
                          </SelectItem>
                          <SelectItem value="part_time">
                            {tOptions('employment.part_time')}
                          </SelectItem>
                          <SelectItem value="contract">
                            {tOptions('employment.contract')}
                          </SelectItem>
                          <SelectItem value="one_time">
                            {tOptions('employment.one_time')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          {t('filters.budgetRange')}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {budgetRange[0].toLocaleString()} - {budgetRange[1].toLocaleString()}
                        </span>
                      </div>
                      <Slider
                        value={budgetRange}
                        min={BUDGET_RANGE_DEFAULT[0]}
                        max={BUDGET_RANGE_DEFAULT[1]}
                        step={500000}
                        onValueChange={(vals) => setBudgetRange([vals[0], vals[1]])}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as JobType)}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                  <TabsList className="h-11 p-1 bg-muted/50 backdrop-blur-sm border border-border/40">
                    <TabsTrigger value="all" className="px-5 text-sm gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      {t('tabs.all')}
                    </TabsTrigger>
                    <TabsTrigger value="producer" className="px-5 text-sm gap-2">
                      <Disc className="w-3.5 h-3.5" />
                      {t('tabs.forProducers')}
                    </TabsTrigger>
                    <TabsTrigger value="singer" className="px-5 text-sm gap-2">
                      <Mic className="w-3.5 h-3.5" />
                      {t('tabs.forSingers')}
                    </TabsTrigger>
                    <TabsTrigger value="saved" className="px-5 text-sm gap-2">
                      <Briefcase className="w-3.5 h-3.5" />
                      {t('tabs.saved')}
                    </TabsTrigger>
                  </TabsList>

                  <div className="px-4 py-1.5 bg-muted/60 backdrop-blur-sm border border-border/40 rounded-full text-xs font-semibold text-muted-foreground shadow-sm">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                        {tCommon('loading')}
                      </span>
                    ) : (
                      `${filteredJobs.length} ${tCommon('results') || 'results'}`
                    )}
                  </div>
                </div>

                {['all', 'producer', 'singer', 'saved'].map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-0">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredJobs.length > 0 ? (
                      <motion.div
                        key={`${tab}-${debouncedSearch}-${selectedGenre}-${selectedLocation}-${selectedLocationType}-${selectedExperience}-${selectedRecruitment}`}
                        className="grid gap-4 md:grid-cols-2 xl:grid-cols-1"
                        initial="hidden"
                        animate="show"
                        variants={staggerContainer}
                      >
                        {filteredJobs.map((job) => (
                          <motion.div key={job.id} variants={fadeInUp}>
                            <Link
                              href={`/jobs/${job.id}`}
                              className="block h-full cursor-pointer hover:no-underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <JobCard
                                job={job}
                                isSaved={isJobSaved(job.id)}
                                onToggleSave={toggleSave}
                                onViewDetails={handleViewDetails}
                                onApply={() => setApplicationDialogJob(job)}
                              />
                            </Link>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <Card className="p-12 text-center">
                        {tab === 'producer' ? (
                          <Disc className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        ) : tab === 'singer' ? (
                          <Mic className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        ) : (
                          <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        )}
                        <h3 className="text-lg font-semibold mb-2">
                          {tab === 'producer'
                            ? t('emptyProducers.title')
                            : tab === 'singer'
                              ? t('emptySingers.title')
                              : tab === 'saved'
                                ? t('emptySaved.title')
                                : t('emptyState.title')}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {tab === 'producer'
                            ? t('emptyProducers.description')
                            : tab === 'singer'
                              ? t('emptySingers.description')
                              : tab === 'saved'
                                ? t('emptySaved.description')
                                : t('emptyState.description')}
                        </p>
                        {hasActiveFilters && tab !== 'saved' && (
                          <Button variant="outline" onClick={clearFilters}>
                            {t('emptyState.clearFilters')}
                          </Button>
                        )}
                      </Card>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <ApplicationDialog
        open={!!applicationDialogJob}
        onOpenChange={(open: boolean) => !open && setApplicationDialogJob(null)}
        jobId={applicationDialogJob?.id || ''}
        jobTitle={applicationDialogJob?.title || ''}
        companyName={applicationDialogJob?.creator_display_name || tCommon('unknown')}
      />
    </div>
  )
}

export default JobPoolClient
