import axiosClient from '@/api/axios'
import { userService } from '@/services/userService'
import type {
  BlogListParams,
  BlogListResponse,
  BlogPost,
  BlogVersionsResponse,
  BookmarkItem,
  BookmarkListItem,
  BookmarkPayload,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
} from '@/types/blog'

const BLOG_DRAFT_CACHE_KEY = 'talentlink_blog_draft_cache_v1'
const BOOKMARK_LIST_CACHE_KEY = 'talentlink_bookmark_lists_v1'

function unwrap<T>(payload: any): T {
  return (payload?.data ?? payload) as T
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readDraftCache(): Record<string, BlogPost> {
  if (!canUseBrowserStorage()) return {}
  try {
    const raw = window.sessionStorage.getItem(BLOG_DRAFT_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, BlogPost>) : {}
  } catch {
    return {}
  }
}

function writeDraftCache(cache: Record<string, BlogPost>) {
  if (!canUseBrowserStorage()) return
  try {
    window.sessionStorage.setItem(BLOG_DRAFT_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore quota/private mode errors
  }
}

function upsertDraftCache(post: BlogPost) {
  if (!post?.id) return
  const cache = readDraftCache()
  cache[post.id] = post
  writeDraftCache(cache)
}

function getDraftFromCache(id: string): BlogPost | null {
  const cache = readDraftCache()
  return cache[id] || null
}

function getDraftListFromCache(): BlogPost[] {
  const cache = readDraftCache()
  return Object.values(cache)
}

function readBookmarkListsCache(): BookmarkListItem[] {
  if (!canUseLocalStorage()) return []
  try {
    const raw = window.localStorage.getItem(BOOKMARK_LIST_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as BookmarkListItem[]) : []
  } catch {
    return []
  }
}

function writeBookmarkListsCache(lists: BookmarkListItem[]) {
  if (!canUseLocalStorage()) return
  try {
    window.localStorage.setItem(BOOKMARK_LIST_CACHE_KEY, JSON.stringify(lists))
  } catch {
    // ignore
  }
}

function inferMediaType(fileNameOrUrl?: string): 'image' | 'video' | 'audio' {
  const value = (fileNameOrUrl || '').toLowerCase()
  if (/\.(mp4|mov|avi|mkv|webm)$/.test(value)) return 'video'
  if (/\.(mp3|wav|ogg|aac|m4a)$/.test(value)) return 'audio'
  return 'image'
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
    const res = await axiosClient.get('/blogs', {
      params: {
        ...(p.sort_by || p.sort_order
          ? { sort: `${p.sort_by || 'published_at'}:${p.sort_order || 'desc'}` }
          : undefined),
        ...(p.topic_id ? { topic_id: p.topic_id } : undefined),
        ...(p.tag_id ? { 'tag_ids[]': [p.tag_id] } : undefined),
      },
    })

    const normalized = normalizeListResponse(res.data)
    const cachedDrafts = getDraftListFromCache()
    const mergedById = new Map<string, BlogPost>()
    normalized.posts.forEach((post) => {
      if (post?.id) mergedById.set(post.id, post)
    })
    cachedDrafts.forEach((post) => {
      if (post?.id) mergedById.set(post.id, post)
    })
    const mergedPosts = Array.from(mergedById.values())

    const keyword = (p.search || p.q || '').trim().toLowerCase()
    const filtered = mergedPosts.filter((post) => {
      if (p.status && String(post.status || '').toLowerCase() !== p.status.toLowerCase()) return false
      if (!keyword) return true
      const searchTarget = [post.title, post.slug, post.short_description, post.brief_description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return searchTarget.includes(keyword)
    })

    const limit = p.limit ?? p.page_size ?? filtered.length
    const offset = p.offset ?? (p.page && p.page_size ? (p.page - 1) * p.page_size : 0)
    return { posts: filtered.slice(offset, offset + limit), total: filtered.length, limit, offset }
  },

  getPostById: async (id: string): Promise<BlogPost> => {
    const cached = getDraftFromCache(id)
    if (cached) return cached

    try {
      // Nhiều backend vẫn hỗ trợ route này cho owner draft.
      const byId = await axiosClient.get(`/blogs/${id}`)
      const normalized = normalizePost(unwrap<any>(byId.data))
      upsertDraftCache(normalized)
      return normalized
    } catch {
      // fallback
    }

    const res = await axiosClient.get('/blogs')
    const list = normalizeListResponse(res.data).posts
    const matched = list.find((post) => post.id === id)
    if (matched) {
      upsertDraftCache(matched)
      return matched
    }

    throw new Error('Không tìm thấy bài viết theo id')
  },

  getPostBySlug: async (slug: string): Promise<BlogPost> => {
    const res = await axiosClient.get(`/blogs/slug/${encodeURIComponent(slug)}`)
    return normalizePost(unwrap<any>(res.data))
  },

  createPost: async (payload: CreateBlogPostRequest): Promise<BlogPost> => {
    const res = await axiosClient.post('/blogs', {
      title: payload.title,
      content: payload.content,
      short_description: payload.short_description ?? payload.brief_description,
      tags: payload.tags,
      topic_id: payload.topic_id,
    })
    const created = normalizePost(unwrap<any>(res.data))
    upsertDraftCache(created)
    return created
  },

  updatePost: async (id: string, payload: UpdateBlogPostRequest): Promise<BlogPost> => {
    const res = await axiosClient.put(`/blogs/${id}`, {
      title: payload.title,
      short_description: payload.short_description ?? payload.brief_description,
      tags: payload.tags,
      topic_id: payload.topic_id,
    })
    const updated = normalizePost(unwrap<any>(res.data))
    upsertDraftCache(updated)
    return updated
  },

  updateContent: async (id: string, content: string): Promise<BlogPost> => {
    const res = await axiosClient.put(`/blogs/${id}/content`, { content })
    return unwrap<BlogPost>(res.data)
  },

  uploadMedia: async (
    id: string,
    file: File,
  ): Promise<{ url?: string; file_url?: string; post?: BlogPost } & Record<string, any>> => {
    const uploaded = await userService.uploadMedia(file)
    const uploadedUrl = uploaded?.file_url
    if (!uploadedUrl) {
      throw new Error('Upload media thành công nhưng không nhận được URL file')
    }

    const attachRes = await axiosClient.post(`/blogs/${id}/media`, {
      url: uploadedUrl,
      media_type: inferMediaType(file.name || uploadedUrl),
    })

    const attachedPost = normalizePost(unwrap<any>(attachRes.data))
    upsertDraftCache(attachedPost)
    return { url: uploadedUrl, file_url: uploadedUrl, post: attachedPost, raw: attachRes.data }
  },

  publish: async (id: string): Promise<BlogPost> => {
    const res = await axiosClient.patch(`/blogs/${id}/publish`)
    const published = normalizePost(unwrap<any>(res.data))
    upsertDraftCache(published)
    return published
  },

  getVersions: async (id: string): Promise<BlogVersionsResponse> => {
    const res = await axiosClient.get(`/blogs/${id}/versions`)
    const data = unwrap<any>(res.data)
    return {
      versions: data?.versions ?? data?.data?.versions ?? data ?? [],
      total: data?.total ?? data?.data?.total,
    }
  },

  bookmarkPost: async (id: string, payload?: BookmarkPayload): Promise<BookmarkItem> => {
    const res = await axiosClient.post(`/blogs/${id}/bookmark`, payload || {})
    return unwrap<BookmarkItem>(res.data)
  },

  getBookmarks: async (listId?: string): Promise<BlogPost[]> => {
    const params = listId ? { list_id: listId } : undefined
    let lastError: unknown
    for (const endpoint of ['/bookmarks', '/blogs/bookmarks']) {
      try {
        const res = await axiosClient.get(endpoint, { params })
        const data = unwrap<any>(res.data)
        const items = Array.isArray(data) ? data : data?.data ?? []
        return Array.isArray(items) ? items.map(normalizePost) : []
      } catch (error) {
        lastError = error
      }
    }
    throw lastError
  },

  createBookmarkList: async (name: string): Promise<BookmarkListItem> => {
    let created: BookmarkListItem | null = null
    let lastError: unknown
    for (const endpoint of ['/bookmarks/lists', '/blogs/bookmarks/lists']) {
      try {
        const res = await axiosClient.post(endpoint, { name })
        created = unwrap<BookmarkListItem>(res.data)
        break
      } catch (error) {
        lastError = error
      }
    }
    if (!created) throw lastError
    const existing = readBookmarkListsCache()
    const merged = [created, ...existing.filter((item) => item.id !== created.id)]
    writeBookmarkListsCache(merged)
    return created
  },

  getBookmarkLists: async (): Promise<BookmarkListItem[]> => {
    return readBookmarkListsCache()
  },
}

