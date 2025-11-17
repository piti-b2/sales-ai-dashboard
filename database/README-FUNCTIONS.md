# 📚 วิธีดูฟังก์ชันใน Supabase

## 🎯 วิธีเร็ว (Copy-Paste ได้เลย!)

### 1️⃣ ดูรายการฟังก์ชันทั้งหมด
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

### 2️⃣ ดู Code ของฟังก์ชันเฉพาะ
```sql
-- แทนที่ 'sync_message_to_chat' ด้วยชื่อฟังก์ชันที่ต้องการ
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'sync_message_to_chat';
```

### 3️⃣ ดู Code ของฟังก์ชันทั้งหมด
```sql
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;
```

### 4️⃣ ดู Triggers ทั้งหมด
```sql
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_statement as function_call
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

---

## 🖥️ ใน Supabase Dashboard

### ขั้นตอน:
1. เปิด https://app.supabase.com
2. เลือก Project
3. ไปที่ **Database** → **Functions**
4. เห็นรายการฟังก์ชันทั้งหมด
5. คลิกดู code ได้

---

## 📊 ตัวอย่างผลลัพธ์

### รายการฟังก์ชัน:
```
function_name              | routine_type
---------------------------+--------------
sync_message_to_chat       | FUNCTION
get_or_create_conversation | FUNCTION
update_chat_room_status    | FUNCTION
```

### Code ของฟังก์ชัน:
```sql
CREATE OR REPLACE FUNCTION public.sync_message_to_chat()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_room_id UUID;
  ...
BEGIN
  ...
END;
$function$
```

---

## 🔍 ค้นหาฟังก์ชัน

### ค้นหาตามชื่อ:
```sql
SELECT proname
FROM pg_proc
WHERE proname LIKE '%sync%'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

### ค้นหาตาม Trigger:
```sql
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%sync_message%';
```

---

## 💾 Export ทั้งหมด

### Export เป็น SQL Script:
```sql
SELECT 
  pg_get_functiondef(p.oid) || E';\n\n' as create_statement
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;
```

**ผลลัพธ์:** SQL script พร้อม run ได้เลย

---

## 📈 ดูสถิติการใช้งาน

### ฟังก์ชันที่ถูกเรียกบ่อย:
```sql
SELECT 
  funcname as function_name,
  calls as total_calls,
  total_time as total_time_ms,
  (total_time / NULLIF(calls, 0)) as avg_time_ms
FROM pg_stat_user_functions
ORDER BY calls DESC;
```

---

## 🎯 Use Cases

### 1. ลืมว่าสร้างฟังก์ชันอะไรไว้
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public';
```

### 2. ต้องการแก้ไขฟังก์ชัน
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'function_name';
```

### 3. ต้องการ backup ฟังก์ชัน
```sql
-- Copy ผลลัพธ์ไปเก็บไว้
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'sync_message_to_chat';
```

### 4. ต้องการดู Trigger ที่เชื่อมกับตาราง
```sql
SELECT *
FROM information_schema.triggers
WHERE event_object_table = 'messages';
```

---

## 📝 ไฟล์ที่เกี่ยวข้อง

```
database/
├── list-all-functions.sql           ← SQL queries ทั้งหมด
├── sync-messages-trigger-fixed.sql  ← Trigger function
└── README-FUNCTIONS.md              ← คู่มือนี้
```

---

## 🚀 Quick Commands

```sql
-- ดูฟังก์ชันทั้งหมด
\df public.*

-- ดู code ฟังก์ชัน (psql)
\sf sync_message_to_chat

-- ดู triggers ทั้งหมด
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';
```

---

## ✅ Checklist

- [ ] ดูรายการฟังก์ชันทั้งหมด
- [ ] ดู code ของฟังก์ชันที่สนใจ
- [ ] ดู triggers ที่เชื่อมกับฟังก์ชัน
- [ ] Export ฟังก์ชันสำคัญไว้ backup
- [ ] ตรวจสอบสถิติการใช้งาน

---

**ใช้ไฟล์ `list-all-functions.sql` ได้เลยครับ!** 🚀
