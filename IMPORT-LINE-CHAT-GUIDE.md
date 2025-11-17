# 📥 คู่มือ Import ประวัติแชทจาก LINE/n8n

## 🎯 วัตถุประสงค์

Import ประวัติการสนทนาจาก LINE ที่เก็บไว้ใน n8n เข้าสู่ระบบแชทใหม่ใน Supabase

---

## 📋 ขั้นตอนการ Import

### วิธีที่ 1: ใช้ Sample Data (สำหรับทดสอบ)

1. เปิด Supabase SQL Editor
2. Copy โค้ดจากไฟล์ `import-line-chats.sql`
3. Run SQL
4. Refresh หน้าแชท

ผลลัพธ์:
- ✅ จะมีห้องแชท 5-7 ห้อง
- ✅ มีข้อความตัวอย่างในแต่ละห้อง
- ✅ มีทั้งข้อความจากลูกค้า, Agent, และ AI

---

### วิธีที่ 2: Import จาก n8n Database (Production)

#### A. ถ้า n8n ใช้ PostgreSQL เดียวกับ Supabase

```sql
-- 1. สร้าง Foreign Data Wrapper
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 2. เชื่อมต่อ n8n database
CREATE SERVER n8n_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'localhost', port '5432', dbname 'n8n');

-- 3. สร้าง user mapping
CREATE USER MAPPING FOR postgres
  SERVER n8n_server
  OPTIONS (user 'n8n_user', password 'your_password');

-- 4. สร้าง foreign table
CREATE FOREIGN TABLE n8n_executions (
  id INT,
  workflowId VARCHAR,
  data JSONB,
  finishedAt TIMESTAMP
)
SERVER n8n_server
OPTIONS (schema_name 'public', table_name 'execution_entity');

-- 5. ดูข้อมูล LINE จาก n8n
SELECT 
  data->'webhook'->'body'->'events'->0->'source'->>'userId' as user_id,
  data->'webhook'->'body'->'events'->0->'message'->>'text' as message,
  data->'webhook'->'body'->'events'->0->'message'->>'type' as type,
  finishedAt as created_at
FROM n8n_executions
WHERE workflowId = 'your_line_workflow_id'
  AND data->'webhook'->'body'->'events' IS NOT NULL
ORDER BY finishedAt DESC
LIMIT 10;
```

#### B. ถ้า n8n ใช้ Database แยก

**ขั้นตอน:**

1. **Export จาก n8n**
   ```bash
   # Connect to n8n database
   psql -h localhost -U n8n_user -d n8n
   
   # Export LINE messages
   \copy (
     SELECT 
       data->'webhook'->'body'->'events'->0->'source'->>'userId' as user_id,
       data->'webhook'->'body'->'events'->0->'message'->>'text' as message,
       data->'webhook'->'body'->'events'->0->'message'->>'type' as type,
       data->'webhook'->'body'->'events'->0->>'timestamp' as timestamp
     FROM execution_entity
     WHERE workflow_id = 'your_workflow_id'
       AND data->'webhook'->'body'->'events' IS NOT NULL
     ORDER BY finished_at ASC
   ) TO '/tmp/line_messages.csv' WITH CSV HEADER;
   ```

2. **Import เข้า Supabase**
   ```sql
   -- สร้างตารางชั่วคราว
   CREATE TEMP TABLE temp_line_messages (
     user_id TEXT,
     message TEXT,
     type TEXT,
     timestamp BIGINT
   );
   
   -- Import CSV
   \copy temp_line_messages FROM '/tmp/line_messages.csv' WITH CSV HEADER;
   
   -- สร้างห้องแชท
   INSERT INTO chat_rooms (customer_user_id, status, is_ai_enabled)
   SELECT DISTINCT 
     user_id,
     'active',
     true
   FROM temp_line_messages
   ON CONFLICT (customer_user_id) DO NOTHING;
   
   -- Import ข้อความ
   INSERT INTO chat_messages (
     room_id,
     sender_id,
     sender_type,
     message_type,
     content,
     created_at
   )
   SELECT 
     cr.id,
     tlm.user_id,
     'customer',
     COALESCE(tlm.type, 'text'),
     tlm.message,
     to_timestamp(tlm.timestamp / 1000.0)
   FROM temp_line_messages tlm
   JOIN chat_rooms cr ON cr.customer_user_id = tlm.user_id
   ORDER BY tlm.timestamp ASC;
   ```

---

### วิธีที่ 3: Import ผ่าน n8n Workflow

สร้าง workflow ใน n8n:

```
[Schedule Trigger]
    ↓
[Supabase: Get Recent Executions]
    ↓
[Function: Transform Data]
    ↓
[Supabase: Insert Chat Rooms]
    ↓
[Supabase: Insert Messages]
```

**Function Node Code:**
```javascript
const items = $input.all();
const chatData = [];

for (const item of items) {
  const events = item.json.data?.webhook?.body?.events || [];
  
  for (const event of events) {
    if (event.type === 'message') {
      chatData.push({
        user_id: event.source.userId,
        message_type: event.message.type,
        content: event.message.text || '',
        timestamp: event.timestamp,
      });
    }
  }
}

return chatData.map(data => ({ json: data }));
```

---

## 🔍 ตรวจสอบข้อมูลใน n8n

### 1. ดูโครงสร้างข้อมูล

```sql
-- Connect to n8n database
SELECT 
  id,
  workflow_id,
  jsonb_pretty(data) as execution_data,
  finished_at
FROM execution_entity
WHERE workflow_id = 'your_line_workflow_id'
ORDER BY finished_at DESC
LIMIT 1;
```

### 2. นับจำนวนข้อความ

```sql
SELECT 
  data->'webhook'->'body'->'events'->0->'source'->>'userId' as user_id,
  COUNT(*) as message_count
FROM execution_entity
WHERE workflow_id = 'your_line_workflow_id'
  AND data->'webhook'->'body'->'events' IS NOT NULL
GROUP BY user_id
ORDER BY message_count DESC;
```

### 3. ดูข้อความล่าสุด

```sql
SELECT 
  data->'webhook'->'body'->'events'->0->'source'->>'userId' as user_id,
  data->'webhook'->'body'->'events'->0->'message'->>'text' as message,
  finished_at
FROM execution_entity
WHERE workflow_id = 'your_line_workflow_id'
  AND data->'webhook'->'body'->'events' IS NOT NULL
ORDER BY finished_at DESC
LIMIT 20;
```

---

## 🐛 Troubleshooting

### ปัญหา: ไม่พบข้อมูลใน n8n

**สาเหตุ:**
- n8n อาจไม่ได้เก็บ execution history
- Workflow ID ไม่ถูกต้อง

**วิธีแก้:**
```sql
-- หา workflow ID
SELECT DISTINCT workflow_id 
FROM execution_entity 
ORDER BY workflow_id;

-- ดูข้อมูลทั้งหมด
SELECT * FROM execution_entity 
WHERE workflow_id LIKE '%line%' 
LIMIT 5;
```

### ปัญหา: โครงสร้างข้อมูลไม่ตรง

**วิธีแก้:**
1. ดูโครงสร้างจริงจาก n8n
2. ปรับ JSON path ให้ตรง
3. ทดสอบ query ทีละส่วน

### ปัญหา: Import ได้แต่ไม่แสดงในแชท

**ตรวจสอบ:**
```sql
-- ดูจำนวนห้องแชท
SELECT COUNT(*) FROM chat_rooms;

-- ดูจำนวนข้อความ
SELECT 
  cr.customer_user_id,
  COUNT(cm.id) as message_count
FROM chat_rooms cr
LEFT JOIN chat_messages cm ON cm.room_id = cr.id
GROUP BY cr.id, cr.customer_user_id;

-- ตรวจสอบ last_message_at
SELECT 
  customer_user_id,
  last_message_at,
  created_at
FROM chat_rooms
ORDER BY last_message_at DESC;
```

---

## 📊 ตัวอย่างข้อมูลที่ได้

หลังจาก import แล้ว คุณจะเห็น:

### Sidebar (รายการห้องแชท)
```
┌─────────────────────────────┐
│ 🔍 ค้นหาการสนทนา...        │
├─────────────────────────────┤
│ U4444... (5 นาทีที่แล้ว)    │
│ ตารางเรียนออกแล้วหรือยัง... │
│ [AI] [1]                    │
├─────────────────────────────┤
│ U3333... (30 นาทีที่แล้ว)   │
│ ระดับกลางครับ               │
│ [AI]                        │
├─────────────────────────────┤
│ U1111... (1 ชั่วโมงที่แล้ว) │
│ ขอบคุณครับ                  │
│ [AI]                        │
└─────────────────────────────┘
```

### Chat Window (หน้าต่างแชท)
```
┌─────────────────────────────┐
│ U4444... [🤖 AI เปิด]       │
├─────────────────────────────┤
│                             │
│  สวัสดีค่ะ                  │
│  1 วันที่แล้ว ✓✓           │
│                             │
│         สวัสดีค่ะ           │
│         1 วันที่แล้ว ✓✓    │
│                             │
│  ตารางเรียนออกแล้วหรือยัง   │
│  5 นาทีที่แล้ว ✓✓          │
│                             │
│         ออกแล้วค่ะ...       │
│         4 นาทีที่แล้ว ✓    │
│                             │
├─────────────────────────────┤
│ 📎 🖼️ 🎥 พิมพ์ข้อความ... ➤│
└─────────────────────────────┘
```

---

## ✅ Checklist

- [ ] รัน `import-line-chats.sql` ใน Supabase
- [ ] ตรวจสอบจำนวนห้องแชท (ควรมี 5-7 ห้อง)
- [ ] ตรวจสอบข้อความในแต่ละห้อง
- [ ] Refresh หน้าแชท
- [ ] ทดสอบส่งข้อความ
- [ ] ทดสอบ AI Suggestion

---

## 🚀 ขั้นตอนต่อไป

1. **Import ข้อมูลจริงจาก n8n**
2. **ตั้งค่า Sync อัตโนมัติ** (ใช้ n8n workflow)
3. **เพิ่มฟีเจอร์ Export/Import** ในหน้า Admin
4. **สร้าง Backup Schedule**

---

**หมายเหตุ:** ถ้าต้องการความช่วยเหลือเพิ่มเติม กรุณาแจ้ง:
1. โครงสร้าง database ของ n8n
2. Workflow ID ที่ใช้กับ LINE
3. ตัวอย่างข้อมูลจาก execution_entity
