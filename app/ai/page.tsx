'use client'

import { useState } from 'react'
import {
  Bot,
  User,
  TrendingUp,
  Zap,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Activity,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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

// AI Performance Metrics
const performanceData = [
  { date: '1 เม.ย.', accuracy: 94.5, confidence: 89.2, success: 96.8 },
  { date: '2 เม.ย.', accuracy: 95.2, confidence: 90.5, success: 97.2 },
  { date: '3 เม.ย.', accuracy: 94.8, confidence: 89.8, success: 96.5 },
  { date: '4 เม.ย.', accuracy: 95.8, confidence: 91.2, success: 97.8 },
  { date: '5 เม.ย.', accuracy: 96.2, confidence: 92.0, success: 98.1 },
  { date: '6 เม.ย.', accuracy: 95.5, confidence: 90.8, success: 97.5 },
  { date: '7 เม.ย.', accuracy: 96.8, confidence: 92.5, success: 98.5 },
]

// AI Capabilities Radar
const capabilitiesData = [
  { capability: 'ตอบคำถาม', score: 95 },
  { capability: 'แนะนำสินค้า', score: 88 },
  { capability: 'แก้ปัญหา', score: 82 },
  { capability: 'ติดตามคำสั่งซื้อ', score: 92 },
  { capability: 'ปิดการขาย', score: 78 },
  { capability: 'สร้างความสัมพันธ์', score: 85 },
]

// Response Time Distribution
const responseTimeData = [
  { range: '< 1 วินาที', count: 8450, percentage: 68 },
  { range: '1-2 วินาที', count: 2890, percentage: 23 },
  { range: '2-3 วินาที', count: 780, percentage: 6 },
  { range: '3-5 วินาที', count: 290, percentage: 2 },
  { range: '> 5 วินาที', count: 120, percentage: 1 },
]

// Common Queries
const commonQueries = [
  { query: 'ราคาคอร์สเท่าไหร่', count: 2850, success: 98.5 },
  { query: 'มีคอร์สอะไรบ้าง', count: 2340, success: 97.2 },
  { query: 'ผ่อนชำระได้ไหม', count: 1950, success: 96.8 },
  { query: 'ตรวจสอบพัสดุ', count: 1680, success: 94.5 },
  { query: 'วิธีการสั่งซื้อ', count: 1420, success: 99.1 },
]

// Failed Queries (ที่ต้อง Escalate)
const failedQueries = [
  { query: 'ขอคืนเงิน', count: 45, reason: 'ต้องการแอดมิน' },
  { query: 'ไม่พอใจสินค้า', count: 32, reason: 'ร้องเรียน' },
  { query: 'เว็บไซต์ไม่ทำงาน', count: 28, reason: 'ปัญหาเทคนิค' },
  { query: 'ไม่ได้รับสินค้า', count: 23, reason: 'ปัญหาการจัดส่ง' },
  { query: 'ลืมรหัสผ่าน', count: 18, reason: 'ต้องการแอดมิน' },
]

// AI vs Admin Performance
const comparisonData = [
  {
    metric: 'Response Time',
    ai: 1.2,
    admin: 45.8,
    unit: 'วินาที',
  },
  {
    metric: 'Success Rate',
    ai: 96.5,
    admin: 94.2,
    unit: '%',
  },
  {
    metric: 'Conversations/Day',
    ai: 1240,
    admin: 85,
    unit: 'ครั้ง',
  },
  {
    metric: 'Customer Satisfaction',
    ai: 4.6,
    admin: 4.8,
    unit: '/5',
  },
]

// Token Usage & Cost
const tokenData = [
  { date: '1 เม.ย.', input: 125000, output: 185000, cost: 45.5 },
  { date: '2 เม.ย.', input: 138000, output: 205000, cost: 51.2 },
  { date: '3 เม.ย.', input: 129000, output: 192000, cost: 47.8 },
  { date: '4 เม.ย.', input: 145000, output: 218000, cost: 54.3 },
  { date: '5 เม.ย.', input: 152000, output: 228000, cost: 57.1 },
  { date: '6 เม.ย.', input: 142000, output: 210000, cost: 52.4 },
  { date: '7 เม.ย.', input: 135000, output: 198000, cost: 49.6 },
]

// Escalation Stats
const escalationData = [
  { type: 'VIP Customer', count: 23, priority: 'critical' },
  { type: 'Hot Lead (>80)', count: 47, priority: 'high' },
  { type: 'ร้องเรียน', count: 32, priority: 'high' },
  { type: 'ปัญหาเทคนิค', count: 28, priority: 'medium' },
  { type: 'คำถามซับซ้อน', count: 65, priority: 'medium' },
  { type: 'ต้องการคำปรึกษา', count: 89, priority: 'low' },
]

export default function AIPage() {
  const [period, setPeriod] = useState('7days')

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            AI Performance
          </h1>
          <p className="text-gray-600 mt-1">
            ประสิทธิภาพและการทำงานของ AI Agent
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="today">วันนี้</option>
          <option value="7days">7 วันที่แล้ว</option>
          <option value="30days">30 วันที่แล้ว</option>
        </select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="AI Response Rate"
          value="96.5%"
          change="+2.3%"
          icon={Bot}
          trend="up"
          color="#22c55e"
        />
        <MetricCard
          title="Accuracy Score"
          value="95.8%"
          change="+1.5%"
          icon={Target}
          trend="up"
          color="#3b82f6"
        />
        <MetricCard
          title="Avg Confidence"
          value="91.2%"
          change="+3.2%"
          icon={Brain}
          trend="up"
          color="#8b5cf6"
        />
        <MetricCard
          title="Escalations"
          value={formatNumber(284)}
          change="-8.5%"
          icon={AlertTriangle}
          trend="down"
          color="#f97316"
        />
      </div>

      {/* Main Performance Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          ประสิทธิภาพ AI ตามเวลา
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} domain={[80, 100]} />
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
              dataKey="accuracy"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="ความแม่นยำ (%)"
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              name="ความมั่นใจ (%)"
            />
            <Line
              type="monotone"
              dataKey="success"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', r: 4 }}
              name="อัตราสำเร็จ (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Capabilities */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            ความสามารถของ AI
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={capabilitiesData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="capability" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.5}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            การกระจายตัวของเวลาตอบกลับ
          </h2>
          <div className="space-y-4 mt-8">
            {responseTimeData.map((item) => (
              <div key={item.range}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {item.range}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(item.count)} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI vs Admin Comparison */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          AI vs Admin Comparison
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {comparisonData.map((item) => (
            <div
              key={item.metric}
              className="border border-gray-100 rounded-lg p-4"
            >
              <p className="text-sm text-gray-600 mb-3">{item.metric}</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600">AI</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {item.ai} {item.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-gray-600">Admin</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">
                    {item.admin} {item.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Token Usage & Cost */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Token Usage & Cost Analysis
          </h2>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(358.9)}
            </p>
            <p className="text-sm text-gray-500">ค่าใช้จ่ายรวม 7 วัน</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={tokenData}>
            <defs>
              <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
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
              dataKey="input"
              stroke="#3b82f6"
              fill="url(#colorInput)"
              name="Input Tokens"
            />
            <Area
              type="monotone"
              dataKey="output"
              stroke="#22c55e"
              fill="url(#colorOutput)"
              name="Output Tokens"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Layout - Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Queries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              คำถามที่พบบ่อย
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {commonQueries.map((query, index) => (
              <div
                key={query.query}
                className="flex items-start justify-between"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {query.query}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNumber(query.count)} ครั้ง
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <span className="text-sm font-semibold text-green-600">
                    {query.success}%
                  </span>
                  <CheckCircle className="w-4 h-4 text-green-600 inline ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failed Queries / Escalations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Escalations (ส่งต่อแอดมิน)
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {failedQueries.map((query, index) => (
              <div
                key={query.query}
                className="flex items-start justify-between"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {query.query}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {query.reason}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {query.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Escalation Priority Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          สถิติการ Escalate ตาม Priority
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {escalationData.map((item) => (
            <div
              key={item.type}
              className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {item.type}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                    item.priority
                  )}`}
                >
                  {item.priority}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              <p className="text-xs text-gray-500 mt-1">ครั้ง</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
