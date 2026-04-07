'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
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
  const [tagsInput, setTagsInput] = useState('')
  const [content, setContent] = useState('')

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false
    if (content.trim().length < 20) return false
    return true
  }, [title, content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      toast.error('Vui lòng điền đủ thông tin (nội dung tối thiểu 20 ký tự).')
      return
    }

    setSubmitting(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      const payload: CreateBlogPostRequest = {
        title: title.trim(),
        content: content.trim(),
        short_description: shortDescription.trim() || undefined,
        topic_id: topicId.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        status: 'draft',
        visibility: 'public',
      }

      const created = await blogService.createPost(payload)
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
            <CardTitle className="text-2xl font-semibold">Tạo bài viết mới</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tạo draft trước, sau đó upload ảnh và publish ở trang chỉnh sửa.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài viết..."
                    required
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

