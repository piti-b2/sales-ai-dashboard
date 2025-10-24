'use client'

import { useState, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Brain,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  Smile,
  Meh,
  Frown,
  Loader2,
  Target,
  HelpCircle,
} from 'lucide-react'

export default function AIInsightsPage() {
  const [data, setData] = useState<any>(null)
  const [faqData, setFaqData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchInsights()
  }, [days])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const [insightsRes, faqRes] = await Promise.all([
        fetch(`/api/analytics/ai-insights?days=${days}`),
        fetch(`/api/analytics/faq?days=${days}`)
      ])
      
      const insights = await insightsRes.json()
      const faq = await faqRes.json()
      
      setData(insights.data)
      setFaqData(faq.data)
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Analyzing data...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No data available</p>
      </div>
    )
  }

  // Prepare sentiment data
  const sentimentData = [
    { name: 'Positive', value: parseInt(data.sentimentPercentage.positive), color: '#22c55e', icon: Smile },
    { name: 'Neutral', value: parseInt(data.sentimentPercentage.neutral), color: '#eab308', icon: Meh },
    { name: 'Negative', value: parseInt(data.sentimentPercentage.negative), color: '#ef4444', icon: Frown },
  ]

  // Prepare intent data
  const intentData = Object.entries(data.intents || {}).map(([intent, count]) => ({
    intent: intent.replace(/_/g, ' ').toUpperCase(),
    count
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            AI Insights
          </h1>
          <p className="text-gray-600 mt-1">Deep analysis powered by AI</p>
        </div>

        {/* Time Range */}
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                days === d
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Smile className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-green-700">
              {data.sentimentPercentage.positive}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-green-900">Positive Sentiment</h3>
          <p className="text-xs text-green-700 mt-1">{data.sentiments.positive} messages</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <Meh className="w-6 h-6 text-yellow-600" />
            <span className="text-2xl font-bold text-yellow-700">
              {data.sentimentPercentage.neutral}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-yellow-900">Neutral Sentiment</h3>
          <p className="text-xs text-yellow-700 mt-1">{data.sentiments.neutral} messages</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <Frown className="w-6 h-6 text-red-600" />
            <span className="text-2xl font-bold text-red-700">
              {data.sentimentPercentage.negative}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-red-900">Negative Sentiment</h3>
          <p className="text-xs text-red-700 mt-1">{data.sentiments.negative} messages</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-purple-600" />
            <span className="text-2xl font-bold text-purple-700">
              {data.ragPerformance.rate}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-purple-900">RAG Success</h3>
          <p className="text-xs text-purple-700 mt-1">{data.ragPerformance.success} found</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sentiment Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {sentimentData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Intent */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Intent Classification</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={intentData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis dataKey="intent" type="category" stroke="#9ca3af" fontSize={12} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Concerns */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          Top Customer Concerns
        </h2>
        <div className="space-y-3">
          {data.topConcerns.length > 0 ? (
            data.topConcerns.map((concern: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700">{concern}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No concerns detected in this period</p>
          )}
        </div>
      </div>

      {/* Product Interest */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Top Product Interest
        </h2>
        <div className="space-y-3">
          {data.productInterest.length > 0 ? (
            data.productInterest.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{item.product}</span>
                </div>
                <span className="text-sm font-bold text-blue-600">{item.count} mentions</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No product mentions detected</p>
          )}
        </div>
      </div>

      {/* FAQ Analysis */}
      {faqData && (
        <>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              คำถามที่พบบ่อย (FAQ)
            </h2>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                วิเคราะห์จาก <strong>{faqData.totalQuestions}</strong> คำถาม
              </p>
              
              {/* Category Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {faqData.categoryStats?.slice(0, 4).map((cat: any, index: number) => (
                  <div key={index} className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                    <p className="text-xs text-indigo-600 font-medium">{cat.category}</p>
                    <p className="text-xl font-bold text-indigo-900">{cat.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Questions */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 15 คำถามที่ถูกถามบ่อยที่สุด</h3>
              {faqData.topQuestions?.slice(0, 15).map((item: any, index: number) => (
                <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{item.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          ถูกถาม {item.count} ครั้ง
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Categories Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">หมวดหมู่คำถาม</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={faqData.categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Stats Summary */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Analysis Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-purple-200 text-sm">Total Analyzed</p>
            <p className="text-2xl font-bold">{data.totalAnalyzed}</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm">RAG Success</p>
            <p className="text-2xl font-bold">{data.ragPerformance.success}</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm">RAG Failed</p>
            <p className="text-2xl font-bold">{data.ragPerformance.failed}</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm">Total Questions</p>
            <p className="text-2xl font-bold">{faqData?.totalQuestions || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
