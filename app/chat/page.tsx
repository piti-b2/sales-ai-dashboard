'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  MessageSquare,
  ArrowRight,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react'

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ChannelStats {
  name: string
  icon: string
  totalRooms: number
  unreadCount: number
  activeRooms: number
  href: string
  color: string
  available: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const [channels, setChannels] = useState<ChannelStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChannelStats()
  }, [])

  const fetchChannelStats = async () => {
    try {
      setLoading(true)

      // ดึงสถิติจาก chat_rooms
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('id, status, unread_count')

      if (error) throw error

      // คำนวณสถิติ LINE (ตอนนี้มีแค่ LINE)
      const lineStats = {
        name: 'LINE',
        icon: '📱',
        totalRooms: rooms?.length || 0,
        unreadCount: rooms?.reduce((sum, room) => sum + (room.unread_count || 0), 0) || 0,
        activeRooms: rooms?.filter(room => room.status === 'active').length || 0,
        href: '/chat-v2',
        color: 'from-green-500 to-green-600',
        available: true,
      }

      // Facebook (Coming Soon)
      const facebookStats = {
        name: 'Facebook',
        icon: '📘',
        totalRooms: 0,
        unreadCount: 0,
        activeRooms: 0,
        href: '/chat-v3',
        color: 'from-blue-500 to-blue-600',
        available: false,
      }

      // Instagram (Coming Soon)
      const instagramStats = {
        name: 'Instagram',
        icon: '📷',
        totalRooms: 0,
        unreadCount: 0,
        activeRooms: 0,
        href: '/chat-v4',
        color: 'from-pink-500 to-purple-600',
        available: false,
      }

      // WhatsApp (Coming Soon)
      const whatsappStats = {
        name: 'WhatsApp',
        icon: '💬',
        totalRooms: 0,
        unreadCount: 0,
        activeRooms: 0,
        href: '/chat-v5',
        color: 'from-green-400 to-green-500',
        available: false,
      }

      setChannels([lineStats, facebookStats, instagramStats, whatsappStats])
    } catch (error) {
      console.error('Error fetching channel stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChannelClick = (channel: ChannelStats) => {
    if (channel.available) {
      router.push(channel.href)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">💬 Chat Management</h1>
        <p className="text-gray-600 mt-1">
          เลือกช่องทางการสนทนาที่ต้องการจัดการ
        </p>
      </div>

      {/* Channel Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {channels.map((channel) => (
            <div
              key={channel.name}
              onClick={() => handleChannelClick(channel)}
              className={`
                bg-white rounded-xl p-6 shadow-sm border border-gray-100 
                transition-all duration-200
                ${
                  channel.available
                    ? 'cursor-pointer hover:shadow-md hover:-translate-y-1'
                    : 'opacity-60 cursor-not-allowed'
                }
              `}
            >
              {/* Icon */}
              <div
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4
                  bg-gradient-to-br ${channel.color}
                  ${channel.available ? '' : 'grayscale'}
                `}
              >
                {channel.icon}
              </div>

              {/* Channel Name */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {channel.name}
              </h3>

              {/* Stats */}
              {channel.available ? (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      ห้องแชททั้งหมด
                    </span>
                    <span className="font-semibold text-gray-900">
                      {channel.totalRooms}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      ยังไม่อ่าน
                    </span>
                    <span className="font-semibold text-red-600">
                      {channel.unreadCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      ใช้งานอยู่
                    </span>
                    <span className="font-semibold text-green-600">
                      {channel.activeRooms}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    เร็วๆ นี้
                  </span>
                </div>
              )}

              {/* Button */}
              <button
                disabled={!channel.available}
                className={`
                  w-full py-2.5 px-4 rounded-lg font-medium text-sm
                  transition-colors flex items-center justify-center
                  ${
                    channel.available
                      ? `bg-gradient-to-r ${channel.color} text-white hover:opacity-90`
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {channel.available ? (
                  <>
                    เข้าสู่ {channel.name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'เร็วๆ นี้'
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              จัดการแชทจากหลายช่องทางในที่เดียว
            </h3>
            <p className="text-blue-700 text-sm">
              ระบบรองรับการจัดการแชทจากหลายช่องทางการสื่อสาร ทำให้คุณสามารถตอบกลับลูกค้าได้อย่างรวดเร็วและมีประสิทธิภาพ
              ไม่ว่าจะเป็น LINE, Facebook, Instagram หรือ WhatsApp
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
