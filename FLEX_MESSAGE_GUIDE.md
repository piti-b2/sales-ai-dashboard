# คู่มือการแก้ไขเพื่อแสดง Flex Message บนเว็บ

## ปัญหา
เมื่อระบบส่ง Flex Message (การ์ดที่มีรูป+ปุ่ม) ไปยัง LINE แล้ว เว็บไม่แสดง Flex Message เหมือนใน LINE

## สาเหตุ
- Workflow ส่ง Flex Message ไปยัง LINE ผ่าน Push/Reply API
- แต่ไม่ได้บันทึก Flex Message ลง `chat_messages` table
- เว็บจึงไม่มีข้อมูลมาแสดง

## วิธีแก้ไข

### 1. เพิ่ม Node บันทึก Flex Message ใน Workflow

หลังจาก Node "สร้าง Flex Message" และก่อน Node "LINE: Push Message" ให้เพิ่ม:

#### Node: "Code: Prepare Flex Message for DB"
```javascript
// รับข้อมูล Flex Message ที่สร้างแล้ว
const flexData = $json;
const userId = flexData.to || flexData.userId;
const flexMessage = flexData.messages?.[0];

// ดึง conversation_id จาก Supabase
let conversationId = null;

try {
  const { data } = await $supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('channel', 'line')
    .single();
  
  conversationId = data?.id;
} catch (e) {
  console.log('⚠️ ไม่พบ conversation');
}

// ถ้าไม่มี conversation ให้สร้างใหม่
if (!conversationId) {
  const { data } = await $supabase
    .from('conversations')
    .insert({
      user_id: userId,
      channel: 'line',
      product_id: 'prod_phonics_chart_th',
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    })
    .select()
    .single();
  
  conversationId = data?.id;
}

// ดึง room_id จาก chat_rooms
let roomId = null;

try {
  const { data } = await $supabase
    .from('chat_rooms')
    .select('id')
    .eq('customer_user_id', userId)
    .single();
  
  roomId = data?.id;
} catch (e) {
  console.log('⚠️ ไม่พบ chat_room');
}

// ถ้าไม่มี room ให้สร้างใหม่
if (!roomId) {
  const { data } = await $supabase
    .from('chat_rooms')
    .insert({
      customer_user_id: userId,
      customer_name: flexData.displayName || 'Unknown',
      status: 'active',
      last_message_at: new Date().toISOString()
    })
    .select()
    .single();
  
  roomId = data?.id;
}

// สร้างข้อความสำหรับบันทึก
const messageData = {
  room_id: roomId,
  sender_id: 'system', // หรือ agent_id ที่เหมาะสม
  sender_type: 'ai',
  message_type: 'text',
  content: '[Flex Message - Product Card]',
  status: 'sent',
  metadata: {
    flex_content: flexMessage,
    is_flex_message: true,
    flex_type: 'product_card'
  }
};

return messageData;
```

#### Node: "Supabase: Save Flex Message"
- Type: Supabase
- Operation: Insert
- Table: `chat_messages`
- Fields: ใช้ข้อมูลจาก Code node ด้านบน

### 2. เชื่อมต่อ Nodes

```
สร้าง Flex Message
    ↓
Code: Prepare Flex Message for DB
    ↓
Supabase: Save Flex Message
    ↓
LINE: Push Message
```

### 3. ตัวอย่าง Flex Message ที่บันทึก

```json
{
  "room_id": "uuid-here",
  "sender_id": "system",
  "sender_type": "ai",
  "message_type": "text",
  "content": "[Flex Message - Product Card]",
  "status": "sent",
  "metadata": {
    "flex_content": {
      "type": "flex",
      "altText": "Phonics Charts",
      "contents": {
        "type": "bubble",
        "hero": {
          "type": "image",
          "url": "https://i.ibb.co/6n5k81p/LINE-ALBUM-1.jpg",
          "size": "full",
          "aspectRatio": "20:13",
          "aspectMode": "cover"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "Phonics Charts",
              "weight": "bold",
              "size": "xl"
            },
            {
              "type": "text",
              "text": "ชาร์ตเสียงอักษร 44 เสียง สำหรับเด็ก 3-6 ปี",
              "size": "sm",
              "color": "#666666",
              "wrap": true
            },
            {
              "type": "text",
              "text": "฿590",
              "weight": "bold",
              "size": "xxl",
              "color": "#06c755"
            }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "vertical",
          "spacing": "sm",
          "contents": [
            {
              "type": "button",
              "style": "primary",
              "action": {
                "type": "uri",
                "label": "ดูรายละเอียด",
                "uri": "https://example.com/product/1"
              }
            },
            {
              "type": "button",
              "style": "secondary",
              "action": {
                "type": "uri",
                "label": "สั่งซื้อเลย",
                "uri": "https://example.com/checkout/1"
              }
            }
          ]
        }
      }
    },
    "is_flex_message": true,
    "flex_type": "product_card"
  }
}
```

## ผลลัพธ์

เมื่อแก้ไขเสร็จแล้ว:
1. ✅ LINE จะแสดง Flex Message แบบเต็มรูปแบบ (รูป + ข้อความ + ปุ่ม)
2. ✅ เว็บจะแสดง Flex Message ในรูปแบบ Card ที่สวยงาม (ใช้ FlexMessage component)
3. ✅ ปุ่มบนเว็บสามารถคลิกได้และเปิดลิงก์ที่กำหนด

## หมายเหตุ

- ต้องแก้ไขทุก workflow ที่มีการส่ง Flex Message
- ตรวจสอบว่า `chat_rooms` และ `conversations` มีข้อมูลครบถ้วน
- ถ้าใช้ Supabase RLS ต้องตรวจสอบ policy ให้อนุญาตการ insert
