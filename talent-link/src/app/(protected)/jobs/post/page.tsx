'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { jobService } from '@/services/jobService'
import { userService } from '@/services/userService'
import type { Genre } from '@/types/user'
import type { CreateJobPostRequest } from '@/types/job'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type PostTypeValue = NonNullable<CreateJobPostRequest['post_type']>
type RoleTypeValue = NonNullable<CreateJobPostRequest['type']>
type RecruitmentTypeValue = NonNullable<CreateJobPostRequest['recruitment_type']>
type ExperienceLevelValue = NonNullable<CreateJobPostRequest['experience_level']>
type PaymentTypeValue = NonNullable<CreateJobPostRequest['payment_type']>
type StatusValue = NonNullable<CreateJobPostRequest['status']>

const ROLE_OPTIONS: { label: string; value: RoleTypeValue; key: string }[] = [
  { label: 'Producer', value: 'producer', key: 'roles.producer' },
  { label: 'Singer', value: 'singer', key: 'roles.singer' },
  { label: 'Venue', value: 'venue', key: 'roles.venue' },
]

const POST_TYPES: { label: string; value: PostTypeValue; key: string }[] = [
  { label: 'Job Offer', value: 'job_offer', key: 'postTypes.job_offer' },
  { label: 'Gig / One-off', value: 'gig', key: 'postTypes.gig' },
  { label: 'Talent Availability', value: 'availability', key: 'postTypes.availability' },
]

const EMPLOYMENT_TYPES: { label: string; value: RecruitmentTypeValue; key: string }[] = [
  { label: 'Full Time', value: 'full_time', key: 'employment.full_time' },
  { label: 'Part Time', value: 'part_time', key: 'employment.part_time' },
  { label: 'Contract', value: 'contract', key: 'employment.contract' },
  { label: 'One Time', value: 'one_time', key: 'employment.one_time' },
]

const EXPERIENCE_LEVELS: { label: string; value: ExperienceLevelValue; key: string }[] = [
  { label: 'Beginner', value: 'beginner', key: 'experience.beginner' },
  { label: 'Intermediate', value: 'intermediate', key: 'experience.intermediate' },
  { label: 'Expert', value: 'expert', key: 'experience.expert' },
  { label: 'Any experience', value: 'any', key: 'experience.any' },
]

const PAYMENT_TYPES: { label: string; value: PaymentTypeValue; key: string }[] = [
  { label: 'Per Show', value: 'bySession', key: 'payment.bySession' },
  { label: 'Per Hour', value: 'byHour', key: 'payment.byHour' },
  { label: 'Per Project', value: 'byProject', key: 'payment.byProject' },
  { label: 'Per Month', value: 'byMonth', key: 'payment.byMonth' },
]

const STATUS_OPTIONS: { label: string; value: StatusValue; key: string }[] = [
  { label: 'Publish immediately', value: 'published', key: 'status.published' },
  { label: 'Save as draft', value: 'draft', key: 'status.draft' },
]

const defaultCurrency: NonNullable<CreateJobPostRequest['budget_currency']> = 'VND'

const JobPostFormPage = () => {
  const t = useTranslations('PostJob')
  const tOptions = useTranslations('options')
  const tCommon = useTranslations('Common')
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [postType, setPostType] = useState<PostTypeValue>('job_offer')
  const [roleType, setRoleType] = useState<RoleTypeValue>('producer')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState<RecruitmentTypeValue>('full_time')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevelValue>('any')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [salaryCurrency, setSalaryCurrency] =
    useState<NonNullable<CreateJobPostRequest['budget_currency']>>(defaultCurrency)
  const [salaryPeriod, setSalaryPeriod] = useState<PaymentTypeValue>('bySession')
  const [salaryNegotiable, setSalaryNegotiable] = useState(false)
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState<string[]>([])
  const [currentRequirement, setCurrentRequirement] = useState('')
  const [benefits, setBenefits] = useState<string[]>([])
  const [currentBenefit, setCurrentBenefit] = useState('')
  const [schedule, setSchedule] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [autoNotify, setAutoNotify] = useState(false)
  const [status, setStatus] = useState<StatusValue>('published')

  const [genres, setGenres] = useState<Genre[]>([])
  const [loadingGenres, setLoadingGenres] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    const fetchGenres = async () => {
      setLoadingGenres(true)
      try {
        const res = await userService.getGenres()
        if (active) {
          setGenres(res)
        }
      } catch (error) {
        console.error('Failed to load genres', error)
        toast.error(t('messages.loadGenresError'))
      } finally {
        if (active) setLoadingGenres(false)
      }
    }
    fetchGenres()
    return () => {
      active = false
    }
  }, [t])

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false
    if (!location.trim()) return false
    if (!description.trim() || description.trim().length < 20) return false
    if (!salaryMin) return false
    if (!salaryPeriod) return false
    if (selectedGenres.length === 0) return false
    return true
  }, [title, location, description, salaryMin, salaryPeriod, selectedGenres])

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      setRequirements((prev) => [...prev, currentRequirement.trim()])
      setCurrentRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index))
  }

  const addBenefit = () => {
    if (currentBenefit.trim()) {
      setBenefits((prev) => [...prev, currentBenefit.trim()])
      setCurrentBenefit('')
    }
  }

  const removeBenefit = (index: number) => {
    setBenefits((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((item) => item !== genre) : [...prev, genre],
    )
  }

  const formatDeadline = (dateString: string): string => {
    if (!dateString) return ''
    // Convert YYYY-MM-DD (from date input) to dd-mm-yyyy (backend format)
    // dateString format: "2025-12-12" -> "12-12-2025"
    const [year, month, day] = dateString.split('-')
    return `${day}-${month}-${year}`
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      if (description.trim().length < 20) {
        toast.error(t('messages.descMinLength'))
      } else {
        toast.error(t('messages.fillRequired'))
      }
      return
    }
    setSubmitting(true)
    try {
      const payload: CreateJobPostRequest = {
        title: title.trim(),
        brief_description: summary.trim() || undefined,
        description: description.trim(),
        post_type: postType,
        type: roleType,
        location: location.trim(),
        recruitment_type: employmentType,
        experience_level: experienceLevel,
        budget_min: salaryMin ? Number(salaryMin) : undefined,
        budget_max: salaryMax ? Number(salaryMax) : undefined,
        budget_currency: salaryCurrency,
        payment_type: salaryPeriod,
        is_negotiable: salaryNegotiable,
        work_time: schedule.trim() || undefined,
        submission_deadline: deadline ? formatDeadline(deadline) : undefined,
        required_skills: requirements.length ? requirements : undefined,
        benefits: benefits.length ? benefits : undefined,
        genres: selectedGenres,
        auto_notify: autoNotify,
        status,
        visibility: 'public',
      }

      await jobService.createJob(payload)
      toast.success(t('messages.success'))
      router.push('/jobs/my-posts')
    } catch (error) {
      console.error('Failed to create job', error)
      const message = error instanceof Error ? error.message : t('messages.createError')
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative">
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
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 text-foreground">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild size="lg">
                <Link href="/jobs/my-posts">{t('viewMyPosts')}</Link>
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
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tCommon('back')}
          </Button>
          <Card className="shadow-lg border-border/50 bg-card/70 backdrop-blur-sm">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-2xl font-semibold">{t('form.title')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('form.description')}</p>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="space-y-10" onSubmit={handleSubmit}>
                <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">{t('form.jobTitle')} *</Label>
                        <Input
                          id="title"
                          placeholder={t('form.placeholders.jobTitle')}
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="summary">{t('form.summary')}</Label>
                        <Input
                          id="summary"
                          placeholder={t('form.placeholders.summary')}
                          value={summary}
                          onChange={(event) => setSummary(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">{t('form.descriptionLabel')} *</Label>
                      <Textarea
                        id="description"
                        placeholder={t('form.placeholders.description')}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={8}
                        required
                        minLength={20}
                      />
                      {description.trim().length > 0 && description.trim().length < 20 && (
                        <p className="text-xs text-destructive">
                          {t('form.descriptionMinLength', {
                            current: description.trim().length,
                            min: 20,
                          })}
                        </p>
                      )}
                      {description.trim().length >= 20 && (
                        <p className="text-xs text-muted-foreground">
                          {t('form.charactersCount', { count: description.trim().length })}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="schedule">{t('form.schedule')}</Label>
                        <Input
                          id="schedule"
                          placeholder={t('form.placeholders.schedule')}
                          value={schedule}
                          onChange={(event) => setSchedule(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline">{t('form.deadline')}</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={deadline}
                          onChange={(event) => setDeadline(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>{t('form.keyRequirements')}</Label>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Input
                          placeholder={t('form.placeholders.keyRequirements')}
                          value={currentRequirement}
                          onChange={(event) => setCurrentRequirement(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              addRequirement()
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addRequirement}>
                          {tCommon('add')}
                        </Button>
                      </div>
                      {requirements.length > 0 && (
                        <div className="space-y-2">
                          {requirements.map((item, index) => (
                            <div
                              key={`${item}-${index}`}
                              className="flex items-center gap-2 rounded-md bg-muted/70 p-3"
                            >
                              <span className="text-primary">•</span>
                              <span className="flex-1 text-sm">{item}</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => removeRequirement(index)}
                                aria-label="Remove requirement"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Label>{t('form.benefits')}</Label>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Input
                          placeholder={t('form.placeholders.benefits')}
                          value={currentBenefit}
                          onChange={(event) => setCurrentBenefit(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              addBenefit()
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addBenefit}>
                          {tCommon('add')}
                        </Button>
                      </div>
                      {benefits.length > 0 && (
                        <div className="space-y-2">
                          {benefits.map((item, index) => (
                            <div
                              key={`${item}-${index}`}
                              className="flex items-center gap-2 rounded-md bg-muted/70 p-3 justify-center"
                            >
                              <span className="text-primary">•</span>
                              <span className="flex-1 text-sm">{item}</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => removeBenefit(index)}
                                aria-label="Remove benefit"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="postType">{t('form.postType')} *</Label>
                        <Select
                          value={postType}
                          onValueChange={(value) => setPostType(value as typeof postType)}
                        >
                          <SelectTrigger id="postType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POST_TYPES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {tOptions(option.key)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleType">{t('form.roleType')} *</Label>
                        <Select
                          value={roleType}
                          onValueChange={(value) => setRoleType(value as typeof roleType)}
                        >
                          <SelectTrigger id="roleType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {tOptions(option.key)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="location">{t('form.locationLabel')} *</Label>
                        <Input
                          id="location"
                          placeholder={t('form.placeholders.location')}
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employmentType">{t('form.employmentType')} *</Label>
                        <Select
                          value={employmentType}
                          onValueChange={(value) =>
                            setEmploymentType(value as typeof employmentType)
                          }
                        >
                          <SelectTrigger id="employmentType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYMENT_TYPES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {tOptions(option.key)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="experienceLevel">{t('form.experienceLevel')} *</Label>
                        <Select
                          value={experienceLevel}
                          onValueChange={(value) =>
                            setExperienceLevel(value as typeof experienceLevel)
                          }
                        >
                          <SelectTrigger id="experienceLevel">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_LEVELS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {tOptions(option.key)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">{t('form.visibility')} *</Label>
                        <Select
                          value={status}
                          onValueChange={(value) => setStatus(value as typeof status)}
                        >
                          <SelectTrigger id="status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {tOptions(option.key)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('form.compensation')} *</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('form.compensationDescription')}
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="salaryMin">{t('form.salaryMin')} *</Label>
                          <Input
                            id="salaryMin"
                            type="number"
                            min={0}
                            placeholder="3000000"
                            value={salaryMin}
                            onChange={(event) => setSalaryMin(event.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salaryMax">{t('form.salaryMax')}</Label>
                          <Input
                            id="salaryMax"
                            type="number"
                            min={0}
                            placeholder="5000000"
                            value={salaryMax}
                            onChange={(event) => setSalaryMax(event.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="currency">{t('form.currency')}</Label>
                          <Select
                            value={salaryCurrency}
                            onValueChange={(value) =>
                              setSalaryCurrency(value as typeof salaryCurrency)
                            }
                          >
                            <SelectTrigger id="currency">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VND">VND (₫)</SelectItem>
                              <SelectItem value="USD">USD ($)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentType">{t('form.paymentType')} *</Label>
                          <Select
                            value={salaryPeriod}
                            onValueChange={(value) => setSalaryPeriod(value as typeof salaryPeriod)}
                          >
                            <SelectTrigger id="paymentType">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAYMENT_TYPES.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {tOptions(option.key)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          id="negotiable"
                          checked={salaryNegotiable}
                          onChange={(event) => setSalaryNegotiable(event.target.checked)}
                          className="h-4 w-4 rounded border border-border"
                        />
                        <span className="cursor-pointer">{t('form.isNegotiable')}</span>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <Label>{t('form.genres')} *</Label>
                      {loadingGenres ? (
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} className="h-8 w-20 rounded-full" />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {genres.map((genre) => (
                            <Badge
                              key={genre.name}
                              variant={selectedGenres.includes(genre.name) ? 'default' : 'outline'}
                              className="cursor-pointer px-3 py-1 text-sm"
                              onClick={() => toggleGenre(genre.name)}
                            >
                              {genre.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {selectedGenres.length === 0 && (
                        <p className="text-xs text-destructive">{t('messages.selectGenre')}</p>
                      )}
                    </div>

                    <label className="flex items-start gap-2 rounded-md border border-dashed border-border/60 px-3 py-2">
                      <input
                        type="checkbox"
                        id="auto-notify"
                        checked={autoNotify}
                        onChange={(event) => setAutoNotify(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border border-border"
                      />
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">{t('form.autoNotify')}</span>
                        <p className="text-xs text-muted-foreground">
                          {t('form.autoNotifyDescription')}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <Button type="button" variant="outline" className="w-full sm:flex-1" asChild>
                    <Link href="/jobs">{tCommon('cancel')}</Link>
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:flex-1"
                    disabled={!canSubmit || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('form.submitting')}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('form.submitButton')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default JobPostFormPage
