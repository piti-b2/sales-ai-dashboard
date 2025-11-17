'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Save, 
  RotateCcw, 
  Sparkles, 
  Settings, 
  MessageSquare,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface AIConfig {
  id: string
  config_name: string
  description: string
  model: string
  temperature: number
  max_tokens: number
  context_message_limit: number
  system_prompt: string
  prompt_guidelines: {
    tone: string[]
    style: string[]
    context: string[]
  }
  business_type: string
  business_description: string
  additional_instructions: string
  fallback_message: string
  is_active: boolean
  is_default: boolean
  usage_count: number
  last_used_at: string
}

export default function AIConfigPage() {
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ai_config')
        .select('*')
        .eq('is_active', true)
        .eq('is_default', true)
        .single()

      if (error) throw error
      setConfig(data)
    } catch (error) {
      console.error('Error fetching config:', error)
      showMessage('error', 'ไม่สามารถโหลดการตั้งค่าได้')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('ai_config')
        .update({
          config_name: config.config_name,
          description: config.description,
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          context_message_limit: config.context_message_limit,
          system_prompt: config.system_prompt,
          prompt_guidelines: config.prompt_guidelines,
          business_type: config.business_type,
          business_description: config.business_description,
          additional_instructions: config.additional_instructions,
          fallback_message: config.fallback_message,
        })
        .eq('id', config.id)

      if (error) throw error
      showMessage('success', 'บันทึกการตั้งค่าสำเร็จ')
      fetchConfig()
    } catch (error) {
      console.error('Error saving config:', error)
      showMessage('error', 'ไม่สามารถบันทึกการตั้งค่าได้')
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const updateGuideline = (category: 'tone' | 'style' | 'context', index: number, value: string) => {
    if (!config) return
    const newGuidelines = { ...config.prompt_guidelines }
    newGuidelines[category][index] = value
    setConfig({ ...config, prompt_guidelines: newGuidelines })
  }

  const addGuideline = (category: 'tone' | 'style' | 'context') => {
    if (!config) return
    const newGuidelines = { ...config.prompt_guidelines }
    newGuidelines[category].push('')
    setConfig({ ...config, prompt_guidelines: newGuidelines })
  }

  const removeGuideline = (category: 'tone' | 'style' | 'context', index: number) => {
    if (!config) return
    const newGuidelines = { ...config.prompt_guidelines }
    newGuidelines[category].splice(index, 1)
    setConfig({ ...config, prompt_guidelines: newGuidelines })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">ไม่พบการตั้งค่า AI</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-600" />
              ตั้งค่า AI Assistant
            </h1>
            <p className="text-gray-600 mt-2">
              ปรับแต่งพฤติกรรมและการตอบกลับของ AI Assistant
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchConfig}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              รีเซ็ต
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">จำนวนครั้งที่ใช้งาน</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{config.usage_count || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Model</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{config.model}</p>
            </div>
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">บริบทข้อความ</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{config.context_message_limit}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            ข้อมูลพื้นฐาน
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อการตั้งค่า
              </label>
              <input
                type="text"
                value={config.config_name}
                onChange={(e) => setConfig({ ...config, config_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทธุรกิจ
              </label>
              <input
                type="text"
                value={config.business_type}
                onChange={(e) => setConfig({ ...config, business_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบาย
              </label>
              <textarea
                value={config.description || ''}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">การตั้งค่า AI Model</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gpt-4o-mini">GPT-4o Mini (ประหยัด)</option>
                <option value="gpt-4o">GPT-4o (แม่นยำ)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature ({config.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">0 = แม่นยำ, 2 = สร้างสรรค์</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={config.max_tokens}
                onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนข้อความบริบท
              </label>
              <input
                type="number"
                value={config.context_message_limit}
                onChange={(e) => setConfig({ ...config, context_message_limit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">AI จะอ่านข้อความล่าสุดกี่ข้อความ</p>
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Prompt</h2>
          <textarea
            value={config.system_prompt}
            onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="คุณเป็น AI Assistant สำหรับ..."
          />
        </div>

        {/* Guidelines */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">แนวทางการตอบกลับ</h2>
          
          {/* Tone */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              น้ำเสียง (Tone)
            </label>
            {config.prompt_guidelines.tone.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateGuideline('tone', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeGuideline('tone', index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  ลบ
                </button>
              </div>
            ))}
            <button
              onClick={() => addGuideline('tone')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + เพิ่มน้ำเสียง
            </button>
          </div>

          {/* Style */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รูปแบบ (Style)
            </label>
            {config.prompt_guidelines.style.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateGuideline('style', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeGuideline('style', index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  ลบ
                </button>
              </div>
            ))}
            <button
              onClick={() => addGuideline('style')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + เพิ่มรูปแบบ
            </button>
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              บริบท (Context)
            </label>
            {config.prompt_guidelines.context.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateGuideline('context', index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeGuideline('context', index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  ลบ
                </button>
              </div>
            ))}
            <button
              onClick={() => addGuideline('context')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + เพิ่มบริบท
            </button>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">การตั้งค่าเพิ่มเติม</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำแนะนำเพิ่มเติม
              </label>
              <textarea
                value={config.additional_instructions || ''}
                onChange={(e) => setConfig({ ...config, additional_instructions: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เพิ่มคำแนะนำพิเศษสำหรับ AI..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ข้อความ Fallback (เมื่อ AI ไม่สามารถตอบได้)
              </label>
              <input
                type="text"
                value={config.fallback_message}
                onChange={(e) => setConfig({ ...config, fallback_message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
