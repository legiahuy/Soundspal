import type { Genre } from './user'

// Featured User Types (from API documentation)
export interface FeaturedUser {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  role: string
  brief_bio?: string
  city?: string
  country?: string
  genres?: Genre[]
  is_verified: boolean
  is_featured: boolean
  featured_at?: string
  created_at: string
}

export interface FeaturedUsersResponse {
  data: {
    users: FeaturedUser[]
    total: number
    limit: number
    offset: number
  }
}

// Featured Job Types (from API documentation)
export interface FeaturedJob {
  id: string
  title: string
  description?: string
  brief_description?: string
  post_type: 'job_offer' | 'gig' | 'availability'
  type?: 'producer' | 'singer' | 'venue'
  status: 'draft' | 'published' | 'closed' | 'completed' | 'cancelled'
  visibility: 'public' | 'private' | 'invite_only'

  // Creator Info
  creator_id: string
  creator_role: string
  creator_display_name?: string
  creator_username?: string
  creator_avatar_url?: string

  // Location & Budget
  location?: string
  location_type?: 'remote' | 'onsite' | 'hybrid'
  budget_min?: number
  budget_max?: number
  budget_currency?: 'USD' | 'EUR' | 'JPY' | 'VND'
  payment_type?: 'bySession' | 'byHour' | 'byProject' | 'byMonth'

  // Requirements
  experience_level?: 'beginner' | 'intermediate' | 'expert' | 'any'
  required_skills?: string[]
  genres?: string[]

  // Dates
  deadline?: string
  submission_deadline?: string
  created_at: string
  updated_at: string
  published_at?: string

  // Featured status
  is_featured: boolean
  featured_at?: string

  // Stats
  total_submissions?: number
  views_count?: number
}

export interface FeaturedJobsResponse {
  data: {
    posts: FeaturedJob[]
    total: number
    limit: number
    offset: number
  }
}

// Action Response Types
export interface FeatureActionResponse {
  message: string
}

// Pagination & Filter Types
export interface AdminPaginationParams {
  limit?: number
  offset?: number
}

export interface AdminSearchParams {
  q?: string
  page?: number
  page_size?: number
}
