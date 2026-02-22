import { jobService } from '@/services/jobService'
import JobPoolClient from './JobPoolClient'
import { JobSearchRequest, JobPost, JobPostSearchDto } from '@/types/job'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Jobs',
  description:
    'Browse the latest creative jobs, auditions, and gigs. Find your next opportunity in the entertainment industry on TalentLink.',
}

export default async function JobPoolPage() {
  // const t = await getTranslations('JobPool')

  // Initial fetch server-side
  let initialJobs: JobPost[] = []

  try {
    const initialRequest: JobSearchRequest = {
      query: undefined,
      status: 'published',
      isActive: true,
      page: 1,
      pageSize: 20,
      sortBy: 'created_at',
      sortOrder: 'desc',
    }

    const searchResult = await jobService.searchJobsAdvanced(initialRequest)

    // Transform data logic — API returns snake_case, with camelCase fallbacks for search service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialJobs = searchResult.jobPosts.map((job: any) => ({
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
  } catch (error) {
    console.error('Failed to fetch initial jobs:', error)
    // Render with empty list if fetch fails
  }

  return <JobPoolClient initialJobs={initialJobs} />
}
