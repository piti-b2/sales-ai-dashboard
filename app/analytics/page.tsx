'use client'

import { useState } from 'react'
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  Download,
  Eye,
  MousePointer,
  Clock,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { MetricCard } from '@/components/MetricCard'
import { formatNumber, formatCurrency } from '@/lib/utils'

// Traffic Sources
const trafficSources = [
  { source: 'LINE Official', value: 4250, color: '#00B900' },
  { source: 'Facebook', value: 3180, color: '#1877F2' },
  { source: 'Google Search', value: 2450, color: '#4285F4' },
  { source: 'Direct', value: 1850, color: '#6B7280' },
  { source: 'Others', value: 890, color: '#9CA3AF' },
]

// Conversion Funnel
const funnelData = [
  { stage: 'เข้าชม', count: 12620, percentage: 100 },
  { stage: 'ดูสินค้า', count: 8945, percentage: 71 },
  { stage: 'สนใจ', count: 4580, percentage: 36 },
  { stage: 'เพิ่มตะกร้า', count: 2340, percentage: 19 },
  { stage: 'ชำระเงิน', count: 1245, percentage: 10 },
]

// User Behavior
const behaviorData = [
  { metric: 'ความสนใจสินค้า', value: 85 },
  { metric: 'การตอบสนอง', value: 92 },
  { metric: 'ความพึงพอใจ', value: 78 },
  { metric: 'โอกาสซื้อซ้ำ', value: 88 },
  { metric: 'แนะนำเพื่อน', value: 65 },
]

// Popular Products
const popularProducts = [
  { name: 'คอร์สโฟนิกส์เด็ก', views: 2850, sales: 245, revenue: 367500 },
  { name: 'คอร์สภาษาอังกฤษ', views: 2340, sales: 189, revenue: 283500 },
  { name: 'หนังสือเสริมทักษะ', views: 1950, sales: 156, revenue: 93600 },
  { name: 'คอร์สคณิตศาสตร์', views: 1680, sales: 142, revenue: 213000 },
  { name: 'แบบฝึกหัดออนไลน์', views: 1420, sales: 98, revenue: 49000 },
]

// Hourly Activity
const hourlyActivity = [
  { hour: '00:00', active: 125 },
  { hour: '02:00', active: 85 },
  { hour: '04:00', active: 65 },
  { hour: '06:00', active: 145 },
  { hour: '08:00', active: 325 },
  { hour: '10:00', active: 485 },
  { hour: '12:00', active: 565 },
  { hour: '14:00', active: 520 },
  { hour: '16:00', active: 480 },
  { hour: '18:00', active: 625 },
  { hour: '20:00', active: 745 },
  { hour: '22:00', active: 425 },
]

// Device Distribution
const deviceData = [
  { name: 'มือถือ', value: 8450, percentage: 68 },
  { name: 'เดสก์ท็อป', value: 2890, percentage: 23 },
  { name: 'แท็บเล็ต', value: 1120, percentage: 9 },
]

// Engagement Metrics Over Time
const engagementData = [
  { date: '1 เม.ย.', pageviews: 1250, sessions: 890, users: 650 },
  { date: '2 เม.ย.', pageviews: 1380, sessions: 950, users: 720 },
  { date: '3 เม.ย.', pageviews: 1290, sessions: 920, users: 680 },
  { date: '4 เม.ย.', pageviews: 1450, sessions: 1020, users: 780 },
  { date: '5 เม.ย.', pageviews: 1520, sessions: 1080, users: 820 },
  { date: '6 เม.ย.', pageviews: 1420, sessions: 980, users: 750 },
  { date: '7 เม.ย.', pageviews: 1350, sessions: 940, users: 710 },
]

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7days')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            รายงานและวิเคราะห์ข้อมูลโดยละเอียด
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">วันนี้</option>
            <option value="7days">7 วันที่แล้ว</option>
            <option value="30days">30 วันที่แล้ว</option>
            <option value="90days">90 วันที่แล้ว</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Page Views"
          value={formatNumber(12620)}
          change="+15.2%"
          icon={Eye}
          trend="up"
          color="#3b82f6"
        />
        <MetricCard
          title="Unique Visitors"
          value={formatNumber(8945)}
          change="+8.7%"
          icon={Users}
          trend="up"
          color="#22c55e"
        />
        <MetricCard
          title="Conversion Rate"
          value="9.87%"
          change="+2.3%"
          icon={TrendingUp}
          trend="up"
          color="#f97316"
        />
        <MetricCard
          title="Avg. Session Time"
          value="4:32 น."
          change="+0:45"
          icon={Clock}
          trend="up"
          color="#8b5cf6"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            แหล่งที่มาของทราฟฟิก
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={trafficSources}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {trafficSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {trafficSources.map((source) => (
              <div
                key={source.source}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: source.color }}
                  />
                  <span className="text-gray-700">{source.source}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatNumber(source.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            อุปกรณ์ที่ใช้
          </h2>
          <div className="space-y-6 mt-8">
            {deviceData.map((device) => (
              <div key={device.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {device.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {device.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(device.value)} ผู้ใช้
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* User Behavior Radar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            พฤติกรรมผู้ใช้
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={behaviorData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.5}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Over Time */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          การมีส่วนร่วมตามเวลา
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={engagementData}>
            <defs>
              <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
              dataKey="pageviews"
              stroke="#3b82f6"
              fill="url(#colorPageviews)"
              name="Page Views"
            />
            <Area
              type="monotone"
              dataKey="sessions"
              stroke="#22c55e"
              fill="url(#colorSessions)"
              name="Sessions"
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#f97316"
              fill="url(#colorUsers)"
              name="Users"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Conversion Funnel
          </h2>
          <div className="space-y-4">
            {funnelData.map((stage, index) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {stage.stage}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(stage.count)} ({stage.percentage}%)
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-10 overflow-hidden">
                    <div
                      className="h-10 rounded-full transition-all duration-300 flex items-center justify-center"
                      style={{
                        width: `${stage.percentage}%`,
                        background: `linear-gradient(135deg, ${
                          index === 0
                            ? '#3b82f6'
                            : index === 1
                            ? '#22c55e'
                            : index === 2
                            ? '#eab308'
                            : index === 3
                            ? '#f97316'
                            : '#ef4444'
                        } 0%, ${
                          index === 0
                            ? '#1d4ed8'
                            : index === 1
                            ? '#16a34a'
                            : index === 2
                            ? '#ca8a04'
                            : index === 3
                            ? '#ea580c'
                            : '#dc2626'
                        } 100%)`,
                      }}
                    >
                      <span className="text-white text-sm font-semibold">
                        {stage.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            กิจกรรมตามชั่วโมง
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="active"
                fill="#8b5cf6"
                radius={[8, 8, 0, 0]}
                name="ผู้ใช้งาน"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            สินค้ายอดนิยม
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สินค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การดู
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การขาย
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รายได้
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {popularProducts.map((product, index) => {
                const conversionRate = ((product.sales / product.views) * 100).toFixed(1)
                return (
                  <tr key={product.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(product.views)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(product.sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">
                        {conversionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
