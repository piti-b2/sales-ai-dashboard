# 📋 ขั้นตอนการแก้ไขปัญหา Sticker และ Flex Message

## ปัญหาที่พบ

1. ✅ **Sticker ไม่แสดงบนเว็บ** - ข้อมูลเข้าตาราง `messages` แต่ไม่ sync ไป `chat_messages`
2. ⏳ **Flex Message ไม่แสดงบนเว็บ** - ยังไม่ได้บันทึกลง database

---

## 🔧 การแก้ไขปัญหา Sticker

### STEP 1: รัน Migration SQL ใน Supabase

```bash
# เปิด Supabase SQL Editor และรันไฟล์นี้
C:\n8n-local\sales-ai\migration-sticker-support.sql
```

**ไฟล์นี้จะทำ:**
1. ✅ เพิ่ม columns: `sticker_id`, `sticker_package_id`, `sticker_resource_type` ใน `chat_messages`
2. ✅ เพิ่ม index สำหรับค้นหา sticker
3. ✅ แก้ไขฟังก์ชัน `sync_message_to_chat()` ให้ sync sticker fields
4. ✅ สร้าง trigger ใหม่
5. ✅ ตรวจสอบว่า migration สำเร็จ

### STEP 2: ตรวจสอบผลลัพธ์

หลังรัน SQL ให้ตรวจสอบ:

```sql
-- ตรวจสอบ columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
AND column_name LIKE 'sticker%';

-- ควรเห็น:
-- sticker_id | text
-- sticker_package_id | text
-- sticker_resource_type | text
```

### STEP 3: ทดสอบส่ง Sticker

1. ส่ง sticker ใน LINE
2. ตรวจสอบว่าข้อมูลเข้า `messages`:
   ```sql
   SELECT id, content, sticker_id, sticker_package_id, sticker_resource_type
   FROM messages
   WHERE message_type = 'sticker'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. ตรวจสอบว่าข้อมูล sync ไป `chat_messages`:
   ```sql
   SELECT id, content, sticker_id, sticker_package_id, sticker_resource_type
   FROM chat_messages
   WHERE message_type = 'sticker'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

4. เปิดเว็บ `/chat-v2` → ควรเห็นรูป sticker แทนข้อความ `[สติกเกอร์]`

---

## 🎴 การแก้ไขปัญหา Flex Message

### STEP 1: แก้ไข Workflow ใน n8n

เปิดไฟล์ `C:\n8n-local\Line.json` และเพิ่ม Node หลัง "สร้าง Flex Message":

#### 1. เพิ่ม Node: "Code: Prepare Flex for DB"

```javascript
// รับข้อมูล Flex Message
const flexData = $json;
const userId = flexData.to || flexData.userId;
const flexMessage = flexData.messages?.[0];

// ดึง room_id จาก Supabase
const { data: room } = await $supabase
  .from('chat_rooms')
  .select('id')
  .eq('customer_user_id', userId)
  .single();

if (!room) {
  console.log('⚠️ Room not found for user:', userId);
  return null;
}

// เตรียมข้อมูลสำหรับบันทึก
return {
  room_id: room.id,
  sender_id: 'system',
  sender_type: 'ai',
  message_type: 'text',
  content: '[Flex Message - Product Card]',
  status: 'sent',
  created_at: new Date().toISOString(),
  metadata: {
    flex_content: flexMessage,
    is_flex_message: true,
    flex_type: 'product_card',
    user_id: userId
  }
};
```

#### 2. เพิ่ม Node: "Supabase: Save Flex Message"

- **Type:** Supabase
- **Operation:** Insert
- **Table:** `chat_messages`
- **Fields:** ใช้ข้อมูลจาก Code node

#### 3. เชื่อมต่อ Nodes

```
สร้าง Flex Message
    ↓
Code: Prepare Flex for DB
    ↓
Supabase: Save Flex Message
    ↓
LINE: Push Message
```

### STEP 2: Import Workflow ใหม่

1. เปิด n8n
2. Import `Line.json` ที่แก้ไขแล้ว
3. Activate workflow

### STEP 3: ทดสอบ Flex Message

1. ทริกเกอร์ให้ระบบส่ง Flex Message
2. ตรวจสอบใน `chat_messages`:
   ```sql
   SELECT 
     id, 
     content, 
     metadata->>'is_flex_message' as is_flex,
     metadata->'flex_content' as flex_data
   FROM chat_messages
   WHERE metadata->>'is_flex_message' = 'true'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. เปิดเว็บ `/chat-v2` → ควรเห็น Card พร้อมรูปภาพและปุ่ม

---

## ✅ Checklist

### Sticker Support
- [ ] รัน `migration-sticker-support.sql` ใน Supabase
- [ ] ตรวจสอบว่า columns ถูกสร้าง
- [ ] ทดสอบส่ง sticker ใน LINE
- [ ] ตรวจสอบว่าข้อมูล sync ไป `chat_messages`
- [ ] เปิดเว็บและตรวจสอบว่าแสดงรูป sticker

### Flex Message Support
- [ ] แก้ไข workflow เพิ่ม Node บันทึก Flex Message
- [ ] Import workflow ใหม่ใน n8n
- [ ] ทดสอบส่ง Flex Message
- [ ] ตรวจสอบว่าข้อมูลเข้า `chat_messages`
- [ ] เปิดเว็บและตรวจสอบว่าแสดง Card

---

## 🐛 Troubleshooting

### ปัญหา: Sticker ยังไม่แสดงหลังรัน SQL

**วิธีแก้:**
1. ตรวจสอบว่า trigger ทำงาน:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_sync_message_to_chat';
   ```

2. ลองส่ง sticker ใหม่และดู log:
   ```sql
   -- ใน Supabase Dashboard > Database > Logs
   ```

3. ตรวจสอบว่า `messages` table มี sticker fields:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'messages' 
   AND column_name LIKE 'sticker%';
   ```

### ปัญหา: Flex Message ไม่แสดง

**วิธีแก้:**
1. ตรวจสอบว่า `FlexMessage.tsx` component ถูก import:
   ```typescript
   import { FlexMessage } from './FlexMessage'
   ```

2. ตรวจสอบว่า metadata มี `flex_content`:
   ```sql
   SELECT metadata->'flex_content' FROM chat_messages 
   WHERE metadata->>'is_flex_message' = 'true';
   ```

3. เปิด Browser Console และดู error

---

## 📁 ไฟล์ที่เกี่ยวข้อง

### SQL Files
- `migration-sticker-support.sql` - Migration หลักสำหรับ sticker
- `add-sticker-columns.sql` - เพิ่ม columns อย่างเดียว
- `fix-sync-message-function.sql` - แก้ไขฟังก์ชัน sync

### React Components
- `components/chat/MessageBubble.tsx` - แสดงข้อความ (รองรับ sticker + flex)
- `components/chat/FlexMessage.tsx` - แสดง Flex Message
- `lib/useRealtimeChat.ts` - Interface และ hooks

### Workflow Files
- `Line.json` - Workflow หลักที่ต้องแก้ไข
- `system_offline_workflow.json` - Workflow สำหรับระบบออฟไลน์

### Documentation
- `FLEX_MESSAGE_GUIDE.md` - คู่มือ Flex Message
- `MIGRATION_STEPS.md` - ไฟล์นี้

---

## 🎯 สรุป

**สำหรับ Sticker:**
→ รัน `migration-sticker-support.sql` แล้วเสร็จ!

**สำหรับ Flex Message:**
→ ต้องแก้ไข workflow เพิ่ม Node บันทึกลง database

**ผลลัพธ์ที่คาดหวัง:**
- ✅ Sticker แสดงเป็นรูปภาพบนเว็บ
- ✅ Flex Message แสดงเป็น Card พร้อมปุ่ม
- ✅ ทั้งหมดทำงานแบบ realtime
