import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Custom cookie storage that uses document.cookie
const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null
    const cookies = document.cookie.split('; ')
    const cookie = cookies.find(c => c.startsWith(`${key}=`))
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return
    document.cookie = `${key}=; path=/; max-age=0`
  }
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    get(name: string) {
      return cookieStorage.getItem(name)
    },
    set(name: string, value: string, options: any) {
      cookieStorage.setItem(name, value)
    },
    remove(name: string, options: any) {
      cookieStorage.removeItem(name)
    }
  }
})

// Types
export interface User {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin' | 'manager' | 'user'
  status: 'active' | 'inactive' | 'suspended'
  avatar_url?: string
  phone?: string
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface AuthResponse {
  user: User | null
  error: string | null
}
