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
        { id: 'U001', score: 95, name: 'Customer A', lastContact: '2 hours ago', intent: 'High Purchase Intent' },
        { id: 'U002', score: 88, name: 'Customer B', lastContact: '5 hours ago', intent: 'Price Inquiry' },
        { id: 'U003', score: 82, name: 'Customer C', lastContact: '1 day ago', intent: 'Product Comparison' },
        { id: 'U004', score: 78, name: 'Customer D', lastContact: '2 days ago', intent: 'Information Seeking' },
        { id: 'U005', score: 75, name: 'Customer E', lastContact: '3 days ago', intent: 'Concern Resolution' },
      ],
      revenueForecast: [
        { week: 'Week 1', actual: 120000, predicted: 125000 },
        { week: 'Week 2', actual: 135000, predicted: 138000 },
        { week: 'Week 3', actual: 148000, predicted: 150000 },
        { week: 'Week 4', actual: 165000, predicted: 168000 },
        { week: 'Next', actual: null, predicted: 185000 },
      ],
      peakHours: [
        { hour: '9-12', activity: 85 },
        { hour: '12-15', activity: 95 },
        { hour: '15-18', activity: 78 },
        { hour: '18-21', activity: 65 },
        { hour: '21-24', activity: 45 },
      ],
      recommendations: [
        { type: 'urgent', title: 'Follow up with 5 hot leads', description: 'These customers showed high purchase intent in the last 24 hours' },
        { type: 'opportunity', title: 'Peak hours: 12-15', description: 'Schedule important campaigns during this time for maximum engagement' },
        { type: 'warning', title: '15% churn risk', description: '12 customers haven\'t responded in 7+ days. Send re-engagement campaign' },
        { type: 'success', title: 'Revenue trending up', description: 'Projected 12.5% growth next week. Maintain current strategy' },
      ]
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Generating predictions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-8 h-8 text-purple-600" />
          Predictive Analytics
        </h1>
        <p className="text-gray-600 mt-1">AI-powered forecasts and recommendations</p>
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
          <h3 className="text-sm font-medium text-purple-900 mb-1">Next Week Revenue</h3>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(data.nextWeekRevenue)}</p>
          <p className="text-xs text-purple-600 mt-1">Predicted with 87% confidence</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-blue-600" />
            <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              +{data.leadsGrowth}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-blue-900 mb-1">Expected Hot Leads</h3>
          <p className="text-2xl font-bold text-blue-700">{data.nextWeekLeads}</p>
          <p className="text-xs text-blue-600 mt-1">Based on current trends</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <span className="text-xs font-medium text-orange-700 bg-orange-200 px-2 py-1 rounded-full">
              Risk
            </span>
          </div>
          <h3 className="text-sm font-medium text-orange-900 mb-1">Churn Risk</h3>
          <p className="text-2xl font-bold text-orange-700">{data.churnRisk}%</p>
          <p className="text-xs text-orange-600 mt-1">12 customers at risk</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-green-600" />
            <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
              Peak
            </span>
          </div>
          <h3 className="text-sm font-medium text-green-900 mb-1">Best Time to Engage</h3>
          <p className="text-2xl font-bold text-green-700">12-15</p>
          <p className="text-xs text-green-600 mt-1">Highest activity period</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Forecast */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Revenue Forecast</h2>
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
                name="Actual"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8b5cf6' }}
                name="Predicted"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Activity by Time</h2>
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
          Top Leads (Lead Scoring)
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
                  <p className="text-xs text-gray-500 mt-1">Last contact: {lead.lastContact}</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Contact Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          AI Recommendations
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
