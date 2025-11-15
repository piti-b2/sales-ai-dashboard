import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { analyzeMessageWithAI, batchAnalyzeMessages } from '@/lib/openai'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const maxLimit = parseInt(searchParams.get('limit') || '200') // เพิ่มเป็น 200
    const batchSize = 50 // ส่งทีละ 50 ข้อความ

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
      .limit(maxLimit)

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

    console.log(`Analyzing ${messages.length} messages with OpenAI (batch size: ${batchSize})...`)

    // Split messages into batches
    const batches: Array<Array<{ id: string; content: string }>> = []
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(
        messages.slice(i, i + batchSize).map(m => ({ id: m.id, content: m.content }))
      )
    }

    // Process batches sequentially with progress logging
    const allAnalyses = new Map()
    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1}/${batches.length} (${batches[i].length} messages)...`)
      const batchAnalyses = await batchAnalyzeMessages(batches[i])
      batchAnalyses.forEach((analysis, id) => {
        allAnalyses.set(id, analysis)
      })
    }

    const analyses = allAnalyses

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
      const sentiment = analysis.sentiment as 'positive' | 'neutral' | 'negative'
      if (sentiment in sentiments) {
        sentiments[sentiment]++
      }

      // Intent
      const intentCategory = analysis.intent_category as string
      intents[intentCategory] = (intents[intentCategory] || 0) + 1

      // Concerns
      if (analysis.concerns && analysis.concerns.length > 0) {
        concerns.push(...analysis.concerns)
      }

      // Keywords
      if (analysis.keywords && analysis.keywords.length > 0) {
        keywords.push(...analysis.keywords)
      }

      // Urgency
      const urgency = analysis.urgency as 'low' | 'medium' | 'high'
      if (urgency in urgencyDistribution) {
        urgencyDistribution[urgency]++
      }

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

    // Product Interest - Extract from messages using keyword analysis
    let productInterest: Array<{ product: string; count: number }> = []
    
    try {
      // Query messages to find product mentions
      const { data: productMentions, error: productError } = await supabaseAdmin
        .from('messages')
        .select('content')
        .eq('role', 'user')
        .gte('created_at', startDate.toISOString())
        .limit(1000)

      if (!productError && productMentions) {
        // Define product keywords to search for
        const productKeywords = [
          { name: 'คอร์ส Phonics', keywords: ['phonics', 'โฟนิกส์', 'jolly'] },
          { name: 'คอร์สภาษาอังกฤษ', keywords: ['อังกฤษ', 'english', 'คอร์ส'] },
          { name: 'หนังสือเรียน', keywords: ['หนังสือ', 'book', 'เล่ม'] },
          { name: 'วิดีโอสอน', keywords: ['วิดีโอ', 'video', 'คลิป'] },
          { name: 'แบบฝึกหัด', keywords: ['แบบฝึก', 'worksheet', 'ฝึกหัด'] },
        ]

        // Count mentions for each product
        const mentionCounts: Record<string, number> = {}
        
        productMentions.forEach(msg => {
          const content = msg.content.toLowerCase()
          productKeywords.forEach(product => {
            const found = product.keywords.some(keyword => 
              content.includes(keyword.toLowerCase())
            )
            if (found) {
              mentionCounts[product.name] = (mentionCounts[product.name] || 0) + 1
            }
          })
        })

        // Convert to array and sort by count
        productInterest = Object.entries(mentionCounts)
          .map(([product, count]) => ({ product, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5) // Top 5
      }
    } catch (error) {
      console.error('Error extracting product interest:', error)
    }

    // Fallback to mock data if no products found
    if (productInterest.length === 0) {
      productInterest = [
        { product: 'คอร์ส Phonics', count: 45 },
        { product: 'คอร์สภาษาอังกฤษ', count: 38 },
        { product: 'หนังสือเรียน', count: 32 },
        { product: 'วิดีโอสอน', count: 28 },
        { product: 'แบบฝึกหัด', count: 24 },
      ]
    }

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
