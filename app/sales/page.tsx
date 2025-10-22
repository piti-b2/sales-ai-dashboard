'use client'

import { useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  CreditCard,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { MetricCard } from '@/components/MetricCard'
import { formatNumber, formatCurrency } from '@/lib/utils'

// Sales Over Time
const salesData = [
  { date: '1 เม.ย.', revenue: 45000, orders: 23, avg: 1956 },
  { date: '2 เม.ย.', revenue: 52000, orders: 28, avg: 1857 },
  { date: '3 เม.ย.', revenue: 48000, orders: 25, avg: 1920 },
  { date: '4 เม.ย.', revenue: 65000, orders: 32, avg: 2031 },
  { date: '5 เม.ย.', revenue: 58000, orders: 29, avg: 2000 },
  { date: '6 เม.ย.', revenue: 71000, orders: 35, avg: 2028 },
  { date: '7 เม.ย.', revenue: 62000, orders: 31, avg: 2000 },
  { date: '8 เม.ย.', revenue: 68000, orders: 33, avg: 2060 },
  { date: '9 เม.ย.', revenue: 75000, orders: 38, avg: 1973 },
  { date: '10 เม.ย.', revenue: 82000, orders: 42, avg: 1952 },
]

// Sales by Category
const categoryData = [
  { name: 'คอร์สออนไลน์', value: 458000, percentage: 62, color: '#3b82f6' },
  { name: 'หนังสือ', value: 185000, percentage: 25, color: '#22c55e' },
  { name: 'แบบฝึกหัด', value: 96000, percentage: 13, color: '#f97316' },
]

// Payment Methods
const paymentData = [
  { method: 'โอนเงิน/สลิป', count: 245, amount: 489000 },
  { method: 'บัตรเครดิต', count: 189, amount: 378000 },
  { method: 'PromptPay QR', count: 156, amount: 234000 },
  { method: 'ผ่อนชำระ', count: 98, amount: 294000 },
  { method: 'COD', count: 45, amount: 67500 },
]

// Top Products
const topProducts = [
  {
    name: 'คอร์สโฟนิกส์สำหรับเด็ก',
    sales: 245,
    revenue: 367500,
    price: 1500,
    trend: 'up',
  },
  {
    name: 'คอร์สภาษาอังกฤษเบื้องต้น',
    sales: 189,
    revenue: 283500,
    price: 1500,
    trend: 'up',
  },
  {
    name: 'หนังสือเสริมทักษะการอ่าน',
    sales: 156,
    revenue: 93600,
    price: 600,
    trend: 'up',
  },
  {
    name: 'คอร์สคณิตศาสตร์มัธยม',
    sales: 142,
    revenue: 213000,
    price: 1500,
    trend: 'down',
  },
  {
    name: 'แบบฝึกหัดออนไลน์',
    sales: 98,
    revenue: 49000,
    price: 500,
    trend: 'up',
  },
]

// Recent Orders
const recentOrders = [
  {
    id: 'ORD-2025-1245',
    customer: 'สมชาย ใจดี',
    products: 'คอร์สโฟนิกส์ + หนังสือ',
    amount: 2100,
    status: 'completed',
    date: '10 เม.ย. 2025, 14:32',
    payment: 'โอนเงิน',
  },
  {
    id: 'ORD-2025-1244',
    customer: 'กมลวรรณ สวยงาม',
    products: 'คอร์สภาษาอังกฤษ',
    amount: 1500,
    status: 'completed',
    date: '10 เม.ย. 2025, 13:18',
    payment: 'บัตรเครดิต',
  },
  {
    id: 'ORD-2025-1243',
    customer: 'ประสิทธิ์ มั่งคั่ง',
    products: 'คอร์สคณิตศาสตร์',
    amount: 1500,
    status: 'pending',
    date: '10 เม.ย. 2025, 12:45',
    payment: 'รอชำระ',
  },
  {
    id: 'ORD-2025-1242',
    customer: 'วิมลรัตน์ ดีมาก',
    products: 'แบบฝึกหัด 3 เล่ม',
    amount: 1500,
    status: 'completed',
    date: '10 เม.ย. 2025, 11:22',
    payment: 'PromptPay',
  },
  {
    id: 'ORD-2025-1241',
    customer: 'ธนากร รุ่งเรือง',
    products: 'คอร์สโฟนิกส์',
    amount: 1500,
    status: 'processing',
    date: '10 เม.ย. 2025, 10:15',
    payment: 'โอนเงิน',
  },
]

// AI vs Admin Sales
const aiAdminData = [
  { month: 'ต.ค.', ai: 280000, admin: 120000 },
  { month: 'พ.ย.', ai: 320000, admin: 145000 },
  { month: 'ธ.ค.', ai: 385000, admin: 168000 },
  { month: 'ม.ค.', ai: 420000, admin: 185000 },
  { month: 'ก.พ.', ai: 468000, admin: 198000 },
  { month: 'มี.ค.', ai: 512000, admin: 210000 },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'processing':
      return 'bg-blue-100 text-blue-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-3 h-3 mr-1" />
    case 'processing':
      return <Clock className="w-3 h-3 mr-1" />
    case 'pending':
      return <Clock className="w-3 h-3 mr-1" />
    case 'cancelled':
      return <XCircle className="w-3 h-3 mr-1" />
    default:
      return null
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'สำเร็จ'
    case 'processing':
      return 'กำลังดำเนินการ'
    case 'pending':
      return 'รอดำเนินการ'
    case 'cancelled':
      return 'ยกเลิก'
    default:
      return status
  }
}

export default function SalesPage() {
  const [period, setPeriod] = useState('week')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ยอดขาย</h1>
          <p className="text-gray-600 mt-1">รายงานและวิเคราะห์ยอดขาย</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">วันนี้</option>
            <option value="week">สัปดาห์นี้</option>
            <option value="month">เดือนนี้</option>
            <option value="year">ปีนี้</option>
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
          title="รายได้รวม"
          value={formatCurrency(739000)}
          change="+18.2%"
          icon={DollarSign}
          trend="up"
          color="#22c55e"
        />
        <MetricCard
          title="คำสั่งซื้อ"
          value={formatNumber(733)}
          change="+12.5%"
          icon={ShoppingCart}
          trend="up"
          color="#3b82f6"
        />
        <MetricCard
          title="มูลค่าเฉลี่ย (AOV)"
          value={formatCurrency(1989)}
          change="+5.2%"
          icon={TrendingUp}
          trend="up"
          color="#f97316"
        />
        <MetricCard
          title="สินค้าที่ขายได้"
          value={formatNumber(1065)}
          change="+8.7%"
          icon={Package}
          trend="up"
          color="#8b5cf6"
        />
      </div>

      {/* Main Chart - Revenue Over Time */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            รายได้และคำสั่งซื้อ
          </h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg font-medium">
              รายได้
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
              คำสั่งซื้อ
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
              formatter={(value: number) => formatCurrency(value)}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#colorRevenue)"
              name="รายได้"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            ยอดขายตามประเภท
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ percentage }: any) => `${percentage}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-3">
            {categoryData.map((item) => (
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
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI vs Admin Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            AI vs Admin ยอดขาย
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aiAdminData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar
                dataKey="ai"
                fill="#22c55e"
                radius={[8, 8, 0, 0]}
                name="AI ปิดการขาย"
              />
              <Bar
                dataKey="admin"
                fill="#f59e0b"
                radius={[8, 8, 0, 0]}
                name="Admin ปิดการขาย"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Methods & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            ช่องทางการชำระเงิน
          </h2>
          <div className="space-y-4">
            {paymentData.map((payment) => (
              <div key={payment.method} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.method}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.count} รายการ
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            สินค้าขายดี
          </h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.sales} ขาย · {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(product.revenue)}
                  </p>
                  {product.trend === 'up' ? (
                    <p className="text-xs text-green-600 flex items-center justify-end">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12%
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 flex items-center justify-end">
                      <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                      -5%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            คำสั่งซื้อล่าสุด
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หมายเลขคำสั่งซื้อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สินค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวนเงิน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-blue-600">
                        {order.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.products}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(order.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.date}
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
