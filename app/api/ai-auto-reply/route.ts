import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // ตรวจสอบว่า AI Auto-Reply ถูกหยุดหรือไม่
    const { data, error } = await supabase
      .from('line_pauses')
      .select('*')
      .eq('user_id', userId)
      .gt('paused_until', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      isPaused: !!data,
      pausedUntil: data?.paused_until || null,
      reason: data?.reason || null,
    })
  } catch (error) {
    console.error('Error checking AI auto-reply status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, duration, adminUserId, groupId } = body

    if (!userId || !duration) {
      return NextResponse.json(
        { error: 'userId and duration are required' },
        { status: 400 }
      )
    }

    // คำนวณเวลาที่จะหยุด
    const pausedUntil = new Date()
    pausedUntil.setMinutes(pausedUntil.getMinutes() + duration)

    // บันทึกการหยุด AI
    const { data, error } = await supabase
      .from('line_pauses')
      .insert({
        user_id: userId,
        paused_until: pausedUntil.toISOString(),
        admin_user_id: adminUserId || userId,
        group_id: groupId || null,
        reason: `Paused by admin for ${duration} min`,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      pausedUntil: data.paused_until,
      message: `AI Auto-Reply หยุดชั่วคราว ${duration} นาที`,
    })
  } catch (error) {
    console.error('Error pausing AI auto-reply:', error)
    return NextResponse.json(
      { error: 'Failed to pause AI auto-reply' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // ลบการหยุด AI ทั้งหมดของ user นี้
    const { error } = await supabase
      .from('line_pauses')
      .delete()
      .eq('user_id', userId)
      .gt('paused_until', new Date().toISOString())

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'AI Auto-Reply เปิดใช้งานแล้ว',
    })
  } catch (error) {
    console.error('Error resuming AI auto-reply:', error)
    return NextResponse.json(
      { error: 'Failed to resume AI auto-reply' },
      { status: 500 }
    )
  }
}
