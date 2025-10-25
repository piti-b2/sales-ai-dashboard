'use client'

import { useState, useEffect } from 'react'
import { MetricCard } from '@/components/MetricCard'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  MessageSquare,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { formatNumber, formatCurrency } from '@/lib/utils'

type Channel = 'all' | 'line' | 'facebook' | 'instagram' | 'whatsapp' | 'tiktok' | 'shopee'

interface AnalyticsData {
  messages: any
  sales: any
  customers: any
  loading: boolean
  error: string | null
}

export default function DashboardPage() {
  const [selectedChannel, setSelectedChannel] = useState<Channel>('all')
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AnalyticsData>({
    messages: null,
    sales: null,
    customers: null,
    loading: true,
    error: null
  })

  const channels = [
    { id: 'all' as Channel, name: 'All Channels', icon: '📊', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200', ring: 'ring-gray-400' },
    { id: 'line' as Channel, name: 'LINE', icon: '💬', color: 'bg-green-100 text-green-700 hover:bg-green-200', ring: 'ring-green-400' },
    { id: 'facebook' as Channel, name: 'Facebook', icon: '👥', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200', ring: 'ring-blue-400' },
    { id: 'instagram' as Channel, name: 'Instagram', icon: '📷', color: 'bg-pink-100 text-pink-700 hover:bg-pink-200', ring: 'ring-pink-400' },
    { id: 'whatsapp' as Channel, name: 'WhatsApp', icon: '💚', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200', ring: 'ring-emerald-400' },
    { id: 'tiktok' as Channel, name: 'TikTok', icon: '🎵', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200', ring: 'ring-slate-400' },
    { id: 'shopee' as Channel, name: 'Shopee', icon: '🛒', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200', ring: 'ring-orange-400' },
  ]

  useEffect(() => {
    fetchAnalytics()
  }, [days, selectedChannel])

  const fetchAnalytics = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const [messagesRes, salesRes, customersRes] = await Promise.all([
        fetch(`/api/analytics/messages?days=${days}&channel=${selectedChannel}`),
        fetch(`/api/analytics/sales?days=${days}`),
        fetch(`/api/analytics/customers?days=${days}`)
      ])

      const messages = await messagesRes.json()
      const sales = await salesRes.json()
      const customers = await customersRes.json()

      setData({
        messages: messages.data,
        sales: sales.data,
        customers: customers.data,
        loading: false,
        error: null
      })
    } catch (error: any) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading data</p>
          <p className="text-gray-600 text-sm">{data.error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const messagesByDayData = Object.entries(data.messages?.messagesByDay || {}).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
    messages: count
  })).reverse()

  const revenueByDayData = Object.entries(data.sales?.revenueByDay || {}).map(([date, amount]) => ({
    date: new Date(date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
    revenue: amount
  })).reverse()

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">แดชบอร์ดข้อมูลแบบ Real-time</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">ตัวชี้วัดและการติดตามผลงานแบบทันที</p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  days === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        
        {/* Channel Filter */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center gap-2 min-w-max md:flex-wrap">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`
                  flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all whitespace-nowrap
                  ${selectedChannel === channel.id 
                    ? `${channel.color} ring-2 ring-offset-1 ${channel.ring}`
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }
                `}
              >
                <span className="text-base md:text-lg">{channel.icon}</span>
                <span className="hidden sm:inline">{channel.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <MetricCard
          title="ข้อความทั้งหมด"
          value={formatNumber(data.messages?.totalMessages || 0)}
          change={`${data.messages?.userMessages || 0} ขาเข้า`}
          icon={MessageSquare}
          trend="up"
          sparklineData={[30, 40, 35, 50, 49, 60, 70, 91, 85, 95]}
          color="#22c55e"
        />
        <MetricCard
          title="ลูกค้าที่ใช้งาน"
          value={formatNumber(data.customers?.totalCustomers || 0)}
          change={`${data.customers?.conversionRate || 0}% แปลงเป็นลูกค้า`}
          icon={Users}
          trend="up"
          sparklineData={[20, 30, 25, 40, 45, 50, 55, 65, 70, 80]}
          color="#3b82f6"
        />
        <MetricCard
          title="ลูกค้าเป้าหมาย"
          value={formatNumber(data.customers?.paidCustomers || 0)}
          change="+5 วันนี้"
          icon={Target}
          trend="up"
          sparklineData={[10, 15, 12, 18, 22, 28, 32, 38, 42, 47]}
          color="#f97316"
        />
        <MetricCard
          title="รายได้"
          value={formatCurrency(data.sales?.totalRevenue || 0)}
          change={`เฉลี่ย ฿${formatNumber(data.sales?.avgOrderValue || 0)}`}
          icon={DollarSign}
          trend="up"
          sparklineData={[150, 160, 170, 180, 190, 200, 210, 220, 235, 245]}
          color="#8b5cf6"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Messages Over Time */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">
            ข้อความตามช่วงเวลา
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={messagesByDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Over Time */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">
            รายได้ตามช่วงเวลา
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueByDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">การสนทนา</h3>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.messages?.uniqueConversations || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">การสนทนาที่ใช้งาน</p>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">เวลาตอบกลับเฉลี่ย</h3>
          <p className="text-2xl font-bold text-gray-900">{data.messages?.avgResponseTime || 0}วิ</p>
          <p className="text-xs text-gray-500 mt-1">เวลาเฉลี่ยในการตอบกลับ</p>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Verified Payments</h3>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.sales?.verifiedPayments || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Out of {data.sales?.totalPayments || 0} total</p>
        </div>
      </div>
    </div>
  )
}
