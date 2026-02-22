'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  startTransition,
  ReactNode,
} from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'
import { messageService } from '@/services/messageService'
import type { Message } from '@/types/message'

interface SocketContextProps {
  socket: Socket | null
  isConnected: boolean
  unreadCount: number
  onlineUsers: Set<string>
  refreshUnreadCount: () => Promise<void>
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  sendTyping: (conversationId: string, isTyping: boolean) => void
  sendMessage: (payload: {
    conversationId: string
    content: string
    attachmentUrl?: string
    attachmentType?: string
  }) => void
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
  unreadCount: 0,
  onlineUsers: new Set(),
  refreshUnreadCount: async () => {},
  joinConversation: () => {},
  leaveConversation: () => {},
  sendTyping: () => {},
  sendMessage: () => {},
})

export const useSocketContext = () => useContext(SocketContext)

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || ''

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const { accessToken, isAuthenticated, user } = useAuthStore()
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  // Initial fetch for unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      // Assuming getConversations returns list with unreadCount per conversation
      const conversations = await messageService.getConversations()
      const total = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)
      setUnreadCount(total)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }, [isAuthenticated])

  useEffect(() => {
    startTransition(() => {
      fetchUnreadCount()
    })
  }, [fetchUnreadCount])

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect()
        startTransition(() => {
          setSocket(null)
          setIsConnected(false)
        })
      }
      return
    }

    if (!socket) {
      console.log('🔌 Initializing global socket connection...')
      const newSocket = io(SOCKET_URL, {
        path: '/socket.io',
        auth: { token: accessToken },
        query: { token: accessToken },
        extraHeaders: { Authorization: `Bearer ${accessToken}` },
        transports: ['polling', 'websocket'], // Prefer polling first for proxy compatibility
        reconnection: true,
      })

      startTransition(() => {
        setSocket(newSocket)
      })

      newSocket.on('connect', () => {
        console.log('✅ Global Socket connected:', newSocket.id)
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('❌ Global Socket disconnected')
        setIsConnected(false)
      })

      newSocket.on('error', (err) => {
        console.error('❌ Global Socket error:', err)
      })

      // Updates for unread count
      // Tin nhắn mới -> Tăng unread count nếu không phải tin mình gửi
      const handleNewMessage = (msg: Message) => {
        // Nếu là tin nhắn của mình thì không tăng
        if (msg.senderId === user?.id) return

        // Ở đây đơn giản là tăng 1.
        // Logic phức tạp hơn (VD: đang xem conversation đó thì không tăng) cần xử lý ở level Page
        // Tuy nhiên `unreadCount` ở đây là global badge ở Header.
        // Khi user đang ở trang chat, logic ở trang đó sẽ mark read -> gọi refreshUnreadCount.
        setUnreadCount((prev) => prev + 1)
      }

      newSocket.on('newMessage', handleNewMessage)
      newSocket.on('message:new', handleNewMessage)

      // Online status events
      newSocket.on('user:online', (userId: string) => {
        setOnlineUsers((prev) => new Set(prev).add(userId))
      })

      newSocket.on('user:offline', (userId: string) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      })

      // Also potentially 'users:online' sending list initially?
      newSocket.on('users:online', (userIds: string[]) => {
        setOnlineUsers(new Set(userIds))
      })
    }

    return () => {
      // Don't disconnect on every render, but cleaning up on unmount (logout) is good.
      // However, strict mode might cause double init. useRef protection handles it.
    }
  }, [isAuthenticated, accessToken, user?.id, socket]) // socket dependency added but handled by check

  // Helper functions
  const joinConversation = useCallback(
    (conversationId: string) => {
      socket?.emit('joinConversation', conversationId)
    },
    [socket],
  )

  const leaveConversation = useCallback(
    (conversationId: string) => {
      socket?.emit('leaveConversation', conversationId)
    },
    [socket],
  )

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      socket?.emit('typing', { conversationId, isTyping })
    },
    [socket],
  )

  const sendMessage = useCallback(
    (payload: {
      conversationId: string
      content: string
      attachmentUrl?: string
      attachmentType?: string
    }) => {
      socket?.emit('sendMessage', payload)
    },
    [socket],
  )

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        unreadCount,
        onlineUsers,
        refreshUnreadCount: fetchUnreadCount,
        joinConversation,
        leaveConversation,
        sendTyping,
        sendMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
