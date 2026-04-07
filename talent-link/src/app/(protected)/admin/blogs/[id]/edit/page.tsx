'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Loader2, Save, Upload, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'

import { blogService } from '@/services/blogService'
import type { BlogPost, UpdateBlogPostRequest } from '@/types/blog'
import { resolveMediaUrl } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { BlogVersion } from '@/types/blog'

export default function AdminBlogEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id ?? ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [versions, setVersions] = useState<BlogVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [topicId, setTopicId] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [content, setContent] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!id) return
      try {
        setLoading(true)
        const data = await blogService.getPostById(id)
        if (!active) return
        setPost(data)
        setTitle(data.title || '')
        setShortDescription(data.short_description || data.brief_description || '')
        setTopicId(data.topic_id || '')
        setTagsInput(Array.isArray(data.tags) ? data.tags.join(', ') : '')
        setContent(data.content || '')
      } catch (e) {
        console.error(e)
        toast.error('Không thể tải bài viết')
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [id])

  const canSave = useMemo(() => {
    if (!title.trim()) return false
    if (content.trim().length < 20) return false
    return true
  }, [title, content])

  const handleSave = async () => {
    if (!post) return
    if (!canSave) {
      toast.error('Vui lòng điền đủ thông tin (nội dung tối thiểu 20 ký tự).')
      return
    }

    setSaving(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      const payload: UpdateBlogPostRequest = {
        title: title.trim(),
        short_description: shortDescription.trim() || undefined,
        topic_id: topicId.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        content: content.trim(),
      }

      const updated = await blogService.updatePost(post.id, payload as UpdateBlogPostRequest)

      // Some backends require content to be updated separately
      if (payload.content) {
        try {
          await blogService.updateContent(post.id, payload.content)
        } catch {
          // ignore; updatePost might already include content
        }
      }

      setPost((prev) => ({ ...(prev || updated), ...updated, ...payload }))
      toast.success('Đã lưu thay đổi')
    } catch (e) {
      console.error(e)
      toast.error('Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!post) return
    setPublishing(true)
    try {
      const updated = await blogService.publish(post.id)
      setPost((prev) => ({ ...(prev || updated), ...updated }))
      toast.success('Đã publish bài viết')
    } catch (e) {
      console.error(e)
      toast.error('Publish thất bại')
    } finally {
      setPublishing(false)
    }
  }

  const handleSelectCover = async (file?: File) => {
    if (!post || !file) return
    setUploading(true)
    try {
      const res = await blogService.uploadMedia(post.id, file)
      const url = res?.url || res?.file_url || res?.data?.url || res?.data?.file_url
      if (url) {
        await blogService.updatePost(post.id, { cover_image_url: url })
        setPost((prev) => (prev ? { ...prev, cover_image_url: url } : prev))
      }
      toast.success('Upload ảnh thành công')
    } catch (e) {
      console.error(e)
      toast.error('Upload ảnh thất bại')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const loadVersions = async (postId: string) => {
    setLoadingVersions(true)
    try {
      const res = await blogService.getVersions(postId)
      const list = Array.isArray(res.versions) ? res.versions : []
      setVersions(list)
    } catch (e) {
      console.error(e)
      toast.error('Không thể tải lịch sử phiên bản')
    } finally {
      setLoadingVersions(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Đang tải...
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-xl border-border/50 bg-card/70 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-5">Không tìm thấy bài viết</p>
            <Button variant="outline" asChild>
              <Link href="/admin/blogs">Quay lại</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = (post.status || 'draft').toLowerCase()
  const isPublished = status === 'published'
  const cover = post.cover_image_url ? resolveMediaUrl(post.cover_image_url) : ''

  return (
    <div className="min-h-screen relative">
      <div className="mx-auto w-full max-w-[1100px] px-4 md:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Button variant="ghost" asChild className="-ml-2">
            <Link href="/admin/blogs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant={isPublished ? 'default' : 'secondary'} className="capitalize">
              {status}
            </Badge>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/blogs/${post.slug}`} target="_blank">
                <ExternalLink className="w-4 h-4" />
                Xem public
              </Link>
            </Button>
          </div>
        </div>

        <Card className="shadow-lg border-border/50 bg-card/70 backdrop-blur-sm">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-2xl font-semibold">Chỉnh sửa bài viết</CardTitle>
            <p className="text-sm text-muted-foreground">
              Lưu thay đổi trước, sau đó publish khi sẵn sàng.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="editor">
              <TabsList className="mb-6">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger
                  value="versions"
                  onClick={() => {
                    if (versions.length === 0 && post?.id) {
                      loadVersions(post.id)
                    }
                  }}
                >
                  Version history
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="mt-0">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nhập tiêu đề..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shortDescription">short_description</Label>
                      <Input
                        id="shortDescription"
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        placeholder="Mô tả ngắn..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topicId">topic_id</Label>
                      <Input
                        id="topicId"
                        value={topicId}
                        onChange={(e) => setTopicId(e.target.value)}
                        placeholder="topic_id..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagsInput">tags (comma separated)</Label>
                      <Input
                        id="tagsInput"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="tag-1, tag-2, tag-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">content *</Label>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={14}
                        minLength={20}
                        placeholder="Nội dung bài viết..."
                      />
                      {content.trim().length > 0 && content.trim().length < 20 && (
                        <p className="text-xs text-destructive">
                          Nội dung phải tối thiểu 20 ký tự ({content.trim().length}/20)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>Ảnh cover</Label>
                      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-border/50 bg-card/50">
                        {cover ? (
                          <Image src={cover} alt="Cover" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                            Chưa có ảnh
                          </div>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => handleSelectCover(e.target.files?.[0])}
                      />

                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full gap-2"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Đang upload...' : 'Upload ảnh cover'}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handleSave}
                        disabled={!canSave || saving}
                        className="w-full gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>

                      <Button
                        onClick={handlePublish}
                        disabled={isPublished || publishing}
                        variant="outline"
                        className="w-full gap-2 hover:bg-primary/10"
                      >
                        {publishing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UploadCloud className="w-4 h-4" />
                        )}
                        {isPublished ? 'Đã publish' : publishing ? 'Đang publish...' : 'Publish'}
                      </Button>

                      <Button variant="ghost" className="w-full" onClick={() => router.refresh()}>
                        Làm mới
                      </Button>
                    </div>

                    {/* Media */}
                    <div className="space-y-3 rounded-lg border border-border/50 p-4 bg-card/40">
                      <h4 className="font-semibold">Media</h4>
                      {!post.media || post.media.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No media</p>
                      ) : (
                        <div className="space-y-3">
                          {post.media.map((m) => (
                            <div key={m.id} className="rounded-md border border-border/50 p-3 text-sm">
                              <div><span className="font-medium">id:</span> {m.id}</div>
                              <div><span className="font-medium">media_type:</span> {m.media_type}</div>
                              <div className="break-all"><span className="font-medium">url:</span> {m.url}</div>
                              <div><span className="font-medium">post_id:</span> {m.post_id || '-'}</div>
                              <div><span className="font-medium">embed_id:</span> {m.embed_id || '-'}</div>
                              <div>
                                <span className="font-medium">duration_seconds:</span> {m.duration_seconds ?? 0}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Post metadata */}
                    <div className="space-y-3 rounded-lg border border-border/50 p-4 bg-card/40">
                      <h4 className="font-semibold">Post metadata</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div><span className="font-medium">id:</span> {post.id}</div>
                        <div><span className="font-medium">author_id:</span> {post.author_id || '-'}</div>
                        <div><span className="font-medium">title:</span> {post.title}</div>
                        <div><span className="font-medium">slug:</span> {post.slug}</div>
                        <div><span className="font-medium">topic_id:</span> {post.topic_id || '-'}</div>
                        <div><span className="font-medium">status:</span> {post.status || '-'}</div>
                        <div><span className="font-medium">created_at:</span> {post.created_at || '-'}</div>
                        <div><span className="font-medium">updated_at:</span> {post.updated_at || '-'}</div>
                        <div><span className="font-medium">published_at:</span> {post.published_at || '-'}</div>
                        <div>
                          <span className="font-medium">short_description:</span>{' '}
                          {post.short_description || post.brief_description || '-'}
                        </div>
                        <div>
                          <span className="font-medium">tags:</span>{' '}
                          {post.tags && post.tags.length > 0 ? post.tags.join(', ') : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="versions" className="mt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Lịch sử phiên bản</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => post?.id && loadVersions(post.id)}
                      disabled={loadingVersions}
                    >
                      {loadingVersions ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang tải...
                        </>
                      ) : (
                        'Tải lại'
                      )}
                    </Button>
                  </div>

                  {loadingVersions ? (
                    <div className="text-sm text-muted-foreground">Đang tải lịch sử phiên bản...</div>
                  ) : versions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Chưa có dữ liệu version cho bài viết này.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((version, index) => (
                        <div
                          key={`${version.post_id || post.id}-${version.version ?? index}-${version.created_at ?? index}`}
                          className="rounded-lg border border-border/50 p-4 bg-card/40"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <span className="font-medium">version:</span> {version.version ?? '-'}
                            </div>
                            <div>
                              <span className="font-medium">auto_save:</span>{' '}
                              {version.auto_save === undefined ? '-' : String(version.auto_save)}
                            </div>
                            <div>
                              <span className="font-medium">created_at:</span>{' '}
                              {version.created_at || '-'}
                            </div>
                            <div>
                              <span className="font-medium">post_id:</span> {version.post_id || post.id}
                            </div>
                          </div>

                          <div className="text-sm mb-2">
                            <span className="font-medium">title:</span> {version.title || '-'}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">content:</span>
                            <pre className="mt-1 whitespace-pre-wrap text-xs bg-muted/50 rounded p-3">
                              {version.content || '-'}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

