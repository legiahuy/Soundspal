'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bold,
  Eye,
  Heading1,
  ImagePlus,
  Italic,
  Link2,
  Loader2,
  Quote,
  Save,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import { blogService } from '@/services/blogService'
import type { BlogPost, UpdateBlogPostRequest } from '@/types/blog'
import { resolveMediaUrl } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BlogVersion } from '@/types/blog'

export default function UserBlogEditPage() {
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
  const [contentHtml, setContentHtml] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!id) return
      try {
        setLoading(true)
        console.log('Loading post with id:', id)
        const data = await blogService.getPostById(id)
        console.log('Loaded post:', data)
        if (!active) return
        setPost(data)
        setTitle(data.title || '')
        setShortDescription(data.short_description || data.brief_description || '')
        setTopicId(data.topic_id || '')
        setTagsInput(Array.isArray(data.tags) ? data.tags.join(', ') : '')
        setContentHtml(data.content || '')
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
    const plain = contentHtml.replace(/<[^>]*>/g, '').trim()
    if (!title.trim()) return false
    if (plain.length < 20) return false
    return true
  }, [title, contentHtml])

  const exec = (command: string, value?: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    setContentHtml(editorRef.current.innerHTML)
  }

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
      }

      const updated = await blogService.updatePost(post.id, payload as UpdateBlogPostRequest)

      const contentPayload = contentHtml.trim()
      if (contentPayload) {
        try {
          await blogService.updateContent(post.id, contentPayload)
        } catch {
          // ignore to avoid breaking metadata save
        }
      }

      setPost((prev) => ({ ...(prev || updated), ...updated, ...payload, content: contentPayload }))
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
      const url = res?.url || res?.file_url
      if (url) {
        setPost((prev) =>
          prev
            ? {
                ...prev,
                cover_image_url: url,
                media: [
                  ...(prev.media || []),
                  {
                    id: `local-media-${Date.now()}`,
                    media_type: 'image',
                    url,
                    post_id: prev.id,
                  },
                ],
              }
            : prev,
        )
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
              <Link href="/blogs/manage">Quay lại</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = (post.status || 'draft').toLowerCase()
  const isPublished = status === 'published'
  const cover = post.cover_image_url ? resolveMediaUrl(post.cover_image_url) : ''
  const tagList = tagsInput
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-[#FFFFFF] pt-24 md:pt-28">
      <div className="sticky top-0 z-20 border-b border-[#E7E7E7] bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1320px] px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="rounded-full">
              <Link href="/blogs/manage">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <p className="text-sm text-[#64748B]">
              {title || 'Untitled Draft'} - Last saved {post.updated_at ? 'recently' : 'just now'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full border-[#E7E7E7]" asChild>
              <Link href={`/blogs/${post.slug}`} target="_blank">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Link>
            </Button>
            <Button
              className="rounded-full bg-[#7D3BED] hover:bg-[#6c30d6]"
              onClick={handlePublish}
              disabled={isPublished || publishing}
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {isPublished ? 'Published' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
        <main className="space-y-6">
          <div className="relative w-full h-72 rounded-3xl overflow-hidden bg-[#F8F9FA]">
            {cover ? (
              <Image src={cover} alt="Cover" fill className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[#64748B]">No cover image</div>
            )}
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title of your masterpiece"
            className="h-16 border-0 bg-transparent text-5xl font-semibold shadow-none px-0 focus-visible:ring-0 placeholder:text-[#d3d3d3]"
          />

          <Input
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Short description..."
            className="h-11 rounded-xl border-[#E7E7E7] bg-[#F8F9FA] text-sm"
          />

          <div className="rounded-2xl border border-[#E7E7E7] bg-white overflow-hidden">
            <div className="border-b border-[#E7E7E7] bg-[#F8F9FA] px-3 py-2 flex items-center gap-1">
              <button className="rounded-md p-2 hover:bg-white" onClick={() => exec('bold')}><Bold className="h-4 w-4" /></button>
              <button className="rounded-md p-2 hover:bg-white" onClick={() => exec('italic')}><Italic className="h-4 w-4" /></button>
              <button className="rounded-md p-2 hover:bg-white" onClick={() => exec('formatBlock', 'h1')}><Heading1 className="h-4 w-4" /></button>
              <button className="rounded-md p-2 hover:bg-white" onClick={() => exec('formatBlock', 'blockquote')}><Quote className="h-4 w-4" /></button>
              <button className="rounded-md p-2 hover:bg-white" onClick={() => exec('createLink', window.prompt('Enter URL') || '')}><Link2 className="h-4 w-4" /></button>
              <button className="rounded-md p-2 hover:bg-white" onClick={() => fileInputRef.current?.click()}><ImagePlus className="h-4 w-4" /></button>
            </div>

            <div className="relative">
              {!contentHtml.replace(/<[^>]*>/g, '').trim() && (
                <p className="pointer-events-none absolute left-4 top-4 text-[#c8c8c8] text-base">
                  Start typing your story...
                </p>
              )}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setContentHtml((e.currentTarget as HTMLDivElement).innerHTML)}
                className="min-h-[420px] px-4 py-4 text-base leading-8 text-[#1E1E1E] focus:outline-none"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </div>
          </div>
        </main>

        <aside className="space-y-5">
          <Card className="bg-[#F8F9FA] border-[#E7E7E7] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs tracking-wide uppercase text-[#64748B]">Status & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span className="text-sm text-[#1E1E1E]">Current State</span>
                <Badge className="bg-[#f2e9ff] text-[#7D3BED]">{status}</Badge>
              </div>
              <div className="space-y-1">
                <Label htmlFor="topicId" className="text-xs text-[#64748B]">Topic</Label>
                <Input
                  id="topicId"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="bg-white border-[#E7E7E7]"
                  placeholder="engineering"
                />
              </div>
              <Button onClick={handleSave} disabled={!canSave || saving} className="w-full rounded-xl bg-[#e9e9e9] text-[#1E1E1E] hover:bg-[#dedede]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Draft
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#F8F9FA] border-[#E7E7E7] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs tracking-wide uppercase text-[#64748B]">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                id="tagsInput"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="bg-white border-[#E7E7E7]"
                placeholder="creativity, design"
              />
              <div className="flex flex-wrap gap-2">
                {tagList.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#efe7ff] text-[#7D3BED] px-3 py-1 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F8F9FA] border-[#E7E7E7] rounded-2xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs tracking-wide uppercase text-[#64748B]">Media Assets</CardTitle>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-[#7D3BED]" onClick={() => fileInputRef.current?.click()}>
                Browse
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => handleSelectCover(e.target.files?.[0])}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white border border-[#E7E7E7]">
                  {cover ? <Image src={cover} alt="cover" fill className="object-cover" /> : null}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border border-dashed border-[#E7E7E7] bg-white text-[#b0b0b0] text-3xl flex items-center justify-center"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : '+'}
                </button>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full rounded-xl border-[#E7E7E7]"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload cover
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#F8F9FA] border-[#E7E7E7] rounded-2xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs tracking-wide uppercase text-[#64748B]">Version History</CardTitle>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-[#7D3BED]" onClick={() => loadVersions(post.id)} disabled={loadingVersions}>
                Reload
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingVersions && <p className="text-xs text-[#64748B]">Loading...</p>}
              {!loadingVersions && versions.length === 0 && (
                <p className="text-xs text-[#64748B]">No versions yet.</p>
              )}
              {versions.slice(0, 5).map((version, index) => (
                <div key={`${version.version ?? index}-${version.created_at ?? index}`} className="flex items-start gap-2 text-xs text-[#64748B]">
                  <span className={`mt-1.5 h-2 w-2 rounded-full ${index === 0 ? 'bg-[#7D3BED]' : 'bg-[#d1d1d1]'}`} />
                  <div>
                    <p className="text-[#1E1E1E] font-medium">
                      {version.auto_save ? 'Auto-save' : `Version ${version.version ?? '-'}`}
                    </p>
                    <p>{version.created_at || 'unknown time'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
