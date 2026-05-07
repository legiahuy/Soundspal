'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  ImagePlus, 
  Loader2, 
  Plus, 
  Save, 
  Settings, 
  Tag, 
  Type, 
  Upload, 
  X,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

import { blogService } from '@/services/blogService'
import type { CreateBlogPostRequest } from '@/types/blog'
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
    loading: () => <div className="h-96 w-full animate-pulse bg-muted rounded-xl" />,
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

function SectionCard({ title, description, action, children }: SectionCardProps) {
  return (
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
}

export default function BlogNewPage() {
  const t = useTranslations('BlogEditor')
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
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

  const tagList = useMemo(() => tags.filter(Boolean), [tags])

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

  const imageHandler = useCallback(() => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      // In a real app, you might upload to S3/Cloudinary here.
      // But let's provide a better UX: convert to base64 so they can see it.
      const reader = new FileReader()
      reader.onload = () => {
        const quill = quillRef.current?.getEditor()
        const range = quill.getSelection()
        quill.insertEmbed(range.index, 'image', reader.result)
      }
      reader.readAsDataURL(file)
      toast.info(t('messages.imageInserted'))
    }
  }, [t])

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'code-block'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [imageHandler])

  const canSubmit = title.trim() !== ''

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(t('messages.validationError'))
      return
    }

    setSubmitting(true)
    try {
      const payload: CreateBlogPostRequest = {
        title: title.trim(),
        content: contentHtml,
        short_description: shortDescription.trim(),
        topic_id: topicId.trim(),
        tags: tagList,
      }

      const created = await blogService.createPost(payload)
      
      if (coverFile) {
        setUploading(true)
        try {
          await blogService.uploadMedia(created.id, coverFile)
        } catch (uploadError) {
          console.error(uploadError)
          toast.error(t('sections.media.uploadError'))
        } finally {
          setUploading(false)
        }
      }
      
      toast.success(t('messages.createSuccess'))
      router.push(`/blogs/edit/${created.id}`)
    } catch (err) {
      console.error(err)
      toast.error(t('messages.createError'))
    } finally {
      setSubmitting(false)
    }
  }

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
                <span>{t('createNew')}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1E1E1E]">
                {title || t('createNew')}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {t('subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white" asChild>
                <Link href="/blogs/manage">{t('cancel')}</Link>
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!canSubmit || submitting} 
                className="rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all px-6"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {t('save')}
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
                    {tagList.map((tag, index) => (
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
                  {coverPreview ? (
                    <Image src={coverPreview} alt="Cover Preview" fill className="object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="p-3 rounded-full bg-white/80 shadow-sm">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-medium">{t('sections.media.hint')}</p>
                    </div>
                  )}
                  {coverPreview && (
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

            {/* Hint Card */}
            <Card className="border-primary/10 bg-primary/5 shadow-inner">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Type className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">{t('messages.newDraft')}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      You are creating a new post. It will be saved as a draft initially.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
