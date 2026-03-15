import axiosClient from '@/api/axios'
import type {
  Beat,
  BeatEntry,
  BeatListParams,
  BeatListResponse,
  CreateBeatPayload,
  UpdateBeatPayload,
  SubmitEntryPayload,
  LeaderboardParams,
  LeaderboardResponse,
  VoteEntryPayload,
  UserSingingStats,
} from '@/types/beat'

export const beatService = {
  // LIST BEATS (public)
  async listBeats(params?: BeatListParams): Promise<BeatListResponse> {
    const res = await axiosClient.get('/beats', { params })
    const data = res.data?.data ?? res.data
    return {
      beats: data.beats ?? [],
      pagination: data.pagination ?? {
        current_page: 1,
        page_size: 20,
        total_pages: 0,
        total_items: 0,
      },
    }
  },

  // GET SINGLE BEAT (public)
  async getBeat(id: string): Promise<Beat> {
    const res = await axiosClient.get(`/beats/${id}`)
    return res.data?.data ?? res.data
  },

  // CREATE BEAT (auth, multipart/form-data)
  async createBeat(payload: CreateBeatPayload): Promise<Beat> {
    const form = new FormData()
    form.append('audio', payload.audio)
    form.append('title', payload.title)
    if (payload.description) form.append('description', payload.description)
    if (payload.genre) form.append('genre', payload.genre)
    if (payload.bpm != null) form.append('bpm', String(payload.bpm))
    if (payload.key_signature) form.append('key_signature', payload.key_signature)

    const res = await axiosClient.post('/beats', form)
    return res.data?.data ?? res.data
  },

  // UPDATE BEAT (auth, JSON)
  async updateBeat(id: string, payload: UpdateBeatPayload): Promise<Beat> {
    const res = await axiosClient.put(`/beats/${id}`, payload)
    return res.data?.data ?? res.data
  },

  // DELETE BEAT (auth, 204 no body)
  async deleteBeat(id: string): Promise<void> {
    await axiosClient.delete(`/beats/${id}`)
  },

  // SUBMIT ENTRY (auth, multipart/form-data, async scoring)
  async submitEntry(beatId: string, payload: SubmitEntryPayload): Promise<BeatEntry> {
    const form = new FormData()
    form.append('audio', payload.audio)

    const res = await axiosClient.post(`/beats/${beatId}/entries`, form)
    return res.data?.data ?? res.data
  },

  // LEADERBOARD (public)
  async getLeaderboard(beatId: string, params?: LeaderboardParams): Promise<LeaderboardResponse> {
    const res = await axiosClient.get(`/beats/${beatId}/leaderboard`, { params })
    const data = res.data?.data ?? res.data
    return {
      beat_id: data.beat_id ?? beatId,
      entries: data.entries ?? [],
    }
  },

  // VOTE ENTRY (auth, JSON)
  async voteEntry(entryId: string, payload: VoteEntryPayload): Promise<void> {
    await axiosClient.post(`/beats/entries/${entryId}/vote`, payload)
  },

  // REMOVE VOTE (auth, 204 no body)
  async removeVote(entryId: string): Promise<void> {
    await axiosClient.delete(`/beats/entries/${entryId}/vote`)
  },

  // USER STATS (public)
  async getUserStats(userId: string): Promise<UserSingingStats> {
    const res = await axiosClient.get(`/beats/stats/${userId}`)
    return res.data?.data ?? res.data
  },
}
