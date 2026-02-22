'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
  CheckCheck,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTranslations } from 'next-intl'

export interface ThreadMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isOwn: boolean
  isRead?: boolean
  avatarUrl?: string
  attachmentUrl?: string
  attachmentType?: 'image' | 'video' | 'audio' | 'file'
  attachmentName?: string
}

interface MessageThreadProps {
  messages: ThreadMessage[]
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>
  onDeleteMessage?: (messageId: string) => Promise<void>
  otherParticipantAvatar?: string
}

const MessageThread = ({
  messages,
  onEditMessage,
  onDeleteMessage,
  otherParticipantAvatar,
}: MessageThreadProps) => {
  const t = useTranslations('MessagesPage')
  const commonT = useTranslations('Common')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Tìm tin nhắn cuối cùng của mình đã được đọc
  const lastReadOwnMessageId = messages
    .slice()
    .reverse()
    .find((msg) => msg.isOwn && msg.isRead)?.id

  // Debug log
  console.log('🔍 Debug read status:', {
    totalMessages: messages.length,
    ownMessages: messages.filter((m) => m.isOwn).length,
    readOwnMessages: messages.filter((m) => m.isOwn && m.isRead).length,
    lastReadOwnMessageId,
    hasAvatar: !!otherParticipantAvatar,
  })

  const handleStartEdit = (message: ThreadMessage) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  const handleSaveEdit = async (messageId: string) => {
    if (!onEditMessage || !editContent.trim()) return
    try {
      await onEditMessage(messageId, editContent.trim())
      setEditingMessageId(null)
      setEditContent('')
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!onDeleteMessage) return
    try {
      setIsDeleting(true)
      await onDeleteMessage(messageId)
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete message:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-0 w-full overflow-hidden pb-4">
      {messages.map((message, index) => {
        const showAttachment = message.attachmentUrl && message.attachmentType
        const isImage = message.attachmentType === 'image'
        const attachmentName = message.attachmentName || message.attachmentUrl?.split('/').pop()
        const isOwn = message.isOwn

        // Kiểm tra xem có phải tin nhắn đầu tiên hoặc người gửi khác với tin nhắn trước không
        const prevMessage = index > 0 ? messages[index - 1] : null
        const isFirstMessageFromSender = !prevMessage || prevMessage.senderId !== message.senderId

        // Kiểm tra xem tin nhắn tiếp theo có cùng người gửi không
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
        const isLastMessageFromSender = !nextMessage || nextMessage.senderId !== message.senderId

        return (
          <div
            key={message.id}
            className={`flex items-start gap-2 w-full ${isOwn ? 'justify-end' : 'justify-start'}`}
            style={{ marginTop: isFirstMessageFromSender ? '12px' : '2px' }}
          >
            {!isOwn && isFirstMessageFromSender && (
              <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-background shadow-md">
                <AvatarImage src={message.avatarUrl} alt={message.senderName} />
                <AvatarFallback className="bg-gradient-to-br from-primary/70 to-primary/50 text-primary-foreground text-xs">
                  {message.senderName?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            )}

            {!isOwn && !isFirstMessageFromSender && <div className="h-8 w-8 flex-shrink-0" />}

            <div
              className={`max-w-[70%] min-w-0 flex flex-col space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}
            >
              {!isOwn && isFirstMessageFromSender && (
                <p className="text-xs font-semibold text-muted-foreground break-words tracking-wide">
                  {message.senderName}
                </p>
              )}

              {editingMessageId === message.id ? (
                // Edit mode
                <div className="flex items-center gap-2 bg-muted p-2 rounded-2xl">
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSaveEdit(message.id)
                      } else if (e.key === 'Escape') {
                        handleCancelEdit()
                      }
                    }}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSaveEdit(message.id)}
                    className="h-8 w-8"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : showAttachment ? (
                <div
                  className={`space-y-2 max-w-full ${isOwn ? 'flex flex-col items-end pl-12' : 'flex flex-col items-start pr-12'}`}
                >
                  {isImage ? (
                    <div className={cn('group relative', isOwn && 'mr-7')}>
                      <img
                        src={message.attachmentUrl}
                        alt={t('attachedImage')}
                        className="max-h-64 rounded-2xl object-cover shadow-lg hover:shadow-xl transition-shadow border-2 border-background"
                      />
                      {/* Dropdown menu cho ảnh - chỉ hiển thị cho tin nhắn của mình */}
                      {isOwn && onDeleteMessage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirmId(message.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>{commonT('delete')}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ) : message.attachmentUrl &&
                    message.attachmentType &&
                    message.attachmentType !== 'image' ? (
                    <div className="group flex items-center gap-1 w-full">
                      <AttachmentLink
                        url={message.attachmentUrl}
                        type={message.attachmentType as 'video' | 'audio' | 'file'}
                        name={attachmentName}
                        isOwn={isOwn}
                      />
                      {/* Dropdown menu cho file - chỉ hiển thị cho tin nhắn của mình */}
                      {isOwn && onDeleteMessage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirmId(message.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>{commonT('delete')}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ) : null}
                  {message.content && (
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg ${
                        isOwn
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground'
                          : 'bg-card border border-border/50 text-foreground'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line break-words tracking-wide">
                        {message.content}
                      </p>
                    </div>
                  )}
                  {isLastMessageFromSender && (
                    <div
                      className={`flex items-center gap-1 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <p className={`text-xs tracking-wide text-muted-foreground`}>
                        {message.timestamp}
                      </p>
                      {isOwn && message.isRead && <CheckCheck className="h-3 w-3 text-primary" />}
                    </div>
                  )}
                </div>
              ) : (
                (() => {
                  // Check for job reference
                  const jobRefMatch = message.content?.match(/^:::JOB_REF:(\{.*?}):::\n([\s\S]*)$/)
                  if (jobRefMatch) {
                    try {
                      const jobData = JSON.parse(jobRefMatch[1])
                      const userMessage = jobRefMatch[2]
                      return (
                        <div className="w-full space-y-2">
                          {/* Job Card Widget */}
                          <div
                            className={cn(
                              'rounded-xl border p-4 flex flex-col gap-3 shadow-md max-w-sm bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg',
                              isOwn
                                ? 'bg-background border-border/50 ml-auto'
                                : 'bg-background border-border/50',
                            )}
                          >
                            <div className="flex items-start justify-between gap-3 border-b border-border/10 pb-2">
                              <div>
                                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                  <Briefcase className="w-3 h-3" />
                                  {t('jobApplication')}
                                </p>
                                <h4 className="font-bold text-base line-clamp-1 text-foreground">
                                  {jobData.title}
                                </h4>
                                <p className="text-sm font-medium text-muted-foreground">
                                  {jobData.companyName}
                                </p>
                              </div>
                              <a
                                href={`/jobs/${jobData.id}`}
                                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-primary/90 transition-all font-medium shadow-sm"
                              >
                                {t('viewJob')}
                              </a>
                            </div>

                            <div className="space-y-2">
                              {jobData.description && (
                                <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded-md italic border-l-2 border-primary/30">
                                  &quot;{jobData.description}&quot;
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2 text-xs">
                                {jobData.location && (
                                  <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-muted-foreground font-medium border border-border/50">
                                    <MapPin className="w-3 h-3" />
                                    {jobData.location}
                                  </span>
                                )}
                                {jobData.budget && (
                                  <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-muted-foreground font-medium border border-border/50">
                                    <DollarSign className="w-3 h-3" />
                                    {jobData.budget}
                                  </span>
                                )}
                                {jobData.type && (
                                  <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-muted-foreground font-medium border border-border/50">
                                    <Clock className="w-3 h-3" />
                                    <span className="capitalize">
                                      {jobData.type.replace('_', ' ')}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* User Message */}
                          <div
                            className={cn(
                              'rounded-2xl px-4 py-3 shadow-md transition-all',
                              isOwn
                                ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-auto w-fit'
                                : 'bg-card border border-border/50 text-foreground w-fit',
                            )}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-line break-words tracking-wide">
                              {userMessage}
                            </p>
                          </div>

                          {isLastMessageFromSender && (
                            <div
                              className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              <p className="text-xs tracking-wide text-muted-foreground">
                                {message.timestamp}
                              </p>
                              {isOwn && message.isRead && (
                                <CheckCheck
                                  className={`h-3 w-3 ${isOwn ? 'text-primary' : 'text-primary'}`}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )
                    } catch (e) {
                      console.error('Failed to parse job ref', e)
                    }
                  }

                  // Normal message logic
                  return (
                    <div className="group flex items-center gap-1">
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-md transition-all hover:shadow-lg ${
                          isOwn
                            ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground'
                            : 'bg-card border border-border/50 text-foreground hover:border-border'
                        }`}
                      >
                        {message.content && (
                          <p className="text-sm leading-relaxed whitespace-pre-line break-words tracking-wide">
                            {message.content}
                          </p>
                        )}
                        {isLastMessageFromSender && (
                          <div
                            className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <p
                              className={`text-xs tracking-wide ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                            >
                              {message.timestamp}
                            </p>
                            {isOwn && message.isRead && (
                              <CheckCheck
                                className={`h-3 w-3 ${isOwn ? 'text-primary-foreground' : 'text-primary'}`}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dropdown menu - chỉ hiển thị cho tin nhắn của mình */}
                      {isOwn && (onEditMessage || onDeleteMessage) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEditMessage && !message.attachmentUrl && (
                              <DropdownMenuItem onClick={() => handleStartEdit(message)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>{commonT('edit')}</span>
                              </DropdownMenuItem>
                            )}
                            {onDeleteMessage && (
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmId(message.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{commonT('delete')}</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )
                })()
              )}
            </div>
          </div>
        )
      })}

      {/* Read status with avatar - hiển thị sau tin nhắn cuối cùng đã đọc */}
      {lastReadOwnMessageId && otherParticipantAvatar && (
        <div className="flex justify-end items-center gap-1.5 mt-2 mb-2 mr-1">
          <span className="text-xs font-medium text-foreground/70 tracking-wide">{t('seen')}</span>
          <Avatar className="h-5 w-5 ring-2 ring-primary/30 shadow-md">
            <AvatarImage src={otherParticipantAvatar} />
            <AvatarFallback className="text-[8px] bg-primary text-primary-foreground font-bold">
              ✓
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteMessageTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteMessageConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{commonT('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteMessage(deleteConfirmId)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? t('deleting') : commonT('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default MessageThread

const AttachmentLink = ({
  url,
  type,
  name,
  isOwn = false,
}: {
  url: string
  type: 'video' | 'audio' | 'file'
  name?: string
  isOwn?: boolean
}) => {
  const t = useTranslations('MessagesPage')
  const icon =
    type === 'video'
      ? FileVideo
      : type === 'audio'
        ? FileAudio
        : name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          ? FileImage
          : FileText

  const Icon = icon

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-md transition-all hover:shadow-lg group flex-1',
        isOwn
          ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/95 hover:to-primary/95'
          : 'bg-card border border-border/50 text-foreground hover:border-border',
      )}
    >
      <div
        className={cn(
          'p-2 rounded-lg transition-colors flex-shrink-0',
          isOwn
            ? 'bg-primary-foreground/20 group-hover:bg-primary-foreground/30'
            : 'bg-primary/10 group-hover:bg-primary/20',
        )}
      >
        <Icon className={cn('h-5 w-5', isOwn ? 'text-primary-foreground' : 'text-primary')} />
      </div>
      <span className="truncate flex-1 font-medium tracking-wide">
        {name || t('preview.attachment')}
      </span>
    </a>
  )
}
