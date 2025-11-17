# 🔧 แก้ไข Migration Error

## ❌ Error ที่เจอ

### Error 1: customer_name
```
ERROR: 42703: column "customer_name" of relation "chat_rooms" does not exist
LINE 8: customer_name,
```

### Error 2: line_message_id
```
ERROR: 42703: column "line_message_id" of relation "chat_messages" does not exist
LINE 14: line_message_id,
```

### Error 3: sender_type ENUM
```
ERROR: 42704: type "sender_type" does not exist
LINE 19: WHEN m.role = 'user' THEN 'customer'::sender_type
```

### Error 4: display_name
```
ERROR: 42703: column "display_name" of relation "customers" does not exist
LINE 7: display_name,
```

### Error 5: full_name NOT NULL
```
ERROR: 23502: null value in column "full_name" of relation "customers" violates not-null constraint
DETAIL: Failing row contains (..., null, ...)
```

### Error 6: JSONB operator
```
ERROR: 42883: operator does not exist: text ->> unknown
LINE 27: WHERE metadata->>'original_metadata'->>'isSlip' = 'true'
HINT: No operator matches the given name and argument types.
```

## 🎯 สาเหตุ

**ตาราง `chat_rooms` ยังไม่มีคอลัมน์:**
- `customer_name` - ชื่อลูกค้า
- `customer_avatar` - รูปโปรไฟล์
- **unique constraint** สำหรับ `customer_user_id`

**ตาราง `chat_messages` ยังไม่มีคอลัมน์:**
- `line_message_id` - LINE Message ID (สำหรับป้องกันข้อความซ้ำ)
- **unique constraint** สำหรับ `line_message_id`

**SQL Script ใช้ ENUM type ผิด:**
- `supabase-schema.sql` ใช้ **TEXT** type
- `migrate-n8n-to-chat.sql` พยายาม cast เป็น **ENUM** (`::sender_type`, `::message_type`)
- ต้องลบ type casting ออก

**ตาราง `customers` มีอยู่แล้วแต่โครงสร้างไม่ตรง:**
- ตาราง `customers` ที่มีอยู่ไม่มีคอลัมน์ `display_name`
- แต่มีคอลัมน์ `full_name` ที่เป็น **NOT NULL** (ต้องมีค่า)
- Script Version 2 ไม่ได้ใส่ `full_name` → เกิด NULL constraint error
- ต้องแก้ไขให้ใส่ `full_name` จาก `chat_rooms.customer_name`

**JSONB operator ใช้ผิด:**
- `metadata->>'original_metadata'` ได้ **TEXT** ออกมา
- พยายาม `->>` อีกครั้ง → ERROR (TEXT ไม่มี operator `->>`)
- ต้องใช้ `->` (ได้ JSONB) สำหรับ level แรก แล้วค่อย `->>` (ได้ TEXT) สำหรับ level สุดท้าย

---

## ✅ วิธีแก้ไข

### ขั้นตอนที่ 1: เพิ่มคอลัมน์

**Run SQL:**

```sql
-- Copy จาก add-customer-columns.sql
-- Paste ใน Supabase SQL Editor
-- กด Run
```

หรือ Copy โค้ดนี้:

```sql
-- เพิ่มคอลัมน์ใน chat_rooms
ALTER TABLE chat_rooms 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_avatar TEXT;

-- เพิ่มคอลัมน์ใน chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS line_message_id TEXT;

-- เพิ่ม unique constraints
DO $$ 
BEGIN
  -- chat_rooms
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_rooms_customer_user_id_key'
  ) THEN
    ALTER TABLE chat_rooms 
    ADD CONSTRAINT chat_rooms_customer_user_id_key 
    UNIQUE (customer_user_id);
  END IF;
  
  -- chat_messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_messages_line_message_id_key'
  ) THEN
    ALTER TABLE chat_messages
    ADD CONSTRAINT chat_messages_line_message_id_key 
    UNIQUE (line_message_id);
  END IF;
END $$;

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_customer_name 
ON chat_rooms(customer_name);

CREATE INDEX IF NOT EXISTS idx_chat_messages_line_id 
ON chat_messages(line_message_id);
```

### ขั้นตอนที่ 2: Run Migration

```sql
-- Copy จาก migrate-n8n-to-chat.sql (แก้ไขแล้ว)
-- Paste ใน Supabase SQL Editor
-- กด Run
```

**หมายเหตุ:** Script แก้ไขแล้ว ลบ `::sender_type`, `::message_type`, `::message_status` ออกแล้ว

---

## 📝 สรุปการแก้ไข

### ไฟล์ที่แก้ไข:

1. **`add-customer-columns.sql`** ✅
   - เพิ่ม `customer_name`, `customer_avatar` ใน `chat_rooms`
   - เพิ่ม `line_message_id` ใน `chat_messages`
   - เพิ่ม unique constraints

2. **`migrate-n8n-to-chat.sql`** ✅
   - ลบ `::sender_type` → ใช้ `'customer'` แทน
   - ลบ `::message_type` → ใช้ `'text'` แทน
   - ลบ `::message_status` → ใช้ `'read'` แทน
   - STEP 5: เพิ่ม `full_name` (จาก `customer_name`)
   - STEP 7: แก้ JSONB operator `->>'...'->>'...'` → `->...'->>'...'`

---

## ❌ Version เก่า (ลบไปแล้ว)

### วิธีที่ 2: ใช้ Version ที่ไม่มีคอลัมน์เหล่านี้ (ไม่แนะนำ)

**ขั้นตอน:**

1. **แก้ไข migrate-n8n-to-chat.sql**

Comment Version 1 และ Uncomment Version 2:

```sql
-- Version 1: มีคอลัมน์ customer_name และ customer_avatar
/*
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
SELECT ...
*/

-- Version 2: ไม่มีคอลัมน์ customer_name และ customer_avatar
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
```

2. **เพิ่ม unique constraint**

```sql
ALTER TABLE chat_rooms 
ADD CONSTRAINT chat_rooms_customer_user_id_key 
UNIQUE (customer_user_id);
```

3. **Run Migration**

```sql
-- Copy ทั้งหมดจาก migrate-n8n-to-chat.sql (ที่แก้ไขแล้ว)
-- Paste ใน Supabase SQL Editor
-- กด Run
```

**ข้อเสีย:**
- ❌ ไม่มีชื่อและรูปโปรไฟล์ใน chat_rooms
- ❌ ต้องดึงจาก customers table (ช้ากว่า)
- ❌ ต้อง JOIN ทุกครั้งที่แสดงรายการแชท

---

## 🚀 แนะนำ: ใช้วิธีที่ 1

เพราะ:
1. ✅ Performance ดีกว่า
2. ✅ Code เรียบง่ายกว่า
3. ✅ ไม่ต้อง JOIN ตาราง customers

---

## 📝 ขั้นตอนที่แนะนำ

### 1. เพิ่มคอลัมน์

```bash
# เปิด Supabase SQL Editor
# Copy จาก add-customer-columns.sql
# กด Run
```

### 2. Run Migration

```bash
# Copy จาก migrate-n8n-to-chat.sql
# กด Run
```

### 3. ดึง LINE Profile

```bash
cd c:\n8n-local\sales-ai
node sync-line-profiles.js
```

### 4. Refresh หน้าแชท

```
http://localhost:3000/chat-v2
```

---

## ✅ ตรวจสอบว่าแก้ไขสำเร็จ

```sql
-- ดูโครงสร้างตาราง
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'chat_rooms'
ORDER BY ordinal_position;

-- ควรเห็น:
-- customer_name | text
-- customer_avatar | text

-- ดู constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'chat_rooms';

-- ควรเห็น:
-- chat_rooms_customer_user_id_key | UNIQUE

-- ดูข้อมูล
SELECT 
  customer_user_id,
  customer_name,
  customer_avatar,
  created_at
FROM chat_rooms
LIMIT 5;
```

---

## 🎉 เสร็จแล้ว!

ตอนนี้คุณสามารถ:
- ✅ Run migration script ได้สำเร็จ
- ✅ เห็นชื่อและรูปโปรไฟล์ในรายการแชท
- ✅ Query ได้เร็วขึ้น

---

**หมายเหตุ:** ถ้ายังมี error อื่นๆ ให้ดูที่ error message และแจ้งให้ทราบ
