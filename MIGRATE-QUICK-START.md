# 🚀 Quick Start: Migrate ข้อมูล n8n → Chat System

## ✅ สถานการณ์

- ✅ n8n และ Web App ใช้ **Supabase เดียวกัน**
- ✅ ข้อมูลอยู่ในตาราง `messages` และ `conversations` แล้ว
- ✅ **ไม่ต้อง** ใช้ Foreign Data Wrapper
- ✅ **แค่ Query** ข้อมูลมา insert ใหม่

---

## 📋 ขั้นตอน (5 นาที)

### 1️⃣ Run SQL Script

```bash
# 1. เปิด Supabase SQL Editor
https://supabase.com/dashboard/project/YOUR_PROJECT/sql

# 2. Copy ทั้งหมดจาก migrate-n8n-to-chat.sql
# 3. Paste และกด Run
# 4. รอ 30 วินาที - 1 นาที
```

**ผลลัพธ์ที่คาดหวัง:**
```
✅ Inserted X rows into chat_rooms
✅ Inserted Y rows into chat_messages
✅ Updated last_message_at
✅ Created customers table
```

---

### 2️⃣ ตรวจสอบข้อมูล

```sql
-- ดูจำนวนห้องแชท
SELECT COUNT(*) FROM chat_rooms;

-- ดูจำนวนข้อความ
SELECT COUNT(*) FROM chat_messages;

-- ดูข้อความล่าสุด
SELECT 
  cr.customer_name,
  cm.sender_type,
  LEFT(cm.content, 50) as preview,
  cm.created_at
FROM chat_messages cm
JOIN chat_rooms cr ON cr.id = cm.room_id
ORDER BY cm.created_at DESC
LIMIT 10;
```

---

### 3️⃣ ดึง LINE Profile

```bash
# ติดตั้ง dependencies (ครั้งเดียว)
cd c:\n8n-local\sales-ai
npm install axios @supabase/supabase-js dotenv

# Run script
node sync-line-profiles.js
```

**ผลลัพธ์:**
```
🚀 Starting LINE Profile Sync...

📋 Found 3 chat rooms

🔄 Processing: Ua717abfa700124404c783316b2fb3e09
   ✅ Profile: นาย ทดสอบ
   ✅ Updated in Supabase

==================================================
📊 Summary:
   ✅ Success: 3
   ❌ Failed: 0
==================================================
```

---

### 4️⃣ Refresh หน้าแชท

```
http://localhost:3000/chat-v2
```

**คุณจะเห็น:**
- ✅ รายการห้องแชททั้งหมดจาก n8n
- ✅ ประวัติข้อความทั้งหมด
- ✅ ชื่อและรูปโปรไฟล์จริงจาก LINE
- ✅ ข้อความที่เป็นรูป/วิดีโอ/สลิป

---

## 📊 ข้อมูลที่ได้

### ตาราง `chat_rooms`
```sql
SELECT 
  customer_user_id,      -- LINE User ID
  customer_name,         -- ชื่อจาก LINE Profile
  customer_avatar,       -- รูปจาก LINE Profile
  is_ai_enabled,         -- เปิด AI (default: true)
  status,                -- active
  created_at,            -- เวลาเริ่มคุย
  last_message_at        -- เวลาข้อความล่าสุด
FROM chat_rooms
LIMIT 5;
```

### ตาราง `chat_messages`
```sql
SELECT 
  sender_type,           -- customer/ai/agent
  message_type,          -- text/image/video
  content,               -- เนื้อหาข้อความ
  media_url,             -- URL ของไฟล์
  metadata,              -- ข้อมูลเพิ่มเติม (payment slip, tokens, etc.)
  line_message_id,       -- ID จาก LINE
  created_at             -- เวลาส่ง
FROM chat_messages
ORDER BY created_at DESC
LIMIT 10;
```

### ตาราง `customers`
```sql
SELECT 
  line_user_id,          -- LINE User ID
  display_name,          -- ชื่อจาก LINE
  picture_url,           -- รูปโปรไฟล์
  status_message,        -- สถานะ LINE
  language               -- ภาษา
FROM customers
LIMIT 5;
```

---

## 🔄 Sync ข้อมูลใหม่

### วิธีที่ 1: Manual (เมื่อต้องการ)

```sql
-- เพิ่มเฉพาะข้อความใหม่
INSERT INTO chat_messages (...)
SELECT ...
FROM messages m
JOIN chat_rooms cr ON cr.customer_user_id = m.user_id
WHERE m.created_at > (SELECT MAX(created_at) FROM chat_messages)
  AND m.line_message_id IS NOT NULL
ON CONFLICT (line_message_id) DO NOTHING;
```

### วิธีที่ 2: Auto Sync (แนะนำ)

สร้าง **Database Trigger** ให้ sync อัตโนมัติ:

```sql
-- สร้าง function
CREATE OR REPLACE FUNCTION sync_message_to_chat()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert ข้อความใหม่เข้า chat_messages
  INSERT INTO chat_messages (
    room_id,
    sender_id,
    sender_type,
    message_type,
    content,
    media_url,
    metadata,
    line_message_id,
    status,
    created_at
  )
  SELECT 
    cr.id,
    NEW.user_id,
    CASE 
      WHEN NEW.role = 'user' THEN 'customer'::sender_type
      WHEN NEW.role = 'assistant' THEN 'ai'::sender_type
      ELSE 'agent'::sender_type
    END,
    COALESCE(NEW.message_type, 'text')::message_type,
    COALESCE(NEW.content, ''),
    COALESCE(NEW.media_url, NEW.line_media_url),
    jsonb_build_object(
      'original_metadata', NEW.metadata,
      'tokens_in', NEW.tokens_in,
      'tokens_out', NEW.tokens_out
    ),
    NEW.line_message_id,
    'sent'::message_status,
    NEW.created_at
  FROM chat_rooms cr
  WHERE cr.customer_user_id = NEW.user_id
  ON CONFLICT (line_message_id) DO NOTHING;
  
  -- อัปเดต last_message_at
  UPDATE chat_rooms
  SET last_message_at = NEW.created_at
  WHERE customer_user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger
CREATE TRIGGER sync_message_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION sync_message_to_chat();
```

**ผลลัพธ์:**
- ✅ เมื่อ n8n เพิ่มข้อความใหม่ใน `messages`
- ✅ Trigger จะ insert อัตโนมัติเข้า `chat_messages`
- ✅ อัปเดต `last_message_at` ใน `chat_rooms`
- ✅ **ไม่ต้อง sync manual อีก!**

---

## 🎯 ตัวอย่างข้อมูลที่ได้

### Sidebar
```
┌─────────────────────────────────┐
│ 🔍 ค้นหาการสนทนา...            │
├─────────────────────────────────┤
│ 📸 นาย ทดสอบ                    │
│ phonics chart ผู้ใหญ่เรียน...   │
│ [🤖 AI] 2 ชม.ที่แล้ว [25]      │
├─────────────────────────────────┤
│ 📸 คุณ สมชาย                    │
│ [รูปภาพ: สลิปโอนเงิน...]        │
│ [🤖 AI] 1 วันที่แล้ว [15]      │
├─────────────────────────────────┤
│ 📸 คุณ สมหญิง                   │
│ [วีดีโอ: วีดีโอแนะนำคอร์ส...]   │
│ [🤖 AI] 2 วันที่แล้ว [8]       │
└─────────────────────────────────┘
```

### Chat Window
```
┌─────────────────────────────────┐
│ 📸 นาย ทดสอบ [🤖 AI เปิด]       │
├─────────────────────────────────┤
│                                 │
│  phonics chart ผู้ใหญ่เรียน...  │
│  2 ชม.ที่แล้ว ✓✓                │
│                                 │
│         ยังไม่มีข้อมูลเกี่ยว...  │
│         2 ชม.ที่แล้ว ✓✓          │
│                                 │
│  [รูปภาพ: สลิปโอนเงิน]          │
│  💰 3,790.65 บาท                │
│  ธนาคาร: อิงเบรน                │
│  1 วันที่แล้ว ✓✓                │
│                                 │
│  [วีดีโอ: วีดีโอแนะนำคอร์ส]     │
│  ⏱️ 15 วินาที                   │
│  2 วันที่แล้ว ✓✓                │
│                                 │
├─────────────────────────────────┤
│ 📎 🖼️ 🎥 พิมพ์ข้อความ...    ➤ │
└─────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### ปัญหา: ไม่มีข้อมูลใน chat_rooms

**ตรวจสอบ:**
```sql
-- ดูข้อมูลใน conversations
SELECT COUNT(*) FROM conversations WHERE channel = 'line';

-- ถ้ามี แต่ไม่ได้ migrate
-- ลอง run STEP 1 ใน migrate-n8n-to-chat.sql อีกครั้ง
```

### ปัญหา: ไม่มีข้อความใน chat_messages

**ตรวจสอบ:**
```sql
-- ดูข้อมูลใน messages
SELECT COUNT(*) FROM messages WHERE user_id IS NOT NULL;

-- ตรวจสอบว่ามี room ไหม
SELECT COUNT(*) FROM chat_rooms;

-- ถ้ามี room แต่ไม่มีข้อความ
-- ลอง run STEP 2 ใน migrate-n8n-to-chat.sql อีกครั้ง
```

### ปัญหา: ชื่อยังเป็น "LINE User Uxxxxxx"

**วิธีแก้:**
```bash
# Run script ดึง LINE Profile
node sync-line-profiles.js
```

### ปัญหา: LINE API Error 401

**วิธีแก้:**
```bash
# ตรวจสอบ LINE_CHANNEL_ACCESS_TOKEN ใน .env
# ทดสอบ token
curl -X GET \
  'https://api.line.me/v2/bot/profile/Ua717abfa700124404c783316b2fb3e09' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## ✅ Checklist

- [ ] Run `migrate-n8n-to-chat.sql` ใน Supabase SQL Editor
- [ ] ตรวจสอบจำนวน chat_rooms และ chat_messages
- [ ] Run `node sync-line-profiles.js`
- [ ] Refresh หน้าแชท `http://localhost:3000/chat-v2`
- [ ] ทดสอบส่งข้อความ
- [ ] ทดสอบ AI Suggestion
- [ ] (Optional) สร้าง Trigger สำหรับ auto-sync

---

## 🎉 เสร็จแล้ว!

ตอนนี้คุณมี:
- ✅ ระบบแชทที่แสดงประวัติจาก n8n
- ✅ ชื่อและรูปโปรไฟล์จริงจาก LINE
- ✅ ข้อความทุกประเภท (text, image, video, payment slip)
- ✅ Metadata ครบถ้วน (tokens, RAG info, payment info)
- ✅ (Optional) Auto-sync เมื่อมีข้อความใหม่

---

**ต้องการความช่วยเหลือ?**
- ดู `IMPORT-N8N-GUIDE.md` สำหรับรายละเอียดเพิ่มเติม
- ดู `migrate-n8n-to-chat.sql` สำหรับ SQL queries
- ดู `sync-line-profiles.js` สำหรับ LINE Profile sync
