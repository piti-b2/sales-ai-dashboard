'use client'

import { useState } from 'react'
import {
  Users,
  UserPlus,
  TrendingUp,
  Target,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Star,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { MetricCard } from '@/components/MetricCard'
import { formatNumber } from '@/lib/utils'

// Lead Distribution
const leadData = [
  { name: 'Hot Leads', value: 47, color: '#f97316', percentage: 5 },
  { name: 'Warm Leads', value: 156, color: '#eab308', percentage: 16 },
  { name: 'Cold Leads', value: 789, color: '#3b82f6', percentage: 79 },
]

// Customer Growth
const growthData = [
  { month: 'ต.ค. 24', total: 450, new: 45 },
  { month: 'พ.ย. 24', total: 520, new: 70 },
  { month: 'ธ.ค. 24', total: 615, new: 95 },
  { month: 'ม.ค. 25', total: 735, new: 120 },
  { month: 'ก.พ. 25', total: 845, new: 110 },
  { month: 'มี.ค. 25', total: 940, new: 95 },
]

// Customer Lifetime Value
const clvData = [
  { range: '< ฿1,000', count: 320 },
  { range: '฿1,000-5,000', count: 450 },
  { range: '฿5,000-10,000', count: 180 },
  { range: '฿10,000-20,000', count: 85 },
  { range: '> ฿20,000', count: 35 },
]

// Recent Customers
const recentCustomers = [
  {
    id: 1,
    name: 'สมชาย ใจดี',
    email: 'somchai@email.com',
    phone: '089-123-4567',
    location: 'กรุงเทพฯ',
    status: 'hot',
    purchases: 3,
    totalSpent: 12500,
    lastActive: '2 ชั่วโมงที่แล้ว',
    avatar: 'SC',
  },
  {
    id: 2,
    name: 'กมลวรรณ สวยงาม',
    email: 'kamonwan@email.com',
    phone: '081-234-5678',
    location: 'เชียงใหม่',
    status: 'warm',
    purchases: 2,
    totalSpent: 8900,
    lastActive: '1 วันที่แล้ว',
    avatar: 'KS',
  },
  {
    id: 3,
    name: 'ประสิทธิ์ มั่งคั่ง',
    email: 'prasit@email.com',
    phone: '062-345-6789',
    location: 'นครปฐม',
    status: 'hot',
    purchases: 5,
    totalSpent: 25000,
    lastActive: '30 นาทีที่แล้ว',
    avatar: 'PM',
  },
  {
    id: 4,
    name: 'วิมลรัตน์ ดีมาก',
    email: 'wimonrat@email.com',
    phone: '095-456-7890',
    location: 'ภูเก็ต',
    status: 'cold',
    purchases: 1,
    totalSpent: 1500,
    lastActive: '3 วันที่แล้ว',
    avatar: 'VD',
  },
  {
    id: 5,
    name: 'ธนากร รุ่งเรือง',
    email: 'thanakorn@email.com',
    phone: '088-567-8901',
    location: 'ขอนแก่น',
    status: 'warm',
    purchases: 2,
    totalSpent: 6500,
    lastActive: '5 ชั่วโมงที่แล้ว',
    avatar: 'TR',
  },
  {
    id: 6,
    name: 'นันทิดา มีสุข',
    email: 'nantida@email.com',
    phone: '092-678-9012',
    location: 'สงขลา',
    status: 'hot',
    purchases: 4,
    totalSpent: 18900,
    lastActive: '1 ชั่วโมงที่แล้ว',
    avatar: 'NM',
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'hot':
      return 'bg-orange-100 text-orange-800'
    case 'warm':
      return 'bg-yellow-100 text-yellow-800'
    case 'cold':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'hot':
      return 'Hot Lead'
    case 'warm':
      return 'Warm Lead'
    case 'cold':
      return 'Cold Lead'
    default:
      return 'Unknown'
  }
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ลูกค้า</h1>
          <p className="text-gray-600 mt-1">จัดการและติดตามลูกค้าทั้งหมด</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <UserPlus className="w-5 h-5" />
          <span>เพิ่มลูกค้าใหม่</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="ลูกค้าทั้งหมด"
          value={formatNumber(992)}
          change="+52"
          icon={Users}
          trend="up"
          color="#3b82f6"
        />
        <MetricCard
          title="ลูกค้าใหม่ (เดือนนี้)"
          value={formatNumber(95)}
          change="+12.5%"
          icon={UserPlus}
          trend="up"
          color="#22c55e"
        />
        <MetricCard
          title="Hot Leads"
          value="47"
          change="+5"
          icon={Target}
          trend="up"
          color="#f97316"
        />
        <MetricCard
          title="Conversion Rate"
          value="23.4%"
          change="+2.1%"
          icon={TrendingUp}
          trend="up"
          color="#8b5cf6"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            การกระจายตัวของ Leads
          </h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={leadData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {leadData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {item.value}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Growth */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            การเติบโตของลูกค้า
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
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
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="ลูกค้าทั้งหมด"
              />
              <Line
                type="monotone"
                dataKey="new"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 4 }}
                name="ลูกค้าใหม่"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Lifetime Value */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          มูลค่าตลอดชีพของลูกค้า (CLV)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={clvData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="range" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar
              dataKey="count"
              fill="#8b5cf6"
              radius={[8, 8, 0, 0]}
              name="จำนวนลูกค้า"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              รายชื่อลูกค้า
            </h2>
            <button className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
              <Filter className="w-4 h-4 inline mr-1" />
              กรอง
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาลูกค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ติดต่อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การซื้อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ใช้จ่ายทั้งหมด
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  กิจกรรมล่าสุด
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recentCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {customer.avatar}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {customer.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {customer.email}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        customer.status
                      )}`}
                    >
                      {customer.status === 'hot' && (
                        <Star className="w-3 h-3 mr-1" />
                      )}
                      {getStatusText(customer.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.purchases} ครั้ง
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ฿{formatNumber(customer.totalSpent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.lastActive}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
