'use client'

import { useState } from 'react'
import { MetricCard } from '@/components/MetricCard'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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
  TrendingUp,
  DollarSign,
  Bot,
  UserCheck,
  Clock,
  Target,
  Calendar,
} from 'lucide-react'
import { formatNumber, formatCurrency } from '@/lib/utils'

// Mock Data
const messageData = [
  { date: '1 Apr', outgoing: 12487, incoming: 9651 },
  { date: '2 Apr', outgoing: 13200, incoming: 10200 },
  { date: '3 Apr', outgoing: 12900, incoming: 10800 },
  { date: '4 Apr', outgoing: 14100, incoming: 11200 },
  { date: '5 Apr', outgoing: 13800, incoming: 10500 },
  { date: '6 Apr', outgoing: 13200, incoming: 10200 },
  { date: '7 Apr', outgoing: 12600, incoming: 9800 },
  { date: '8 Apr', outgoing: 13500, incoming: 10600 },
  { date: '9 Apr', outgoing: 14200, incoming: 11400 },
  { date: '10 Apr', outgoing: 12487, incoming: 7651 },
]

const performanceData = [
  { month: 'Jan', ai: 120, admin: 35 },
  { month: 'Feb', ai: 135, admin: 38 },
  { month: 'Mar', ai: 145, admin: 42 },
  { month: 'Apr', ai: 150, admin: 40 },
  { month: 'May', ai: 156, admin: 45 },
  { month: 'Jun', ai: 168, admin: 42 },
]

const leadData = [
  { name: 'Hot Leads', value: 47, color: '#f97316' },
  { name: 'Warm Leads', value: 156, color: '#eab308' },
  { name: 'Cold Leads', value: 789, color: '#3b82f6' },
]

const responseTimeData = [
  { time: '00:00', seconds: 45 },
  { time: '04:00', seconds: 38 },
  { time: '08:00', seconds: 62 },
  { time: '12:00', seconds: 78 },
  { time: '16:00', seconds: 85 },
  { time: '20:00', seconds: 65 },
  { time: '24:00', seconds: 42 },
]

const salesData = [
  { date: 'Mon', amount: 12000 },
  { date: 'Tue', amount: 19000 },
  { date: 'Wed', amount: 15000 },
  { date: 'Thu', amount: 25000 },
  { date: 'Fri', amount: 22000 },
  { date: 'Sat', amount: 30000 },
  { date: 'Sun', amount: 18000 },
]

// NEW: Top Products Data (สินค้าขายดี)
const topProductsData = [
  { name: 'ครีมบำรุงผิว Premium', sales: 245, revenue: 122500, color: '#3b82f6' },
  { name: 'เซรั่มหน้าใส', sales: 198, revenue: 99000, color: '#8b5cf6' },
  { name: 'มาส์กหน้า 7 วัน', sales: 167, revenue: 50100, color: '#ec4899' },
  { name: 'โลชั่นบำรุงผิว', sales: 145, revenue: 43500, color: '#f97316' },
  { name: 'ครีมกันแดด SPF50', sales: 132, revenue: 52800, color: '#eab308' },
]

// NEW: Peak Hours Data (เวลาที่ขายดี)
const peakHoursData = [
  { hour: '00:00', orders: 5, amount: 12000 },
  { hour: '03:00', orders: 3, amount: 7500 },
  { hour: '06:00', orders: 8, amount: 18000 },
  { hour: '09:00', orders: 25, amount: 62500 },
  { hour: '12:00', orders: 42, amount: 105000 },
  { hour: '15:00', orders: 38, amount: 95000 },
  { hour: '18:00', orders: 55, amount: 137500 },
  { hour: '21:00', orders: 48, amount: 120000 },
]

// NEW: Admin Sales Performance (แอดมินขายได้เยอะ)
const adminSalesData = [
  { name: 'Admin A', sales: 125, revenue: 312500, orders: 145, color: '#3b82f6' },
  { name: 'Admin B', sales: 98, revenue: 245000, orders: 112, color: '#8b5cf6' },
  { name: 'Admin C', sales: 87, revenue: 217500, orders: 98, color: '#ec4899' },
  { name: 'Admin D', sales: 76, revenue: 190000, orders: 85, color: '#f97316' },
  { name: 'AI Bot', sales: 456, revenue: 1140000, orders: 523, color: '#22c55e' },
]

// NEW: Customer Demographics (ข้อมูลลูกค้า)
const provinceData = [
  { name: 'กรุงเทพฯ', customers: 1245, color: '#3b82f6' },
  { name: 'เชียงใหม่', customers: 456, color: '#8b5cf6' },
  { name: 'ภูเก็ต', customers: 389, color: '#ec4899' },
  { name: 'ขอนแก่น', customers: 312, color: '#f97316' },
  { name: 'อื่นๆ', customers: 1598, color: '#94a3b8' },
]

const ageData = [
  { range: '18-24', customers: 1245, percentage: 31, color: '#3b82f6' },
  { range: '25-34', customers: 1876, percentage: 47, color: '#8b5cf6' },
  { range: '35-44', customers: 623, percentage: 16, color: '#ec4899' },
  { range: '45+', customers: 256, percentage: 6, color: '#f97316' },
]

const genderData = [
  { name: 'หญิง', value: 2845, percentage: 71, color: '#ec4899' },
  { name: 'ชาย', value: 1045, percentage: 26, color: '#3b82f6' },
  { name: 'ไม่ระบุ', value: 110, percentage: 3, color: '#94a3b8' },
]

type Channel = 'all' | 'line' | 'facebook' | 'instagram' | 'whatsapp' | 'tiktok' | 'shopee'

export default function Home() {
  const [selectedChannel, setSelectedChannel] = useState<Channel>('all')
  const [dateRange, setDateRange] = useState(7) // 7, 30, 90 days
  
  // Calculate date range display
  const getDateRangeText = () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - dateRange)
    return `${startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  const channels = [
    { id: 'all' as Channel, name: 'All Channels', icon: '📊', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200', ring: 'ring-gray-400' },
    { id: 'line' as Channel, name: 'LINE', icon: '💬', color: 'bg-green-100 text-green-700 hover:bg-green-200', ring: 'ring-green-400' },
    { id: 'facebook' as Channel, name: 'Facebook', icon: '👥', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200', ring: 'ring-blue-400' },
    { id: 'instagram' as Channel, name: 'Instagram', icon: '📷', color: 'bg-pink-100 text-pink-700 hover:bg-pink-200', ring: 'ring-pink-400' },
    { id: 'whatsapp' as Channel, name: 'WhatsApp', icon: '💚', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200', ring: 'ring-emerald-400' },
    { id: 'tiktok' as Channel, name: 'TikTok', icon: '🎵', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200', ring: 'ring-slate-400' },
    { id: 'shopee' as Channel, name: 'Shopee', icon: '🛒', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200', ring: 'ring-orange-400' },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {getDateRangeText()}
            </p>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex gap-2">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  dateRange === days
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {days} วัน
              </button>
            ))}
          </div>
        </div>
        
        {/* Channel Filter - Mobile Optimized */}
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

      {/* Selected Channel Badge - Mobile Optimized */}
      {selectedChannel !== 'all' && (
        <div className="flex items-center justify-between gap-2 px-3 md:px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-xs md:text-sm text-blue-700 flex items-center gap-1.5">
            <span className="text-base">{channels.find(c => c.id === selectedChannel)?.icon}</span>
            <span>
              <span className="hidden sm:inline">Showing: </span>
              <strong>{channels.find(c => c.id === selectedChannel)?.name}</strong>
            </span>
          </span>
          <button
            onClick={() => setSelectedChannel('all')}
            className="text-blue-600 hover:text-blue-800 font-medium text-xs md:text-sm px-2 py-1 hover:bg-blue-100 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <MetricCard
          title="Total Messages"
          value={formatNumber(43624)}
          change="+482"
          icon={MessageSquare}
          trend="up"
          sparklineData={[30, 40, 35, 50, 49, 60, 70, 91, 85, 95]}
          color="#22c55e"
        />
        <MetricCard
          title="Active Customers"
          value={formatNumber(8442)}
          change="+127"
          icon={Users}
          trend="up"
          sparklineData={[20, 30, 25, 40, 45, 50, 55, 65, 70, 80]}
          color="#3b82f6"
        />
        <MetricCard
          title="Hot Leads"
          value="47"
          change="+5"
          icon={Target}
          trend="up"
          sparklineData={[10, 15, 12, 18, 22, 28, 32, 38, 42, 47]}
          color="#f97316"
        />
        <MetricCard
          title="Revenue (Month)"
          value={formatCurrency(245000)}
          change="+18.2%"
          icon={DollarSign}
          trend="up"
          sparklineData={[150, 160, 170, 180, 190, 200, 210, 220, 235, 245]}
          color="#8b5cf6"
        />
      </div>

      {/* Main Charts - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Outgoing vs Incoming Messages */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Outgoing vs Incoming</h2>
            <div className="flex space-x-1 md:space-x-2">
              <button className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm bg-blue-50 text-blue-600 rounded-lg font-medium">
                Line
              </button>
              <button className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
                Bar
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={messageData}>
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
              <Line
                type="monotone"
                dataKey="outgoing"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                name="Outgoing"
              />
              <Line
                type="monotone"
                dataKey="incoming"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Incoming"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI vs Admin Performance */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">AI vs Admin Performance</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="ai" fill="#22c55e" radius={[8, 8, 0, 0]} name="AI Responses" />
              <Bar dataKey="admin" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Admin Responses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Lead Distribution */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Lead Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={leadData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {leadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {leadData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Average Response Time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="seconds"
                stroke="#8b5cf6"
                fill="#c4b5fd"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Sales */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Daily Sales</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NEW SECTION: Top Products (สินค้าขายดี) */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          🏆 สินค้าขายดี Top 5
        </h2>
        <div className="space-y-4">
          {topProductsData.map((product, index) => (
            <div key={product.name} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                   style={{ backgroundColor: product.color }}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-gray-500">ขายได้ {product.sales} ชิ้น</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div className="h-2 rounded-full" 
                       style={{ 
                         width: `${(product.sales / topProductsData[0].sales) * 100}%`,
                         backgroundColor: product.color 
                       }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW SECTION: Peak Hours & Admin Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Peak Hours (เวลาที่ขายดี) */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">
            ⏰ เวลาที่ขายดี
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'amount') return [formatCurrency(value), 'ยอดขาย']
                  return [value, 'ออเดอร์']
                }}
              />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} name="จำนวนออเดอร์" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Admin Sales Performance (แอดมินขายได้เยอะ) */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">
            👥 ผลงานการขายของทีม
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={adminSalesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                {adminSalesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NEW SECTION: Customer Demographics */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">
          📊 ข้อมูลลูกค้า (Demographics)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* จังหวัด */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📍 จังหวัด Top 5</h3>
            <div className="space-y-3">
              {provinceData.map((province) => (
                <div key={province.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: province.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{province.name}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className="h-1.5 rounded-full" 
                           style={{ 
                             width: `${(province.customers / provinceData[0].customers) * 100}%`,
                             backgroundColor: province.color 
                           }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    {formatNumber(province.customers)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* อายุ */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🎂 ช่วงอายุ</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percentage }: any) => `${range}\n${percentage}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="customers"
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* เพศ */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">👤 เพศ</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) => `${name}\n${percentage}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
