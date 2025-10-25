import OpenAI from 'openai'

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Types
export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  sentiment_score: number
  confidence: number
}

export interface IntentAnalysis {
  intent: string
  intent_category: 'price_inquiry' | 'purchase_intent' | 'information_seeking' | 'concern' | 'how_to' | 'complaint' | 'general'
  confidence: number
}

export interface MessageAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  sentiment_score: number
  intent: string
  intent_category: string
  concerns: string[]
  keywords: string[]
  category: string
  urgency: 'low' | 'medium' | 'high'
  confidence: number
  summary: string
}

// Analyze single message with GPT-4o-mini
export async function analyzeMessageWithAI(text: string): Promise<MessageAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ข้อความภาษาไทยสำหรับระบบ Customer Service

วิเคราะห์ข้อความและตอบเป็น JSON ตามรูปแบบนี้:
{
  "sentiment": "positive|neutral|negative",
  "sentiment_score": 0-100,
  "intent": "คำอธิบายความตั้งใจของลูกค้า",
  "intent_category": "price_inquiry|purchase_intent|information_seeking|concern|how_to|complaint|general",
  "concerns": ["ข้อกังวลที่พบ"],
  "keywords": ["คำสำคัญ"],
  "category": "ราคา|การจัดส่ง|การชำระเงิน|การคืนสินค้า|วิธีใช้งาน|คำแนะนำ|ช่วงอายุ|สินค้าคงคลัง|ทั่วไป",
  "urgency": "low|medium|high",
  "confidence": 0-100,
  "summary": "สรุปสั้นๆ ของข้อความ"
}

หมายเหตุ:
- sentiment_score: 0=แย่มาก, 50=กลางๆ, 100=ดีมาก
- urgency: ระดับความเร่งด่วนในการตอบ
- confidence: ความมั่นใจในการวิเคราะห์
- concerns: ข้อกังวลหรือปัญหาที่ลูกค้ากังวล (ถ้ามี)
- keywords: คำสำคัญที่ควรจับตา`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500
    })

    const analysis = JSON.parse(response.choices[0].message.content || '{}')
    return analysis as MessageAnalysis
  } catch (error) {
    console.error('OpenAI Analysis Error:', error)
    throw error
  }
}

// Batch analyze multiple messages
export async function batchAnalyzeMessages(messages: { id: string; content: string }[]): Promise<Map<string, MessageAnalysis>> {
  const results = new Map<string, MessageAnalysis>()
  
  // Process in batches of 10 to avoid rate limits
  const batchSize = 10
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize)
    
    const analyses = await Promise.all(
      batch.map(async (msg) => {
        try {
          const analysis = await analyzeMessageWithAI(msg.content)
          return { id: msg.id, analysis }
        } catch (error) {
          console.error(`Error analyzing message ${msg.id}:`, error)
          return null
        }
      })
    )
    
    analyses.forEach(result => {
      if (result) {
        results.set(result.id, result.analysis)
      }
    })
    
    // Small delay between batches
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

// Summarize multiple messages into insights
export async function summarizeConversation(messages: string[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "คุณเป็นผู้เชี่ยวชาญในการสรุปบทสนทนา สรุปเป็นภาษาไทยแบบกระชับ"
        },
        {
          role: "user",
          content: `สรุปบทสนทนานี้:\n\n${messages.join('\n\n')}`
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    })

    return response.choices[0].message.content || ''
  } catch (error) {
    console.error('Summarization Error:', error)
    throw error
  }
}

// Extract FAQ from messages
export async function extractFAQ(messages: string[]): Promise<{ question: string; category: string; frequency: number }[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์คำถามที่พบบ่อย

วิเคราะห์และจัดกลุ่มคำถามที่คล้ายกัน ตอบเป็น JSON:
{
  "faqs": [
    {
      "question": "คำถามที่ถูกถามบ่อย",
      "category": "ราคา|การจัดส่ง|การชำระเงิน|...",
      "variations": ["รูปแบบคำถามที่คล้ายกัน"],
      "frequency": จำนวนครั้งโดยประมาณ
    }
  ]
}`
        },
        {
          role: "user",
          content: `วิเคราะห์คำถามเหล่านี้:\n\n${messages.join('\n')}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000
    })

    const result = JSON.parse(response.choices[0].message.content || '{"faqs":[]}')
    return result.faqs || []
  } catch (error) {
    console.error('FAQ Extraction Error:', error)
    throw error
  }
}
