-- ============================================
-- Import ข้อมูลจาก n8n Database → Supabase
-- ============================================
-- ไฟล์นี้จะ import ข้อมูลจาก:
-- - messages → chat_messages + chat_rooms
-- - conversations → chat_rooms
-- - payment_slips → (optional) สามารถเก็บไว้ใน metadata
-- ============================================

-- ============================================
-- STEP 1: สร้าง Foreign Data Wrapper (ถ้ายังไม่มี)
-- ============================================

-- เปิดใช้งาน postgres_fdw extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- สร้าง server connection ไปยัง n8n database
-- ⚠️ แก้ไข host, port, dbname ให้ตรงกับ n8n database ของคุณ
CREATE SERVER IF NOT EXISTS n8n_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host 'localhost',      -- แก้เป็น host ของ n8n database
    port '5432',           -- แก้เป็น port ของ n8n database
    dbname 'n8n'          -- แก้เป็นชื่อ database ของ n8n
  );

-- สร้าง user mapping
-- ⚠️ แก้ไข username และ password ให้ตรงกับ n8n database
CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER
  SERVER n8n_server
  OPTIONS (
    user 'postgres',       -- แก้เป็น username ของ n8n database
    password 'your_password'  -- แก้เป็น password ของ n8n database
  );

-- ============================================
-- STEP 2: สร้าง Foreign Tables
-- ============================================

-- Foreign table สำหรับ messages
DROP FOREIGN TABLE IF EXISTS n8n_messages CASCADE;
CREATE FOREIGN TABLE n8n_messages (
  id UUID,
  conversation_id UUID,
  user_id TEXT,
  role TEXT,
  content TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  message_type TEXT,
  line_message_id TEXT,
  media_url TEXT,
  media_type TEXT,
  media_category TEXT,
  media_description TEXT,
  media_metadata JSONB,
  should_store BOOLEAN,
  line_media_url TEXT,
  media_storage_path TEXT,
  media_size INTEGER
)
SERVER n8n_server
OPTIONS (schema_name 'public', table_name 'messages');

-- Foreign table สำหรับ conversations
DROP FOREIGN TABLE IF EXISTS n8n_conversations CASCADE;
CREATE FOREIGN TABLE n8n_conversations (
  id UUID,
  user_id TEXT,
  channel TEXT,
  product_id TEXT,
  started_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ
)
SERVER n8n_server
OPTIONS (schema_name 'public', table_name 'conversations');

-- Foreign table สำหรับ payment_slips (optional)
DROP FOREIGN TABLE IF EXISTS n8n_payment_slips CASCADE;
CREATE FOREIGN TABLE n8n_payment_slips (
  id TEXT,
  user_id TEXT,
  message_id TEXT,
  amount DECIMAL,
  datetime TEXT,
  bank TEXT,
  bank_destination TEXT,
  reference TEXT,
  recipient_name TEXT,
  recipient_account TEXT,
  has_qr_code BOOLEAN,
  qr_verified BOOLEAN,
  qr_data JSONB,
  verified BOOLEAN,
  verified_by TEXT,
  confidence TEXT,
  validation_status TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_duplicate BOOLEAN,
  duplicate_check_passed BOOLEAN,
  should_reject BOOLEAN
)
SERVER n8n_server
OPTIONS (schema_name 'public', table_name 'payment_slips');

-- ============================================
-- STEP 3: Import Chat Rooms
-- ============================================

-- สร้างห้องแชทจาก conversations
INSERT INTO chat_rooms (
  customer_user_id,
  agent_user_id,
  status,
  is_ai_enabled,
  created_at,
  last_message_at,
  customer_name,
  customer_avatar
)
SELECT 
  c.user_id as customer_user_id,
  NULL as agent_user_id,  -- ยังไม่มี agent รับเคส
  'active' as status,
  true as is_ai_enabled,  -- เปิด AI ทุกห้องตามค่าเริ่มต้น
  c.started_at as created_at,
  c.last_activity_at as last_message_at,
  -- ชื่อและรูปจะต้องดึงจาก LINE API ภายหลัง
  'LINE User ' || SUBSTRING(c.user_id, 1, 8) as customer_name,
  NULL as customer_avatar
FROM n8n_conversations c
WHERE c.channel = 'line'
ON CONFLICT (customer_user_id) DO UPDATE
SET 
  last_message_at = EXCLUDED.last_message_at,
  created_at = LEAST(chat_rooms.created_at, EXCLUDED.created_at);

-- ============================================
-- STEP 4: Import Chat Messages
-- ============================================

-- Import ข้อความจาก messages
INSERT INTO chat_messages (
  room_id,
  sender_id,
  sender_type,
  message_type,
  content,
  media_url,
  media_type,
  metadata,
  line_message_id,
  status,
  created_at
)
SELECT 
  cr.id as room_id,
  m.user_id as sender_id,
  CASE 
    WHEN m.role = 'user' THEN 'customer'::sender_type
    WHEN m.role = 'assistant' THEN 'ai'::sender_type
    WHEN m.role = 'agent' THEN 'agent'::sender_type
    ELSE 'customer'::sender_type
  END as sender_type,
  COALESCE(m.message_type, 'text')::message_type as message_type,
  m.content,
  m.media_url,
  m.media_type,
  -- รวม metadata ทั้งหมด
  jsonb_build_object(
    'original_metadata', m.metadata,
    'media_metadata', m.media_metadata,
    'media_category', m.media_category,
    'media_description', m.media_description,
    'media_storage_path', m.media_storage_path,
    'line_media_url', m.line_media_url,
    'tokens_in', m.tokens_in,
    'tokens_out', m.tokens_out
  ) as metadata,
  m.line_message_id,
  'read'::message_status as status,  -- ข้อความเก่าถือว่าอ่านแล้ว
  m.created_at
FROM n8n_messages m
JOIN chat_rooms cr ON cr.customer_user_id = m.user_id
WHERE m.content IS NOT NULL 
  AND m.content != ''
ORDER BY m.created_at ASC
ON CONFLICT (line_message_id) DO NOTHING;

-- ============================================
-- STEP 5: อัปเดต last_message_at ใน chat_rooms
-- ============================================

UPDATE chat_rooms cr
SET last_message_at = (
  SELECT MAX(cm.created_at)
  FROM chat_messages cm
  WHERE cm.room_id = cr.id
)
WHERE EXISTS (
  SELECT 1 FROM chat_messages cm WHERE cm.room_id = cr.id
);

-- ============================================
-- STEP 6: สร้างตาราง customers (ถ้ายังไม่มี)
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  picture_url TEXT,
  status_message TEXT,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7: Import ข้อมูลลูกค้าเบื้องต้น
-- ============================================

-- สร้างรายการลูกค้าจาก user_id ที่มีในห้องแชท
INSERT INTO customers (
  line_user_id,
  display_name,
  created_at
)
SELECT DISTINCT
  cr.customer_user_id as line_user_id,
  cr.customer_name as display_name,
  cr.created_at
FROM chat_rooms cr
ON CONFLICT (line_user_id) DO NOTHING;

-- ============================================
-- STEP 8: สถิติและการตรวจสอบ
-- ============================================

-- จำนวนห้องแชทที่ import
SELECT 
  'Chat Rooms Imported' as metric,
  COUNT(*) as count
FROM chat_rooms;

-- จำนวนข้อความที่ import
SELECT 
  'Messages Imported' as metric,
  COUNT(*) as count
FROM chat_messages;

-- จำนวนข้อความในแต่ละห้อง
SELECT 
  cr.customer_name,
  cr.customer_user_id,
  COUNT(cm.id) as message_count,
  MAX(cm.created_at) as last_message,
  MIN(cm.created_at) as first_message
FROM chat_rooms cr
LEFT JOIN chat_messages cm ON cm.room_id = cr.id
GROUP BY cr.id, cr.customer_name, cr.customer_user_id
ORDER BY last_message DESC;

-- แสดงตัวอย่างข้อความ
SELECT 
  cr.customer_name,
  cm.sender_type,
  cm.message_type,
  LEFT(cm.content, 50) as content_preview,
  cm.created_at
FROM chat_messages cm
JOIN chat_rooms cr ON cr.id = cm.room_id
ORDER BY cm.created_at DESC
LIMIT 20;

-- ============================================
-- STEP 9: Cleanup (Optional)
-- ============================================

-- ถ้าไม่ต้องการใช้ foreign tables อีกต่อไป สามารถลบได้
-- DROP FOREIGN TABLE IF EXISTS n8n_messages CASCADE;
-- DROP FOREIGN TABLE IF EXISTS n8n_conversations CASCADE;
-- DROP FOREIGN TABLE IF EXISTS n8n_payment_slips CASCADE;

-- ============================================
-- หมายเหตุ
-- ============================================

/*
⚠️ สิ่งที่ต้องทำเพิ่มเติม:

1. ดึง LINE Profile:
   - ใช้ LINE Messaging API
   - GET https://api.line.me/v2/bot/profile/{userId}
   - อัปเดต customer_name และ customer_avatar

2. แก้ไข connection string:
   - แก้ host, port, dbname ใน CREATE SERVER
   - แก้ username, password ใน CREATE USER MAPPING

3. ทดสอบ connection:
   - SELECT * FROM n8n_messages LIMIT 5;
   - ถ้า error ให้ตรวจสอบ connection string

4. Import แบบ Incremental:
   - เพิ่ม WHERE m.created_at > (SELECT MAX(created_at) FROM chat_messages)
   - เพื่อ import เฉพาะข้อความใหม่

5. Backup:
   - สำรองข้อมูลก่อน import
   - pg_dump -t chat_rooms -t chat_messages > backup.sql
*/
