-- ============================================
-- Migrate ข้อมูลจาก n8n Tables → Chat System
-- ============================================
-- ใช้งานใน Supabase SQL Editor
-- n8n และ Web App ใช้ Supabase เดียวกัน
-- ============================================

-- ============================================
-- STEP 1: Import Chat Rooms จาก conversations
-- ============================================

-- ⚠️ ถ้ายังไม่มีคอลัมน์ customer_name และ customer_avatar
-- ให้ run add-customer-columns.sql ก่อน
-- หรือใช้ version ด้านล่างที่ไม่ใช้คอลัมน์เหล่านี้

-- Version 1: มีคอลัมน์ customer_name และ customer_avatar
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
  NULL as agent_user_id,
  'active' as status,
  true as is_ai_enabled,
  c.started_at as created_at,
  c.last_activity_at as last_message_at,
  'LINE User ' || SUBSTRING(c.user_id, 1, 8) as customer_name,
  NULL as customer_avatar
FROM conversations c
WHERE c.channel = 'line'
  AND c.user_id IS NOT NULL
ON CONFLICT (customer_user_id) DO UPDATE
SET 
  last_message_at = GREATEST(chat_rooms.last_message_at, EXCLUDED.last_message_at),
  created_at = LEAST(chat_rooms.created_at, EXCLUDED.created_at),
  customer_name = EXCLUDED.customer_name;

-- Version 2: ไม่มีคอลัมน์ customer_name และ customer_avatar (ใช้อันนี้ถ้า error)
/*
INSERT INTO chat_rooms (
  customer_user_id,
  agent_user_id,
  status,
  is_ai_enabled,
  created_at,
  last_message_at
)
SELECT 
  c.user_id as customer_user_id,
  NULL as agent_user_id,
  'active' as status,
  true as is_ai_enabled,
  c.started_at as created_at,
  c.last_activity_at as last_message_at
FROM conversations c
WHERE c.channel = 'line'
  AND c.user_id IS NOT NULL
ON CONFLICT (customer_user_id) DO UPDATE
SET 
  last_message_at = GREATEST(chat_rooms.last_message_at, EXCLUDED.last_message_at),
  created_at = LEAST(chat_rooms.created_at, EXCLUDED.created_at);
*/

-- ============================================
-- STEP 2: Import Chat Messages จาก messages
-- ============================================

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
  -- แปลง role เป็น sender_type
  CASE 
    WHEN m.role = 'user' THEN 'customer'
    WHEN m.role = 'assistant' THEN 'ai'
    WHEN m.role = 'agent' THEN 'agent'
    ELSE 'customer'
  END as sender_type,
  -- แปลง message_type
  CASE 
    WHEN m.message_type = 'text' THEN 'text'
    WHEN m.message_type = 'image' THEN 'image'
    WHEN m.message_type = 'video' THEN 'video'
    WHEN m.message_type = 'audio' THEN 'audio'
    WHEN m.message_type = 'file' THEN 'file'
    ELSE 'text'
  END as message_type,
  -- เนื้อหาข้อความ
  COALESCE(m.content, '') as content,
  -- Media
  COALESCE(m.media_url, m.line_media_url) as media_url,
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
    'tokens_out', m.tokens_out,
    'should_store', m.should_store,
    'media_size', m.media_size
  ) as metadata,
  m.line_message_id,
  'read' as status,
  m.created_at
FROM messages m
JOIN chat_rooms cr ON cr.customer_user_id = m.user_id
WHERE m.content IS NOT NULL 
  AND m.content != ''
  AND m.user_id IS NOT NULL
ORDER BY m.created_at ASC
ON CONFLICT (line_message_id) 
DO NOTHING;

-- ============================================
-- STEP 3: อัปเดต last_message_at
-- ============================================

UPDATE chat_rooms cr
SET last_message_at = subquery.last_msg
FROM (
  SELECT 
    room_id,
    MAX(created_at) as last_msg
  FROM chat_messages
  GROUP BY room_id
) subquery
WHERE cr.id = subquery.room_id;

-- ============================================
-- STEP 4: สร้างตาราง customers (ถ้ายังไม่มี)
-- ============================================

-- ⚠️ ถ้ามีตาราง customers อยู่แล้ว ให้ comment STEP 4 นี้ออก
-- และใช้ STEP 5 Version 2 แทน

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
-- STEP 5: สร้างรายการลูกค้า
-- ============================================

-- Version 1: ถ้าตาราง customers มีคอลัมน์ display_name
/*
INSERT INTO customers (
  line_user_id,
  display_name,
  created_at
)
SELECT DISTINCT
  cr.customer_user_id as line_user_id,
  cr.customer_name as display_name,
  MIN(cr.created_at) as created_at
FROM chat_rooms cr
GROUP BY cr.customer_user_id, cr.customer_name
ON CONFLICT (line_user_id) 
DO UPDATE SET
  updated_at = NOW();
*/

-- Version 2: ถ้าตาราง customers มี full_name (NOT NULL) (ใช้อันนี้)
INSERT INTO customers (
  line_user_id,
  full_name,
  created_at
)
SELECT DISTINCT
  cr.customer_user_id as line_user_id,
  COALESCE(cr.customer_name, 'LINE User ' || SUBSTRING(cr.customer_user_id, 1, 8)) as full_name,
  MIN(cr.created_at) as created_at
FROM chat_rooms cr
GROUP BY cr.customer_user_id, cr.customer_name
ON CONFLICT (line_user_id) 
DO UPDATE SET
  updated_at = NOW();

-- ============================================
-- STEP 6: สถิติและการตรวจสอบ
-- ============================================

-- จำนวนห้องแชท
SELECT 
  '📊 Chat Rooms' as metric,
  COUNT(*) as count,
  COUNT(CASE WHEN is_ai_enabled THEN 1 END) as ai_enabled,
  COUNT(CASE WHEN agent_user_id IS NOT NULL THEN 1 END) as has_agent
FROM chat_rooms;

-- จำนวนข้อความ
SELECT 
  '📊 Messages' as metric,
  COUNT(*) as total,
  COUNT(CASE WHEN sender_type = 'customer' THEN 1 END) as from_customer,
  COUNT(CASE WHEN sender_type = 'ai' THEN 1 END) as from_ai,
  COUNT(CASE WHEN sender_type = 'agent' THEN 1 END) as from_agent
FROM chat_messages;

-- ข้อความแต่ละประเภท
SELECT 
  message_type,
  COUNT(*) as count
FROM chat_messages
GROUP BY message_type
ORDER BY count DESC;

-- ห้องที่มีข้อความมากที่สุด
SELECT 
  cr.customer_name,
  cr.customer_user_id,
  COUNT(cm.id) as message_count,
  MAX(cm.created_at) as last_message,
  MIN(cm.created_at) as first_message
FROM chat_rooms cr
LEFT JOIN chat_messages cm ON cm.room_id = cr.id
GROUP BY cr.id, cr.customer_name, cr.customer_user_id
ORDER BY message_count DESC
LIMIT 10;

-- ข้อความล่าสุด
SELECT 
  cr.customer_name,
  cm.sender_type,
  cm.message_type,
  LEFT(cm.content, 60) as content_preview,
  cm.created_at
FROM chat_messages cm
JOIN chat_rooms cr ON cr.id = cm.room_id
ORDER BY cm.created_at DESC
LIMIT 20;

-- ============================================
-- STEP 7: ตรวจสอบข้อมูลที่มีปัญหา
-- ============================================

-- ข้อความที่ไม่มี room (ไม่ควรมี)
SELECT 
  '⚠️ Messages without room' as issue,
  COUNT(*) as count
FROM messages m
LEFT JOIN chat_rooms cr ON cr.customer_user_id = m.user_id
WHERE cr.id IS NULL
  AND m.user_id IS NOT NULL;

-- ห้องที่ไม่มีข้อความ
SELECT 
  '⚠️ Rooms without messages' as issue,
  COUNT(*) as count
FROM chat_rooms cr
LEFT JOIN chat_messages cm ON cm.room_id = cr.id
WHERE cm.id IS NULL;

-- ข้อความที่เป็นสลิป
SELECT 
  '💰 Payment Slips' as metric,
  COUNT(*) as count
FROM chat_messages
WHERE metadata->'original_metadata'->>'isSlip' = 'true'
   OR (message_type = 'image' 
       AND metadata->>'media_category' = 'payment_slip');

-- ============================================
-- หมายเหตุ
-- ============================================

/*
✅ ข้อมูลที่ Migrate แล้ว:
- Chat Rooms (จาก conversations)
- Chat Messages (จาก messages)
- Customers (จาก chat_rooms)

⚠️ ข้อมูลที่ยังไม่ได้ Migrate:
- LINE Profile (display_name, picture_url)
  → ต้องดึงจาก LINE API ด้วย sync-line-profiles.js

🔄 การ Sync แบบ Incremental:
เพิ่ม WHERE clause:
  AND m.created_at > (SELECT MAX(created_at) FROM chat_messages)

📝 ข้อมูลเพิ่มเติมที่มีใน metadata:
- Payment slip info (bank, amount, reference)
- Media info (duration, size, storage path)
- AI tokens (tokens_in, tokens_out)
- RAG info (ragFound, product_id, contextCount)

🚀 ขั้นตอนต่อไป:
1. Run script นี้ใน Supabase SQL Editor
2. Run: node sync-line-profiles.js
3. Refresh หน้าแชท
*/
