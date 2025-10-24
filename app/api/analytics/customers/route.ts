import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('user_id, conversation_id, created_at, metadata')
      .gte('created_at', startDate.toISOString())

    if (msgError) throw msgError

    // Get payments
    const { data: payments, error: payError } = await supabaseAdmin
      .from('payment_slips')
      .select('user_id, verified, is_duplicate')
      .gte('created_at', startDate.toISOString())

    if (payError) throw payError

    // Calculate metrics
    const allUsers = new Set(messages?.map(m => m.user_id))
    const totalCustomers = allUsers.size

    const paidUsers = new Set(
      payments?.filter(p => p.verified && !p.is_duplicate).map(p => p.user_id)
    )
    const paidCustomers = paidUsers.size
    const unpaidCustomers = totalCustomers - paidCustomers

    // Conversion rate
    const conversionRate = totalCustomers > 0 
      ? (paidCustomers / totalCustomers * 100).toFixed(1) 
      : '0'

    // Active conversations
    const activeConversations = new Set(messages?.map(m => m.conversation_id)).size

    // New customers by day
    const firstMessageByUser = messages?.reduce((acc: any, msg) => {
      if (!acc[msg.user_id] || new Date(msg.created_at) < new Date(acc[msg.user_id])) {
        acc[msg.user_id] = msg.created_at
      }
      return acc
    }, {})

    const newCustomersByDay = Object.values(firstMessageByUser || {}).reduce((acc: any, date: any) => {
      const day = new Date(date).toISOString().split('T')[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {})

    // Customer engagement (messages per user)
    const messagesPerUser = messages?.reduce((acc: any, msg) => {
      acc[msg.user_id] = (acc[msg.user_id] || 0) + 1
      return acc
    }, {})

    const engagementLevels = {
      high: 0, // > 10 messages
      medium: 0, // 5-10 messages
      low: 0 // < 5 messages
    }

    Object.values(messagesPerUser || {}).forEach((count: any) => {
      if (count > 10) engagementLevels.high++
      else if (count >= 5) engagementLevels.medium++
      else engagementLevels.low++
    })

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        paidCustomers,
        unpaidCustomers,
        conversionRate,
        activeConversations,
        newCustomersByDay,
        engagementLevels,
        period: `${days} days`
      }
    })
  } catch (error: any) {
    console.error('Customers API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
