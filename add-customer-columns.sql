-- ============================================
-- เพิ่มคอลัมน์สำหรับเก็บข้อมูลลูกค้าและ LINE Integration
-- ============================================

-- เพิ่มคอลัมน์ใน chat_rooms
ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_avatar TEXT;

-- เพิ่ม unique constraint สำหรับ customer_user_id (ถ้ายังไม่มี)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_rooms_customer_user_id_key'
  ) THEN
    ALTER TABLE chat_rooms 
    ADD CONSTRAINT chat_rooms_customer_user_id_key 
    UNIQUE (customer_user_id);
  END IF;
END $$;

-- เพิ่มคอลัมน์ใน chat_messages สำหรับ LINE integration
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS line_message_id TEXT;

-- เพิ่ม unique constraint สำหรับ line_message_id (ป้องกันข้อความซ้ำ)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_messages_line_message_id_key'
  ) THEN
    ALTER TABLE chat_messages
    ADD CONSTRAINT chat_messages_line_message_id_key 
    UNIQUE (line_message_id);
  END IF;
END $$;

-- สร้าง index
CREATE INDEX IF NOT EXISTS idx_chat_rooms_customer_name ON chat_rooms(customer_name);
CREATE INDEX IF NOT EXISTS idx_chat_messages_line_id ON chat_messages(line_message_id);

-- แสดงโครงสร้างตาราง chat_rooms
SELECT 'chat_rooms columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_rooms'
ORDER BY ordinal_position;

-- แสดงโครงสร้างตาราง chat_messages (เฉพาะคอลัมน์ที่เกี่ยวข้อง)
SELECT 'chat_messages columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_messages'
  AND column_name IN ('id', 'line_message_id', 'sender_id', 'message_type', 'content')
ORDER BY ordinal_position;
