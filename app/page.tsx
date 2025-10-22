'use client'

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

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outgoing vs Incoming Messages */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Outgoing vs Incoming</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg font-medium">
                Line graph
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
                Bar graph
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">AI vs Admin Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
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

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Lead Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Average Response Time</h2>
          <ResponsiveContainer width="100%" height={250}>
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Sales</h2>
          <ResponsiveContainer width="100%" height={250}>
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
    </div>
  )
}
