# 🔄 Sync Messages Trigger

## 📋 ภาพรวม

Trigger นี้จะซิงค์ข้อความจากตาราง `messages` (LINE) ไปยัง `chat_messages` และ `chat_rooms` อัตโนมัติ

```
LINE → n8n → messages (ตารางเดิม)
                ↓ (Trigger อัตโนมัติ)
          chat_messages + chat_rooms (ใช้ในเว็บ)
```

---

## ✅ ข้อดี

1. **Real-time** - ข้อความแสดงทันทีในเว็บ
2. **ไม่พลาด** - ทำงานทุก transaction
3. **ไม่ต้องแก้ n8n** - workflow เดิมใช้ได้เลย
4. **Performance** - ทำงานใน database โดยตรง
5. **ป้องกันซ้ำ** - เช็ค `line_message_id` ก่อน insert

---

## 🚀 การติดตั้ง

### 1. เปิด Supabase SQL Editor

```
https://supabase.com/dashboard/project/YOUR_PROJECT/sql
```

### 2. Copy SQL จากไฟล์

```bash
# เปิดไฟล์
c:\n8n-local\sales-ai\database\sync-messages-trigger.sql
```

### 3. Run SQL

1. Copy ทั้งหมด
2. Paste ใน SQL Editor
3. กด **Run** (Ctrl+Enter)

### 4. ตรวจสอบการติดตั้ง

```sql
-- ตรวจสอบ Function
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'sync_message_to_chat';

-- ตรวจสอบ Trigger
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_sync_message_to_chat';
```

**ผลลัพธ์ที่ควรได้:**
- Function: `sync_message_to_chat` (1 row)
- Trigger: `trigger_sync_message_to_chat` (enabled = 'O')

---

## 🧪 ทดสอบ

### 1. Insert ข้อความทดสอบ

```sql
-- สร้าง conversation ก่อน (ถ้ายังไม่มี)
INSERT INTO conversations (customer_id, channel, status)
SELECT id, 'line', 'active'
FROM customers
WHERE line_user_id = 'U1234567890'
LIMIT 1;

-- Insert ข้อความทดสอบ
INSERT INTO messages (
  conversation_id,
  user_id,
  role,
  message_type,
  content,
  created_at,
  line_message_id,
  metadata
) VALUES (
  (SELECT id FROM conversations WHERE customer_id = (SELECT id FROM customers WHERE line_user_id = 'U1234567890' LIMIT 1) LIMIT 1),
  'U1234567890',
  'user',
  'text',
  'สวัสดีครับ ทดสอบระบบ',
  NOW(),
  'test-message-001',
  '{"displayName": "ทดสอบ", "source": "line"}'::jsonb
);
```

### 2. ตรวจสอบผลลัพธ์

```sql
-- ตรวจสอบ chat_rooms
SELECT * FROM chat_rooms 
WHERE customer_user_id = 'U1234567890';

-- ตรวจสอบ chat_messages
SELECT * FROM chat_messages 
WHERE sender_id = 'U1234567890'
ORDER BY created_at DESC;
```

**ควรเห็น:**
- ✅ มี room ใหม่ใน `chat_rooms`
- ✅ มีข้อความใน `chat_messages`
- ✅ `metadata` มี `line_message_id`

### 3. ทดสอบป้องกันซ้ำ

```sql
-- Insert ข้อความเดิมอีกครั้ง
INSERT INTO messages (
  line_user_id,
  line_message_id,
  direction,
  message_type,
  content,
  created_at
) VALUES (
  'U1234567890',
  'test-message-001', -- ← line_message_id เดิม
  'incoming',
  'text',
  'ข้อความซ้ำ',
  NOW()
);

-- ตรวจสอบว่าไม่มีข้อความซ้ำ
SELECT COUNT(*) FROM chat_messages 
WHERE metadata->>'line_message_id' = 'test-message-001';
-- ควรได้ 1 (ไม่ซ้ำ)
```

---

## 📊 Monitoring

### ดูสถิติการซิงค์

```sql
-- จำนวนข้อความที่ซิงค์
SELECT 
  COUNT(*) as total_synced_messages,
  COUNT(DISTINCT room_id) as total_rooms,
  MIN(created_at) as first_sync,
  MAX(created_at) as last_sync
FROM chat_messages
WHERE metadata->>'original_table' = 'messages';
```

### ดู Logs

```sql
-- ดู function calls
SELECT 
  funcname,
  calls,
  total_time,
  self_time
FROM pg_stat_user_functions 
WHERE funcname = 'sync_message_to_chat';
```

### ดูข้อความที่ยังไม่ซิงค์

```sql
-- ข้อความใน messages ที่ยังไม่มีใน chat_messages
SELECT m.*
FROM messages m
LEFT JOIN chat_messages cm 
  ON cm.metadata->>'line_message_id' = m.line_message_id::text
WHERE cm.id IS NULL
ORDER BY m.created_at DESC
LIMIT 10;
```

---

## 🔧 การจัดการ

### ปิด Trigger ชั่วคราว

```sql
ALTER TABLE messages DISABLE TRIGGER trigger_sync_message_to_chat;
```

### เปิด Trigger

```sql
ALTER TABLE messages ENABLE TRIGGER trigger_sync_message_to_chat;
```

### ลบ Trigger

```sql
DROP TRIGGER IF EXISTS trigger_sync_message_to_chat ON messages;
DROP FUNCTION IF EXISTS sync_message_to_chat();
```

---

## 🐛 Troubleshooting

### ปัญหา: Trigger ไม่ทำงาน

**ตรวจสอบ:**
```sql
-- 1. Trigger เปิดอยู่หรือไม่
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_sync_message_to_chat';
-- tgenabled ควรเป็น 'O' (enabled)

-- 2. ดู logs
SELECT * FROM pg_stat_user_functions 
WHERE funcname = 'sync_message_to_chat';
-- calls ควรเพิ่มขึ้นเมื่อมีข้อความใหม่
```

### ปัญหา: ข้อความซ้ำ

**แก้ไข:**
```sql
-- ลบข้อความซ้ำ
DELETE FROM chat_messages
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
      ROW_NUMBER() OVER (
        PARTITION BY metadata->>'line_message_id' 
        ORDER BY created_at
      ) as rn
    FROM chat_messages
    WHERE metadata->>'line_message_id' IS NOT NULL
  ) t
  WHERE t.rn > 1
);
```

### ปัญหา: Room ไม่ถูกสร้าง

**ตรวจสอบ:**
```sql
-- ดู error logs
SELECT * FROM pg_stat_activity 
WHERE query LIKE '%sync_message_to_chat%';
```

---

## 📈 Performance

### Index ที่แนะนำ

```sql
-- Index สำหรับ line_message_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_line_message_id 
ON chat_messages ((metadata->>'line_message_id'));

-- Index สำหรับ customer_user_id
CREATE INDEX IF NOT EXISTS idx_chat_rooms_customer_user_id 
ON chat_rooms (customer_user_id);

-- Index สำหรับ room_id + created_at
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created 
ON chat_messages (room_id, created_at DESC);
```

---

## 🔄 Migration (ซิงค์ข้อมูลเก่า)

ถ้ามีข้อความเก่าในตาราง `messages` ที่ยังไม่ได้ซิงค์:

```sql
-- ซิงค์ข้อความเก่าทั้งหมด
INSERT INTO chat_messages (
  room_id,
  sender_id,
  sender_type,
  message_type,
  content,
  media_url,
  status,
  created_at,
  metadata
)
SELECT 
  COALESCE(
    (SELECT id FROM chat_rooms WHERE customer_user_id = m.line_user_id LIMIT 1),
    -- สร้าง room ใหม่ถ้าไม่มี
    (INSERT INTO chat_rooms (customer_user_id, status, is_ai_enabled, last_message_at, created_at)
     VALUES (m.line_user_id, 'active', true, m.created_at, m.created_at)
     RETURNING id)
  ) as room_id,
  m.line_user_id as sender_id,
  CASE WHEN m.direction = 'incoming' THEN 'customer' ELSE 'agent' END as sender_type,
  COALESCE(m.message_type, 'text') as message_type,
  m.content,
  m.media_url,
  'delivered' as status,
  m.created_at,
  jsonb_build_object(
    'line_message_id', m.line_message_id,
    'original_table', 'messages',
    'migrated_at', NOW()
  ) as metadata
FROM messages m
LEFT JOIN chat_messages cm 
  ON cm.metadata->>'line_message_id' = m.line_message_id::text
WHERE cm.id IS NULL
ORDER BY m.created_at;
```

---

## 📞 Support

หากมีปัญหา:
1. ตรวจสอบ logs ใน Supabase Dashboard
2. ดู error messages ใน SQL Editor
3. ทดสอบด้วยข้อความใหม่

---

## 📝 Changelog

### v1.0.0 (2025-10-30)
- ✅ สร้าง trigger แรก
- ✅ รองรับ text, image, video, audio, file, sticker
- ✅ ป้องกันข้อความซ้ำ
- ✅ Auto-create chat_rooms
- ✅ Sync customer name & avatar
