'use client'

import { LucideIcon } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface MetricCardProps {
  title: string
  value: string | number
  change: string
  icon: LucideIcon
  trend?: 'up' | 'down'
  sparklineData?: number[]
  color?: string
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  trend = 'up',
  sparklineData,
  color = '#22c55e'
}: MetricCardProps) {
  const isPositive = trend === 'up'
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50'

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${changeColor}`} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${changeColor}`}>
          {change}
        </span>
        <span className="text-xs text-gray-500">compared to last period</span>
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData.map((val, idx) => ({ value: val, index: idx }))}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
