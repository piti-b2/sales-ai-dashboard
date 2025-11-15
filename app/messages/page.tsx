'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { MetricCard } from '@/components/MetricCard'
import { formatNumber } from '@/lib/utils'

// Mock Data - ข้อมูลข้อความรายวัน
const dailyMessages = [
  { date: '1 เม.ย.', sent: 1240, received: 980, total: 2220 },
  { date: '2 เม.ย.', sent: 1350, received: 1100, total: 2450 },
  { date: '3 เม.ย.', sent: 1280, received: 1050, total: 2330 },
  { date: '4 เม.ย.', sent: 1420, received: 1200, total: 2620 },
  { date: '5 เม.ย.', sent: 1380, received: 1150, total: 2530 },
  { date: '6 เม.ย.', sent: 1320, received: 1080, total: 2400 },
  { date: '7 เม.ย.', sent: 1260, received: 1020, total: 2280 },
  { date: '8 เม.ย.', sent: 1450, received: 1250, total: 2700 },
  { date: '9 เม.ย.', sent: 1490, received: 1300, total: 2790 },
  { date: '10 เม.ย.', sent: 1520, received: 1350, total: 2870 },
]

// ประเภทข้อความ
const messageTypes = [
  { type: 'ข้อความทั่วไป', count: 12450, percentage: 65, color: '#3b82f6' },
  { type: 'คำถามสินค้า', count: 4230, percentage: 22, color: '#22c55e' },
  { type: 'ร้องเรียน', count: 1580, percentage: 8, color: '#f97316' },
  { type: 'ขอบคุณ', count: 950, percentage: 5, color: '#8b5cf6' },
]

// เวลาตอบกลับเฉลี่ย
const responseTimeData = [
  { hour: '00:00', seconds: 45 },
  { hour: '02:00', seconds: 38 },
  { hour: '04:00', seconds: 42 },
  { hour: '06:00', seconds: 52 },
  { hour: '08:00', seconds: 68 },
  { hour: '10:00', seconds: 75 },
  { hour: '12:00', seconds: 85 },
  { hour: '14:00', seconds: 82 },
  { hour: '16:00', seconds: 78 },
  { hour: '18:00', seconds: 72 },
  { hour: '20:00', seconds: 65 },
  { hour: '22:00', seconds: 55 },
]

// Interface สำหรับ Chat Room
interface ChatRoom {
  id: string
  customer_user_id: string
  customer_name: string
  customer_avatar: string | null
  last_message_at: string
  last_message_content: string | null
  unread_count: number
  status: string
}

// สร้าง Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MessagesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [recentMessages, setRecentMessages] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  // ดึงข้อมูล chat rooms
  useEffect(() => {
    fetchRecentChats()
  }, [])

  const fetchRecentChats = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setRecentMessages(data || [])
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันสำหรับคลิกเข้าแชท
  const handleChatClick = (roomId: string) => {
    router.push(`/chat-v2?room=${roomId}`)
  }

  // ฟังก์ชันสร้าง avatar initials
  const getInitials = (name: string) => {
    if (!name) return '??'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ข้อความ</h1>
        <p className="text-gray-600 mt-1">
          ภาพรวมการสนทนาและข้อความทั้งหมด
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="ข้อความทั้งหมด"
          value={formatNumber(43624)}
          change="+482"
          icon={MessageSquare}
          trend="up"
          color="#3b82f6"
        />
        <MetricCard
          title="ส่งออก"
          value={formatNumber(35182)}
          change="+27"
          icon={TrendingUp}
          trend="up"
          color="#22c55e"
        />
        <MetricCard
          title="รับเข้า"
          value={formatNumber(8442)}
          change="-"
          icon={TrendingDown}
          trend="up"
          color="#f97316"
        />
        <MetricCard
          title="เวลาตอบกลับเฉลี่ย"
          value="0:21 น."
          change="-2 น."
          icon={Clock}
          trend="down"
          color="#8b5cf6"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Messages Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            ข้อความรายวัน
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyMessages}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="sent"
                stroke="#3b82f6"
                fill="url(#colorSent)"
                name="ส่งออก"
              />
              <Area
                type="monotone"
                dataKey="received"
                stroke="#22c55e"
                fill="url(#colorReceived)"
                name="รับเข้า"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            เวลาตอบกลับเฉลี่ย (วินาที)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="seconds"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                name="วินาที"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Message Types */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          ประเภทข้อความ
        </h2>
        <div className="space-y-4">
          {messageTypes.map((type) => (
            <div key={type.type}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {type.type}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(type.count)} ({type.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${type.percentage}%`,
                    backgroundColor: type.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              ข้อความล่าสุด
            </h2>
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                <Filter className="w-4 h-4 inline mr-1" />
                กรอง
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาข้อความ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">กำลังโหลด...</p>
            </div>
          ) : recentMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีข้อความ</p>
            </div>
          ) : (
            recentMessages.map((room) => (
              <div
                key={room.id}
                onClick={() => handleChatClick(room.id)}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  {room.customer_avatar ? (
                    <img
                      src={room.customer_avatar}
                      alt={room.customer_name}
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {getInitials(room.customer_name)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {room.customer_name || room.customer_user_id}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {room.last_message_at
                          ? formatDistanceToNow(new Date(room.last_message_at), {
                              addSuffix: true,
                              locale: th,
                            })
                          : '-'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {room.last_message_content || 'ไม่มีข้อความ'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {/* Status Badge */}
                      {room.status === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          ใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Clock className="w-3 h-3 mr-1" />
                          {room.status}
                        </span>
                      )}
                      
                      {/* Unread Count */}
                      {room.unread_count > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
    </div>
  )
}
