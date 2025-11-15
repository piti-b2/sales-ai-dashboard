# 📅 LINE Media URL Expiration Guide

## ปัญหา: รูปภาพ/วิดีโอเก่าแสดงไม่ได้

### อาการ:
- ✅ รูป/วิดีโอใหม่ (< 7 วัน) แสดงได้
- ❌ รูป/วิดีโอเก่า (> 7-18 วัน) แสดงไม่ได้
- ❌ Console แสดง error: `Image load error`, `Video load error`

---

## สาเหตุ

### LINE Media URLs มีอายุจำกัด

```
https://api-data.line.me/v2/bot/message/587766716437102865/content
                                        ↑
                                  Message ID
```

**อายุการใช้งาน:**
- ✅ **1-7 วัน**: ใช้ได้ปกติ
- ⚠️ **7-30 วัน**: อาจหมดอายุบางส่วน
- ❌ **> 30 วัน**: หมดอายุแน่นอน

**ผลกระทบ:**
- รูปภาพ/วิดีโอที่ส่งมานานแล้วจะดูไม่ได้
- ต้องบันทึกลง Storage ถาวรถ้าต้องการเก็บนาน

---

## รูปแบบการเก็บ Media ในระบบ

### 1. 🔗 LINE URL (ชั่วคราว)

```json
{
  "media_url": "https://api-data.line.me/v2/bot/message/123/content",
  "message_type": "image"
}
```

**ข้อดี:**
- ✅ ไม่ต้องเสีย storage
- ✅ ไม่ต้อง download/upload
- ✅ รวดเร็ว

**ข้อเสีย:**
- ❌ หมดอายุ 7-30 วัน
- ❌ ดูไม่ได้หลังหมดอายุ

**เหมาะกับ:**
- แชทระยะสั้น
- ข้อมูลไม่สำคัญ
- ไม่ต้องเก็บนาน

---

### 2. 💾 Supabase Storage (ถาวร)

```json
{
  "media_url": "https://xxx.supabase.co/storage/v1/object/public/line-media/videos/123.mp4",
  "media_storage_path": "line-media/videos/123.mp4",
  "message_type": "video"
}
```

**ข้อดี:**
- ✅ ไม่หมดอายุ
- ✅ ควบคุมเอง
- ✅ เข้าถึงได้ตลอด

**ข้อเสีย:**
- ❌ ต้องเสีย storage
- ❌ ต้อง download/upload
- ❌ ช้ากว่า

**เหมาะกับ:**
- ข้อมูลสำคัญ
- ต้องเก็บนาน
- ต้องการ backup

---

### 3. 🔀 Hybrid (แนะนำ)

**กลยุทธ์:**
1. บันทึก LINE URL ก่อน (รวดเร็ว)
2. Download และ upload ไป Storage ทีหลัง (background job)
3. อัพเดท `media_url` เป็น Storage URL

**ข้อดี:**
- ✅ Response เร็ว (ไม่ต้องรอ upload)
- ✅ มี backup ถาวร
- ✅ Best of both worlds

**ตัวอย่าง:**

```javascript
// Step 1: บันทึก LINE URL ก่อน (ทันที)
{
  "media_url": "https://api-data.line.me/...",
  "line_media_url": "https://api-data.line.me/...",
  "media_storage_path": null
}

// Step 2: Background job download & upload (ทีหลัง)
// ... download from LINE ...
// ... upload to Supabase Storage ...

// Step 3: อัพเดท record
{
  "media_url": "https://xxx.supabase.co/storage/...",
  "line_media_url": "https://api-data.line.me/...",
  "media_storage_path": "line-media/videos/123.mp4"
}
```

---

## การแก้ไขที่ทำไปแล้ว

### ✅ เพิ่ม Error Handling

**Image:**
```typescript
const [imageError, setImageError] = useState(false)

<img
  onError={() => setImageError(true)}
/>

{imageError && (
  <div className="text-xs text-gray-400 mt-1">
    ⚠️ รูปภาพหมดอายุ (LINE media URL หมดอายุหลัง 7 วัน)
  </div>
)}
```

**Video:**
```typescript
const [videoError, setVideoError] = useState(false)

<video
  onError={() => setVideoError(true)}
/>

{videoError && (
  <div className="text-xs text-gray-400 mt-1">
    ⚠️ วิดีโอหมดอายุ (LINE media URL หมดอายุหลัง 7 วัน)
  </div>
)}
```

---

## ผลลัพธ์

### ก่อนแก้ไข:
```
┌─────────────┐
│             │  ← ช่องว่าง (ไม่มี fallback)
│             │
└─────────────┘
```

### หลังแก้ไข:
```
┌─────────────────────────────────┐
│ 🖼️ รูปภาพ                       │
│ ⚠️ รูปภาพหมดอายุ (LINE media   │
│    URL หมดอายุหลัง 7 วัน)       │
└─────────────────────────────────┘
```

---

## วิธีแก้ปัญหาถาวร

### Option 1: ใช้ Supabase Storage

#### 1. สร้าง Storage Bucket

```sql
-- ใน Supabase Dashboard > Storage
-- Create new bucket: line-media
-- Public: Yes
```

#### 2. แก้ไข n8n Workflow

```javascript
// ใน Node "Code: Prepare Message Data"
case 'image':
case 'video':
  // Download จาก LINE
  const mediaBlob = await fetch(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      }
    }
  ).then(r => r.blob());
  
  // Upload to Supabase Storage
  const fileExt = messageType === 'image' ? 'jpg' : 'mp4';
  const fileName = `${messageType}s/${userId}/${messageId}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('line-media')
    .upload(fileName, mediaBlob, {
      contentType: messageType === 'image' ? 'image/jpeg' : 'video/mp4',
      upsert: false
    });
  
  if (!error) {
    // ใช้ public URL
    const { data: { publicUrl } } = supabase.storage
      .from('line-media')
      .getPublicUrl(fileName);
    
    metadata.media_url = publicUrl;
    metadata.line_media_url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
    metadata.media_storage_path = fileName;
  }
  break;
```

#### 3. อัพเดท Database Schema

```sql
-- เพิ่ม column สำหรับ storage path
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS media_storage_path TEXT;

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS media_storage_path TEXT;

-- อัพเดท sync function
CREATE OR REPLACE FUNCTION sync_message_to_chat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chat_messages (
    ...
    media_url,
    media_storage_path,
    ...
  ) VALUES (
    ...
    COALESCE(NEW.media_storage_path, NEW.media_url, NEW.line_media_url),
    NEW.media_storage_path,
    ...
  );
END;
$$ LANGUAGE plpgsql;
```

---

### Option 2: Background Job (แนะนำ)

**ข้อดี:**
- ไม่ทำให้ response ช้า
- ประมวลผลทีหลัง
- Retry ได้ถ้าล้มเหลว

**สร้าง Workflow แยก:**

```javascript
// Workflow: "Download LINE Media to Storage"
// Trigger: Webhook หรือ Schedule

// 1. Query messages ที่ยังไม่มี storage path
const messages = await supabase
  .from('messages')
  .select('*')
  .is('media_storage_path', null)
  .in('message_type', ['image', 'video'])
  .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 วันล่าสุด
  .limit(100);

// 2. Download และ upload แต่ละไฟล์
for (const msg of messages) {
  try {
    // Download
    const blob = await fetch(msg.line_media_url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.blob());
    
    // Upload
    const fileName = `${msg.message_type}s/${msg.user_id}/${msg.line_message_id}.${ext}`;
    await supabase.storage.from('line-media').upload(fileName, blob);
    
    // Update
    const publicUrl = supabase.storage.from('line-media').getPublicUrl(fileName).data.publicUrl;
    await supabase
      .from('messages')
      .update({
        media_url: publicUrl,
        media_storage_path: fileName
      })
      .eq('id', msg.id);
      
    console.log('✅ Backed up:', msg.id);
  } catch (err) {
    console.error('❌ Failed:', msg.id, err);
  }
}
```

**ตั้ง Schedule:**
- รันทุก 1 ชั่วโมง
- หรือรันทุกวันตอนกลางคืน

---

### Option 3: ใช้ CDN/External Storage

**ตัวเลือก:**
- AWS S3 + CloudFront
- Cloudinary
- imgix
- Bunny CDN

**ข้อดี:**
- Performance ดีกว่า
- CDN ทั่วโลก
- Image optimization

**ข้อเสีย:**
- ต้องจ่ายเงิน
- Setup ซับซ้อนกว่า

---

## สรุป

### ✅ ที่แก้ไขแล้ว:

1. **Error Handling**
   - แสดงข้อความเตือนเมื่อ media หมดอายุ
   - ไม่แสดงช่องว่าง
   - UX ดีขึ้น

2. **Bug Fixes**
   - แก้ `setImageError(false)` → `setImageError(true)`
   - เพิ่ม `videoError` state
   - Reset state เมื่อ message เปลี่ยน

### 🎯 แนะนำต่อไป:

1. **ระยะสั้น (ใช้ได้เลย):**
   - ✅ ปล่อยให้ใช้ LINE URL
   - ✅ แสดง fallback UI เมื่อหมดอายุ
   - ✅ User รู้ว่าทำไมดูไม่ได้

2. **ระยะยาว (ถ้าต้องการเก็บนาน):**
   - 📦 ใช้ Supabase Storage
   - 🔄 สร้าง Background Job
   - 💾 Backup media ทุกวัน

---

## ตัวอย่าง Error Messages

### Image Error:
```
┌─────────────────────────────────┐
│ 🖼️ รูปภาพ                       │
│ ⚠️ รูปภาพหมดอายุ (LINE media   │
│    URL หมดอายุหลัง 7 วัน)       │
└─────────────────────────────────┘
```

### Video Error:
```
┌─────────────────────────────────┐
│ 🎥 วิดีโอ (2:58)                │
│ ⚠️ วิดีโอหมดอายุ (LINE media   │
│    URL หมดอายุหลัง 7 วัน)       │
└─────────────────────────────────┘
```

---

**✅ ตอนนี้ระบบจัดการ error ได้ดีแล้ว ไม่มีช่องว่างแปลกๆ**
