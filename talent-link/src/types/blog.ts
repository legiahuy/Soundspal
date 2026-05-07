export type BlogPostStatus = 'draft' | 'published' | 'archived' | 'deleted'

export interface BlogPostMedia {
  id: string
  media_type: string
  url: string
  post_id?: string
  embed_id?: string
  duration_seconds?: number
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content?: string
  short_description?: string
  // Keep backward compatibility with older UI field name
  brief_description?: string
  author_id?: string
  topic_id?: string
  tags?: string[]
  media?: BlogPostMedia[]
  bookmark_count?: number
  comment_count?: number
  upvote_count?: number
  downvote_count?: number
  view_count?: number
  read_time?: number
  status?: BlogPostStatus | string
  created_at?: string
  updated_at?: string
  published_at?: string

  // Legacy/custom fields kept optional for existing admin forms
  cover_image_url?: string
  visibility?: 'public' | 'private' | 'unlisted' | string
}

export interface BlogCommentAudio {
  url?: string
  duration_seconds?: number
  marker_seconds?: number
}

export interface BlogComment {
  id: string
  author_id?: string
  post_id?: string
  content?: string
  created_at?: string
  updated_at?: string
  deleted_at?: string
  parent_id?: string
  root_parent_id?: string
  depth?: number
  timestamp_seconds?: number
  audio?: BlogCommentAudio
}

export interface CreateBlogCommentPayload {
  content: string
  parent_id?: string
  timestamp_seconds?: number
  audio_attachment?: BlogCommentAudio
}

export interface BlogListParams {
  limit?: number
  offset?: number
  page?: number
  page_size?: number
  search?: string
  q?: string
  status?: string
  tag_id?: string
  topic_id?: string
  sort_by?: string
  author_id?: string
  sort_order?: 'asc' | 'desc'
}

export interface BlogListResponse {
  posts: BlogPost[]
  total: number
  limit?: number
  offset?: number
}

export interface BlogSearchParams {
  q?: string
  topic_id?: string
  sort?: string
  'tag_ids[]'?: string[]
  page?: number
  page_size?: number
}

export interface BlogSearchResponse {
  data: {
    items: BlogPost[]
    meta: {
      page: number
      page_size: number
      total: number
    }
  }
  message: string
}

export interface BlogDetailResponse {
  data: BlogPost
  message: string
}

export interface CreateBlogPostRequest {
  title: string
  content: string
  short_description?: string
  tags?: string[]
  topic_id?: string
  slug?: string
  brief_description?: string
  status?: BlogPostStatus | string
  visibility?: string
  cover_image_url?: string
}

export type UpdateBlogPostRequest = Partial<CreateBlogPostRequest>

export interface BlogVersion {
  id?: string
  post_id?: string
  created_at?: string
  content?: string
  title?: string
  brief_description?: string
  auto_save?: boolean
  version?: number
}

export interface BlogVersionsResponse {
  versions: BlogVersion[]
  total?: number
}

export interface BookmarkPayload {
  list_id?: string
}

export interface BookmarkItem {
  created_at?: string
  list_id?: string
  post_id?: string
  user_id?: string
}

export interface BookmarkListItem {
  id: string
  name: string
  user_id?: string
  created_at?: string
}
