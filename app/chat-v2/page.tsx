'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Bot,
  BotOff,
  Sparkles,
  Loader2,
  Circle,
  Menu,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { ChatRoomContent } from './ChatRoomContent'

interface ChatRoom {
  id: string
  customer_user_id: string
  agent_user_id?: string
  status: string
  is_ai_enabled: boolean
  last_message_at: string
  created_at: string
  metadata?: any
  customer_name?: string
  customer_avatar?: string
}

interface ChatRoomWithDetails extends ChatRoom {
  last_message?: string
  unread_count?: number
}

function ChatPageV2Content() {
  const searchParams = useSearchParams()
  const roomIdFromUrl = searchParams.get('room')
  
  const [rooms, setRooms] = useState<ChatRoomWithDetails[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAIEnabled, setIsAIEnabled] = useState(true)
  const [showAISuggestion, setShowAISuggestion] = useState(false)
  const [aiSuggestion, setAISuggestion] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Current user ID (ในระบบจริงจะดึงจาก auth)
  const currentUserId = 'agent@example.com'

  // ดึงรายการห้องแชท
  useEffect(() => {
    fetchRooms()
  }, [roomIdFromUrl])

  // ฟังก์ชันสำหรับจัดการ AI Suggestion
  const useAISuggestion = () => {
    if (aiSuggestion) {
      handleSendMessage(aiSuggestion)
    }
  }

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // ดึงข้อความล่าสุดและนับข้อความที่ยังไม่อ่าน
      const roomsWithDetails = await Promise.all(
        (data || []).map(async (room) => {
          // Query ข้อความล่าสุด (ไม่ใช้ .single() เพราะอาจไม่มีข้อความ)
          const { data: messages, error: msgError } = await supabase
            .from('chat_messages')
            .select('content, message_type, created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const lastMsg = messages?.[0]

          if (msgError) {
            console.error('Error fetching messages for room:', room.id, msgError)
          }

          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .neq('sender_id', currentUserId)
            .neq('status', 'read')

          console.log('🔍 Room:', room.customer_name, {
            lastMessage: lastMsg?.content?.substring(0, 30),
            createdAt: lastMsg?.created_at,
            roomLastMessageAt: room.last_message_at
          })

          return {
            ...room,
            customer_name: room.customer_name || room.customer_user_id.substring(0, 10) + '...',
            last_message: lastMsg?.content || 'ไม่มีข้อความ',
            last_message_at: lastMsg?.created_at || room.last_message_at,
            unread_count: count || 0,
          }
        })
      )

      setRooms(roomsWithDetails)

      // เลือกห้องจาก URL parameter หรือห้องแรกอัตโนมัติ
      if (roomsWithDetails.length > 0 && !selectedRoomId) {
        // ถ้ามี room ID จาก URL ให้เลือกห้องนั้น
        if (roomIdFromUrl) {
          const targetRoom = roomsWithDetails.find(r => r.id === roomIdFromUrl)
          if (targetRoom) {
            setSelectedRoomId(targetRoom.id)
            setIsAIEnabled(targetRoom.is_ai_enabled)
          } else {
            // ถ้าไม่เจอห้องที่ระบุ ให้เลือกห้องแรก
            setSelectedRoomId(roomsWithDetails[0].id)
            setIsAIEnabled(roomsWithDetails[0].is_ai_enabled)
          }
        } else {
          // ถ้าไม่มี room ID จาก URL ให้เลือกห้องแรก
          setSelectedRoomId(roomsWithDetails[0].id)
          setIsAIEnabled(roomsWithDetails[0].is_ai_enabled)
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (content: string, type?: any) => {
    // TODO: Implement send message via API
    console.log('Send message:', content, type)
    setShowAISuggestion(false)
    setAISuggestion('')
  }

  const handleTyping = (isTyping: boolean) => {
    // TODO: Implement typing indicator
    console.log('Typing:', isTyping)
  }

  const toggleAI = async () => {
    if (!selectedRoomId) return

    try {
      const newStatus = !isAIEnabled
      await supabase
        .from('chat_rooms')
        .update({ is_ai_enabled: newStatus })
        .eq('id', selectedRoomId)

      setIsAIEnabled(newStatus)
      
      // อัปเดต local state
      setRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoomId
            ? { ...room, is_ai_enabled: newStatus }
            : room
        )
      )
    } catch (error) {
      console.error('Error toggling AI:', error)
    }
  }

  const fetchAISuggestion = async (customerMessage: string) => {
    try {
      setLoadingAI(true)
      
      // เรียก OpenAI API
      const response = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: customerMessage,
          roomId: selectedRoomId,
        }),
      })

      const data = await response.json()
      
      if (data.suggestion) {
        setAISuggestion(data.suggestion)
        setShowAISuggestion(true)
      }
    } catch (error) {
      console.error('Error fetching AI suggestion:', error)
    } finally {
      setLoadingAI(false)
    }
  }


  const filteredRooms = rooms.filter(
    (room) =>
      room.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full bg-gray-50 overflow-hidden relative">
      {/* Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - รายการห้องแชท */}
      <div className={`
        w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0
        md:relative md:translate-x-0
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900 mb-4">แชท</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาการสนทนา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Close Button (Mobile) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>ไม่พบการสนทนา</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => {
                  console.log('🎯 Room clicked:', { 
                    roomId: room.id, 
                    customerName: room.customer_name,
                    isAIEnabled: room.is_ai_enabled 
                  })
                  setSelectedRoomId(room.id)
                  setIsAIEnabled(room.is_ai_enabled)
                  setSidebarOpen(false) // ปิด sidebar เมื่อเลือกห้อง (mobile)
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedRoomId === room.id
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {room.customer_avatar ? (
                    <img
                      src={room.customer_avatar}
                      alt={room.customer_name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 ${room.customer_avatar ? 'hidden' : ''}`}>
                    <span className="text-white text-sm font-semibold">
                      {room.customer_name?.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {room.customer_name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(room.last_message_at), {
                          addSuffix: true,
                          locale: th,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {room.last_message}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {room.is_ai_enabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            <Bot className="w-3 h-3 mr-1" />
                            AI
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Manual
                          </span>
                        )}
                      </div>
                      {room.unread_count! > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex items-center space-x-3">
                {selectedRoom.customer_avatar ? (
                  <img
                    src={selectedRoom.customer_avatar}
                    alt={selectedRoom.customer_name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ${selectedRoom.customer_avatar ? 'hidden' : ''}`}>
                  <span className="text-white text-sm font-semibold">
                    {selectedRoom.customer_name?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {selectedRoom.customer_name}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    <p className="text-xs text-gray-500">ออนไลน์</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Toggle AI Button */}
                <button
                  onClick={toggleAI}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isAIEnabled
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isAIEnabled ? (
                    <>
                      <Bot className="w-4 h-4 inline mr-1" />
                      AI Assistant เปิด
                    </>
                  ) : (
                    <>
                      <BotOff className="w-4 h-4 inline mr-1" />
                      AI Assistant ปิด
                    </>
                  )}
                </button>
                
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Chat Room Content */}
            {selectedRoomId && (
              <ChatRoomContent
                roomId={selectedRoomId}
                currentUserId={currentUserId}
                customerAvatar={selectedRoom?.customer_avatar}
                isAIEnabled={isAIEnabled}
                showAISuggestion={showAISuggestion}
                aiSuggestion={aiSuggestion}
                onAISuggestionUse={useAISuggestion}
                onAISuggestionClose={() => setShowAISuggestion(false)}
                onFetchAISuggestion={fetchAISuggestion}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeft className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                เลือกการสนทนา
              </h3>
              <p className="text-gray-500">
                เลือกการสนทนาจากรายการด้านซ้ายเพื่อเริ่มแชท
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPageV2() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <ChatPageV2Content />
    </Suspense>
  )
}
