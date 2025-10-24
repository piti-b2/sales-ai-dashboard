import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import type { AuthResponse, User } from './supabase'

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    // Sign in with Supabase Auth - THIS CREATES THE SESSION
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return {
        user: null,
        error: authError.message,
      }
    }

    if (!authData.user || !authData.session) {
      return {
        user: null,
        error: 'ไม่พบข้อมูลผู้ใช้',
      }
    }

    // Get user data from public.users table using admin client (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      // Sign out if user data not found
      await supabase.auth.signOut()
      return {
        user: null,
        error: 'ไม่พบข้อมูลผู้ใช้ในระบบ',
      }
    }

    // Check if user is active
    if (userData.status !== 'active') {
      await supabase.auth.signOut()
      return {
        user: null,
        error: 'บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบ',
      }
    }

    // Update last login time
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id)

    return {
      user: userData as User,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
    }
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error: 'เกิดข้อผิดพลาดในการออกจากระบบ' }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return null
    }

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error || !userData) {
      return null
    }

    return userData as User
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
