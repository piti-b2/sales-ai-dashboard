import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const channel = searchParams.get('channel') || 'all'

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total messages
    let query = supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())

    const { data: messages, count: totalMessages, error } = await query

    if (error) throw error

    // Calculate metrics
    const userMessages = messages?.filter(m => m.role === 'user').length || 0
    const assistantMessages = messages?.filter(m => m.role === 'assistant').length || 0
    const uniqueUsers = new Set(messages?.map(m => m.user_id)).size
    const uniqueConversations = new Set(messages?.map(m => m.conversation_id)).size

    // Messages by day
    const messagesByDay = messages?.reduce((acc: any, msg) => {
      const date = new Date(msg.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // RAG performance
    const ragFound = messages?.filter(m => m.metadata?.ragFound).length || 0
    const ragRate = totalMessages ? (ragFound / totalMessages * 100).toFixed(1) : '0'

    // Product mentions
    const productMentions = messages?.reduce((acc: any, msg) => {
      const productId = msg.metadata?.product_id
      if (productId) {
        acc[productId] = (acc[productId] || 0) + 1
      }
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        totalMessages,
        userMessages,
        assistantMessages,
        uniqueUsers,
        uniqueConversations,
        messagesByDay,
        ragRate,
        productMentions,
        period: `${days} days`
      }
    })
  } catch (error: any) {
    console.error('Messages API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
