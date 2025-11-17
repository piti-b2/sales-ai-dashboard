# 📥 คู่มือ Import ข้อมูลจาก n8n → Supabase

## 🎯 ภาพรวม

Import ประวัติการสนทนาจาก n8n database (ตาราง `messages`) เข้าสู่ระบบแชทใหม่ใน Supabase

---

## 📊 โครงสร้างข้อมูล n8n

### ตารางที่เกี่ยวข้อง:

1. **`messages`** - ประวัติแชทระหว่างลูกค้าและ AI
   - `user_id` - LINE User ID
   - `role` - user/assistant/agent
   - `content` - เนื้อหาข้อความ
   - `message_type` - text/image/video
   - `line_message_id` - ID จาก LINE

2. **`conversations`** - คีย์การคุย
   - `user_id` - LINE User ID
   - `started_at` - เวลาเริ่มคุย
   - `last_activity_at` - เวลาล่าสุด

3. **`payment_slips`** - สลิปการโอนเงิน
4. **`line_pauses`** - เวลาหยุด AI
5. **`line_admin_alerts`** - ระบบแจ้งเตือน

---

## 🚀 วิธีการ Import

### วิธีที่ 1: ใช้ Foreign Data Wrapper (แนะนำ)

**ข้อดี:**
- ✅ Query ข้อมูลจาก n8n แบบ real-time
- ✅ ไม่ต้อง export/import
- ✅ สามารถ sync ได้ต่อเนื่อง

**ขั้นตอน:**

#### 1. เปิด Supabase SQL Editor

#### 2. แก้ไข Connection String

```sql
-- แก้ไขใน import-from-n8n.sql
CREATE SERVER IF NOT EXISTS n8n_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host 'localhost',      -- ⚠️ แก้เป็น host ของ n8n
    port '5432',           -- ⚠️ แก้เป็น port ของ n8n
    dbname 'n8n'          -- ⚠️ แก้เป็นชื่อ database
  );

CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER
  SERVER n8n_server
  OPTIONS (
    user 'postgres',       -- ⚠️ แก้เป็น username
    password 'your_password'  -- ⚠️ แก้เป็น password
  );
```

#### 3. Run SQL Script

```bash
# Copy ไฟล์ import-from-n8n.sql
# Paste ใน Supabase SQL Editor
# กด Run
```

#### 4. ตรวจสอบผลลัพธ์

```sql
-- ดูจำนวนห้องแชท
SELECT COUNT(*) FROM chat_rooms;

-- ดูจำนวนข้อความ
SELECT COUNT(*) FROM chat_messages;

-- ดูข้อความล่าสุด
SELECT 
  cr.customer_name,
  cm.content,
  cm.created_at
FROM chat_messages cm
JOIN chat_rooms cr ON cr.id = cm.room_id
ORDER BY cm.created_at DESC
LIMIT 10;
```

---

### วิธีที่ 2: Export/Import ผ่าน CSV

**ใช้เมื่อ:**
- n8n อยู่คนละ server
- ไม่สามารถเชื่อมต่อ database โดยตรง

#### 1. Export จาก n8n

```bash
# Connect to n8n database
psql -h localhost -U postgres -d n8n

# Export conversations
\copy (
  SELECT 
    id,
    user_id,
    channel,
    product_id,
    started_at,
    last_activity_at
  FROM conversations
  WHERE channel = 'line'
) TO '/tmp/conversations.csv' WITH CSV HEADER;

# Export messages
\copy (
  SELECT 
    id,
    conversation_id,
    user_id,
    role,
    content,
    message_type,
    line_message_id,
    media_url,
    media_type,
    metadata,
    created_at
  FROM messages
  WHERE user_id LIKE 'U%'
  ORDER BY created_at ASC
) TO '/tmp/messages.csv' WITH CSV HEADER;
```

#### 2. Import เข้า Supabase

```sql
-- สร้างตารางชั่วคราว
CREATE TEMP TABLE temp_conversations (
  id UUID,
  user_id TEXT,
  channel TEXT,
  product_id TEXT,
  started_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ
);

CREATE TEMP TABLE temp_messages (
  id UUID,
  conversation_id UUID,
  user_id TEXT,
  role TEXT,
  content TEXT,
  message_type TEXT,
  line_message_id TEXT,
  media_url TEXT,
  media_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
);

-- Import CSV (ใน Supabase SQL Editor ไม่รองรับ \copy)
-- ต้องใช้ psql หรือ upload ผ่าน Supabase Storage

-- สร้างห้องแชท
INSERT INTO chat_rooms (
  customer_user_id,
  status,
  is_ai_enabled,
  created_at,
  last_message_at,
  customer_name
)
SELECT 
  user_id,
  'active',
  true,
  started_at,
  last_activity_at,
  'LINE User ' || SUBSTRING(user_id, 1, 8)
FROM temp_conversations
ON CONFLICT (customer_user_id) DO NOTHING;

-- Import ข้อความ
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
  cr.id,
  tm.user_id,
  CASE 
    WHEN tm.role = 'user' THEN 'customer'::sender_type
    WHEN tm.role = 'assistant' THEN 'ai'::sender_type
    ELSE 'agent'::sender_type
  END,
  COALESCE(tm.message_type, 'text')::message_type,
  tm.content,
  tm.media_url,
  tm.media_type,
  tm.metadata,
  tm.line_message_id,
  'read'::message_status,
  tm.created_at
FROM temp_messages tm
JOIN chat_rooms cr ON cr.customer_user_id = tm.user_id
WHERE tm.content IS NOT NULL
ORDER BY tm.created_at ASC
ON CONFLICT (line_message_id) DO NOTHING;
```

---

## 👤 ดึง LINE Profile

หลังจาก import ข้อความแล้ว ต้องดึง profile จาก LINE API

### วิธีที่ 1: ใช้ Node.js Script (แนะนำ)

```bash
# ติดตั้ง dependencies
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
🔄 Processing: U3482fb64ff02dfc8dee63fb5402d13bd
   ✅ Profile: คุณ สมชาย
   ✅ Updated in Supabase

==================================================
📊 Summary:
   ✅ Success: 2
   ❌ Failed: 0
   📝 Total: 2
==================================================

✅ Sync completed!
```

### วิธีที่ 2: ใช้ n8n Workflow

สร้าง workflow ใหม่:

```
[Schedule Trigger: ทุก 1 ชั่วโมง]
    ↓
[Supabase: Get Chat Rooms]
    ↓
[Loop: For Each Room]
    ↓
[HTTP Request: LINE Profile API]
  URL: https://api.line.me/v2/bot/profile/{{$json.customer_user_id}}
  Headers: Authorization: Bearer {{$env.LINE_CHANNEL_ACCESS_TOKEN}}
    ↓
[Supabase: Update Chat Room]
  customer_name: {{$json.displayName}}
  customer_avatar: {{$json.pictureUrl}}
    ↓
[Supabase: Upsert Customer]
```

### วิธีที่ 3: Manual SQL (สำหรับทดสอบ)

```sql
-- ใช้ Supabase Edge Function หรือ API Route
-- ตัวอย่าง: app/api/sync-profiles/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ดึงรายการ user_id
  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('customer_user_id');

  const results = [];

  for (const room of rooms || []) {
    // เรียก LINE API
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${room.customer_user_id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );

    if (response.ok) {
      const profile = await response.json();

      // อัปเดต Supabase
      await supabase
        .from('chat_rooms')
        .update({
          customer_name: profile.displayName,
          customer_avatar: profile.pictureUrl
        })
        .eq('customer_user_id', room.customer_user_id);

      results.push({ userId: room.customer_user_id, success: true });
    }
  }

  return NextResponse.json({ results });
}
```

---

## 🔍 ตรวจสอบข้อมูล

### 1. ดูจำนวนข้อมูลที่ import

```sql
-- จำนวนห้องแชท
SELECT 
  status,
  is_ai_enabled,
  COUNT(*) as count
FROM chat_rooms
GROUP BY status, is_ai_enabled;

-- จำนวนข้อความแต่ละประเภท
SELECT 
  sender_type,
  message_type,
  COUNT(*) as count
FROM chat_messages
GROUP BY sender_type, message_type
ORDER BY count DESC;

-- ห้องที่มีข้อความมากที่สุด
SELECT 
  cr.customer_name,
  cr.customer_user_id,
  COUNT(cm.id) as message_count,
  MAX(cm.created_at) as last_message
FROM chat_rooms cr
LEFT JOIN chat_messages cm ON cm.room_id = cr.id
GROUP BY cr.id, cr.customer_name, cr.customer_user_id
ORDER BY message_count DESC
LIMIT 10;
```

### 2. ตรวจสอบข้อความที่มีปัญหา

```sql
-- ข้อความที่ไม่มี content
SELECT COUNT(*) 
FROM chat_messages 
WHERE content IS NULL OR content = '';

-- ข้อความที่มี media
SELECT 
  message_type,
  media_type,
  COUNT(*) as count
FROM chat_messages
WHERE media_url IS NOT NULL
GROUP BY message_type, media_type;

-- ข้อความที่เป็นสลิป
SELECT 
  cm.content,
  cm.metadata->>'bank' as bank,
  cm.metadata->>'amount' as amount,
  cm.created_at
FROM chat_messages cm
WHERE cm.metadata->>'isSlip' = 'true'
ORDER BY cm.created_at DESC;
```

---

## 🐛 Troubleshooting

### ปัญหา 1: ไม่สามารถเชื่อมต่อ n8n database

**สาเหตุ:**
- Host/Port ไม่ถูกต้อง
- Firewall block
- Username/Password ผิด

**วิธีแก้:**

```bash
# ทดสอบ connection
psql -h localhost -p 5432 -U postgres -d n8n

# ถ้าเชื่อมต่อได้ แสดงว่า connection string ถูกต้อง
```

### ปัญหา 2: Foreign Table ไม่มีข้อมูล

**ตรวจสอบ:**

```sql
-- ดูข้อมูลจาก foreign table
SELECT * FROM n8n_messages LIMIT 5;

-- ถ้า error ให้ตรวจสอบ table name
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';
```

### ปัญหา 3: LINE API Error 401

**สาเหตุ:**
- `LINE_CHANNEL_ACCESS_TOKEN` ไม่ถูกต้อง
- Token หมดอายุ

**วิธีแก้:**

```bash
# ทดสอบ token
curl -X GET \
  'https://api.line.me/v2/bot/profile/Ua717abfa700124404c783316b2fb3e09' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# ถ้า error ให้ไปสร้าง token ใหม่ที่ LINE Developer Console
```

### ปัญหา 4: Duplicate Messages

**สาเหตุ:**
- Run import script หลายครั้ง
- `line_message_id` ซ้ำ

**วิธีแก้:**

```sql
-- ลบข้อความซ้ำ
DELETE FROM chat_messages
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY line_message_id 
             ORDER BY created_at
           ) as rn
    FROM chat_messages
    WHERE line_message_id IS NOT NULL
  ) t
  WHERE t.rn > 1
);
```

---

## 📝 Checklist

### ก่อน Import:
- [ ] Backup Supabase database
- [ ] ทดสอบ connection ไปยัง n8n database
- [ ] ตรวจสอบ LINE_CHANNEL_ACCESS_TOKEN
- [ ] ตรวจสอบจำนวนข้อมูลใน n8n

### หลัง Import:
- [ ] ตรวจสอบจำนวนห้องแชท
- [ ] ตรวจสอบจำนวนข้อความ
- [ ] ดึง LINE Profile
- [ ] ทดสอบส่งข้อความ
- [ ] ทดสอบ AI Suggestion

---

## 🚀 ขั้นตอนต่อไป

1. **Setup Auto Sync**
   - สร้าง cron job เพื่อ sync ข้อความใหม่
   - ใช้ n8n workflow หรือ Supabase Edge Function

2. **Import Payment Slips**
   - Link ข้อความที่เป็นสลิปกับตาราง payment_slips
   - แสดงสถานะการชำระเงินในแชท

3. **Import Line Pauses**
   - แสดงประวัติการหยุด AI
   - แสดงว่าใครเป็นคนหยุด

4. **Analytics Dashboard**
   - สร้างหน้า dashboard แสดงสถิติ
   - จำนวนข้อความต่อวัน
   - Response time
   - AI vs Human response

---

## 📞 ต้องการความช่วยเหลือ?

ถ้ามีปัญหาหรือข้อสงสัย กรุณาแจ้ง:
1. Error message ที่เจอ
2. ขั้นตอนที่ทำไปแล้ว
3. ผลลัพธ์ที่ได้
