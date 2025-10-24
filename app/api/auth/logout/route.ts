import { NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'

export async function POST() {
  try {
    const { error } = await signOut()

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'ออกจากระบบสำเร็จ' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการออกจากระบบ' },
      { status: 500 }
    )
  }
}
