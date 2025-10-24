import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Simple sentiment analysis based on keywords
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positive = ['ดี', 'สวย', 'ชอบ', 'ประทับใจ', 'คุ้มค่า', 'ขอบคุณ', 'สนใจ', 'อยาก']
  const negative = ['แย่', 'ไม่ดี', 'กลัว', 'กังวล', 'แพง', 'ไม่', 'ผิดหวัง', 'มิจฉาชีพ']
  
  const lowerText = text.toLowerCase()
  const positiveCount = positive.filter(word => lowerText.includes(word)).length
  const negativeCount = negative.filter(word => lowerText.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

// Classify intent
function classifyIntent(text: string): string {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('ราคา') || lowerText.includes('เท่าไร') || lowerText.includes('ค่า')) {
    return 'price_inquiry'
  }
  if (lowerText.includes('ซื้อ') || lowerText.includes('สั่ง') || lowerText.includes('จอง')) {
    return 'purchase_intent'
  }
  if (lowerText.includes('อย่างไร') || lowerText.includes('ยังไง') || lowerText.includes('วิธี')) {
    return 'how_to'
  }
  if (lowerText.includes('มี') || lowerText.includes('คือ') || lowerText.includes('อะไร')) {
    return 'information_seeking'
  }
  if (lowerText.includes('กลัว') || lowerText.includes('กังวล') || lowerText.includes('ไม่แน่ใจ')) {
    return 'concern'
  }
  
  return 'general'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get messages
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .eq('role', 'user') // Only analyze user messages

    if (error) throw error

    // Analyze sentiments
    const sentiments = {
      positive: 0,
      neutral: 0,
      negative: 0
    }

    // Analyze intents
    const intents: any = {}

    // Common concerns
    const concerns: string[] = []

    messages?.forEach(msg => {
      // Sentiment
      const sentiment = analyzeSentiment(msg.content)
      sentiments[sentiment]++

      // Intent
      const intent = classifyIntent(msg.content)
      intents[intent] = (intents[intent] || 0) + 1

      // Concerns
      if (intent === 'concern') {
        concerns.push(msg.content)
      }
    })

    // Calculate sentiment percentage
    const total = messages?.length || 1
    const sentimentPercentage = {
      positive: ((sentiments.positive / total) * 100).toFixed(1),
      neutral: ((sentiments.neutral / total) * 100).toFixed(1),
      negative: ((sentiments.negative / total) * 100).toFixed(1)
    }

    // Top concerns (limit to 10)
    const topConcerns = concerns.slice(0, 10)

    // RAG performance
    const ragSuccess = messages?.filter(m => m.metadata?.ragFound).length || 0
    const ragFailed = messages?.filter(m => m.metadata?.isFallback).length || 0
    const ragRate = total > 0 ? ((ragSuccess / total) * 100).toFixed(1) : '0'

    // Product interest
    const productInterest = messages?.reduce((acc: any, msg) => {
      const productId = msg.metadata?.product_id
      if (productId) {
        acc[productId] = (acc[productId] || 0) + 1
      }
      return acc
    }, {})

    // Top products by interest
    const topProducts = Object.entries(productInterest || {})
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([product, count]) => ({ product, count }))

    return NextResponse.json({
      success: true,
      data: {
        sentiments,
        sentimentPercentage,
        intents,
        topConcerns,
        ragPerformance: {
          success: ragSuccess,
          failed: ragFailed,
          rate: ragRate
        },
        productInterest: topProducts,
        totalAnalyzed: total,
        period: `${days} days`
      }
    })
  } catch (error: any) {
    console.error('AI Insights API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
