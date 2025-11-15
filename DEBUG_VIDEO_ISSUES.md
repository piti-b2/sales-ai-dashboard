# 🐛 Debug Video Loading Issues

## ปัญหา: Video Player แสดงแต่เล่นไม่ได้

### อาการ:
- ✅ Video player แสดง
- ✅ Controls แสดง (play, volume, etc.)
- ❌ จอดำ ไม่มีภาพ
- ❌ กดเล่นแล้วไม่เกิดอะไร

---

## สาเหตุที่เป็นไปได้

### 1. LINE Media URL หมดอายุ ⏰

**LINE media URLs มีอายุจำกัด (1-7 วัน)**

```
https://api-data.line.me/v2/bot/message/587766716437102865/content
                                        ↑
                                  Message ID
```

**วิธีตรวจสอบ:**

1. เปิด Browser DevTools > Console
2. ดู log:
   ```javascript
   🎬 Video loading started: /api/line-media?url=...
   ❌ Video load error: { error: ..., networkState: 3 }
   ```

3. เปิด Network tab
4. หา request ไป `/api/line-media`
5. ดู Response:
   - `200 OK` → URL ยังใช้ได้
   - `400/401/403` → URL หมดอายุหรือ token ไม่ถูกต้อง
   - `404` → ไม่พบไฟล์

**วิธีแก้:**
- ส่งวิดีโอใหม่ทดสอบ
- หรือบันทึกวิดีโอลง server/storage ถาวร

---

### 2. LINE Channel Access Token หมดอายุ 🔑

**ตรวจสอบ:**

```bash
# ดู .env
LINE_CHANNEL_ACCESS_TOKEN=...
```

**วิธีแก้:**
1. เปิด LINE Developers Console
2. ไปที่ Channel > Messaging API
3. Issue new token
4. อัพเดท `.env`
5. Restart server

---

### 3. CORS Error 🚫

**อาการ:**
```
Access to fetch at 'https://api-data.line.me/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**วิธีแก้:**
- ใช้ `/api/line-media` proxy (มีอยู่แล้ว)
- ตรวจสอบว่า video URL ใช้ proxy:
  ```typescript
  src="/api/line-media?url=..."  // ✅ ถูกต้อง
  src="https://api-data.line.me/..."  // ❌ จะโดน CORS
  ```

---

### 4. Video Format ไม่รองรับ 📹

**Browser รองรับ:**
- ✅ MP4 (H.264)
- ✅ WebM (VP8/VP9)
- ❌ AVI, MOV, FLV (ต้อง transcode)

**ตรวจสอบ:**
```javascript
// ใน Browser Console
const video = document.querySelector('video')
console.log(video.canPlayType('video/mp4'))  // "probably" หรือ "maybe"
```

---

### 5. Network Error 🌐

**ตรวจสอบ:**
1. เปิด Network tab
2. ดู request size
3. ถ้าวิดีโอใหญ่มาก (>50MB) อาจโหลดช้า

**วิธีแก้:**
- รอให้โหลดเสร็จ
- หรือใช้ `preload="metadata"` (มีอยู่แล้ว)

---

## วิธี Debug

### 1. เปิด Browser Console

```javascript
// ควรเห็น logs เหล่านี้:
🎬 Video message: { videoUrl: "...", finalVideoUrl: "..." }
🎬 Video loading started: /api/line-media?url=...
✅ Video metadata loaded: { duration: 178.7, videoWidth: 1920, videoHeight: 1080 }
✅ Video can play
```

### 2. ตรวจสอบ Network Tab

```
Request URL: http://localhost:3000/api/line-media?url=https://api-data.line.me/...
Status: 200 OK
Content-Type: video/mp4
Size: 2.5 MB
Time: 1.2s
```

### 3. ตรวจสอบ Video Element

```javascript
const video = document.querySelector('video')
console.log({
  src: video.src,
  readyState: video.readyState,  // 4 = HAVE_ENOUGH_DATA
  networkState: video.networkState,  // 2 = NETWORK_LOADING
  error: video.error,  // null = no error
  duration: video.duration,
  videoWidth: video.videoWidth,
  videoHeight: video.videoHeight
})
```

**readyState:**
- `0` = HAVE_NOTHING
- `1` = HAVE_METADATA
- `2` = HAVE_CURRENT_DATA
- `3` = HAVE_FUTURE_DATA
- `4` = HAVE_ENOUGH_DATA ✅

**networkState:**
- `0` = NETWORK_EMPTY
- `1` = NETWORK_IDLE
- `2` = NETWORK_LOADING
- `3` = NETWORK_NO_SOURCE ❌

---

## วิธีแก้ปัญหา

### แก้ที่ 1: ทดสอบด้วยวิดีโอใหม่

```bash
# ส่งวิดีโอใหม่ใน LINE
# URL จะยังไม่หมดอายุ
```

### แก้ที่ 2: บันทึกวิดีโอลง Storage

แก้ไข n8n workflow ให้ดาวน์โหลดและบันทึกวิดีโอ:

```javascript
// ใน Node "Code: Prepare Message Data"
case 'video':
  content = '[วีดีโอ]';
  
  // ดาวน์โหลดวิดีโอและบันทึกลง Supabase Storage
  const videoBlob = await fetch(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      }
    }
  ).then(r => r.blob());
  
  // Upload to Supabase Storage
  const fileName = `videos/${userId}/${messageId}.mp4`;
  const { data, error } = await supabase.storage
    .from('line-media')
    .upload(fileName, videoBlob);
  
  // ใช้ public URL แทน LINE URL
  metadata.media_url = data.publicUrl;
  metadata.line_media_url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  metadata.media_duration = fullEvent.message?.duration || null;
  break;
```

### แก้ที่ 3: ตรวจสอบ LINE Token

```bash
# Test LINE API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api-data.line.me/v2/bot/message/587766716437102865/content \
  --output test.mp4

# ถ้าได้ไฟล์ test.mp4 → Token ใช้ได้
# ถ้า error → Token หมดอายุ
```

### แก้ที่ 4: เพิ่ม Error UI

แสดง error message ให้ user เห็น:

```typescript
const [videoError, setVideoError] = useState(false)

<video
  onError={() => setVideoError(true)}
/>

{videoError && (
  <div className="text-red-500 text-sm">
    ⚠️ ไม่สามารถโหลดวิดีโอได้ (URL อาจหมดอายุ)
  </div>
)}
```

---

## ตรวจสอบ Logs

### Server Logs (Next.js):

```bash
# Terminal ที่รัน npm run dev
📡 LINE Media Proxy Request: { url: 'https://api-data.line.me/...' }
🔑 Using LINE token: eyJhbGciO...
📊 LINE API Response: { status: 200, contentType: 'video/mp4' }
✅ Successfully proxied LINE media: 2500000 bytes
```

### Browser Console:

```javascript
🎬 Video message: { videoUrl: "...", finalVideoUrl: "/api/line-media?url=..." }
🎬 Video loading started: /api/line-media?url=...
✅ Video metadata loaded: { duration: 178.7 }
✅ Video can play
```

---

## สรุป

### สาเหตุที่พบบ่อย:
1. ❌ **LINE URL หมดอายุ** (1-7 วัน)
2. ❌ **LINE Token หมดอายุ**
3. ❌ **Network slow** (วิดีโอใหญ่)

### วิธีแก้:
1. ✅ ส่งวิดีโอใหม่ทดสอบ
2. ✅ ตรวจสอบ Browser Console
3. ✅ ตรวจสอบ Network Tab
4. ✅ ตรวจสอบ LINE Token
5. ✅ พิจารณาบันทึกวิดีโอลง Storage ถาวร

---

## Next Steps

### ถ้าต้องการให้วิดีโอเล่นได้นาน:

1. **สร้าง Supabase Storage Bucket:**
   ```sql
   -- ใน Supabase Dashboard > Storage
   CREATE BUCKET line-media
   ```

2. **แก้ไข n8n workflow:**
   - ดาวน์โหลดวิดีโอจาก LINE
   - Upload ไป Supabase Storage
   - บันทึก public URL ลง database

3. **ผลลัพธ์:**
   - ✅ วิดีโอเล่นได้ตลอด
   - ✅ ไม่ต้องพึ่ง LINE URL
   - ✅ ควบคุม storage เอง

---

**🎬 ลองเปิด Browser Console แล้วดู error ว่าเป็นอะไร**
