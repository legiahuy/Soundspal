import axiosClient from '@/api/axios'
import type {
  BlogListParams,
  BlogListResponse,
  BlogPost,
  BlogVersionsResponse,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
} from '@/types/blog'

const useMockBlogData =
  process.env.NEXT_PUBLIC_USE_MOCK_BLOG_DATA === 'true' ||
  process.env.NEXT_PUBLIC_USE_MOCK_ADMIN_DATA === 'true'
const BLOG_STORAGE_KEY = 'talentlink_mock_blogs_v1'

const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: 'mock-blog-1',
    title: '5 xu huong am nhac noi bat nam 2026',
    slug: '5-xu-huong-am-nhac-noi-bat-2026',
    author_id: 'admin-mock',
    topic_id: 'music-trend',
    short_description:
      'Tong hop cac xu huong am nhac duoc nghe si va nha san xuat quan tam nhieu nhat trong nam nay.',
    brief_description:
      'Tong hop cac xu huong am nhac duoc nghe si va nha san xuat quan tam nhieu nhat trong nam nay.',
    content:
      'Nam 2026 danh dau su tro lai manh me cua indie pop, am thanh lo-fi va cac du an ket hop AI trong sang tac. Ben canh do, live session va mini concert tiep tuc tang truong tren cac nen tang so.',
    tags: ['music', 'trend', '2026'],
    media: [
      {
        id: 'mock-media-1',
        media_type: 'image',
        post_id: 'mock-blog-1',
        url: '/images/job/default-job.jpg',
      },
    ],
    bookmark_count: 12,
    comment_count: 5,
    upvote_count: 23,
    downvote_count: 1,
    view_count: 340,
    read_time: 4,
    status: 'published',
    visibility: 'public',
    cover_image_url: '/images/job/default-job.jpg',
    created_at: '2026-04-01T08:00:00.000Z',
    updated_at: '2026-04-01T08:00:00.000Z',
    published_at: '2026-04-01T08:00:00.000Z',
  },
  {
    id: 'mock-blog-2',
    title: 'Huong dan toi uu ho so nghe si de thu hut booking',
    slug: 'huong-dan-toi-uu-ho-so-nghe-si-thu-hut-booking',
    author_id: 'admin-mock',
    topic_id: 'profile-growth',
    short_description:
      'Nhung meo don gian de cai thien profile, portfolio va tang co hoi duoc lien he hop tac.',
    brief_description:
      'Nhung meo don gian de cai thien profile, portfolio va tang co hoi duoc lien he hop tac.',
    content:
      'Hay bat dau tu avatar ro rang, mo ta ngan gon nhung day du thong tin. Bo sung video demo chat luong, cap nhat the loai am nhac va lich bieu dien gan day de tang do tin cay.',
    tags: ['profile', 'booking'],
    media: [
      {
        id: 'mock-media-2',
        media_type: 'image',
        post_id: 'mock-blog-2',
        url: '/images/job/default-job.jpg',
      },
    ],
    bookmark_count: 7,
    comment_count: 2,
    upvote_count: 15,
    downvote_count: 0,
    view_count: 190,
    read_time: 3,
    status: 'published',
    visibility: 'public',
    cover_image_url: '/images/job/default-job.jpg',
    created_at: '2026-04-03T09:30:00.000Z',
    updated_at: '2026-04-03T09:30:00.000Z',
    published_at: '2026-04-03T09:30:00.000Z',
  },
  {
    id: 'mock-blog-3',
    title: 'Checklist truoc khi dang bai tuyen dung nghe si',
    slug: 'checklist-truoc-khi-dang-bai-tuyen-dung-nghe-si',
    author_id: 'admin-mock',
    topic_id: 'recruitment',
    short_description:
      'Danh sach cac thong tin quan trong giup bai dang ro rang hon va nhan dung ung vien.',
    brief_description:
      'Danh sach cac thong tin quan trong giup bai dang ro rang hon va nhan dung ung vien.',
    content:
      'Truoc khi dang bai, ban nen xac dinh ro vai tro, ngan sach, lich trinh va deadline. Mot bai dang ro rang se giam trao doi lap lai va tang toc do tim duoc ung vien phu hop.',
    tags: ['recruitment', 'checklist'],
    media: [
      {
        id: 'mock-media-3',
        media_type: 'image',
        post_id: 'mock-blog-3',
        url: '/images/job/default-job.jpg',
      },
    ],
    bookmark_count: 1,
    comment_count: 0,
    upvote_count: 4,
    downvote_count: 0,
    view_count: 60,
    read_time: 2,
    status: 'draft',
    visibility: 'public',
    cover_image_url: '/images/job/default-job.jpg',
    created_at: '2026-04-05T12:15:00.000Z',
    updated_at: '2026-04-05T12:15:00.000Z',
  },
]

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStoredMockPosts(): BlogPost[] {
  if (!canUseBrowserStorage()) return []
  try {
    const raw = window.localStorage.getItem(BLOG_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as BlogPost[]
  } catch {
    return []
  }
}

function writeStoredMockPosts(posts: BlogPost[]) {
  if (!canUseBrowserStorage()) return
  try {
    window.localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(posts))
  } catch {
    // Ignore storage quota/private mode errors
  }
}

function getEffectiveMockPosts(): BlogPost[] {
  const stored = readStoredMockPosts()
  if (stored.length > 0) return stored
  return [...MOCK_BLOG_POSTS]
}

function upsertMockPosts(posts: BlogPost[]) {
  writeStoredMockPosts(posts)
}

function makeMockPostFromCreatePayload(payload: CreateBlogPostRequest): BlogPost {
  const now = new Date().toISOString()
  const normalizedTitle = (payload.title || '').trim()
  const generatedSlug = normalizedTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  return {
    id: `mock-blog-${Date.now()}`,
    title: normalizedTitle || 'Untitled',
    slug: payload.slug || generatedSlug || `mock-${Date.now()}`,
    content: payload.content,
    short_description: payload.short_description ?? payload.brief_description,
    brief_description: payload.short_description ?? payload.brief_description,
    topic_id: payload.topic_id,
    tags: payload.tags ?? [],
    media: [],
    bookmark_count: 0,
    comment_count: 0,
    upvote_count: 0,
    downvote_count: 0,
    view_count: 0,
    read_time: 1,
    status: payload.status ?? 'draft',
    visibility: payload.visibility ?? 'public',
    created_at: now,
    updated_at: now,
    published_at: undefined,
    cover_image_url: '/images/job/default-job.jpg',
  }
}

function unwrap<T>(payload: any): T {
  return (payload?.data ?? payload) as T
}

function normalizePost(raw: any): BlogPost {
  const p = raw || {}
  const firstMediaUrl = Array.isArray(p.media) && p.media.length > 0 ? p.media[0]?.url : undefined
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content,
    short_description: p.short_description,
    brief_description: p.brief_description ?? p.short_description,
    author_id: p.author_id,
    topic_id: p.topic_id,
    tags: Array.isArray(p.tags) ? p.tags : [],
    media: Array.isArray(p.media) ? p.media : [],
    bookmark_count: p.bookmark_count ?? 0,
    comment_count: p.comment_count ?? 0,
    upvote_count: p.upvote_count ?? 0,
    downvote_count: p.downvote_count ?? 0,
    view_count: p.view_count ?? 0,
    read_time: p.read_time ?? 0,
    status: p.status,
    created_at: p.created_at,
    updated_at: p.updated_at,
    published_at: p.published_at,
    cover_image_url: p.cover_image_url ?? firstMediaUrl,
    visibility: p.visibility,
  }
}

function normalizeListResponse(raw: any, params?: BlogListParams): BlogListResponse {
  const topLevel = raw || {}
  const data = unwrap<any>(raw)

  const posts = (data?.posts ??
    data?.data?.posts ??
    data?.items ??
    data?.results ??
    data?.data ??
    topLevel?.data ??
    []) as any[]
  const total =
    (data?.total ??
      data?.data?.total ??
      data?.pagination?.total_items ??
      data?.pagination?.total ??
      posts.length) as number

  return {
    posts: Array.isArray(posts) ? posts.map(normalizePost) : [],
    total: typeof total === 'number' ? total : Number(total || 0),
    limit: params?.limit,
    offset: params?.offset,
  }
}

export const blogService = {
  listPosts: async (params?: BlogListParams): Promise<BlogListResponse> => {
    const p = params || {}
    if (useMockBlogData) {
      const all = getEffectiveMockPosts()
      return { posts: all, total: all.length, limit: p.limit, offset: p.offset }
    }

    try {
      // Prefer admin-style limit/offset if caller provides, else support page/page_size
      const res = await axiosClient.get('/posts', {
        params: {
          ...(p.search ? { search: p.search } : undefined),
          ...(p.q ? { q: p.q } : undefined),
          ...(p.status ? { status: p.status } : undefined),
          ...(p.tag_id ? { tag_id: p.tag_id } : undefined),
          ...(p.topic_id ? { topic_id: p.topic_id } : undefined),
          ...(typeof p.limit === 'number' ? { limit: p.limit } : undefined),
          ...(typeof p.offset === 'number' ? { offset: p.offset } : undefined),
          ...(typeof p.page === 'number' ? { page: p.page } : undefined),
          ...(typeof p.page_size === 'number' ? { page_size: p.page_size } : undefined),
          ...(p.sort_by ? { sort_by: p.sort_by } : undefined),
          ...(p.sort_order ? { sort_order: p.sort_order } : undefined),
          post_type: 'blog',
        },
      })

      return normalizeListResponse(res.data, p)
    } catch {
      const all = getEffectiveMockPosts()
      return { posts: all, total: all.length, limit: p.limit, offset: p.offset }
    }
  },

  getPostById: async (id: string): Promise<BlogPost> => {
    const mockPosts = getEffectiveMockPosts()
    if (useMockBlogData) {
      return mockPosts.find((p) => p.id === id) || mockPosts[0]
    }
    try {
      const res = await axiosClient.get(`/posts/${id}`)
      return normalizePost(unwrap<any>(res.data))
    } catch {
      return mockPosts.find((p) => p.id === id) || mockPosts[0]
    }
  },

  getPostBySlug: async (slug: string): Promise<BlogPost> => {
    const mockPosts = getEffectiveMockPosts()
    if (useMockBlogData) {
      return mockPosts.find((p) => p.slug === slug) || mockPosts[0]
    }
    try {
      const res = await axiosClient.get(`/posts/slug/${encodeURIComponent(slug)}`)
      return normalizePost(unwrap<any>(res.data))
    } catch {
      return mockPosts.find((p) => p.slug === slug) || mockPosts[0]
    }
  },

  createPost: async (payload: CreateBlogPostRequest): Promise<BlogPost> => {
    if (useMockBlogData) {
      const created = makeMockPostFromCreatePayload(payload)
      const all = [created, ...getEffectiveMockPosts()]
      upsertMockPosts(all)
      return created
    }

    try {
      const res = await axiosClient.post('/posts', {
        ...payload,
        short_description: payload.short_description ?? payload.brief_description,
        post_type: 'blog',
      })
      return normalizePost(unwrap<any>(res.data))
    } catch (error) {
      console.error('createPost network fallback:', error)
      const created = makeMockPostFromCreatePayload(payload)
      const all = [created, ...getEffectiveMockPosts()]
      upsertMockPosts(all)
      return created
    }
  },

  updatePost: async (id: string, payload: UpdateBlogPostRequest): Promise<BlogPost> => {
    if (useMockBlogData) {
      const all = getEffectiveMockPosts()
      const idx = all.findIndex((p) => p.id === id)
      if (idx >= 0) {
        const merged = {
          ...all[idx],
          ...payload,
          short_description: payload.short_description ?? payload.brief_description ?? all[idx].short_description,
          brief_description: payload.short_description ?? payload.brief_description ?? all[idx].brief_description,
          updated_at: new Date().toISOString(),
        } as BlogPost
        all[idx] = merged
        upsertMockPosts(all)
        return merged
      }
    }

    try {
      const res = await axiosClient.put(`/posts/${id}`, {
        ...payload,
        short_description: payload.short_description ?? payload.brief_description,
      })
      return normalizePost(unwrap<any>(res.data))
    } catch (error) {
      console.error('updatePost network fallback:', error)
      const all = getEffectiveMockPosts()
      const existing = all.find((p) => p.id === id)
      if (existing) {
        const merged = {
          ...existing,
          ...payload,
          short_description: payload.short_description ?? payload.brief_description ?? existing.short_description,
          brief_description: payload.short_description ?? payload.brief_description ?? existing.brief_description,
          updated_at: new Date().toISOString(),
        } as BlogPost
        const idx = all.findIndex((p) => p.id === id)
        all[idx] = merged
        upsertMockPosts(all)
        return merged
      }
      throw error
    }
  },

  updateContent: async (id: string, content: string): Promise<BlogPost> => {
    const res = await axiosClient.put(`/posts/${id}/content`, { content })
    return unwrap<BlogPost>(res.data)
  },

  uploadMedia: async (id: string, file: File): Promise<{ url?: string } & Record<string, any>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await axiosClient.post(`/posts/${id}/media`, form)
    return unwrap(res.data)
  },

  publish: async (id: string): Promise<BlogPost> => {
    try {
      const res = await axiosClient.patch(`/posts/${id}/publish`)
      return unwrap<BlogPost>(res.data)
    } catch (error) {
      const all = getEffectiveMockPosts()
      const idx = all.findIndex((p) => p.id === id)
      if (idx >= 0) {
        const now = new Date().toISOString()
        const merged = {
          ...all[idx],
          status: 'published',
          published_at: all[idx].published_at || now,
          updated_at: now,
        } as BlogPost
        all[idx] = merged
        upsertMockPosts(all)
        return merged
      }
      throw error
    }
  },

  getVersions: async (id: string): Promise<BlogVersionsResponse> => {
    const res = await axiosClient.get(`/posts/${id}/versions`)
    const data = unwrap<any>(res.data)
    return {
      versions: data?.versions ?? data?.data?.versions ?? data ?? [],
      total: data?.total ?? data?.data?.total,
    }
  },
}

