'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, Save, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { blogService } from '@/services/blogService'
import type { CreateBlogPostRequest } from '@/types/blog'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminBlogNewPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [topicId, setTopicId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [content, setContent] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const normalizedTags = useMemo(() => tags.filter(Boolean), [tags])

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false
    if (!shortDescription.trim()) return false
    if (!topicId.trim()) return false
    if (normalizedTags.length === 0) return false
    if (content.trim().length < 20) return false
    return true
  }, [title, shortDescription, topicId, normalizedTags, content])

  const addTag = () => {
    const value = currentTag.trim()
    if (!value) return
    if (tags.some((item) => item.toLowerCase() === value.toLowerCase())) {
      toast.error('Tag đã tồn tại')
      return
    }
    setTags((prev) => [...prev, value])
    setCurrentTag('')
  }

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index))
  }

  const onPickCover = (file?: File) => {
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      toast.error('Vui lòng điền đủ thông tin (nội dung tối thiểu 20 ký tự).')
      return
    }

    setSubmitting(true)
    try {
      const payload: CreateBlogPostRequest = {
        title: title.trim(),
        content: content.trim(),
        short_description: shortDescription.trim(),
        topic_id: topicId.trim(),
        tags: normalizedTags,
      }

      const created = await blogService.createPost(payload)
      if (coverFile) {
        try {
          const uploaded = await blogService.uploadMedia(created.id, coverFile)
          if (!uploaded?.url && !uploaded?.file_url) {
            toast.error('Upload ảnh cover thất bại')
          }
        } catch (uploadError) {
          console.error(uploadError)
          toast.error('Đã tạo bài viết nhưng upload ảnh cover thất bại')
        }
      }
      toast.success('Tạo bài viết thành công')
      router.push(`/admin/blogs/${created.id}/edit`)
    } catch (err) {
      console.error(err)
      toast.error('Tạo bài viết thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="mx-auto w-full max-w-[1100px] px-4 md:px-6 py-10">
        <Button variant="ghost" asChild className="mb-6 -ml-2">
          <Link href="/admin/blogs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Link>
        </Button>

        <Card className="shadow-lg border-border/50 bg-card/70 backdrop-blur-sm">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-2xl font-semibold">Create Blog Article</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề bài viết (title) *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài viết..."
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="shortDescription">Mô tả ngắn*</Label>
                  <Input
                    id="shortDescription"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Tóm tắt ngắn nội dung chính của bài viết..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topicId">Chủ đề*</Label>
                  <Input
                    id="topicId"
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    placeholder="engineering, music-trend..."
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="currentTag">Thẻ (tags) *</Label>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <Input
                      id="currentTag"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                      placeholder="Nhập tag rồi bấm Enter"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm
                    </Button>
                  </div>
                  {normalizedTags.length > 0 && (
                    <div className="space-y-2">
                      {normalizedTags.map((tag, index) => (
                        <div
                          key={`${tag}-${index}`}
                          className="flex items-center gap-2 rounded-md bg-muted/70 p-3"
                        >
                          <span className="text-primary">#</span>
                          <span className="flex-1 text-sm">{tag}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeTag(index)}
                            aria-label="Remove tag"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="content">Nội dung bài viết*</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nhập nội dung bài viết..."
                    rows={12}
                    minLength={20}
                    required
                  />
                  {content.trim().length > 0 && content.trim().length < 20 && (
                    <p className="text-xs text-destructive">
                      Nội dung phải tối thiểu 20 ký tự ({content.trim().length}/20)
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Ảnh cover</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => onPickCover(e.target.files?.[0])}
                  />
                  <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border/70 p-4">
                    {coverPreview ? (
                      <div className="relative h-52 w-full overflow-hidden rounded-lg bg-muted">
                        <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-muted/60 text-sm text-muted-foreground">
                        Chưa chọn ảnh cover
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full md:w-fit"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {coverFile ? 'Đổi ảnh cover' : 'Chọn ảnh cover'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button type="button" variant="outline" className="w-full sm:flex-1" asChild>
                  <Link href="/admin/blogs">Hủy</Link>
                </Button>
                <Button type="submit" className="w-full sm:flex-1" disabled={!canSubmit || submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Tạo draft
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

