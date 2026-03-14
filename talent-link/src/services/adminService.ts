import axiosClient from '@/api/axios'
import type {
  FeaturedUser,
  FeaturedJob,
  FeaturedUsersResponse,
  FeaturedJobsResponse,
  FeatureActionResponse,
  AdminPaginationParams,
  AdminUser,
  AdminUsersResponse,
  AdminUserParams,
  AdminUserActionResponse,
} from '@/types/admin'
import type { Media, MediaListResponse } from '@/types/media'

// Check if we should use mock data
const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_ADMIN_DATA === 'true'

// Helper to upload image trying multiple field names for backend compatibility
async function uploadImageWithFieldFallback(
  endpoint: string,
  file: File,
  fieldNames: string[],
): Promise<string> {
  let lastErr: unknown
  for (const field of fieldNames) {
    try {
      const form = new FormData()
      form.append(field, file)
      const res = await axiosClient.post(endpoint, form)
      const data = res.data?.data ?? res.data
      return data?.url ?? data?.file_url ?? data?.path ?? ''
    } catch (e) {
      lastErr = e
      continue
    }
  }
  throw lastErr
}

export const adminService = {
  // ===== FEATURED USERS =====

  listFeaturedUsers: async (params?: AdminPaginationParams): Promise<FeaturedUsersResponse> => {
    const { limit = 50, offset = 0 } = params || {}

    const res = await axiosClient.get('/admin/users/featured', {
      params: { limit, offset },
    })
    return res.data
  },

  featureUser: async (userId: string): Promise<FeatureActionResponse> => {
    const res = await axiosClient.post(`/admin/users/${userId}/feature`)
    return res.data
  },

  unfeatureUser: async (userId: string): Promise<FeatureActionResponse> => {
    const res = await axiosClient.delete(`/admin/users/${userId}/feature`)
    return res.data
  },

  // ===== FEATURED JOBS =====

  listFeaturedJobs: async (params?: AdminPaginationParams): Promise<FeaturedJobsResponse> => {
    const { limit = 50, offset = 0 } = params || {}

    const res = await axiosClient.get('/admin/posts/featured', {
      params: { limit, offset },
    })
    return res.data
  },

  featureJob: async (jobId: string): Promise<FeatureActionResponse> => {
    const res = await axiosClient.post(`/admin/posts/${jobId}/feature`)
    return res.data
  },

  unfeatureJob: async (jobId: string): Promise<FeatureActionResponse> => {
    const res = await axiosClient.delete(`/admin/posts/${jobId}/feature`)
    return res.data
  },

  // ===== SEARCH =====

  searchUsers: async (query: string): Promise<FeaturedUser[]> => {
    const res = await axiosClient.get('/search/users', {
      params: { q: query },
    })
    return res.data.data || []
  },

  searchJobs: async (query: string): Promise<FeaturedJob[]> => {
    const res = await axiosClient.get('/search/posts', {
      params: { q: query },
    })
    return res.data.data || []
  },

  // ===== ADMIN MEDIA MANAGEMENT =====

  uploadUserAvatar: async (userId: string, file: File): Promise<string> => {
    return uploadImageWithFieldFallback(
      `/admin/users/${userId}/avatar`,
      file,
      ['file', 'avatar', 'image'],
    )
  },

  uploadUserCover: async (userId: string, file: File): Promise<string> => {
    return uploadImageWithFieldFallback(
      `/admin/users/${userId}/cover`,
      file,
      ['file', 'cover', 'image'],
    )
  },

  uploadUserMedia: async (userId: string, file: File): Promise<Media> => {
    const form = new FormData()
    form.append('file', file)
    const res = await axiosClient.post(`/admin/users/${userId}/media`, form)
    return res.data?.data ?? res.data
  },

  deleteUserMedia: async (userId: string, mediaId: string): Promise<void> => {
    await axiosClient.delete(`/admin/users/${userId}/media/${mediaId}`)
  },

  getUserMedia: async (userId: string): Promise<MediaListResponse> => {
    const res = await axiosClient.get(`/admin/users/${userId}/media`)
    const data = res.data?.data ?? res.data
    return {
      media: data?.media ?? [],
      total: data?.total ?? data?.media?.length ?? 0,
    }
  },

  // ===== UTILITY =====

  isMockMode: (): boolean => {
    return useMockData
  },
}
