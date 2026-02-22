import axiosClient from '@/api/axios'
import type {
  JobPost,
  JobPostListResponse,
  CreateJobPostRequest,
  UpdateJobPostRequest,
  JobPostFilters,
  CreateSubmissionRequest,
  SubmissionResponse,
  SubmissionDetailResponse,
  SubmissionListResponse,
  SubmissionTimelineResponse,
  MediaResponse,
  ListMediaResponse,
  MySubmissionsResponse,
  PoolStatisticsResponse,
  BulkActionResponse,
  JobSearchRequest,
  JobSearchResult,
} from '@/types/job'

import { BackendJobSearchResponse } from '@/types/search'

export const jobService = {
  // JOB POSTS
  listJobs: async (filters?: JobPostFilters): Promise<JobPostListResponse> => {
    const res = await axiosClient.get('/posts', { params: filters })
    return res.data?.data ?? res.data
  },

  searchJobs: async (query: string, page = 1, pageSize = 20): Promise<JobPostListResponse> => {
    const res = await axiosClient.get('/posts/search', {
      params: { q: query, page, page_size: pageSize },
    })
    return res.data?.data ?? res.data
  },

  // Search and Matching Service - Advanced job search
  // Endpoint: POST /api/v1/search/jobs
  searchJobsAdvanced: async (request: JobSearchRequest): Promise<JobSearchResult> => {
    const res = await axiosClient.post<BackendJobSearchResponse>('/search/jobs', request)

    // Backend returns: { posts: [...], pagination: {...} }
    // Transform to frontend expected format: { jobPosts: [...], totalCount, page, pageSize, totalPages }
    const backendData = res.data

    return {
      jobPosts: backendData.posts || [],
      totalCount: backendData.pagination?.total_items || 0,
      page: backendData.pagination?.current_page || 1,
      pageSize: backendData.pagination?.page_size || 20,
      totalPages: backendData.pagination?.total_pages || 0,
    }
  },

  getJobById: async (id: string, include?: string): Promise<JobPost> => {
    const res = await axiosClient.get(`/posts/${id}`, {
      params: include ? { include } : undefined,
    })
    return res.data?.data ?? res.data
  },

  getMyJobs: async (page = 1, pageSize = 20): Promise<JobPostListResponse> => {
    const res = await axiosClient.get('/posts/me', {
      params: { page, page_size: pageSize },
    })
    return res.data?.data ?? res.data
  },

  createJob: async (data: CreateJobPostRequest): Promise<JobPost> => {
    const res = await axiosClient.post('/posts', data)
    return res.data?.data ?? res.data
  },

  updateJob: async (id: string, data: UpdateJobPostRequest): Promise<JobPost> => {
    const res = await axiosClient.put(`/posts/${id}`, data)
    return res.data?.data ?? res.data
  },

  deleteJob: async (id: string): Promise<void> => {
    await axiosClient.delete(`/posts/${id}`)
  },

  publishJob: async (id: string): Promise<JobPost> => {
    const res = await axiosClient.post(`/posts/${id}/publish`)
    return res.data?.data ?? res.data
  },

  closeJob: async (id: string): Promise<JobPost> => {
    const res = await axiosClient.post(`/posts/${id}/close`)
    return res.data?.data ?? res.data
  },

  // SUBMISSIONS
  submitApplication: async (
    jobId: string,
    data: CreateSubmissionRequest,
  ): Promise<SubmissionResponse> => {
    const res = await axiosClient.post(`/posts/${jobId}/submit`, data)
    return res.data?.data ?? res.data
  },

  uploadSubmissionMedia: async (file: File): Promise<MediaResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await axiosClient.post('/submissions/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data?.data ?? res.data
  },

  getMyMedia: async (includeInactive?: boolean): Promise<ListMediaResponse> => {
    const res = await axiosClient.get('/submissions/me/media', {
      params: includeInactive ? { include_inactive: includeInactive } : undefined,
    })
    return res.data?.data ?? res.data
  },

  deleteSubmissionMedia: async (id: string): Promise<void> => {
    await axiosClient.delete(`/submissions/me/media/${id}`)
  },

  getMySubmissions: async (page = 1, pageSize = 20): Promise<MySubmissionsResponse> => {
    const res = await axiosClient.get('/my-submissions', {
      params: { page, page_size: pageSize },
    })
    return res.data?.data ?? res.data
  },

  getSubmissionById: async (id: string): Promise<SubmissionDetailResponse> => {
    const res = await axiosClient.get(`/submissions/${id}`, {
      params: { include: 'creator_profile' },
    })
    return res.data?.data ?? res.data
  },

  withdrawSubmission: async (id: string, reason?: string) => {
    const res = await axiosClient.put(`/submissions/${id}/withdraw`, { reason })
    return res.data?.data ?? res.data
  },

  // JOB OWNER ONLY
  getJobSubmissions: async (
    jobId: string,
    params?: {
      page?: number
      page_size?: number
      status?: 'pending_review' | 'under_review' | 'accepted' | 'rejected' | 'skipped' | 'withdrawn'
      sort_by?: string
      sort_order?: 'asc' | 'desc'
    },
  ): Promise<SubmissionListResponse> => {
    const res = await axiosClient.get(`/posts/${jobId}/submissions`, { params })
    return res.data?.data ?? res.data
  },

  reviewSubmission: async (
    submissionId: string,
    action: 'skip' | 'reject' | 'accept' | 'start_review',
    reviewNotes?: string,
  ): Promise<SubmissionResponse> => {
    const res = await axiosClient.put(`/submissions/${submissionId}/review`, {
      action,
      review_notes: reviewNotes,
    })
    return res.data?.data ?? res.data
  },

  bulkReviewAction: async (
    submissionIds: string[],
    action: 'skip' | 'reject' | 'accept',
    notes?: string,
  ): Promise<BulkActionResponse> => {
    const res = await axiosClient.post('/submissions/bulk-action', {
      submission_ids: submissionIds,
      action,
      notes,
    })
    return res.data?.data ?? res.data
  },

  getReviewStatistics: async (jobId: string): Promise<PoolStatisticsResponse> => {
    const res = await axiosClient.get(`/posts/${jobId}/review-statistics`)
    return res.data?.data ?? res.data
  },

  getSubmissionTimeline: async (submissionId: string): Promise<SubmissionTimelineResponse> => {
    const res = await axiosClient.get(`/submissions/${submissionId}/timeline`)
    return res.data?.data ?? res.data
  },
}
