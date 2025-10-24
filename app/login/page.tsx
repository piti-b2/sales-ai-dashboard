'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Bot,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { signIn } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { user, error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError)
        setIsLoading(false)
        return
      }

      if (user) {
        // Check if session exists
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Redirect to dashboard
          window.location.href = '/'
        } else {
          setError('ไม่สามารถสร้าง session ได้')
          setIsLoading(false)
        }
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
        setIsLoading(false)
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              MAAS AI System
            </h1>
            <p className="text-gray-600">
              Marketing Automation AI Assistant System
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              เข้าสู่ระบบ
            </h2>
            <p className="text-gray-600 mb-6">
              ยินดีต้อนรับกลับมา! กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    จดจำฉันไว้
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-8">
            © 2025 MAAS AI System. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Feature Showcase */}
      <div className="hidden lg:flex flex-1 p-12 items-center justify-center relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/image/login.png')",
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-white/30"></div>
        </div>

        <div className="relative z-10 max-w-lg text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)' }}>
          <h2 className="text-5xl font-bold mb-6">
            ยินดีต้อนรับสู่ MAAS AI
          </h2>
          <p className="text-2xl mb-8">
            ระบบ AI ที่ช่วยให้การทำงานของคุณง่ายขึ้น อัตโนมัติมากขึ้น และมีประสิทธิภาพสูงสุด
          </p>

          {/* Features */}
          <div className="space-y-5">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1">
                  AI-Powered Automation
                </h3>
                <p className="text-white/90 text-base">
                  ระบบ AI ที่ช่วยตอบคำถาม ปิดการขาย และดูแลลูกค้าอัตโนมัติ 24/7
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1">
                  Real-time Analytics
                </h3>
                <p className="text-white/90 text-base">
                  ติดตามและวิเคราะห์ข้อมูลแบบ Real-time พร้อม Dashboard ที่ครบครัน
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center mt-1">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1">
                  Seamless Integration
                </h3>
                <p className="text-white/90 text-base">
                  เชื่อมต่อกับ LINE, Payment Gateway, และระบบต่างๆ ได้อย่างง่ายดาย
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
            <div>
              <div className="text-4xl font-bold mb-1">98%</div>
              <div className="text-base text-white/90">AI Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">24/7</div>
              <div className="text-base text-white/90">Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">1.2s</div>
              <div className="text-base text-white/90">Response Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
