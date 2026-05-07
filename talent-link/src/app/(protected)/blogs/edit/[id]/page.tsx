'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import {
  ArrowLeft,
  Eye,
  ImagePlus,
  Loader2,
  Save,
  Upload,
  ChevronLeft,
  Settings,
  FileText,
  Tag,
  History,
  Plus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { blogService } from '@/services/blogService'
import type { BlogPost, UpdateBlogPostRequest, BlogVersion } from '@/types/blog'
import { resolveMediaUrl } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new')
    return ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />
  },
  {
    ssr: false,
    loading: () => <div className="h-[400px] w-full animate-pulse bg-muted rounded-xl" />,
  }
)
import 'react-quill-new/dist/quill.snow.css'

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'link',
  'image',
  'code-block',
]

interface SectionCardProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}

const SectionCard = ({ title, description, action, children }: SectionCardProps) => (
  <Card className="border-border/50 shadow-sm overflow-hidden bg-white">
    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between border-b border-border/30 bg-muted/5 pb-6">
      <div>
        <CardTitle className="text-xl font-bold text-[#1E1E1E]">{title}</CardTitle>
        {description ? <CardDescription className="text-sm mt-1">{description}</CardDescription> : null}
      </div>
      {action}
    </CardHeader>
    <CardContent className="p-6 space-y-6">{children}</CardContent>
  </Card>
)

export default function UserBlogEditPage() {
  const t = useTranslations('BlogEditor')
  const { id } = useParams()
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [topicId, setTopicId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const quillRef = useRef<any>(null)

  const [versions, setVersions] = useState<BlogVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  const fetchPost = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await blogService.getPostById(id as string)
      setPost(data)
      setTitle(data.title || '')
      setShortDescription(data.brief_description || '')
      setTopicId(data.topic_id || '')
      setTags(data.tags || [])
      setContentHtml(data.content || '')
      if (data.cover_image_url) {
        setCoverPreview(resolveMediaUrl(data.cover_image_url))
      }
    } catch (err) {
      console.error(err)
      toast.error(t('messages.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const loadVersions = async (postId: string) => {
    setLoadingVersions(true)
    try {
      const data = await blogService.getVersions(postId)
      setVersions(data.versions)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleSelectCover = (file?: File) => {
    if (!file) return
    setCoverFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const addTag = () => {
    const val = currentTag.trim()
    if (val && !tags.includes(val)) {
      setTags([...tags, val])
      setCurrentTag('')
    }
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!post) return
    setSaving(true)
    try {
      let finalCoverUrl = post.cover_image_url
      if (coverFile) {
        try {
          const uploadRes = await blogService.uploadMedia(post.id, coverFile)
          finalCoverUrl = uploadRes.url
        } catch (uploadError) {
          console.error(uploadError)
          toast.error(t('sections.media.uploadError'))
        }
      }

      const req: UpdateBlogPostRequest = {
        title,
        brief_description: shortDescription,
        content: contentHtml,
        topic_id: topicId,
        tags: tags,
        cover_image_url: finalCoverUrl,
      }

      await blogService.updatePost(post.id, req)
      toast.success(t('messages.updateSuccess'))
      await fetchPost()
    } catch (err) {
      console.error(err)
      toast.error(t('messages.updateError'))
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!post) return
    setPublishing(true)
    try {
      await blogService.publish(post.id)
      toast.success(t('messages.publishSuccess'))
      await fetchPost()
    } catch (err) {
      console.error(err)
      toast.error(t('messages.publishError'))
    } finally {
      setPublishing(false)
    }
  }

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'code-block'],
        ['clean'],
      ],
    }),
    []
  )

  const canSave = title.trim() !== ''

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">{t('messages.loading')}</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4">
        <Card className="max-w-md w-full border-border/40 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="pt-12 pb-10 px-8 text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('messages.notFound')}</h2>
            <p className="text-muted-foreground mb-8">{t('messages.notFoundDesc')}</p>
            <Button variant="default" size="lg" asChild className="rounded-full px-8">
              <Link href="/blogs/manage">{t('messages.backToManage')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = (post.status || 'draft').toLowerCase()
  const isPublished = status === 'published'
  const cover = coverPreview || ''

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Hero Section - Matches Profile Settings Style */}
      <section className="relative border-b pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden bg-linear-to-br from-primary/15 via-primary/8 to-primary/5">
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-primary/10 to-transparent" />
        
        <div className="relative mx-auto w-full max-w-[1320px] px-4 md:px-6 z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Link href="/blogs/manage" className="hover:text-primary transition-colors flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  {t('messages.backToManage')}
                </Link>
                <span>/</span>
                <span>{t('editPost')}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1E1E1E]">
                {title || t('messages.newDraft')}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {t('subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-border/30 backdrop-blur-sm">
                <div className={`h-2 w-2 rounded-full ${isPublished ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{status}</span>
              </div>
              
              <Button variant="outline" className="rounded-xl bg-white/50 backdrop-blur-sm border-border/60 hover:bg-white" asChild>
                <Link href={`/blogs/${post.id}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  {t('messages.preview')}
                </Link>
              </Button>
              
              <Button
                className="rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all px-6"
                onClick={handlePublish}
                disabled={isPublished || publishing}
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isPublished ? t('messages.published') : t('messages.publish')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-8">
            {/* Main Content Section */}
            <SectionCard 
              title={t('sections.main.title')} 
              description={t('sections.main.description')}
              action={<FileText className="h-5 w-5 text-primary/40" />}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-[#1E1E1E]">{t('sections.main.labelTitle')}</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('sections.main.placeholderTitle')}
                    className="h-14 text-xl font-bold border-border/30 bg-muted/5 rounded-xl focus-visible:ring-primary/20 transition-all focus:bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortDesc" className="text-sm font-semibold text-[#1E1E1E]">{t('sections.main.labelShortDesc')}</Label>
                  <Textarea
                    id="shortDesc"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder={t('sections.main.placeholderShortDesc')}
                    className="min-h-[100px] border-border/30 bg-muted/5 rounded-xl focus-visible:ring-primary/20 transition-all duration-300 focus:min-h-[150px] focus:bg-white"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard 
              title={t('sections.main.labelContent')} 
              description={t('sections.main.placeholderContent')}
              action={<Settings className="h-5 w-5 text-primary/40" />}
            >
              <div className="bg-white rounded-xl overflow-hidden border border-border/30">
                <ReactQuill
                  forwardedRef={quillRef}
                  theme="snow"
                  value={contentHtml}
                  onChange={setContentHtml}
                  modules={modules}
                  formats={quillFormats}
                  placeholder={t('sections.main.placeholderContent')}
                  className="editor-quill"
                />
              </div>
              <style jsx global>{`
                .editor-quill .ql-toolbar.ql-snow {
                  border: none;
                  border-bottom: 1px solid hsl(var(--border) / 0.5);
                  background-color: hsl(var(--muted) / 0.2);
                  padding: 12px;
                }
                .editor-quill .ql-container.ql-snow {
                  border: none;
                  min-height: 500px;
                  font-size: 1.05rem;
                  line-height: 1.8;
                  color: #2D3748;
                }
                .editor-quill .ql-editor {
                  padding: 32px;
                }
                .editor-quill .ql-editor img {
                  width: 100% !important;
                  max-width: none !important;
                  height: auto !important;
                  border-radius: 1rem;
                  margin: 24px 0;
                  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                }
                .editor-quill .ql-editor.ql-blank::before {
                  left: 32px;
                  font-style: normal;
                  color: hsl(var(--muted-foreground));
                }
              `}</style>
            </SectionCard>

            {/* Settings Section */}
            <SectionCard 
              title={t('sections.settings.title')} 
              description={t('sections.settings.description')}
              action={<Tag className="h-5 w-5 text-primary/40" />}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-semibold text-[#1E1E1E]">{t('sections.settings.labelTopic')}</Label>
                  <Input
                    id="topic"
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    placeholder={t('sections.settings.placeholderTopic')}
                    className="h-12 border-border/30 bg-muted/5 rounded-xl focus:bg-white"
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="currentTag" className="text-sm font-semibold text-[#1E1E1E]">{t('sections.settings.labelTags')}</Label>
                  <div className="flex gap-2">
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
                      placeholder={t('sections.settings.placeholderTags')}
                      className="h-12 border-border/30 bg-muted/5 rounded-xl flex-1 focus:bg-white"
                    />
                    <Button type="button" variant="outline" onClick={addTag} className="h-12 rounded-xl border-dashed">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('sections.settings.add')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((tag, index) => (
                      <Badge 
                        key={`${tag}-${index}`} 
                        variant="secondary" 
                        className="rounded-full pl-3 pr-1 py-1.5 bg-primary/5 text-primary border-primary/10 flex items-center gap-1 group/tag"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="p-0.5 rounded-full hover:bg-primary/10 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* History Section */}
            <SectionCard 
              title={t('history.title')} 
              description={t('history.description')}
              action={<History className="h-5 w-5 text-primary/40" />}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => loadVersions(post.id)} 
                    disabled={loadingVersions}
                    className="rounded-full px-4"
                  >
                    {loadingVersions ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <History className="h-4 w-4 mr-2" />}
                    {t('history.update')}
                  </Button>
                  <p className="text-[10px] text-muted-foreground italic">
                    {t('history.lastVersions')}
                  </p>
                </div>
                
                {loadingVersions && (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{t('history.loading')}</p>
                  </div>
                )}
                
                {!loadingVersions && versions.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                    {t('history.empty')}
                  </div>
                )}
                
                {!loadingVersions && versions.length > 0 && (
                  <div className="divide-y divide-border/50 rounded-xl border border-border/30 bg-white shadow-sm overflow-hidden">
                    {versions.slice(0, 10).map((version, index) => (
                      <div key={`${version.version ?? index}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                          <div>
                            <p className="text-sm font-semibold text-[#1E1E1E]">{version.auto_save ? t('history.autoSave') : t('history.version', { num: version.version ?? '-' })}</p>
                            <p className="text-[10px] text-muted-foreground">{version.created_at || 'Unknown time'}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] rounded-full hover:bg-primary/10 hover:text-primary transition-colors">{t('history.view')}</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-8">
            {/* Cover Image Section */}
            <Card className="border-border/50 bg-white/50 backdrop-blur-sm overflow-hidden shadow-sm">
              <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('sections.media.title')}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div 
                  className="relative aspect-video rounded-2xl overflow-hidden bg-muted group cursor-pointer border-2 border-dashed border-border/50 hover:border-primary/50 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {cover ? (
                    <Image src={cover} alt="Cover Preview" fill className="object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="p-3 rounded-full bg-white/80 shadow-sm">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-medium">{t('sections.media.hint')}</p>
                    </div>
                  )}
                  {cover && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm" className="rounded-full shadow-lg">{t('sections.media.change')}</Button>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                
                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Supports: JPEG, PNG, WEBP. <br/>Recommended: 1200x630px.
                </p>
              </CardContent>
            </Card>

            {/* Actions Section */}
            <Card className="border-border/50 bg-primary/5 shadow-inner">
              <CardContent className="p-6 space-y-4">
                <Button 
                  onClick={handleSave} 
                  disabled={!canSave || saving} 
                  className="w-full h-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  {isPublished ? t('saveUpdate') : t('saveDraft')}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center px-4">
                  All changes are saved in the version history so you can review them later.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
