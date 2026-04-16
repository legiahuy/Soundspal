import axiosClient from '@/api/axios'
import { userService } from '@/services/userService'
import type {
  BlogComment,
  BlogListParams,
  BlogListResponse,
  BlogPost,
  BlogVersionsResponse,
  BookmarkItem,
  BookmarkListItem,
  BookmarkPayload,
  CreateBlogCommentPayload,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
} from '@/types/blog'

const BLOG_DRAFT_CACHE_KEY = 'talentlink_blog_draft_cache_v1'
const BOOKMARK_LIST_CACHE_KEY = 'talentlink_bookmark_lists_v1'

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: unknown }).data as T
  }
  return payload as T
}

type BlogVoteType = 'up' | 'down'

function normalizeVoteType(input: string): BlogVoteType {
  const raw = String(input || '').trim().toLowerCase()
  if (!raw) throw new Error('Vote type is required')

  if (raw === 'up' || raw === 'like' || raw === 'upvote') return 'up'
  if (raw === 'down' || raw === 'dislike' || raw === 'downvote') return 'down'

  throw new Error(`Invalid vote type: ${input}`)
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

function normalizePost(raw: unknown): BlogPost {
  const p = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>
  const media = (p.media as unknown) as unknown[]
  const firstMediaUrl = Array.isArray(media) && media.length > 0 ? (media[0] as { url?: string } | undefined)?.url : undefined
  return {
    id: p.id as string,
    title: p.title as string,
    slug: p.slug as string,
    content: p.content as string | undefined,
    short_description: p.short_description as string | undefined,
    brief_description: (p.brief_description ?? p.short_description) as string | undefined,
    author_id: p.author_id as string | undefined,
    topic_id: p.topic_id as string | undefined,
    tags: (Array.isArray(p.tags) ? p.tags : []) as string[],
    media: (Array.isArray(media) ? media : []) as unknown as BlogPost['media'],
    bookmark_count: (p.bookmark_count ?? 0) as number,
    comment_count: (p.comment_count ?? 0) as number,
    upvote_count: (p.upvote_count ?? 0) as number,
    downvote_count: (p.downvote_count ?? 0) as number,
    view_count: (p.view_count ?? 0) as number,
    read_time: (p.read_time ?? 0) as number,
    status: p.status as BlogPost['status'],
    created_at: p.created_at as string | undefined,
    updated_at: p.updated_at as string | undefined,
    published_at: p.published_at as string | undefined,
    cover_image_url: (p.cover_image_url ?? firstMediaUrl) as string | undefined,
    visibility: p.visibility as BlogPost['visibility'],
  }
}

function normalizeComment(raw: unknown): BlogComment {
  const comment =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>)
  return {
    id: comment.id as string,
    author_id: comment.author_id as string | undefined,
    post_id: comment.post_id as string | undefined,
    content: comment.content as string | undefined,
    created_at: comment.created_at as string | undefined,
    updated_at: comment.updated_at as string | undefined,
    deleted_at: comment.deleted_at as string | undefined,
    parent_id: comment.parent_id as string | undefined,
    root_parent_id: comment.root_parent_id as string | undefined,
    depth: comment.depth as number | undefined,
    timestamp_seconds: comment.timestamp_seconds as number | undefined,
    audio: (comment.audio ?? comment.audio_attachment) as BlogComment['audio'],
  }
}

function normalizeListResponse(raw: unknown, params?: BlogListParams): BlogListResponse {
  const topLevel = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>
  const data = unwrap<unknown>(raw)
  const dataObj = (data && typeof data === 'object' ? (data as Record<string, unknown>) : {}) as Record<string, unknown>

  const nestedData =
    dataObj.data && typeof dataObj.data === 'object' ? (dataObj.data as Record<string, unknown>) : undefined

  const posts = (dataObj.posts ??
    nestedData?.posts ??
    dataObj.items ??
    dataObj.results ??
    dataObj.data ??
    topLevel.data ??
    []) as unknown[]
  const total =
    (dataObj.total ??
      nestedData?.total ??
      (dataObj.pagination && typeof dataObj.pagination === 'object'
        ? (dataObj.pagination as Record<string, unknown>).total_items ??
          (dataObj.pagination as Record<string, unknown>).total
        : undefined) ??
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

    const authorFiltered = p.author_id
    ? mergedPosts.filter((post) => post.author_id === p.author_id)
    : mergedPosts

    const keyword = (p.search || p.q || '').trim().toLowerCase()
    const filtered = authorFiltered.filter((post) => {
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
      const normalized = normalizePost(unwrap<unknown>(byId.data))
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
    return normalizePost(unwrap<unknown>(res.data))
  },

  getComments: async (id: string): Promise<BlogComment[]> => {
    const res = await axiosClient.get(`/blogs/${id}/comments`)
    const data = unwrap<unknown>(res.data)
    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined
    const items = (obj?.data ?? obj?.comments ?? data ?? []) as unknown
    return Array.isArray(items) ? items.map(normalizeComment) : []
  },

  createComment: async (id: string, payload: CreateBlogCommentPayload): Promise<BlogComment> => {
    const res = await axiosClient.post(`/blogs/${id}/comments`, payload)
    const data = unwrap<unknown>(res.data)
    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined
    const created = obj?.data ?? obj?.comment ?? data
    return normalizeComment(created)
  },

  updateComment: async (commentId: string, payload: { content: string }): Promise<BlogComment> => {
    const res = await axiosClient.put(`/comments/${commentId}`, payload)
    const data = unwrap<unknown>(res.data)
    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined
    const updated = obj?.data ?? obj?.comment ?? data
    return normalizeComment(updated)
  },

  deleteComment: async (commentId: string): Promise<{ id?: string; message?: string } & Record<string, unknown>> => {
    const res = await axiosClient.delete(`/comments/${commentId}`)
    const payload = unwrap<unknown>(res.data)
    if (payload && typeof payload === 'object') return payload as { id?: string; message?: string } & Record<string, unknown>
    return { id: typeof payload === 'string' ? payload : undefined }
  },

  createPost: async (payload: CreateBlogPostRequest): Promise<BlogPost> => {
    const res = await axiosClient.post('/blogs', {
      title: payload.title,
      content: payload.content,
      short_description: payload.short_description ?? payload.brief_description,
      tags: payload.tags,
      topic_id: payload.topic_id,
    })
    const created = normalizePost(unwrap<unknown>(res.data))
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
    const updated = normalizePost(unwrap<unknown>(res.data))
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
  ): Promise<{ url?: string; file_url?: string; post?: BlogPost } & Record<string, unknown>> => {
    const uploaded = await userService.uploadMedia(file)
    const uploadedUrl = uploaded?.file_url
    if (!uploadedUrl) {
      throw new Error('Upload media thành công nhưng không nhận được URL file')
    }

    const attachRes = await axiosClient.post(`/blogs/${id}/media`, {
      url: uploadedUrl,
      media_type: inferMediaType(file.name || uploadedUrl),
    })

    const attachedPost = normalizePost(unwrap<unknown>(attachRes.data))
    upsertDraftCache(attachedPost)
    return { url: uploadedUrl, file_url: uploadedUrl, post: attachedPost, raw: attachRes.data }
  },

  publish: async (id: string): Promise<BlogPost> => {
    const res = await axiosClient.patch(`/blogs/${id}/publish`)
    const published = normalizePost(unwrap<unknown>(res.data))
    upsertDraftCache(published)
    return published
  },

  getVersions: async (id: string): Promise<BlogVersionsResponse> => {
    const res = await axiosClient.get(`/blogs/${id}/versions`)
    const data = unwrap<unknown>(res.data)
    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined
    return {
      versions: (obj?.versions ??
        (obj?.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>).versions : undefined) ??
        data ??
        []) as BlogVersionsResponse['versions'],
      total: (obj?.total ??
        (obj?.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>).total : undefined)) as
        | number
        | undefined,
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
        const data = unwrap<unknown>(res.data)
        const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined
        const items = (Array.isArray(data) ? data : (obj?.data ?? [])) as unknown
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

  votePost: async (id: string, voteType: string): Promise<BlogPost> => {
    const vote_type = normalizeVoteType(voteType)
    const res = await axiosClient.post(`/blogs/${id}/vote`, { vote_type })
    return normalizePost(unwrap<unknown>(res.data))
  },

  removeVote: async (id: string): Promise<BlogPost> => {
    const res = await axiosClient.delete(`/blogs/${id}/vote`)
    return normalizePost(unwrap<unknown>(res.data))
  },
}

