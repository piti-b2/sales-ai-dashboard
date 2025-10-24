import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get payment slips
    const { data: payments, error } = await supabaseAdmin
      .from('payment_slips')
      .select('*')
      .gte('created_at', startDate.toISOString())

    if (error) throw error

    // Calculate metrics
    const totalPayments = payments?.length || 0
    const verifiedPayments = payments?.filter(p => p.verified).length || 0
    const totalRevenue = payments
      ?.filter(p => p.verified && !p.is_duplicate)
      .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0

    const duplicates = payments?.filter(p => p.is_duplicate).length || 0
    const avgOrderValue = verifiedPayments > 0 ? totalRevenue / verifiedPayments : 0

    // Revenue by day
    const revenueByDay = payments
      ?.filter(p => p.verified && !p.is_duplicate)
      .reduce((acc: any, payment) => {
        const date = new Date(payment.created_at).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + parseFloat(payment.amount || '0')
        return acc
      }, {})

    // Bank distribution
    const bankDistribution = payments?.reduce((acc: any, payment) => {
      const bank = payment.bank || 'Unknown'
      acc[bank] = (acc[bank] || 0) + 1
      return acc
    }, {})

    // Verification confidence
    const confidenceDistribution = payments?.reduce((acc: any, payment) => {
      const confidence = payment.confidence || 'unknown'
      acc[confidence] = (acc[confidence] || 0) + 1
      return acc
    }, {})

    // Unique customers who paid
    const paidCustomers = new Set(
      payments?.filter(p => p.verified && !p.is_duplicate).map(p => p.user_id)
    ).size

    return NextResponse.json({
      success: true,
      data: {
        totalPayments,
        verifiedPayments,
        totalRevenue,
        avgOrderValue,
        duplicates,
        paidCustomers,
        revenueByDay,
        bankDistribution,
        confidenceDistribution,
        period: `${days} days`
      }
    })
  } catch (error: any) {
    console.error('Sales API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
