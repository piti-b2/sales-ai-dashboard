import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Extract questions from messages
function extractQuestions(messages: any[]): string[] {
  const questions: string[] = []
  
  messages.forEach(msg => {
    const content = msg.content.toLowerCase()
    // Check if message is a question
    if (
      content.includes('?') ||
      content.includes('ไหม') ||
      content.includes('อย่างไร') ||
      content.includes('ยังไง') ||
      content.includes('เท่าไร') ||
      content.includes('กี่') ||
      content.includes('ที่ไหน') ||
      content.includes('เมื่อไร') ||
      content.includes('ทำไม') ||
      content.includes('อะไร') ||
      content.includes('ใคร') ||
      content.includes('มี') ||
      content.includes('คือ')
    ) {
      questions.push(msg.content)
    }
  })
  
  return questions
}

// Categorize questions
function categorizeQuestion(question: string): string {
  const lowerQ = question.toLowerCase()
  
  if (lowerQ.includes('ราคา') || lowerQ.includes('เท่าไร') || lowerQ.includes('ค่า')) {
    return 'ราคา'
  }
  if (lowerQ.includes('ส่ง') || lowerQ.includes('จัดส่ง') || lowerQ.includes('ขนส่ง')) {
    return 'การจัดส่ง'
  }
  if (lowerQ.includes('ชำระ') || lowerQ.includes('จ่าย') || lowerQ.includes('โอน')) {
    return 'การชำระเงิน'
  }
  if (lowerQ.includes('คืน') || lowerQ.includes('เปลี่ยน') || lowerQ.includes('รับประกัน')) {
    return 'การคืนสินค้า'
  }
  if (lowerQ.includes('ใช้') || lowerQ.includes('วิธี') || lowerQ.includes('อย่างไร')) {
    return 'วิธีใช้งาน'
  }
  if (lowerQ.includes('เหมาะ') || lowerQ.includes('แนะนำ') || lowerQ.includes('ดี')) {
    return 'คำแนะนำ'
  }
  if (lowerQ.includes('อายุ') || lowerQ.includes('ขวบ') || lowerQ.includes('ปี')) {
    return 'ช่วงอายุ'
  }
  if (lowerQ.includes('มี') || lowerQ.includes('สต็อก') || lowerQ.includes('พร้อม')) {
    return 'สินค้าคงคลัง'
  }
  
  return 'ทั่วไป'
}

// Find similar questions
function findSimilarQuestions(questions: string[]): any[] {
  const questionMap = new Map<string, number>()
  const categoryMap = new Map<string, string[]>()
  
  questions.forEach(q => {
    // Normalize question
    const normalized = q
      .toLowerCase()
      .replace(/[?!.,]/g, '')
      .trim()
    
    // Count occurrences
    questionMap.set(normalized, (questionMap.get(normalized) || 0) + 1)
    
    // Categorize
    const category = categorizeQuestion(q)
    if (!categoryMap.has(category)) {
      categoryMap.set(category, [])
    }
    categoryMap.get(category)!.push(q)
  })
  
  // Get top questions
  const topQuestions = Array.from(questionMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([question, count]) => ({
      question,
      count,
      category: categorizeQuestion(question)
    }))
  
  // Get category stats
  const categoryStats = Array.from(categoryMap.entries())
    .map(([category, questions]) => ({
      category,
      count: questions.length,
      percentage: ((questions.length / questions.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
  
  return [topQuestions, categoryStats]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get user messages only
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('content, created_at, user_id')
      .eq('role', 'user')
      .gte('created_at', startDate.toISOString())

    if (error) throw error

    // Extract questions
    const questions = extractQuestions(messages || [])
    
    // Find similar questions and categorize
    const [topQuestions, categoryStats] = findSimilarQuestions(questions)

    // Get question trends by day
    const questionsByDay = messages?.reduce((acc: any, msg) => {
      const isQuestion = extractQuestions([msg]).length > 0
      if (isQuestion) {
        const date = new Date(msg.created_at).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + 1
      }
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        totalQuestions: questions.length,
        topQuestions,
        categoryStats,
        questionsByDay,
        period: `${days} days`
      }
    })
  } catch (error: any) {
    console.error('FAQ API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
