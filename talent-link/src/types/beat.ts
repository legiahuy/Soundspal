// Beat Battle Types based on Beat Battle API

export interface Beat {
  id: string
  creator_id: string
  creator_username: string
  title: string
  description: string
  audio_url: string
  cover_image_url: string
  genre: string
  bpm: number | null
  key_signature: string
  duration_seconds: number
  is_active: boolean
  entry_count: number
  created_at: string
  updated_at: string
}

export interface BeatEntry {
  id: string
  beat_id: string
  user_id: string
  username: string
  display_name: string
  audio_url: string
  pitch_score: number | null
  rhythm_score: number | null
  tone_score: number | null
  expression_score: number | null
  stability_score: number | null
  total_score: number | null
  normalized_score: number | null
  explanation: string
  scored_at: string | null
  vote_count: number
  created_at: string
}

export interface BeatListPagination {
  current_page: number
  page_size: number
  total_pages: number
  total_items: number
}

export interface BeatListResponse {
  beats: Beat[]
  pagination: BeatListPagination
}

export interface LeaderboardResponse {
  beat_id: string
  entries: BeatEntry[]
}

export interface UserSingingStats {
  user_id: string
  total_entries: number
  average_score: number
  best_score: number
  total_votes_received: number
}

// Request / Payload types

export interface BeatListParams {
  genre?: string
  page?: number
  page_size?: number
}

export interface CreateBeatPayload {
  audio: File
  title: string
  description?: string
  genre?: string
  bpm?: number
  key_signature?: string
}

export interface UpdateBeatPayload {
  title?: string
  description?: string
  genre?: string
  bpm?: number
  key_signature?: string
  is_active?: boolean
}

export interface SubmitEntryPayload {
  audio: File
}

export interface LeaderboardParams {
  limit?: number
  offset?: number
}

export type VoteType = 'up' | 'down'

export interface VoteEntryPayload {
  vote_type: VoteType
}
