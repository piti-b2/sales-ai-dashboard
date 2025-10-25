import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { analyzeMessageWithAI, batchAnalyzeMessages } from '@/lib/openai'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get user messages only
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('id, content, created_at, user_id, metadata')
      .eq('role', 'user')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalAnalyzed: 0,
          sentiments: { positive: 0, neutral: 0, negative: 0 },
          intents: {},
          concerns: [],
          topKeywords: [],
          urgencyDistribution: { low: 0, medium: 0, high: 0 },
          avgConfidence: 0,
          period: `${days} days`
        }
      })
    }

    console.log(`Analyzing ${messages.length} messages with OpenAI...`)

    // Batch analyze with OpenAI
    const analyses = await batchAnalyzeMessages(
      messages.map(m => ({ id: m.id, content: m.content }))
    )

    // Aggregate results
    const sentiments = { positive: 0, neutral: 0, negative: 0 }
    const intents: Record<string, number> = {}
    const concerns: string[] = []
    const keywords: string[] = []
    const urgencyDistribution = { low: 0, medium: 0, high: 0 }
    let totalConfidence = 0
    let analyzedCount = 0

    analyses.forEach((analysis) => {
      // Sentiment
      sentiments[analysis.sentiment]++

      // Intent
      intents[analysis.intent_category] = (intents[analysis.intent_category] || 0) + 1

      // Concerns
      if (analysis.concerns && analysis.concerns.length > 0) {
        concerns.push(...analysis.concerns)
      }

      // Keywords
      if (analysis.keywords && analysis.keywords.length > 0) {
        keywords.push(...analysis.keywords)
      }

      // Urgency
      urgencyDistribution[analysis.urgency]++

      // Confidence
      totalConfidence += analysis.confidence
      analyzedCount++
    })

    // Calculate percentages
    const total = analyzedCount || 1
    const sentimentPercentage = {
      positive: ((sentiments.positive / total) * 100).toFixed(1),
      neutral: ((sentiments.neutral / total) * 100).toFixed(1),
      negative: ((sentiments.negative / total) * 100).toFixed(1)
    }

    // Top concerns (unique, top 10)
    const concernCounts = concerns.reduce((acc: Record<string, number>, concern) => {
      acc[concern] = (acc[concern] || 0) + 1
      return acc
    }, {})
    const topConcerns = Object.entries(concernCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([concern, count]) => ({ concern, count }))

    // Top keywords (unique, top 20)
    const keywordCounts = keywords.reduce((acc: Record<string, number>, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1
      return acc
    }, {})
    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }))

    // Average confidence
    const avgConfidence = analyzedCount > 0 ? (totalConfidence / analyzedCount).toFixed(1) : '0'

    // RAG Performance (mock for now - can be calculated from actual data later)
    const ragPerformance = {
      rate: 85,
      success: Math.floor(analyzedCount * 0.85),
      failed: Math.floor(analyzedCount * 0.15)
    }

    // Product Interest (mock data - can be extracted from keywords/intents)
    const productInterest = [
      { product: 'ครีมบำรุงผิว', count: 45 },
      { product: 'เซรั่มหน้าใส', count: 38 },
      { product: 'มาส์กหน้า', count: 32 },
      { product: 'โลชั่นบำรุงผิว', count: 28 },
      { product: 'ครีมกันแดด', count: 24 },
    ]

    return NextResponse.json({
      success: true,
      data: {
        totalAnalyzed: analyzedCount,
        sentiments,
        sentimentPercentage,
        intents,
        topConcerns,
        topKeywords,
        urgencyDistribution,
        avgConfidence,
        ragPerformance,
        productInterest,
        period: `${days} days`,
        model: 'gpt-4o-mini'
      }
    })
  } catch (error: any) {
    console.error('AI Insights Advanced API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        hint: 'Make sure OPENAI_API_KEY is set in .env.local'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for analyzing specific messages
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Invalid messages array' },
        { status: 400 }
      )
    }

    const analyses = await batchAnalyzeMessages(messages)

    return NextResponse.json({
      success: true,
      data: {
        analyses: Array.from(analyses.entries()).map(([id, analysis]) => ({
          id,
          ...analysis
        }))
      }
    })
  } catch (error: any) {
    console.error('AI Analysis POST Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
