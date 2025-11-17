'use client'

import { useState } from 'react'
import {
  User,
  Bell,
  Shield,
  Zap,
  Database,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Globe,
  Palette,
  Moon,
  Sun,
  Monitor,
  Brain,
  RefreshCw,
  Download,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [theme, setTheme] = useState('light')

  const tabs = [
    { id: 'profile', name: 'โปรไฟล์', icon: User },
    { id: 'notifications', name: 'การแจ้งเตือน', icon: Bell },
    { id: 'security', name: 'ความปลอดภัย', icon: Shield },
    { id: 'integrations', name: 'การเชื่อมต่อ', icon: Zap },
    { id: 'appearance', name: 'รูปแบบ', icon: Palette },
    { id: 'data', name: 'ข้อมูล', icon: Database },
  ]

  const externalLinks = [
    { href: '/settings/ai-config', name: 'AI Config', icon: Brain },
    { href: '/settings/operating-hours', name: 'เวลาทำงาน', icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ตั้งค่า</h1>
        <p className="text-gray-600 mt-1">จัดการการตั้งค่าระบบและบัญชีของคุณ</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              )
            })}
            
            {/* Divider */}
            <div className="my-2 border-t border-gray-200"></div>
            
            {/* External Links */}
            {externalLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลโปรไฟล์</h2>
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">AD</span>
                </div>
                <div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    เปลี่ยนรูปภาพ
                  </button>
                  <p className="text-sm text-gray-500 mt-2">JPG, PNG หรือ GIF (ขนาดสูงสุด 2MB)</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ</label>
                    <input type="text" defaultValue="ผู้ดูแลระบบ" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">นามสกุล</label>
                    <input type="text" defaultValue="Admin" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" defaultValue="admin@salesai.com" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">ยกเลิก</button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>บันทึก</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">การเชื่อมต่อ</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Database className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Supabase</h3>
                      <p className="text-sm text-gray-500">Database & Auth</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">เชื่อมต่อแล้ว</span>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">OpenAI</h3>
                      <p className="text-sm text-gray-500">AI Model (GPT-4)</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">เชื่อมต่อแล้ว</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">รูปแบบ</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">ธีม</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => setTheme('light')} className={`p-4 border-2 rounded-lg transition-all ${theme === 'light' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                      <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                      <p className="font-medium text-gray-900">สว่าง</p>
                    </button>
                    <button onClick={() => setTheme('dark')} className={`p-4 border-2 rounded-lg transition-all ${theme === 'dark' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                      <Moon className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                      <p className="font-medium text-gray-900">มืด</p>
                    </button>
                    <button onClick={() => setTheme('system')} className={`p-4 border-2 rounded-lg transition-all ${theme === 'system' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                      <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <p className="font-medium text-gray-900">ตามระบบ</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูล</h2>
              <div className="space-y-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">ส่งออกข้อมูล</h3>
                      <p className="text-sm text-gray-500 mt-1">ดาวน์โหลดข้อมูลทั้งหมดของคุณ</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>ส่งออก</span>
                    </button>
                  </div>
                </div>
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h3 className="font-medium text-red-900">ลบบัญชี</h3>
                  <p className="text-sm text-red-700 mt-1 mb-4">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">ลบบัญชี</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
