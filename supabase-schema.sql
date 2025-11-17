-- ============================================
-- Schema สำหรับระบบแชทแบบ LINE
-- ============================================

-- 1. ตาราง chat_rooms (ห้องแชท 1-1)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id TEXT NOT NULL, -- LINE User ID หรือ User ID ของลูกค้า
  agent_user_id TEXT, -- Admin/Agent ที่รับผิดชอบห้องนี้
  status TEXT DEFAULT 'active', -- active, closed, blocked
  is_ai_enabled BOOLEAN DEFAULT true, -- เปิด/ปิด AI Auto Reply
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index สำหรับค้นหาห้องแชท
CREATE INDEX IF NOT EXISTS idx_chat_rooms_customer ON chat_rooms(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_agent ON chat_rooms(agent_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON chat_rooms(last_message_at DESC);

-- 2. ตาราง chat_messages (ข้อความในแชท)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL, -- User ID ของผู้ส่ง
  sender_type TEXT NOT NULL, -- 'customer', 'agent', 'ai'
  message_type TEXT NOT NULL, -- 'text', 'image', 'video', 'audio', 'file', 'sticker'
  content TEXT, -- ข้อความ (สำหรับ text)
  media_url TEXT, -- URL ของไฟล์สื่อ
  media_type TEXT, -- MIME type (image/jpeg, video/mp4, etc.)
  media_size INTEGER, -- ขนาดไฟล์ (bytes)
  media_duration INTEGER, -- ความยาววิดีโอ/เสียง (วินาที)
  thumbnail_url TEXT, -- URL ของ thumbnail (สำหรับวิดีโอ)
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb, -- เก็บข้อมูลเพิ่มเติม (เช่น AI confidence, transcription)
  reply_to_id UUID REFERENCES chat_messages(id) -- สำหรับ reply ข้อความ (Phase 2)
);

-- Index สำหรับดึงข้อความ
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(room_id, status) WHERE status != 'read';

-- 3. ตาราง typing_indicators (สถานะกำลังพิมพ์)
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  is_typing BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index และ Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_typing_unique ON typing_indicators(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_typing_room ON typing_indicators(room_id);

-- 4. ตาราง ai_suggestions (คำแนะนำจาก AI สำหรับ Agent)
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL, -- 'auto_reply', 'quick_reply', 'rag_answer'
  suggested_content TEXT NOT NULL,
  confidence_score FLOAT,
  sources JSONB, -- แหล่งที่มาของคำตอบ (สำหรับ RAG)
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_room ON ai_suggestions(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_message ON ai_suggestions(message_id);

-- 5. ตาราง notification_settings (การตั้งค่าการแจ้งเตือน)
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  sound_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  muted_rooms JSONB DEFAULT '[]'::jsonb, -- รายการห้องที่ปิดเสียง
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON notification_settings(user_id);

-- 6. ตาราง agent_status (สถานะของ Agent)
CREATE TABLE IF NOT EXISTS agent_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_user_id TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'offline', -- online, away, busy, offline
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_rooms_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_status_user ON agent_status(agent_user_id);
CREATE INDEX IF NOT EXISTS idx_agent_status_online ON agent_status(status) WHERE status = 'online';

-- ============================================
-- Functions และ Triggers
-- ============================================

-- Function: อัปเดต last_message_at เมื่อมีข้อความใหม่
CREATE OR REPLACE FUNCTION update_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: เรียก function เมื่อมีข้อความใหม่
DROP TRIGGER IF EXISTS trigger_update_room_last_message ON chat_messages;
CREATE TRIGGER trigger_update_room_last_message
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_room_last_message();

-- Function: ลบ typing indicator เก่าอัตโนมัติ (เก่ากว่า 5 วินาที)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < NOW() - INTERVAL '5 seconds';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- เปิด RLS สำหรับทุกตาราง
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

-- Policy: ลูกค้าเห็นเฉพาะห้องของตัวเอง
CREATE POLICY "Customers can view their own rooms"
ON chat_rooms FOR SELECT
USING (customer_user_id = auth.uid()::text);

-- Policy: Agent เห็นห้องที่รับผิดชอบหรือห้องที่ยังไม่มี agent
CREATE POLICY "Agents can view assigned or unassigned rooms"
ON chat_rooms FOR SELECT
USING (
  agent_user_id = auth.uid()::text 
  OR agent_user_id IS NULL
  OR EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()::text AND enabled = true
  )
);

-- Policy: ลูกค้าเห็นข้อความในห้องของตัวเอง
CREATE POLICY "Customers can view messages in their rooms"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE id = chat_messages.room_id 
    AND customer_user_id = auth.uid()::text
  )
);

-- Policy: Agent เห็นข้อความในห้องที่รับผิดชอบ
CREATE POLICY "Agents can view messages in assigned rooms"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE id = chat_messages.room_id 
    AND (
      agent_user_id = auth.uid()::text 
      OR EXISTS (
        SELECT 1 FROM admins WHERE user_id = auth.uid()::text AND enabled = true
      )
    )
  )
);

-- Policy: ผู้ใช้สามารถส่งข้อความในห้องของตัวเอง
CREATE POLICY "Users can insert messages in their rooms"
ON chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE id = chat_messages.room_id 
    AND (
      customer_user_id = auth.uid()::text 
      OR agent_user_id = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM admins WHERE user_id = auth.uid()::text AND enabled = true
      )
    )
  )
);

-- ============================================
-- Realtime Publication
-- ============================================

-- เปิด Realtime สำหรับตารางที่ต้องการ
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_suggestions;

-- ============================================
-- Sample Data (สำหรับทดสอบ)
-- ============================================

-- สร้างห้องแชททดสอบ
INSERT INTO chat_rooms (customer_user_id, agent_user_id, status, is_ai_enabled)
VALUES 
  ('U1234567890abcdef', 'admin@example.com', 'active', true),
  ('U9876543210fedcba', NULL, 'active', true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE chat_rooms IS 'ห้องแชท 1-1 ระหว่างลูกค้าและ Agent';
COMMENT ON TABLE chat_messages IS 'ข้อความในแชท รองรับหลายประเภท (text, image, video, audio, file)';
COMMENT ON TABLE typing_indicators IS 'สถานะกำลังพิมพ์แบบ Realtime';
COMMENT ON TABLE ai_suggestions IS 'คำแนะนำจาก AI สำหรับ Agent';
COMMENT ON TABLE notification_settings IS 'การตั้งค่าการแจ้งเตือนของผู้ใช้';
COMMENT ON TABLE agent_status IS 'สถานะออนไลน์/ออฟไลน์ของ Agent';
