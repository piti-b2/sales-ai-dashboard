'use client'

import { useEffect, useRef, useState } from 'react'
import { useRealtimeChat } from '@/lib/useRealtimeChat'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { MessageInput } from '@/components/chat/MessageInput'
import { ImageModal } from '@/components/chat/ImageModal'
import { Loader2, Sparkles, ChevronUp, Wifi, WifiOff } from 'lucide-react'

interface ChatRoomContentProps {
  roomId: string
  currentUserId: string
  customerAvatar?: string
  isAIEnabled: boolean
  showAISuggestion: boolean
  aiSuggestion: string
  onAISuggestionUse: () => void
  onAISuggestionClose: () => void
  onFetchAISuggestion: (message: string) => void
  onSendMessage: (content: string, type?: any) => Promise<void>
  onTyping: (isTyping: boolean) => void
}

export function ChatRoomContent({
  roomId,
  currentUserId,
  customerAvatar,
  isAIEnabled,
  showAISuggestion,
  aiSuggestion,
  onAISuggestionUse,
  onAISuggestionClose,
  onFetchAISuggestion,
  onSendMessage,
  onTyping,
}: ChatRoomContentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showLoadMoreHint, setShowLoadMoreHint] = useState(false)

  // console.log('🏠 ChatRoomContent rendered:', { roomId, currentUserId })

  const {
    messages,
    loading: messagesLoading,
    loadingMore,
    hasMore,
    typingUsers,
    isConnected,
    markAllAsRead,
    loadMoreMessages,
  } = useRealtimeChat({
    roomId,
    userId: currentUserId,
    onNewMessage: (message) => {
      console.log('📨 New message received:', message)
      
      if (isAIEnabled && message.sender_type === 'customer') {
        onFetchAISuggestion(message.content || '')
      }
    },
  })

  console.log('📋 Current state:', { 
    messageCount: messages.length, 
    loading: messagesLoading,
    loadingMore,
    hasMore,
    typingUsersCount: typingUsers.size 
  })

  useEffect(() => {
    // Scroll ลงล่างสุดเมื่อข้อความเปลี่ยน (แต่ไม่ใช่ตอน load more)
    if (!loadingMore) {
      scrollToBottom()
    }
  }, [messages, loadingMore])

  useEffect(() => {
    if (roomId) {
      markAllAsRead()
      // Scroll ลงล่างสุดเมื่อเปลี่ยนห้อง
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [roomId, markAllAsRead])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Detect scroll to top
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const threshold = 50 // pixels from top
      
      // แสดงปุ่มเฉพาะเมื่อเลื่อนถึงบนสุด (scrollTop < threshold)
      if (scrollTop < threshold && hasMore && !loadingMore) {
        setShowLoadMoreHint(true)
      } else {
        setShowLoadMoreHint(false)
      }
    }

    // เรียกครั้งแรกเพื่อตรวจสอบตำแหน่งเริ่มต้น
    handleScroll()

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore])

  return (
    <>
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-center space-x-2 text-sm text-yellow-800">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>กำลังเชื่อมต่อ... (ใช้โหมดสำรอง)</span>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 min-h-0 relative"
      >
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">ยังไม่มีข้อความในการสนทนานี้</p>
          </div>
        ) : (
          <>
            {/* Load More Button - แสดงเฉพาะเมื่อเลื่อนถึงบนสุด */}
            {hasMore && showLoadMoreHint && (
              <div className="flex justify-center mb-6 sticky top-0 z-10 pt-4">
                <button
                  onClick={loadMoreMessages}
                  disabled={loadingMore}
                  className="
                    px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full 
                    shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 
                    disabled:opacity-50 disabled:cursor-not-allowed 
                    transition-all transform hover:scale-105 animate-bounce
                    flex items-center space-x-2 font-medium
                  "
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>กำลังโหลด...</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      <span>โหลดข้อความเก่า</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {messages.length} ข้อความ
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Hint when near top */}
            {showLoadMoreHint && hasMore && !loadingMore && (
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 animate-pulse">
                  <ChevronUp className="w-4 h-4" />
                  <span>เลื่อนขึ้นเพื่อโหลดข้อความเก่า</span>
                </div>
              </div>
            )}



            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_type === 'agent' || message.sender_type === 'ai'}
                customerAvatar={customerAvatar}
                onImageClick={(url) => {
                  setSelectedImage(url)
                }}
              />
            ))}
            
            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
                <span>กำลังพิมพ์...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* AI Suggestion */}
      {showAISuggestion && aiSuggestion && (
        <div className="bg-purple-50 border-t border-purple-200 p-4 flex-shrink-0">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-900 mb-1">
                AI แนะนำคำตอบ:
              </p>
              <p className="text-sm text-purple-800 mb-3">
                {aiSuggestion}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={onAISuggestionUse}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  ใช้คำตอบนี้
                </button>
                <button
                  onClick={onAISuggestionClose}
                  className="px-4 py-2 bg-white text-purple-600 border border-purple-300 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <MessageInput
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          placeholder="พิมพ์ข้อความ..."
        />
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  )
}
