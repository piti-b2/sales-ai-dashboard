-- ============================================
-- Import LINE Chat History to Supabase
-- ============================================

-- สคริปต์นี้จะ import ประวัติแชทจาก LINE/n8n เข้าสู่ระบบแชทใหม่

-- ============================================
-- 1. สร้างห้องแชทจาก LINE Users ที่เคยคุยไว้
-- ============================================

-- ถ้าคุณมีตาราง LINE users/conversations ใน n8n database
-- ให้ปรับ query นี้ตามโครงสร้างจริง

-- ตัวอย่าง: ถ้ามีตาราง line_conversations
/*
INSERT INTO chat_rooms (customer_user_id, agent_user_id, status, is_ai_enabled, created_at, last_message_at)
SELECT 
  user_id as customer_user_id,
  'agent@example.com' as agent_user_id,
  'active' as status,
  true as is_ai_enabled,
  MIN(created_at) as created_at,
  MAX(created_at) as last_message_at
FROM line_conversations
GROUP BY user_id
ON CONFLICT (customer_user_id) DO NOTHING;
*/

-- ============================================
-- 2. Import ข้อความจาก LINE History
-- ============================================

-- ตัวอย่าง: ถ้ามีตาราง line_messages
/*
INSERT INTO chat_messages (
  room_id,
  sender_id,
  sender_type,
  message_type,
  content,
  line_message_id,
  status,
  created_at
)
SELECT 
  cr.id as room_id,
  CASE 
    WHEN lm.direction = 'incoming' THEN lm.user_id
    ELSE 'agent@example.com'
  END as sender_id,
  CASE 
    WHEN lm.direction = 'incoming' THEN 'customer'
    ELSE 'agent'
  END as sender_type,
  COALESCE(lm.message_type, 'text') as message_type,
  lm.text as content,
  lm.message_id as line_message_id,
  'read' as status,
  lm.created_at
FROM line_messages lm
JOIN chat_rooms cr ON cr.customer_user_id = lm.user_id
ORDER BY lm.created_at ASC;
*/

-- ============================================
-- 3. สร้าง Sample Data เพิ่มเติม (สำหรับทดสอบ)
-- ============================================

-- สร้างห้องแชททดสอบเพิ่ม
INSERT INTO chat_rooms (customer_user_id, agent_user_id, status, is_ai_enabled, created_at, last_message_at)
VALUES 
  ('U1111111111111111', 'agent@example.com', 'active', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 hour'),
  ('U2222222222222222', 'agent@example.com', 'active', false, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours'),
  ('U3333333333333333', NULL, 'active', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '30 minutes'),
  ('U4444444444444444', 'agent@example.com', 'active', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 minutes'),
  ('U5555555555555555', 'agent@example.com', 'closed', false, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days')
ON CONFLICT (customer_user_id) DO NOTHING;

-- สร้างข้อความตัวอย่าง
DO $$
DECLARE
  room1_id UUID;
  room2_id UUID;
  room3_id UUID;
  room4_id UUID;
BEGIN
  -- ดึง room IDs
  SELECT id INTO room1_id FROM chat_rooms WHERE customer_user_id = 'U1111111111111111';
  SELECT id INTO room2_id FROM chat_rooms WHERE customer_user_id = 'U2222222222222222';
  SELECT id INTO room3_id FROM chat_rooms WHERE customer_user_id = 'U3333333333333333';
  SELECT id INTO room4_id FROM chat_rooms WHERE customer_user_id = 'U4444444444444444';

  -- ห้องที่ 1: บทสนทนาเกี่ยวกับคอร์สเรียน
  IF room1_id IS NOT NULL THEN
    INSERT INTO chat_messages (room_id, sender_id, sender_type, message_type, content, status, created_at) VALUES
    (room1_id, 'U1111111111111111', 'customer', 'text', 'สวัสดีครับ', 'read', NOW() - INTERVAL '5 days'),
    (room1_id, 'agent@example.com', 'agent', 'text', 'สวัสดีค่ะ ยินดีให้บริการค่ะ', 'read', NOW() - INTERVAL '5 days' + INTERVAL '1 minute'),
    (room1_id, 'U1111111111111111', 'customer', 'text', 'อยากสอบถามเรื่องคอร์สเรียนครับ', 'read', NOW() - INTERVAL '5 days' + INTERVAL '2 minutes'),
    (room1_id, 'agent@example.com', 'agent', 'text', 'ได้เลยค่ะ อยากทราบข้อมูลคอร์สไหนคะ', 'read', NOW() - INTERVAL '5 days' + INTERVAL '3 minutes'),
    (room1_id, 'U1111111111111111', 'customer', 'text', 'คอร์สคณิตศาสตร์ ม.3 มีไหมครับ', 'read', NOW() - INTERVAL '5 days' + INTERVAL '5 minutes'),
    (room1_id, 'agent@example.com', 'ai', 'text', 'มีค่ะ คอร์สคณิตศาสตร์ ม.3 ของเรามี 2 แบบค่ะ\n1. คอร์สปกติ 8 สัปดาห์ ราคา 3,500 บาท\n2. คอร์สเข้มข้น 4 สัปดาห์ ราคา 4,500 บาท', 'read', NOW() - INTERVAL '5 days' + INTERVAL '6 minutes'),
    (room1_id, 'U1111111111111111', 'customer', 'text', 'ขอดูรายละเอียดคอร์สปกติหน่อยครับ', 'read', NOW() - INTERVAL '4 days'),
    (room1_id, 'agent@example.com', 'agent', 'text', 'ได้เลยค่ะ รอสักครู่นะคะ', 'read', NOW() - INTERVAL '4 days' + INTERVAL '30 seconds'),
    (room1_id, 'U1111111111111111', 'customer', 'text', 'ขอบคุณครับ', 'read', NOW() - INTERVAL '1 hour');
  END IF;

  -- ห้องที่ 2: บทสนทนาเกี่ยวกับการชำระเงิน
  IF room2_id IS NOT NULL THEN
    INSERT INTO chat_messages (room_id, sender_id, sender_type, message_type, content, status, created_at) VALUES
    (room2_id, 'U2222222222222222', 'customer', 'text', 'สวัสดีค่ะ', 'read', NOW() - INTERVAL '3 days'),
    (room2_id, 'agent@example.com', 'agent', 'text', 'สวัสดีค่ะ', 'read', NOW() - INTERVAL '3 days' + INTERVAL '30 seconds'),
    (room2_id, 'U2222222222222222', 'customer', 'text', 'โอนเงินแล้วค่ะ', 'read', NOW() - INTERVAL '3 days' + INTERVAL '1 minute'),
    (room2_id, 'U2222222222222222', 'customer', 'image', 'สลิปการโอนเงิน', 'read', NOW() - INTERVAL '3 days' + INTERVAL '2 minutes'),
    (room2_id, 'agent@example.com', 'agent', 'text', 'ขอบคุณค่ะ รอตรวจสอบสักครู่นะคะ', 'read', NOW() - INTERVAL '3 days' + INTERVAL '3 minutes'),
    (room2_id, 'agent@example.com', 'agent', 'text', 'ตรวจสอบแล้วค่ะ ได้รับเงินเรียบร้อยค่ะ ขอบคุณมากค่ะ', 'read', NOW() - INTERVAL '3 days' + INTERVAL '10 minutes'),
    (room2_id, 'U2222222222222222', 'customer', 'text', 'เมื่อไหร่จะได้เข้าเรียนคะ', 'read', NOW() - INTERVAL '2 hours'),
    (room2_id, 'agent@example.com', 'agent', 'text', 'จะส่ง link เข้าเรียนให้ภายในวันนี้ค่ะ', 'delivered', NOW() - INTERVAL '2 hours' + INTERVAL '5 minutes');
  END IF;

  -- ห้องที่ 3: ลูกค้าใหม่ถามข้อมูล
  IF room3_id IS NOT NULL THEN
    INSERT INTO chat_messages (room_id, sender_id, sender_type, message_type, content, status, created_at) VALUES
    (room3_id, 'U3333333333333333', 'customer', 'text', 'สวัสดีครับ', 'read', NOW() - INTERVAL '2 days'),
    (room3_id, 'agent@example.com', 'ai', 'text', 'สวัสดีครับ ยินดีให้บริการครับ มีอะไรให้ช่วยไหมครับ', 'read', NOW() - INTERVAL '2 days' + INTERVAL '10 seconds'),
    (room3_id, 'U3333333333333333', 'customer', 'text', 'มีคอร์สภาษาอังกฤษไหมครับ', 'read', NOW() - INTERVAL '2 days' + INTERVAL '1 minute'),
    (room3_id, 'agent@example.com', 'ai', 'text', 'มีครับ เรามีคอร์สภาษาอังกฤษหลายระดับค่ะ\n- ระดับเริ่มต้น\n- ระดับกลาง\n- ระดับสูง\n\nสนใจระดับไหนครับ', 'read', NOW() - INTERVAL '2 days' + INTERVAL '2 minutes'),
    (room3_id, 'U3333333333333333', 'customer', 'text', 'ระดับกลางครับ', 'read', NOW() - INTERVAL '30 minutes'),
    (room3_id, 'agent@example.com', 'ai', 'text', 'คอร์สภาษาอังกฤษระดับกลางของเรา เหมาะสำหรับผู้ที่มีพื้นฐานอยู่แล้วครับ\nราคา 4,000 บาท ระยะเวลา 10 สัปดาห์\nสนใจไหมครับ', 'delivered', NOW() - INTERVAL '30 minutes' + INTERVAL '30 seconds');
  END IF;

  -- ห้องที่ 4: บทสนทนาล่าสุด
  IF room4_id IS NOT NULL THEN
    INSERT INTO chat_messages (room_id, sender_id, sender_type, message_type, content, status, created_at) VALUES
    (room4_id, 'U4444444444444444', 'customer', 'text', 'สวัสดีค่ะ', 'read', NOW() - INTERVAL '1 day'),
    (room4_id, 'agent@example.com', 'ai', 'text', 'สวัสดีค่ะ', 'read', NOW() - INTERVAL '1 day' + INTERVAL '5 seconds'),
    (room4_id, 'U4444444444444444', 'customer', 'text', 'ตารางเรียนออกแล้วหรือยังคะ', 'read', NOW() - INTERVAL '5 minutes'),
    (room4_id, 'agent@example.com', 'agent', 'text', 'ออกแล้วค่ะ กำลังส่งให้ค่ะ', 'sent', NOW() - INTERVAL '4 minutes');
  END IF;

  -- อัปเดต last_message_at
  UPDATE chat_rooms SET last_message_at = NOW() - INTERVAL '1 hour' WHERE id = room1_id;
  UPDATE chat_rooms SET last_message_at = NOW() - INTERVAL '2 hours' WHERE id = room2_id;
  UPDATE chat_rooms SET last_message_at = NOW() - INTERVAL '30 minutes' WHERE id = room3_id;
  UPDATE chat_rooms SET last_message_at = NOW() - INTERVAL '4 minutes' WHERE id = room4_id;
END $$;

-- ============================================
-- 4. ตรวจสอบผลลัพธ์
-- ============================================

-- ดูจำนวนห้องแชท
SELECT 
  status,
  is_ai_enabled,
  COUNT(*) as room_count
FROM chat_rooms
GROUP BY status, is_ai_enabled;

-- ดูจำนวนข้อความในแต่ละห้อง
SELECT 
  cr.customer_user_id,
  COUNT(cm.id) as message_count,
  MAX(cm.created_at) as last_message
FROM chat_rooms cr
LEFT JOIN chat_messages cm ON cm.room_id = cr.id
GROUP BY cr.id, cr.customer_user_id
ORDER BY last_message DESC;

-- ============================================
-- 5. วิธีใช้งาน
-- ============================================

/*
ถ้าต้องการ import จาก n8n database จริง:

1. เชื่อมต่อ n8n database:
   - ถ้า n8n ใช้ PostgreSQL เดียวกัน สามารถใช้ postgres_fdw
   - หรือ export เป็น CSV แล้ว import

2. ตัวอย่างการใช้ postgres_fdw:

-- สร้าง foreign data wrapper
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- สร้าง server connection
CREATE SERVER n8n_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'localhost', port '5432', dbname 'n8n');

-- สร้าง user mapping
CREATE USER MAPPING FOR CURRENT_USER
  SERVER n8n_server
  OPTIONS (user 'n8n_user', password 'n8n_password');

-- สร้าง foreign table
CREATE FOREIGN TABLE n8n_executions (
  id INT,
  workflow_id VARCHAR,
  data JSONB,
  finished_at TIMESTAMP
)
SERVER n8n_server
OPTIONS (schema_name 'public', table_name 'execution_entity');

-- Query ข้อมูล LINE จาก n8n
SELECT 
  data->'webhook'->'body'->'events'->0->'source'->>'userId' as user_id,
  data->'webhook'->'body'->'events'->0->'message'->>'text' as message_text,
  data->'webhook'->'body'->'events'->0->'message'->>'type' as message_type,
  finished_at as created_at
FROM n8n_executions
WHERE workflow_id = 'your_line_workflow_id'
  AND data->'webhook'->'body'->'events'->0->'type' = '"message"'
ORDER BY finished_at DESC;

3. หรือ export จาก n8n เป็น CSV:
   - Export execution data จาก n8n
   - ใช้ COPY command import เข้า Supabase
*/
