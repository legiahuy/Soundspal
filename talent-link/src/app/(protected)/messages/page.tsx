'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/public/Header'
import MessageThread, { ThreadMessage } from '@/components/messages/MessageThread'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  Send,
  Loader2,
  Paperclip,
  X,
  Image,
  FileText,
  Film,
  Music,
  MoreVertical,
  Trash2,
  MessageCircle,
  ChevronLeft,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { messageService } from '@/services/messageService'
import { useAuthStore } from '@/stores/authStore'
import { useSocket } from '@/hooks/useSocket'
import type { Conversation, Message } from '@/types/message'
import { resolveMediaUrl } from '@/lib/utils'
import { useTranslations } from 'next-intl'

const MessagesPage = () => {
  const t = useTranslations('MessagesPage')
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const sortMessages = useCallback((items: Message[]) => {
    return [...items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }, [])

  const sortConversations = useCallback((items: Conversation[]) => {
    return [...items].sort((a, b) => {
      const dateA = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : new Date(a.updatedAt).getTime()
      const dateB = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : new Date(b.updatedAt).getTime()
      return dateB - dateA
    })
  }, [])
  const [messageInput, setMessageInput] = useState('')
  // const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const previousConversationRef = useRef<string | null>(null)
  const threadContainerRef = useRef<HTMLDivElement | null>(null)
  const [creatingConversation, setCreatingConversation] = useState(false)

  // Socket connection for real-time messaging
  const { joinConversation, leaveConversation, sendTyping, onlineUsers } = useSocket({
    onNewMessage: (message: Message) => {
      console.log('📨 Socket nhận tin nhắn mới:', message)
      const isActiveConversation = message.conversationId === selectedConversation
      console.log('🔍 Có phải conversation hiện tại?', isActiveConversation, {
        messageConvId: message.conversationId,
        selectedConvId: selectedConversation,
      })

      // Add new message if it's for the current conversation
      if (isActiveConversation) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            console.log('⚠️ Tin nhắn đã tồn tại, bỏ qua')
            return prev
          }
          console.log('✅ Thêm tin nhắn mới vào danh sách')
          return sortMessages([...prev, message])
        })
      }
      // Update last message in conversation list
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessage: message,
                unreadCount: isActiveConversation ? 0 : (conv.unreadCount || 0) + 1,
              }
            : conv,
        )
        return sortConversations(updated)
      })
    },
    onTyping: (data) => {
      if (data.conversationId === selectedConversation && data.userId !== user?.id) {
        setTypingUser(data.isTyping ? data.userId : null)
      }
    },
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Mock data for testing - remove when API is ready
  const mockConversations: Conversation[] = [
    {
      id: '1',
      isGroup: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: [
        {
          id: 'other-user-1',
          username: 'acoustic_cafe',
          displayName: 'Acoustic Cafe & Bar',
          avatarUrl:
            'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=100&h=100&fit=crop',
        },
      ],
      lastMessage: {
        id: 'm1',
        conversationId: '1',
        senderId: 'other-user-1',
        content: 'Thank you for your interest! We will get back to you this week.',
        isRead: false,
        createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      unreadCount: 2,
    },
    {
      id: '2',
      isGroup: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: [
        {
          id: 'other-user-2',
          username: 'minhtam',
          displayName: 'Minh Tam (Artist)',
          avatarUrl:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        },
      ],
      lastMessage: {
        id: 'm2',
        conversationId: '2',
        senderId: 'other-user-2',
        content: 'I can perform next Saturday!',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      unreadCount: 0,
    },
  ]

  const mockMessages: Message[] = [
    {
      id: '1',
      conversationId: '1',
      senderId: 'other-user-1',
      senderName: 'Acoustic Cafe & Bar',
      content: 'Hello! Thank you for sending a collaboration request to our venue.',
      isRead: true,
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      conversationId: '1',
      senderId: user?.id || 'current-user',
      senderName: 'You',
      content: 'Hi venue! I am very interested in performing at your space.',
      isRead: true,
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      conversationId: '1',
      senderId: 'other-user-1',
      senderName: 'Acoustic Cafe & Bar',
      content: 'Thank you for your interest! We will get back to you this week.',
      isRead: false,
      createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  // Set to true to use mock data, false to use real API
  const USE_MOCK_DATA = false

  const fetchUnreadCounts = useCallback(async (items: Conversation[]) => {
    try {
      const conversationsWithUnread = await Promise.all(
        items.map(async (conversation) => {
          try {
            const unread = await messageService.getUnreadCount(conversation.id)
            return { ...conversation, unreadCount: unread ?? 0 }
          } catch (error) {
            console.error(`Failed to fetch unread count for ${conversation.id}:`, error)
            return conversation
          }
        }),
      )
      return conversationsWithUnread
    } catch (error) {
      console.error('Failed to fetch unread counts:', error)
      return items
    }
  }, [])

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConversations(true)
        // if (USE_MOCK_DATA) {
        //   setConversations(mockConversations)
        //   setSelectedConversation(mockConversations[0]?.id || null)
        //   return
        // }
        const data = await messageService.getConversations()
        const conversationsWithUnread = await fetchUnreadCounts(data)
        setConversations(sortConversations(conversationsWithUnread))
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      } finally {
        setLoadingConversations(false)
      }
    }
    fetchConversations()
  }, [fetchUnreadCounts])

  // Xử lý userId từ query params để tạo/mở conversation
  useEffect(() => {
    const userId = searchParams.get('userId')
    if (!userId || !user?.id || userId === user.id || USE_MOCK_DATA) return
    if (loadingConversations || creatingConversation) return

    const createOrOpenConversation = async () => {
      try {
        setCreatingConversation(true)

        // Kiểm tra xem đã có conversation với user này chưa
        const existingConv = conversations.find(
          (conv) =>
            !conv.isGroup &&
            conv.participants.some((p) => p.id === userId || p.odUserId === userId),
        )

        if (existingConv) {
          // Nếu đã có, mở conversation đó
          setSelectedConversation(existingConv.id)
          // Xóa userId khỏi URL
          router.replace('/messages', { scroll: false })
          return
        }

        // Nếu chưa có, tạo mới
        const newConversation = await messageService.createConversation({
          isGroup: false,
          participantIds: [userId],
        })

        // Thêm vào danh sách và chọn
        setConversations((prev) => [newConversation, ...prev])
        setSelectedConversation(newConversation.id)

        // Xóa userId khỏi URL
        router.replace('/messages', { scroll: false })
      } catch (error) {
        console.error('Failed to create/open conversation:', error)
        // Xóa userId khỏi URL ngay cả khi lỗi
        router.replace('/messages', { scroll: false })
      } finally {
        setCreatingConversation(false)
      }
    }

    createOrOpenConversation()
  }, [searchParams, user, conversations, loadingConversations, creatingConversation, router])

  // Xử lý jobId và jobTitle để pre-fill nội dung tin nhắn
  useEffect(() => {
    const jobId = searchParams.get('jobId')
    const jobTitle = searchParams.get('jobTitle')

    if (jobId && jobTitle) {
      setMessageInput(t('prefillMessage', { title: jobTitle, id: jobId }))
    }
  }, [searchParams, t])

  // Join/leave socket rooms when conversation changes
  useEffect(() => {
    if (previousConversationRef.current) {
      console.log('🚪 Rời khỏi conversation:', previousConversationRef.current)
      leaveConversation(previousConversationRef.current)
    }
    if (selectedConversation) {
      console.log('🚪 Tham gia conversation:', selectedConversation)
      // Retry join nếu socket chưa sẵn sàng
      const tryJoin = () => {
        joinConversation(selectedConversation)
        // Retry sau 500ms nếu cần
        setTimeout(() => {
          joinConversation(selectedConversation)
        }, 500)
      }
      tryJoin()
    }
    previousConversationRef.current = selectedConversation
  }, [selectedConversation, joinConversation, leaveConversation])

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConversation) return

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true)
        // if (USE_MOCK_DATA) {
        //   setMessages(
        //     sortMessages(mockMessages.filter((m) => m.conversationId === selectedConversation)),
        //   )
        //   return
        // }
        const data = await messageService.getMessages(selectedConversation)
        setMessages(sortMessages(data))
        // Mark conversation as read
        await messageService.markConversationAsRead(selectedConversation)
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation ? { ...conv, unreadCount: 0 } : conv,
          ),
        )
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        setLoadingMessages(false)
      }
    }
    fetchMessages()
  }, [selectedConversation, sortMessages])

  // Khi chọn cuộc trò chuyện mới và dữ liệu đã load, mặc định hiển thị đoạn tin nhắn gần nhất
  useEffect(() => {
    if (!selectedConversation || loadingMessages) return
    const container = threadContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'auto' })
  }, [selectedConversation, loadingMessages])

  // Auto scroll logic
  useEffect(() => {
    if (!messages.length || loadingMessages) return
    const container = threadContainerRef.current
    if (!container) return

    // Logic: Only auto-scroll if user is already near bottom OR if the new message is from "me"
    // Since we don't track "who sent the last message" easily in this effect without looking at messages[last],
    // we can check if we are near bottom.

    // Threshold to consider "near bottom"
    const threshold = 100
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <= threshold

    // If it's a new message (messages changed), assume we might want to scroll.
    // For simplicity in MVP: If it's my message (added to local state), we forced scroll in handleSendMessage usually?
    // Actually handleSendMessage just updates state.
    // Let's scroll if near bottom.

    if (isNearBottom) {
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      })
    }
  }, [messages, loadingMessages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.startsWith('image/')) return <Image alt="Image" className="w-4 h-4" />
    if (type.startsWith('video/')) return <Film alt="Video" className="w-4 h-4" />
    if (type.startsWith('audio/')) return <Music alt="Audio" className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const getAttachmentType = (file: File): 'image' | 'video' | 'audio' | 'file' => {
    const type = file.type
    if (type.startsWith('image/')) return 'image'
    if (type.startsWith('video/')) return 'video'
    if (type.startsWith('audio/')) return 'audio'
    return 'file'
  }

  // Edit message
  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      if (USE_MOCK_DATA) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, content: newContent } : msg)),
        )
        return
      }
      const updatedMessage = await messageService.updateMessage(messageId, { content: newContent })
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: updatedMessage.content } : msg,
        ),
      )
    } catch (error) {
      console.error('Failed to edit message:', error)
      throw error
    }
  }, [])

  // Delete message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      if (USE_MOCK_DATA) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
        return
      }
      await messageService.deleteMessage(messageId)
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    } catch (error) {
      console.error('Failed to delete message:', error)
      throw error
    }
  }, [])

  // Delete conversation
  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    if (!confirm(t('confirmDelete'))) return

    try {
      if (USE_MOCK_DATA) {
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
        setSelectedConversation(null)
        return
      }
      await messageService.deleteConversation(conversationId)
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
      setSelectedConversation(null)
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }, [])

  // Gửi tin nhắn qua REST API.
  // Backend sau khi lưu DB sẽ tự emit sự kiện socket (vd: 'newMessage')
  // để các client khác (đối phương) nhận được realtime qua useSocket.onNewMessage.
  const handleSendMessage = useCallback(async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation || sendingMessage) return

    try {
      setSendingMessage(true)

      let attachmentUrl: string | undefined
      let attachmentType: 'image' | 'video' | 'audio' | 'file' | undefined

      // Upload file if selected
      if (selectedFile && !USE_MOCK_DATA) {
        setUploadingFile(true)
        try {
          const uploadResult = await messageService.uploadFile(selectedFile, 'messages')
          attachmentUrl = uploadResult.url
          attachmentType = getAttachmentType(selectedFile)
        } catch (error) {
          console.error('Failed to upload file:', error)
        } finally {
          setUploadingFile(false)
        }
      }

      if (USE_MOCK_DATA) {
        const newMessage: Message = {
          id: Date.now().toString(),
          conversationId: selectedConversation,
          senderId: user?.id || 'current-user',
          senderName: user?.display_name || 'You',
          content: messageInput.trim(),
          attachmentUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
          attachmentType: selectedFile ? getAttachmentType(selectedFile) : undefined,
          isRead: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setMessages((prev) => sortMessages([...prev, newMessage]))
        setMessageInput('')
        setSelectedFile(null)
        return
      }

      console.log('📤 Gửi tin nhắn qua API...', {
        conversationId: selectedConversation,
        content: messageInput.trim(),
      })

      const newMessage = await messageService.sendMessage({
        conversationId: selectedConversation,
        content: messageInput.trim(),
        attachmentUrl,
        attachmentType,
      })

      console.log('✅ Tin nhắn đã gửi thành công:', newMessage)

      // Add message to local state (socket sẽ broadcast cho người khác)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev
        return sortMessages([...prev, newMessage])
      })
      setMessageInput('')
      setSelectedFile(null)

      // Update last message in conversation list & sort
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === selectedConversation
            ? { ...conv, lastMessage: newMessage, unreadCount: 0 }
            : conv,
        )
        return sortConversations(updated)
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSendingMessage(false)
    }
  }, [messageInput, selectedConversation, sendingMessage, user, selectedFile, sortMessages])

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return {
        name: conversation.name || 'Group',
        avatar: undefined,
        username: undefined,
      }
    }
    // API trả về p.id là odUserId của participant
    const other = conversation.participants.find((p) => p.id !== user?.id)
    return {
      name: other?.displayName || other?.username || 'Unknown',
      avatar: other?.avatarUrl || undefined,
      username: other?.username,
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return t('time.justNow')
      if (diffMins < 60) return t('time.minutesAgo', { count: diffMins })
      if (diffHours < 24) return t('time.hoursAgo', { count: diffHours })
      if (diffDays < 7) return t('time.daysAgo', { count: diffDays })
      return date.toLocaleDateString('en-US')
    } catch {
      return ''
    }
  }

  const getPreviewText = (conv: Conversation): string => {
    if (!conv.lastMessage) return t('preview.noMessages')

    const lastMsg = conv.lastMessage
    const isOwn = lastMsg.senderId === user?.id

    // Tìm tên người gửi
    let senderName = t('preview.user')
    if (isOwn) {
      senderName = t('preview.you')
    } else {
      const sender = conv.participants.find((p) => p.id === lastMsg.senderId)
      senderName = sender?.displayName || sender?.username || t('preview.user')
    }

    // Kiểm tra attachment URL trước (có thể attachmentType chưa set)
    if (lastMsg.attachmentUrl || lastMsg.attachmentType) {
      // Xác định loại attachment
      const attachmentType = lastMsg.attachmentType

      if (attachmentType === 'image') {
        return `${senderName}: 📷 ${t('preview.photo')}`
      } else if (attachmentType === 'video') {
        return `${senderName}: 🎥 ${t('preview.video')}`
      } else if (attachmentType === 'audio') {
        return `${senderName}: 🎵 ${t('preview.audio')}`
      } else {
        return `${senderName}: 📎 ${t('preview.attachment')}`
      }
    }

    // Nếu có nội dung text
    if (lastMsg.content?.trim()) {
      const content = lastMsg.content.trim()

      // Check for job reference
      const jobRefMatch = content.match(/^:::JOB_REF:(\{.*\}):::\n([\s\S]*)$/)
      if (jobRefMatch) {
        return `${senderName}: ${t('jobApplication')}`
      }

      // Truncate nếu quá dài
      return content.length > 50 ? `${content.substring(0, 50)}...` : content
    }

    // Fallback nếu có tin nhắn nhưng không xác định được nội dung (thường là do attachment bị thiếu field từ API)
    return `${senderName}: 📎 ${t('preview.attachment')}`
  }

  const filteredConversations = conversations.filter((conv) => {
    const { name } = getOtherParticipant(conv)
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const selectedConv = conversations.find((c) => c.id === selectedConversation)
  const selectedConvInfo = selectedConv ? getOtherParticipant(selectedConv) : null

  // Determine if other user is online
  const otherParticipantId = selectedConv?.participants.find((p) => p.id !== user?.id)?.id
  const isOnline = otherParticipantId ? onlineUsers.has(otherParticipantId) : false

  const participantNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    if (selectedConv) {
      selectedConv.participants.forEach((participant) => {
        map[participant.id] = participant.displayName || participant.username || t('preview.user')
      })
    }
    if (user?.id) {
      map[user.id] = user.display_name || user.username || t('preview.you')
    }
    return map
  }, [selectedConv, user, t])

  const participantAvatarMap = useMemo(() => {
    const map: Record<string, string | undefined> = {}
    if (selectedConv) {
      selectedConv.participants.forEach((participant) => {
        map[participant.id] = participant.avatarUrl || undefined
      })
    }
    if (user?.id) {
      map[user.id] = user.avatar_url ? resolveMediaUrl(user.avatar_url) : undefined
    }
    return map
  }, [selectedConv, user])

  const formattedMessages: ThreadMessage[] = messages.map((msg) => ({
    id: msg.id,
    senderId: msg.senderId,
    senderName:
      msg.senderName ||
      participantNameMap[msg.senderId] ||
      (msg.senderId === user?.id ? t('preview.you') : t('preview.user')),
    content: msg.content,
    timestamp: formatTime(msg.createdAt),
    isOwn: msg.senderId === user?.id,
    isRead: msg.isRead,
    avatarUrl: participantAvatarMap[msg.senderId],
    attachmentUrl: msg.attachmentUrl ? resolveMediaUrl(msg.attachmentUrl) : undefined,
    attachmentType: msg.attachmentType,
    attachmentName: msg.attachmentUrl?.split('/').pop(),
  }))

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-background via-background to-muted/20">
      <Header />

      <main className="flex-1 pt-20">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <div
            className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-border/50"
            style={{ height: 'calc(100vh - 180px)' }}
          >
            <div className="flex h-full">
              {/* Conversations List */}
              <div
                className={`w-full md:w-1/3 border-r border-border/50 flex flex-col bg-linear-to-b from-muted/20 to-transparent ${selectedConversation ? 'hidden md:flex' : 'flex'}`}
              >
                <div className="p-5 border-b border-border/50 backdrop-blur-sm bg-background/50">
                  <h2 className="text-2xl font-bold mb-4 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {t('title')}
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      placeholder={t('searchPlaceholder')}
                      className="pl-10 bg-background/80 border-border/50 focus:border-primary/50 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      {t('noConversations')}
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredConversations.map((conv) => {
                        const { name, avatar } = getOtherParticipant(conv)
                        const unreadCount = conv.unreadCount ?? 0
                        const isUnread = unreadCount > 0
                        const isActive = selectedConversation === conv.id
                        const previewText = getPreviewText(conv)
                        return (
                          <div
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv.id)}
                            className={`p-4 cursor-pointer transition-all duration-200 border-l-4 hover:scale-[1.01] ${
                              isActive
                                ? 'bg-primary/10 border-primary shadow-sm'
                                : isUnread
                                  ? 'bg-muted/50 border-primary/60 hover:bg-muted/70 hover:border-primary'
                                  : 'border-transparent hover:bg-accent/50 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="relative">
                                <Avatar className="ring-2 ring-background shadow-md">
                                  <AvatarImage
                                    src={avatar ? resolveMediaUrl(avatar) : undefined}
                                    alt={name}
                                  />
                                  <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-primary-foreground">
                                    {name[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {isUnread && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <h3
                                    className={`truncate ${
                                      isUnread ? 'font-semibold text-foreground' : 'font-medium'
                                    }`}
                                  >
                                    {name}
                                  </h3>
                                  {conv.lastMessage && (
                                    <span
                                      className={`text-xs whitespace-nowrap ml-2 ${
                                        isUnread ? 'text-foreground' : 'text-muted-foreground'
                                      }`}
                                    >
                                      {formatTime(conv.lastMessage.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                  <p
                                    className={`text-sm truncate ${
                                      isUnread
                                        ? 'text-foreground font-medium'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {previewText}
                                  </p>
                                  {isUnread && (
                                    <span className="ml-auto bg-linear-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse min-w-[24px] text-center">
                                      {unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div
                className={`${selectedConversation ? 'flex' : 'hidden'} md:flex md:w-2/3 flex-col w-full`}
              >
                {selectedConversation && selectedConvInfo ? (
                  <>
                    {/* Thread Header */}
                    <div className="p-5 border-b border-border/50 flex items-center justify-between backdrop-blur-sm bg-linear-to-r from-background to-muted/20 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="md:hidden -ml-2 h-9 w-9"
                          onClick={() => setSelectedConversation(null)}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        {selectedConvInfo.username ? (
                          <Link
                            href={`/profile/${selectedConvInfo.username}`}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          >
                            <Avatar className="h-11 w-11 ring-2 ring-primary/20 shadow-md">
                              <AvatarImage
                                src={
                                  selectedConvInfo.avatar
                                    ? resolveMediaUrl(selectedConvInfo.avatar)
                                    : undefined
                                }
                                alt={selectedConvInfo.name}
                              />
                              <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-primary-foreground">
                                {selectedConvInfo.name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h3 className="font-bold text-lg truncate whitespace-nowrap">
                                {selectedConvInfo.name}
                              </h3>
                              {isOnline && (
                                <div className="flex items-center gap-1.5">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                  </span>
                                  <p className="not-italic text-xs text-green-600 font-medium">
                                    {t('activeNow')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 ring-2 ring-primary/20 shadow-md">
                              <AvatarImage
                                src={
                                  selectedConvInfo.avatar
                                    ? resolveMediaUrl(selectedConvInfo.avatar)
                                    : undefined
                                }
                                alt={selectedConvInfo.name}
                              />
                              <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-primary-foreground">
                                {selectedConvInfo.name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h3 className="font-bold text-lg truncate whitespace-nowrap">
                                {selectedConvInfo.name}
                              </h3>
                              {isOnline && (
                                <div className="flex items-center gap-1.5">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                  </span>
                                  <p className="text-xs text-green-600 font-medium">
                                    {t('activeNow')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteConversation(selectedConversation)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>{t('deleteConversation')}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Messages */}
                    <div
                      ref={threadContainerRef}
                      className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-linear-to-b from-transparent to-muted/5 scrollbar-thin"
                    >
                      {loadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">{t('loadingMessages')}</p>
                          </div>
                        </div>
                      ) : (
                        <MessageThread
                          messages={formattedMessages}
                          otherParticipantAvatar={
                            selectedConvInfo.avatar
                              ? resolveMediaUrl(selectedConvInfo.avatar)
                              : undefined
                          }
                        />
                      )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
                      {selectedFile && (
                        <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between animate-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-2">
                            {getFileIcon(selectedFile)}
                            <span className="text-sm truncate max-w-[200px]">
                              {selectedFile.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-background/80"
                            onClick={() => setSelectedFile(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Typing indicator */}
                      {typingUser && typingUser !== user?.id && (
                        <div className="mb-2 px-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="animate-bounce">●</span>
                            <span className="animate-bounce delay-100">●</span>
                            <span className="animate-bounce delay-200">●</span>
                            <span className="ml-1">Typing...</span>
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          disabled={sendingMessage || uploadingFile}
                        >
                          <Paperclip className="w-5 h-5" />
                        </Button>
                        <Input
                          placeholder="Type a message..."
                          value={messageInput}
                          onChange={(e) => {
                            setMessageInput(e.target.value)
                            if (selectedConversation) {
                              sendTyping(selectedConversation, true)
                              // Debounce stop typing could be added here
                            }
                          }}
                          onBlur={() => {
                            if (selectedConversation) {
                              sendTyping(selectedConversation, false)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                          className="flex-1 bg-background/50 focus:bg-background transition-all"
                          disabled={uploadingFile}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={
                            (!messageInput.trim() && !selectedFile) ||
                            sendingMessage ||
                            uploadingFile
                          }
                          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/20 transition-all duration-300"
                        >
                          {sendingMessage || uploadingFile ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/5">
                    <div className="text-center space-y-4 p-8">
                      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-xl font-semibold">{t('title')}</h3>
                      <p className="max-w-xs mx-auto text-sm text-muted-foreground/80">
                        Select a conversation to start chatting or search for a user to connect.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default MessagesPage
