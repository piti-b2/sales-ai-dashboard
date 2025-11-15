# 🎬 Video Support Guide

## ปัญหาที่พบ

เมื่อลูกค้าส่งวิดีโอเข้ามา:
- ✅ ข้อมูลเข้า `messages` table พร้อม `metadata.media_url`
- ✅ ข้อมูล sync ไป `chat_messages` table
- ❌ แต่ `media_url` ใน `chat_messages` เป็น `null`
- ❌ เว็บแสดงแค่คำว่า "วิดีโอ" แทนที่จะแสดง video player

---

## สาเหตุ

### 1. ข้อมูลใน `messages` table:

```json
{
  "media_url": null,
  "metadata": {
    "media_url": "https://api-data.line.me/v2/bot/message/587762983304691851/content",
    "media_duration": 41772
  }
}
```

### 2. ฟังก์ชัน `sync_message_to_chat`:

```sql
INSERT INTO chat_messages (media_url)
VALUES (NEW.media_url)  -- NULL เพราะไม่ได้ดึงจาก metadata
```

### 3. ผลลัพธ์ใน `chat_messages`:

```json
{
  "media_url": null,  // ❌ ไม่มีค่า
  "metadata": {
    "media_url": "https://..."  // ✅ มีอยู่แต่ไม่ได้ใช้
  }
}
```

---

## การแก้ไข

### วิธีที่ 1: แก้ไขเฉพาะเว็บ (ง่ายกว่า) ✅

แก้ไข `MessageBubble.tsx` ให้ดึง URL จาก `metadata`:

```typescript
case 'video':
  // ดึง video URL จากหลายแหล่ง
  const videoUrl = message.media_url 
    || (message.metadata as any)?.line_media_url 
    || (message.metadata as any)?.media_url  // ⭐ เพิ่มบรรทัดนี้
  
  // ดึง duration จากหลายแหล่ง
  const videoDuration = message.media_duration 
    || (message.metadata as any)?.media_duration  // ⭐ เพิ่มบรรทัดนี้
```

**ข้อดี:**
- ✅ แก้ไขง่าย ไม่ต้องแก้ database
- ✅ ใช้ได้กับข้อมูลเก่าทันที
- ✅ ไม่ต้องรัน migration

**ข้อเสีย:**
- ❌ ต้องดึงจาก metadata ทุกครั้ง
- ❌ ไม่ได้แก้ root cause

---

### วิธีที่ 2: แก้ไข Sync Function (ถูกต้องกว่า)

รัน SQL: `fix-video-sync.sql`

```sql
-- ดึง media_url จาก metadata
v_media_url := COALESCE(
  NEW.media_url,
  NEW.line_media_url,
  NEW.metadata->>'media_url',  -- ⭐ เพิ่มบรรทัดนี้
  NEW.metadata->>'line_media_url'
);

-- ดึง media_duration จาก metadata
v_media_duration := COALESCE(
  NEW.media_size,
  (NEW.metadata->>'media_duration')::INTEGER,  -- ⭐ เพิ่มบรรทัดนี้
  (NEW.metadata->>'duration')::INTEGER
);

-- Insert ลง chat_messages
INSERT INTO chat_messages (
  media_url,
  media_duration
) VALUES (
  v_media_url,      -- ✅ มีค่าแล้ว
  v_media_duration  -- ✅ มีค่าแล้ว
);
```

**ข้อดี:**
- ✅ แก้ root cause
- ✅ ข้อมูลใหม่จะถูกต้องทันที
- ✅ ไม่ต้องดึงจาก metadata ในเว็บ

**ข้อเสีย:**
- ❌ ต้องรัน migration
- ❌ ข้อมูลเก่ายังไม่ถูกต้อง (ต้อง backfill)

---

## การแสดงผลบนเว็บ

### ก่อนแก้ไข:

```
┌─────────────┐
│ 📹 วิดีโอ   │
└─────────────┘
```

### หลังแก้ไข:

```
┌─────────────────────────┐
│ [Video Player]          │
│ ▶️ Play/Pause           │
│ ━━━━━━━━━━━━━━━━━━━━━━ │
│ 0:00 / 0:41             │
│                    41s  │ ← Duration badge
└─────────────────────────┘
```

---

## Video Player Features

### 1. ✅ HTML5 Video Player

```typescript
<video
  src="/api/line-media?url=..."
  controls
  preload="metadata"
  className="w-full h-auto bg-gray-900"
>
```

**Features:**
- ▶️ Play/Pause
- 🔊 Volume control
- ⏩ Seek bar
- 📱 Fullscreen
- ⬇️ Download (browser dependent)

### 2. ✅ Duration Badge

```typescript
{videoDuration && (
  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
    {formatDuration(videoDuration)}
  </div>
)}
```

**แสดง:**
- `41772` ms → `41s`
- `125000` ms → `2:05`
- `3661000` ms → `1:01:01`

### 3. ✅ Fallback UI

ถ้าไม่มี `videoUrl`:

```
┌─────────────────┐
│ 📹 วิดีโอ (41s) │
└─────────────────┘
```

---

## LINE Media Proxy

### Endpoint: `/api/line-media`

```typescript
GET /api/line-media?url=https://api-data.line.me/v2/bot/message/123/content
```

**ทำอะไร:**
1. รับ LINE media URL
2. Fetch จาก LINE API พร้อม Authorization header
3. Proxy content กลับมาให้เว็บ
4. Cache 1 ปี (`max-age=31536000`)

**ทำไมต้องใช้ Proxy:**
- LINE API ต้องการ `Authorization: Bearer {token}`
- Browser ไม่สามารถส่ง header นี้ได้
- Proxy จะส่ง header แทน

---

## ตัวอย่างการใช้งาน

### 1. ลูกค้าส่งวิดีโอ:

```json
// LINE Webhook Event
{
  "type": "message",
  "message": {
    "type": "video",
    "id": "587762983304691851",
    "duration": 41772,
    "contentProvider": {
      "type": "line"
    }
  }
}
```

### 2. n8n บันทึกลง `messages`:

```sql
INSERT INTO messages (
  message_type,
  content,
  metadata
) VALUES (
  'video',
  '[วีดีโอ]',
  '{
    "media_url": "https://api-data.line.me/v2/bot/message/587762983304691851/content",
    "media_duration": 41772
  }'
);
```

### 3. Trigger sync ไป `chat_messages`:

```sql
-- ถ้าใช้ fix-video-sync.sql
INSERT INTO chat_messages (
  media_url,
  media_duration
) VALUES (
  'https://api-data.line.me/v2/bot/message/587762983304691851/content',
  41772
);
```

### 4. เว็บแสดง Video Player:

```html
<video src="/api/line-media?url=https://api-data.line.me/..." controls>
```

---

## การทดสอบ

### 1. ทดสอบด้วยข้อมูลเก่า:

```bash
# เปิดเว็บ /chat-v2
# หาข้อความวิดีโอ
# ควรเห็น video player แทนคำว่า "วิดีโอ"
```

### 2. ทดสอบด้วยวิดีโอใหม่:

```bash
# ส่งวิดีโอใน LINE
# เปิดเว็บ /chat-v2
# ควรเห็น video player พร้อม duration
```

### 3. ตรวจสอบ Browser Console:

```javascript
// ควรเห็น log:
// 🎬 Video message: {
//   media_url: null,
//   metadata_media_url: "https://...",
//   videoUrl: "https://...",
//   videoDuration: 41772
// }
```

### 4. ตรวจสอบ Network Tab:

```
GET /api/line-media?url=https://api-data.line.me/...
Status: 200 OK
Content-Type: video/mp4
Size: 2.5 MB
```

---

## Troubleshooting

### ปัญหา: ยังแสดงแค่คำว่า "วิดีโอ"

**วิธีแก้:**
1. เปิด Browser Console
2. ดู log `🎬 Video message:`
3. ตรวจสอบว่า `videoUrl` มีค่าหรือไม่
4. ถ้าไม่มี ตรวจสอบ `metadata` ใน database

### ปัญหา: Video ไม่เล่น

**วิธีแก้:**
1. เปิด Network tab
2. ดู request ไป `/api/line-media`
3. ตรวจสอบ status code:
   - `400`: ไม่มี URL parameter
   - `401`: LINE token ไม่ถูกต้อง
   - `500`: LINE API error
4. ตรวจสอบ `LINE_CHANNEL_ACCESS_TOKEN` ใน `.env`

### ปัญหา: Duration ไม่แสดง

**วิธีแก้:**
1. ตรวจสอบ `metadata.media_duration` ใน database
2. ตรวจสอบว่า `formatDuration()` function ทำงานหรือไม่
3. ลอง log `videoDuration` ใน console

### ปัญหา: Video โหลดช้า

**วิธีแก้:**
1. ใช้ `preload="metadata"` แทน `preload="auto"`
2. เพิ่ม thumbnail/poster image
3. ตรวจสอบ network speed
4. พิจารณาใช้ CDN

---

## Future Enhancements

### 1. Thumbnail Generation:

```typescript
// สร้าง thumbnail จาก video frame แรก
const generateThumbnail = async (videoUrl: string) => {
  const video = document.createElement('video')
  video.src = videoUrl
  video.currentTime = 1  // 1 second
  
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  const ctx = canvas.getContext('2d')
  ctx?.drawImage(video, 0, 0)
  
  return canvas.toDataURL('image/jpeg')
}
```

### 2. Video Transcoding:

```typescript
// แปลงวิดีโอเป็น format ที่เล็กกว่า
// ใช้ FFmpeg หรือ cloud service
```

### 3. Progress Bar:

```typescript
// แสดง progress bar ขณะโหลด
<div className="relative">
  <video src="..." />
  {loading && (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full h-1 bg-gray-200">
        <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )}
</div>
```

### 4. Picture-in-Picture:

```typescript
// เปิด video ในโหมด PiP
const handlePiP = async () => {
  const video = videoRef.current
  if (document.pictureInPictureEnabled) {
    await video.requestPictureInPicture()
  }
}
```

---

## สรุป

### แก้ไขแล้ว:
1. ✅ `MessageBubble.tsx` - ดึง URL จาก `metadata.media_url`
2. ✅ แสดง Video Player พร้อม controls
3. ✅ แสดง Duration badge
4. ✅ Fallback UI ถ้าไม่มี URL

### ต้องทำเพิ่ม (Optional):
1. ⏳ รัน `fix-video-sync.sql` เพื่อแก้ sync function
2. ⏳ Backfill ข้อมูลเก่า
3. ⏳ เพิ่ม thumbnail generation
4. ⏳ เพิ่ม video transcoding

---

**🎉 วิดีโอพร้อมแสดงแล้ว! ทดสอบส่งวิดีโอใหม่ดูสิ** 🎬
