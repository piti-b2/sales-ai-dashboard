'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  Zap,
  Target,
  Users,
  DollarSign,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

export default function PredictivePage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    // Simulate loading and generate predictions
    setTimeout(() => {
      setData(generatePredictions())
      setLoading(false)
    }, 1500)
  }, [])

  const generatePredictions = () => {
    // Mock predictive data
    return {
      nextWeekRevenue: 185000,
      revenueGrowth: 12.5,
      nextWeekLeads: 45,
      leadsGrowth: 8.3,
      churnRisk: 15,
      topLeads: [
        { id: 'U001', score: 95, name: 'ลูกค้า A', lastContact: '2 ชั่วโมงที่แล้ว', intent: 'มีความตั้งใจซื้อสูง' },
        { id: 'U002', score: 88, name: 'ลูกค้า B', lastContact: '5 ชั่วโมงที่แล้ว', intent: 'สอบถามราคา' },
        { id: 'U003', score: 82, name: 'ลูกค้า C', lastContact: '1 วันที่แล้ว', intent: 'เปรียบเทียบสินค้า' },
        { id: 'U004', score: 78, name: 'ลูกค้า D', lastContact: '2 วันที่แล้ว', intent: 'หาข้อมูล' },
        { id: 'U005', score: 75, name: 'ลูกค้า E', lastContact: '3 วันที่แล้ว', intent: 'แก้ไขข้อกังวล' },
      ],
      revenueForecast: [
        { week: 'สัปดาห์ 1', actual: 120000, predicted: 125000 },
        { week: 'สัปดาห์ 2', actual: 135000, predicted: 138000 },
        { week: 'สัปดาห์ 3', actual: 148000, predicted: 150000 },
        { week: 'สัปดาห์ 4', actual: 165000, predicted: 168000 },
        { week: 'สัปดาห์หน้า', actual: null, predicted: 185000 },
      ],
      peakHours: [
        { hour: '9-12', activity: 85 },
        { hour: '12-15', activity: 95 },
        { hour: '15-18', activity: 78 },
        { hour: '18-21', activity: 65 },
        { hour: '21-24', activity: 45 },
      ],
      recommendations: [
        { type: 'urgent', title: 'ติดตาม 5 ลูกค้าที่มีโอกาสสูง', description: 'ลูกค้าเหล่านี้แสดงความตั้งใจซื้อสูงใน 24 ชั่วโมงที่ผ่านมา' },
        { type: 'opportunity', title: 'ช่วงเวลาที่ดีที่สุด: 12-15 น.', description: 'กำหนดแคมเปญสำคัญในช่วงเวลานี้เพื่อการมีส่วนร่วมสูงสุด' },
        { type: 'warning', title: 'ความเสี่ยงการสูญเสียลูกค้า 15%', description: 'ลูกค้า 12 รายไม่ตอบกลับมากกว่า 7 วัน ควรส่งแคมเปญกระตุ้น' },
        { type: 'success', title: 'รายได้มีแนวโน้มเพิ่มขึ้น', description: 'คาดการณ์เติบโต 12.5% สัปดาห์หน้า รักษากลยุทธ์ปัจจุบัน' },
      ]
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">กำลังสร้างการคาดการณ์...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-8 h-8 text-purple-600" />
          การวิเคราะห์เชิงคาดการณ์
        </h1>
        <p className="text-gray-600 mt-1">การคาดการณ์และคำแนะนำโดย AI</p>
      </div>

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-purple-600" />
            <span className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
              +{data.revenueGrowth}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-purple-900 mb-1">รายได้สัปดาห์หน้า</h3>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(data.nextWeekRevenue)}</p>
          <p className="text-xs text-purple-600 mt-1">คาดการณ์ด้วยความมั่นใจ 87%</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-blue-600" />
            <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              +{data.leadsGrowth}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-blue-900 mb-1">ลูกค้าเป้าหมายที่คาดว่าจะได้</h3>
          <p className="text-2xl font-bold text-blue-700">{data.nextWeekLeads}</p>
          <p className="text-xs text-blue-600 mt-1">จากแนวโน้มปัจจุบัน</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <span className="text-xs font-medium text-orange-700 bg-orange-200 px-2 py-1 rounded-full">
              Risk
            </span>
          </div>
          <h3 className="text-sm font-medium text-orange-900 mb-1">ความเสี่ยงสูญเสียลูกค้า</h3>
          <p className="text-2xl font-bold text-orange-700">{data.churnRisk}%</p>
          <p className="text-xs text-orange-600 mt-1">ลูกค้า 12 รายมีความเสี่ยง</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-green-600" />
            <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
              Peak
            </span>
          </div>
          <h3 className="text-sm font-medium text-green-900 mb-1">เวลาที่ดีที่สุดในการติดต่อ</h3>
          <p className="text-2xl font-bold text-green-700">12-15 น.</p>
          <p className="text-xs text-green-600 mt-1">ช่วงที่มีกิจกรรมสูงสุด</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Forecast */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">การคาดการณ์รายได้</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
                name="ยอดจริง"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8b5cf6' }}
                name="คาดการณ์"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">กิจกรรมตามช่วงเวลา</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Bar dataKey="activity" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Leads */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          ลูกค้าเป้าหมายอันดับต้น (คะแนนลูกค้า)
        </h2>
        <div className="space-y-3">
          {data.topLeads.map((lead: any, index: number) => (
            <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                  lead.score >= 90 ? 'bg-red-500' :
                  lead.score >= 80 ? 'bg-orange-500' :
                  'bg-yellow-500'
                }`}>
                  {lead.score}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                  <p className="text-sm text-gray-600">{lead.intent}</p>
                  <p className="text-xs text-gray-500 mt-1">ติดต่อล่าสุด: {lead.lastContact}</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                ติดต่อเลย
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          คำแนะนำจาก AI
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recommendations.map((rec: any, index: number) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${
              rec.type === 'urgent' ? 'bg-red-50 border-red-200' :
              rec.type === 'warning' ? 'bg-orange-50 border-orange-200' :
              rec.type === 'opportunity' ? 'bg-blue-50 border-blue-200' :
              'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start gap-3">
                {rec.type === 'urgent' && <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                {rec.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />}
                {rec.type === 'opportunity' && <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                {rec.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                <div>
                  <h3 className={`font-semibold ${
                    rec.type === 'urgent' ? 'text-red-900' :
                    rec.type === 'warning' ? 'text-orange-900' :
                    rec.type === 'opportunity' ? 'text-blue-900' :
                    'text-green-900'
                  }`}>{rec.title}</h3>
                  <p className={`text-sm mt-1 ${
                    rec.type === 'urgent' ? 'text-red-700' :
                    rec.type === 'warning' ? 'text-orange-700' :
                    rec.type === 'opportunity' ? 'text-blue-700' :
                    'text-green-700'
                  }`}>{rec.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
