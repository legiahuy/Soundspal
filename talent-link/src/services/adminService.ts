import axiosClient from '@/api/axios'
import type {
  FeaturedUser,
  FeaturedJob,
  FeaturedUsersResponse,
  FeaturedJobsResponse,
  FeatureActionResponse,
  AdminPaginationParams,
  AdminUsersResponse,
  AdminUserDetailResponse,
  AdminUserListParams,
  AdminActionResponse,
} from '@/types/admin'
import type { Media, MediaListResponse } from '@/types/media'

// Check if we should use mock data
const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_ADMIN_DATA === 'true'

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

  // ===== UTILITY =====

  isMockMode: (): boolean => {
    return useMockData
  },

  // ===== USER MANAGEMENT =====

  listUsers: async (params?: AdminUserListParams): Promise<AdminUsersResponse> => {
    const { limit = 20, offset = 0, role, search } = params || {}
    const res = await axiosClient.get('/admin/users', {
      params: { limit, offset, ...(role && { role }), ...(search && { search }) },
    })
    return res.data
  },

  getUser: async (userId: string): Promise<AdminUserDetailResponse> => {
    const res = await axiosClient.get(`/admin/users/${userId}`)
    return res.data
  },

  updateUserRole: async (userId: string, role: string): Promise<AdminActionResponse> => {
    const res = await axiosClient.put(`/admin/users/${userId}/role`, { role })
    return res.data
  },

  banUser: async (userId: string): Promise<AdminActionResponse> => {
    const res = await axiosClient.put(`/admin/users/${userId}/ban`)
    return res.data
  },

  unbanUser: async (userId: string): Promise<AdminActionResponse> => {
    const res = await axiosClient.put(`/admin/users/${userId}/unban`)
    return res.data
  },

  verifyUser: async (userId: string): Promise<AdminActionResponse> => {
    const res = await axiosClient.put(`/admin/users/${userId}/verify`)
    return res.data
  },

  unverifyUser: async (userId: string): Promise<AdminActionResponse> => {
    const res = await axiosClient.put(`/admin/users/${userId}/unverify`)
    return res.data
  },

  deleteUser: async (userId: string): Promise<AdminActionResponse> => {
    const res = await axiosClient.delete(`/admin/users/${userId}`)
    return res.data
  },

  // ===== ADMIN MEDIA MANAGEMENT =====

  uploadUserAvatar: async (userId: string, file: File): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    const res = await axiosClient.post(`/admin/users/${userId}/avatar`, form)
    const data = res.data?.data ?? res.data
    return data?.url ?? data?.file_url ?? data?.path ?? ''
  },

  uploadUserCover: async (userId: string, file: File): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    const res = await axiosClient.post(`/admin/users/${userId}/cover`, form)
    const data = res.data?.data ?? res.data
    return data?.url ?? data?.file_url ?? data?.path ?? ''
  },

  uploadUserMedia: async (userId: string, file: File): Promise<Media> => {
    const form = new FormData()
    form.append('file', file)
    const res = await axiosClient.post(`/admin/users/${userId}/media`, form)
    return res.data?.data ?? res.data
  },

  deleteUserMedia: async (userId: string, mediaId: string): Promise<AdminActionResponse> => {
    const res = await axiosClient.delete(`/admin/users/${userId}/media/${mediaId}`)
    return res.data
  },

  getUserMedia: async (userId: string): Promise<MediaListResponse> => {
    const res = await axiosClient.get(`/admin/users/${userId}/media`)
    const data = res.data?.data ?? res.data
    return {
      media: data?.media ?? [],
      total: data?.total ?? data?.media?.length ?? 0,
    }
  },
}
