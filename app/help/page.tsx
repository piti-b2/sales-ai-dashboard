'use client'

import { useState } from 'react'
import {
  HelpCircle,
  Search,
  Book,
  Video,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Zap,
  Shield,
  Settings,
  DollarSign,
  BarChart,
} from 'lucide-react'

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'ทั้งหมด', icon: Book },
    { id: 'getting-started', name: 'เริ่มต้นใช้งาน', icon: Zap },
    { id: 'dashboard', name: 'Dashboard', icon: BarChart },
    { id: 'security', name: 'ความปลอดภัย', icon: Shield },
    { id: 'billing', name: 'การเรียกเก็บเงิน', icon: DollarSign },
    { id: 'settings', name: 'การตั้งค่า', icon: Settings },
  ]

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'วิธีการเริ่มต้นใช้งาน Sales AI Dashboard',
      answer: 'คุณสามารถเริ่มต้นใช้งานได้โดยการสร้างบัญชีผ่านหน้า Sign Up จากนั้นทำการยืนยันอีเมล และเชื่อมต่อ LINE Official Account ของคุณเข้ากับระบบ ระบบจะทำการ Setup AI Agent ให้อัตโนมัติ',
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'ต้องใช้เวลานานแค่ไหนในการ Setup',
      answer: 'การ Setup ครั้งแรกใช้เวลาเพียง 5-10 นาที คุณจะได้ AI Agent ที่พร้อมใช้งานทันที และสามารถปรับแต่งเพิ่มเติมได้ตามต้องการ',
    },
    {
      id: 3,
      category: 'dashboard',
      question: 'วิธีการดูรายงานยอดขาย',
      answer: 'คุณสามารถดูรายงานยอดขายได้ที่เมนู Sales ในแถบด้านซ้าย ซึ่งจะแสดงข้อมูลยอดขาย รายได้ และสถิติต่างๆ พร้อมกราฟแสดงผลที่เข้าใจง่าย สามารถเลือกช่วงเวลาได้ตามต้องการ',
    },
    {
      id: 4,
      category: 'dashboard',
      question: 'ข้อมูลใน Dashboard อัปเดตบ่อยแค่ไหน',
      answer: 'ข้อมูลส่วนใหญ่จะอัปเดตแบบ Real-time โดยอัตโนมัติ บางข้อมูลที่ต้องการการประมวลผลจะอัปเดตทุก 5-10 นาที',
    },
    {
      id: 5,
      category: 'security',
      question: 'ข้อมูลของฉันปลอดภัยหรือไม่',
      answer: 'เรามีระบบรักษาความปลอดภัยระดับ Enterprise โดยใช้การเข้ารหัส SSL/TLS, Two-Factor Authentication, และมีการสำรองข้อมูลอัตโนมัติทุกวัน ข้อมูลทั้งหมดเก็บบน Supabase ซึ่งเป็นบริการ Database ที่มีมาตรฐานสูง',
    },
    {
      id: 6,
      category: 'security',
      question: 'วิธีการเปิดใช้งาน Two-Factor Authentication',
      answer: 'ไปที่เมนู Settings > Security จากนั้นคลิกที่ปุ่ม "เปิดใช้งาน 2FA" ระบบจะแนะนำขั้นตอนการตั้งค่าผ่าน QR Code ที่คุณสามารถสแกนด้วยแอพ Google Authenticator หรือแอพที่รองรับ TOTP',
    },
    {
      id: 7,
      category: 'billing',
      question: 'มีแพ็กเกจอะไรบ้าง',
      answer: 'เรามี 3 แพ็กเกจหลัก: Starter (฿999/เดือน) เหมาะสำหรับธุรกิจขนาดเล็ก, Pro (฿2,999/เดือน) สำหรับธุรกิจขนาดกลาง, และ Enterprise (ราคาตามความต้องการ) สำหรับองค์กรขนาดใหญ่',
    },
    {
      id: 8,
      category: 'billing',
      question: 'สามารถยกเลิกได้ตลอดเวลาหรือไม่',
      answer: 'สามารถยกเลิกได้ทุกเมื่อ โดยไม่มีค่าปรับ หากยกเลิกภายในรอบบิล คุณจะยังสามารถใช้งานได้จนถึงสิ้นสุดรอบที่จ่ายไปแล้ว',
    },
    {
      id: 9,
      category: 'settings',
      question: 'วิธีการเปลี่ยนฟอนต์หรือธีมสี',
      answer: 'ไปที่ Settings > Appearance คุณสามารถเลือกธีมสี (สว่าง/มืด) และเลือกฟอนต์ที่ต้องการได้ ระบบจะบันทึกค่าที่ตั้งไว้อัตโนมัติ',
    },
    {
      id: 10,
      category: 'settings',
      question: 'วิธีการเชื่อมต่อ LINE Official Account',
      answer: 'ไปที่ Settings > Integrations จากนั้นคลิก "เชื่อมต่อ LINE" กรอก Channel ID และ Channel Secret จาก LINE Developers Console ระบบจะทำการตรวจสอบและเชื่อมต่อให้อัตโนมัติ',
    },
  ]

  const resources = [
    {
      title: 'คู่มือการใช้งาน',
      description: 'เอกสารครบถ้วนสำหรับการใช้งาน Dashboard',
      icon: Book,
      color: 'bg-blue-100 text-blue-600',
      link: '#',
    },
    {
      title: 'วิดีโอสอนการใช้งาน',
      description: 'วิดีโอสอนการใช้งานทีละขั้นตอน',
      icon: Video,
      color: 'bg-purple-100 text-purple-600',
      link: '#',
    },
    {
      title: 'API Documentation',
      description: 'เอกสารสำหรับนักพัฒนา (Developer)',
      icon: FileText,
      color: 'bg-green-100 text-green-600',
      link: '#',
    },
    {
      title: 'Community Forum',
      description: 'พูดคุยและแลกเปลี่ยนกับผู้ใช้งานอื่นๆ',
      icon: MessageSquare,
      color: 'bg-orange-100 text-orange-600',
      link: '#',
    },
  ]

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">ศูนย์ช่วยเหลือ</h1>
        <p className="text-gray-600 mt-2">มีคำถามหรือต้องการความช่วยเหลือ? เราพร้อมช่วยคุณ</p>
        
        {/* Search Bar */}
        <div className="mt-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาคำถามหรือหัวข้อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>
      </div>

      {/* Quick Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.map((resource) => {
          const Icon = resource.icon
          return (
            <a
              key={resource.title}
              href={resource.link}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className={`w-12 h-12 ${resource.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-gray-600">{resource.description}</p>
              <div className="mt-3 flex items-center text-sm text-blue-600 font-medium">
                <span>เรียนรู้เพิ่มเติม</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </div>
            </a>
          )
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">คำถามที่พบบ่อย (FAQ)</h2>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            )
          })}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-gray-900">{faq.question}</span>
                </div>
                {expandedFaq === faq.id ? (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {expandedFaq === faq.id && (
                <div className="px-4 pb-4 pl-12 text-gray-600 border-t border-gray-100 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ยังหาคำตอบไม่เจอ?
          </h2>
          <p className="text-gray-600 mb-6">
            ทีมซัพพอร์ตของเราพร้อมช่วยเหลือคุณตลอด 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@salesai.com"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:shadow-md transition-all border border-gray-200"
            >
              <Mail className="w-5 h-5" />
              <span>ส่งอีเมล</span>
            </a>
            <a
              href="tel:+66812345678"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:shadow-md transition-all border border-gray-200"
            >
              <Phone className="w-5 h-5" />
              <span>โทรหาเรา</span>
            </a>
            <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span>แชทกับเรา</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            เวลาทำการ: จันทร์-ศุกร์ 9:00-18:00 | เสาร์-อาทิตย์ 9:00-17:00
          </p>
        </div>
      </div>
    </div>
  )
}
