import axiosClient from '@/api/axios'
import type { FeaturedUser, FeaturedJob } from '@/types/admin'

// Check if we should use mock data
const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_ADMIN_DATA === 'true'

export const landingService = {
  // Get featured users for landing page (public endpoint, no auth required)
  getFeaturedUsers: async (limit = 10): Promise<FeaturedUser[]> => {
    try {
      const res = await axiosClient.get('/landing/featured-users', {
        params: { limit },
      })
      return res.data?.data?.users.users || res.data?.users.users || []
    } catch (error) {
      console.error('Failed to fetch featured users:', error)
      return []
    }
  },

  // Get featured jobs for landing page (public endpoint, no auth required)
  getFeaturedJobs: async (limit = 10): Promise<FeaturedJob[]> => {
    try {
      const res = await axiosClient.get('/landing/featured-jobs', {
        params: { limit },
      })
      return res.data?.data?.jobs || res.data?.jobs || []
    } catch (error) {
      console.error('Failed to fetch featured jobs:', error)
      return []
    }
  },
  // Get discovery data
  getDiscoveryData: async () => {
    try {
      // Luôn ưu tiên gọi API thật, chỉ fallback sang mock khi không có data hoặc lỗi
      const res = await axiosClient.get('/landing/featured-users', {
        params: { limit: 1000 },
      })
      const users: FeaturedUser[] =
        res.data?.data?.users?.users ||
        res.data?.users?.users ||
        res.data?.data?.users ||
        res.data?.users ||
        []

      const artists = users.filter((u) => u.role !== 'venue')
      const venues = users.filter((u) => u.role === 'venue')

      // If API returns empty data, fallback to mock data
      if (artists.length === 0 && venues.length === 0) {
        console.warn('API returned no discovery data, falling back to mock data')
      }

      return { artists, venues }
    } catch (error) {
      console.error('Failed to fetch discovery data, falling back to mock data:', error)
    }
  },
}
