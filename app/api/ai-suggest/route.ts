import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { message, roomId, useRAG = false } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let suggestion = ''
    let sources: any[] = []

    if (useRAG) {
      // TODO: ใช้ RAG เพื่อค้นหาคำตอบจาก Knowledge Base
      // ตอนนี้ใช้ OpenAI ธรรมดาก่อน
      suggestion = await generateAISuggestion(message, roomId)
    } else {
      // ใช้ OpenAI ธรรมดา
      suggestion = await generateAISuggestion(message, roomId)
    }

    // บันทึก AI Suggestion ลง Database
    if (roomId) {
      await supabase.from('ai_suggestions').insert({
        room_id: roomId,
        suggestion_type: useRAG ? 'rag_answer' : 'auto_reply',
        suggested_content: suggestion,
        sources: sources.length > 0 ? sources : null,
        is_used: false,
      })
    }

    return NextResponse.json({
      suggestion,
      sources,
    })
  } catch (error: any) {
    console.error('Error generating AI suggestion:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestion' },
      { status: 500 }
    )
  }
}

async function generateAISuggestion(
  customerMessage: string,
  roomId?: string
): Promise<string> {
  try {
    // ดึงการตั้งค่า AI จาก Database
    const { data: aiConfig } = await supabase
      .from('ai_config')
      .select('*')
      .eq('is_active', true)
      .eq('is_default', true)
      .single()

    // ใช้ค่าเริ่มต้นถ้าไม่มีการตั้งค่า
    const config = aiConfig || {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1000,
      context_message_limit: 30,
      system_prompt: 'คุณเป็น AI Assistant สำหรับพนักงานขายและซัพพอร์ต',
      prompt_guidelines: {
        tone: ['สุภาพ', 'เป็นมิตร', 'เป็นมืออาชีพ'],
        style: ['ตรงประเด็นและชัดเจน', 'ใช้ภาษาไทยที่เข้าใจง่าย', 'ไม่ยาวเกินไป (2-3 ประโยค)'],
        context: ['เหมาะสมกับบริบทของสถาบันสอนพิเศษเด็ก']
      },
      business_type: 'สถาบันสอนพิเศษเด็ก',
      fallback_message: 'ขออภัยค่ะ ไม่สามารถสร้างคำตอบได้ในขณะนี้'
    }

    // ดึงประวัติการสนทนาตามจำนวนที่ตั้งค่าไว้
    let context = ''
    if (roomId) {
      const { data: recentMessages } = await supabase
        .from('chat_messages')
        .select('sender_type, content, message_type')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(config.context_message_limit)

      if (recentMessages && recentMessages.length > 0) {
        context = recentMessages
          .reverse()
          .map((msg) => {
            const role = msg.sender_type === 'customer' ? 'ลูกค้า' : 'พนักงาน'
            return `${role}: ${msg.content || `[${msg.message_type}]`}`
          })
          .join('\n')
      }
    }

    // สร้าง guidelines text จาก JSONB
    const guidelines = config.prompt_guidelines || {}
    const guidelinesText = [
      guidelines.tone ? `\nคำตอบต้อง:\n${guidelines.tone.map((t: string) => `- ${t}`).join('\n')}` : '',
      guidelines.style ? `\n${guidelines.style.map((s: string) => `- ${s}`).join('\n')}` : '',
      guidelines.context ? `\n${guidelines.context.map((c: string) => `- ${c}`).join('\n')}` : ''
    ].filter(Boolean).join('\n')

    // สร้าง system prompt แบบ dynamic
    const systemPrompt = `${config.system_prompt}
${guidelinesText}

${context ? `\nบริบทการสนทนา:\n${context}\n` : ''}

ข้อความล่าสุดจากลูกค้า: "${customerMessage}"

กรุณาแนะนำคำตอบที่เหมาะสม:`

    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: customerMessage,
        },
      ],
      temperature: Number(config.temperature),
      max_tokens: config.max_tokens,
    })

    // อัพเดทสถิติการใช้งาน
    if (aiConfig?.id) {
      await supabase.rpc('increment_ai_config_usage', { config_id: aiConfig.id })
    }

    return completion.choices[0]?.message?.content || config.fallback_message
  } catch (error) {
    console.error('Error calling OpenAI:', error)
    throw error
  }
}
