import { useEffect, useState, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  sender_type: 'customer' | 'agent' | 'ai'
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker'
  content?: string
  media_url?: string
  media_type?: string
  media_size?: number
  media_duration?: number
  thumbnail_url?: string
  sticker_id?: string
  sticker_package_id?: string
  sticker_resource_type?: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  delivered_at?: string
  read_at?: string
  created_at: string
  metadata?: any
}

export interface TypingIndicator {
  user_id: string
  is_typing: boolean
}

export interface UseRealtimeChatOptions {
  roomId: string
  userId: string
  onNewMessage?: (message: ChatMessage) => void
  onMessageStatusUpdate?: (messageId: string, status: string) => void
  onTypingChange?: (indicator: TypingIndicator) => void
}

export function useRealtimeChat({
  roomId,
  userId,
  onNewMessage,
  onMessageStatusUpdate,
  onTypingChange,
}: UseRealtimeChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ดึงข้อความเริ่มต้น
  const fetchMessages = useCallback(async () => {
    // ถ้าไม่มี roomId ให้ skip
    if (!roomId) {
      console.log('❌ No roomId provided')
      setLoading(false)
      return
    }
    
    console.log('🔄 Fetching messages for room:', roomId)
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50)

      console.log('📊 Query result:', { 
        messageCount: data?.length || 0, 
        error: error?.message,
        roomId 
      })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      
      console.log('✅ Messages loaded:', data?.length || 0)
      setMessages(data || [])
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  // ส่งข้อความ
  const sendMessage = useCallback(
    async (
      content: string,
      messageType: ChatMessage['message_type'] = 'text',
      mediaData?: {
        url?: string
        type?: string
        size?: number
        duration?: number
        thumbnail?: string
      }
    ) => {
      try {
        const newMessage = {
          room_id: roomId,
          sender_id: userId,
          sender_type: 'agent' as const, // หรือ 'customer' ขึ้นอยู่กับบริบท
          message_type: messageType,
          content,
          media_url: mediaData?.url,
          media_type: mediaData?.type,
          media_size: mediaData?.size,
          media_duration: mediaData?.duration,
          thumbnail_url: mediaData?.thumbnail,
          status: 'sent' as const,
        }

        const { data, error } = await supabase
          .from('chat_messages')
          .insert(newMessage)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (error) {
        console.error('Error sending message:', error)
        throw error
      }
    },
    [roomId, userId]
  )

  // อัปเดตสถานะข้อความ
  const updateMessageStatus = useCallback(
    async (messageId: string, status: ChatMessage['status']) => {
      try {
        const updateData: any = { status }
        
        if (status === 'delivered') {
          updateData.delivered_at = new Date().toISOString()
        } else if (status === 'read') {
          updateData.read_at = new Date().toISOString()
        }

        const { error } = await supabase
          .from('chat_messages')
          .update(updateData)
          .eq('id', messageId)

        if (error) throw error
      } catch (error) {
        console.error('Error updating message status:', error)
      }
    },
    []
  )

  // ทำเครื่องหมายข้อความทั้งหมดว่าอ่านแล้ว
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('room_id', roomId)
        .neq('sender_id', userId)
        .neq('status', 'read')

      if (error) throw error
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [roomId, userId])

  // ส่งสถานะกำลังพิมพ์
  const sendTypingIndicator = useCallback(
    async (isTyping: boolean) => {
      try {
        if (isTyping) {
          // Upsert typing indicator
          await supabase.from('typing_indicators').upsert({
            room_id: roomId,
            user_id: userId,
            is_typing: true,
            updated_at: new Date().toISOString(),
          })

          // ตั้งเวลาลบ indicator อัตโนมัติ
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          typingTimeoutRef.current = setTimeout(() => {
            sendTypingIndicator(false)
          }, 3000)
        } else {
          // ลบ typing indicator
          await supabase
            .from('typing_indicators')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', userId)
        }
      } catch (error) {
        console.error('Error sending typing indicator:', error)
      }
    },
    [roomId, userId]
  )

  // ตั้งค่า Realtime subscriptions
  useEffect(() => {
    // ถ้าไม่มี roomId ให้ skip
    if (!roomId) {
      return
    }
    
    // Fetch messages เฉพาะตอน mount หรือเปลี่ยน roomId
    const loadMessages = async () => {
      if (!roomId) {
        console.log('❌ No roomId provided')
        setLoading(false)
        return
      }
      
      console.log('🔄 Fetching messages for room:', roomId)
      
      try {
        setLoading(true)
        
        // ดึงข้อความล่าสุด 50 ข้อความ (DESC แล้ว reverse)
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false })
          .limit(50)

        console.log('📊 Query result:', { 
          messageCount: data?.length || 0, 
          error: error?.message,
          roomId 
        })

        if (error) {
          console.error('❌ Supabase error:', error)
          throw error
        }
        
        // Reverse เพื่อให้เรียงจากเก่า → ใหม่
        const sortedMessages = (data || []).reverse()
        console.log('✅ Messages loaded:', sortedMessages.length)
        
        // ถ้าได้ครบ 50 แสดงว่าอาจมีข้อความเก่ากว่านี้อีก
        // ถ้าได้น้อยกว่า 50 แสดงว่าไม่มีข้อความเก่ากว่านี้แล้ว
        setHasMore(sortedMessages.length >= 50)
        
        setMessages(sortedMessages)
      } catch (error) {
        console.error('❌ Error fetching messages:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadMessages()

    // สร้าง channel สำหรับ realtime
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId },
      },
    })

    // Subscribe ข้อความใหม่
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('📨 New message received (realtime):', payload.new)
          const newMessage = payload.new as ChatMessage
          
          // ป้องกันข้อความซ้ำ
          setMessages((prev) => {
            const exists = prev.some(msg => msg.id === newMessage.id)
            if (exists) {
              console.log('⚠️ Message already exists, skipping')
              return prev
            }
            return [...prev, newMessage]
          })
          
          onNewMessage?.(newMessage)

          // เล่นเสียงแจ้งเตือนถ้าไม่ใช่ข้อความของตัวเอง
          if (newMessage.sender_id !== userId) {
            playNotificationSound()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          )
          onMessageStatusUpdate?.(updatedMessage.id, updatedMessage.status)
        }
      )

    // Subscribe typing indicators
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const indicator = payload.new as any
            if (indicator.user_id !== userId && indicator.is_typing) {
              setTypingUsers((prev) => new Set(prev).add(indicator.user_id))
              onTypingChange?.({ user_id: indicator.user_id, is_typing: true })
            }
          } else if (payload.eventType === 'DELETE') {
            const indicator = payload.old as any
            setTypingUsers((prev) => {
              const newSet = new Set(prev)
              newSet.delete(indicator.user_id)
              return newSet
            })
            onTypingChange?.({ user_id: indicator.user_id, is_typing: false })
          }
        }
      )

    // Subscribe และตรวจสอบ connection status
    channel
      .subscribe((status, err) => {
        console.log('🔌 Realtime connection status:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected!')
          setIsConnected(true)
          
          // หยุด polling เมื่อ realtime ทำงาน
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Realtime connection error:', {
            status,
            error: err || 'Unknown error',
            roomId
          })
          setIsConnected(false)
          
          // เริ่ม polling เป็น fallback
          startPolling()
        } else if (status === 'CLOSED') {
          console.log('🔌 Realtime connection closed')
          setIsConnected(false)
        }
      })
    
    channelRef.current = channel

    // ฟังก์ชัน polling สำหรับ fallback
    const startPolling = () => {
      if (pollingIntervalRef.current) return
      
      console.log('🔄 Starting polling fallback...')
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: false })
            .limit(50)
          
          if (error) throw error
          
          const sortedMessages = (data || []).reverse()
          
          // อัพเดทเฉพาะถ้ามีข้อความใหม่
          setMessages(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(sortedMessages)) {
              console.log('🔄 Messages updated via polling')
              return sortedMessages
            }
            return prev
          })
        } catch (error) {
          console.error('❌ Polling error:', error)
        }
      }, 3000) // ทุก 3 วินาที
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      // ลบ typing indicator เมื่อออกจากห้อง
      sendTypingIndicator(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId])

  // โหลดข้อความเก่าเพิ่มเติม
  const loadMoreMessages = useCallback(async () => {
    if (!roomId || loadingMore || !hasMore) return

    const oldestMessage = messages[0]
    if (!oldestMessage) return

    console.log('📜 Loading more messages before:', oldestMessage.created_at)

    try {
      setLoadingMore(true)
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const olderMessages = (data || []).reverse()
      console.log('✅ Loaded', olderMessages.length, 'older messages')

      if (olderMessages.length < 50) {
        setHasMore(false)
      }

      setMessages((prev) => [...olderMessages, ...prev])
    } catch (error) {
      console.error('❌ Error loading more messages:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [roomId, messages, loadingMore, hasMore])

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    typingUsers,
    isConnected,
    sendMessage,
    updateMessageStatus,
    markAllAsRead,
    sendTypingIndicator,
    loadMoreMessages,
    refetch: fetchMessages,
  }
}

// ฟังก์ชันเล่นเสียงแจ้งเตือน
function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.5
    audio.play().catch((err) => {
      console.log('Cannot play notification sound:', err)
    })
  } catch (error) {
    console.log('Notification sound not available')
  }
}
