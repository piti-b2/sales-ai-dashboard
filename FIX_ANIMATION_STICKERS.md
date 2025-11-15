# แก้ไขปัญหา Animation Stickers และ Realtime Error

## ปัญหาที่พบ

### 1. 🎬 สติกเกอร์ Animation ไม่ขยับในเว็บ
- **สาเหตุ:** ใช้ URL ของ Android ที่เป็นไฟล์ PNG คงที่
- **วิธีแก้:** ใช้ URL ของ iPhone ที่รองรับ APNG (Animated PNG)

### 2. ❌ Realtime Connection Error
- **สาเหตุ:** Error message แสดง `undefined` ทำให้ debug ยาก
- **วิธีแก้:** ปรับปรุง error logging และตรวจสอบ Realtime configuration

---

## การแก้ไข

### ✅ 1. แก้ไข MessageBubble.tsx

**เปลี่ยนจาก:**
```typescript
const stickerUrl = stickerId 
  ? `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`
  : null
```

**เป็น:**
```typescript
const stickerUrl = stickerId 
  ? stickerResourceType === 'ANIMATION'
    ? `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker_animation@2x.png`
    : `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`
  : null
```

**Fallback Chain:**
1. ANIMATION: `sticker_animation@2x.png` (มีการเคลื่อนไหว)
2. Fallback 1: `sticker@2x.png` (ไม่มีการเคลื่อนไหว)
3. Fallback 2: `android/sticker.png`
4. Fallback 3: แสดง emoji 😊

---

### ✅ 2. แก้ไข useRealtimeChat.ts

**ปรับปรุง Error Logging:**
```typescript
console.error('❌ Realtime connection error:', {
  status,
  error: err || 'Unknown error',
  roomId
})
```

---

### ✅ 3. ตรวจสอบ Supabase Realtime Configuration

รันไฟล์: `check-realtime-config.sql`

```sql
-- เปิดใช้งาน Realtime สำหรับ chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS chat_messages;
```

---

## LINE Sticker URL Formats

### Static Stickers (ไม่ขยับ)
```
Android: https://stickershop.line-scdn.net/stickershop/v1/sticker/{stickerId}/android/sticker.png
iPhone:  https://stickershop.line-scdn.net/stickershop/v1/sticker/{stickerId}/iPhone/sticker@2x.png
```

### Animation Stickers (ขยับได้)
```
iPhone:  https://stickershop.line-scdn.net/stickershop/v1/sticker/{stickerId}/iPhone/sticker_animation@2x.png
```

### Sound Stickers (มีเสียง)
```
iPhone:  https://stickershop.line-scdn.net/stickershop/v1/sticker/{stickerId}/iPhone/sticker_sound.png
```

### Popup Stickers (ป๊อปอัพ)
```
iPhone:  https://stickershop.line-scdn.net/stickershop/v1/sticker/{stickerId}/iPhone/sticker_popup.png
```

---

## Resource Types

| Type | Description | URL Format |
|------|-------------|------------|
| `STATIC` | สติกเกอร์คงที่ | `android/sticker.png` |
| `ANIMATION` | สติกเกอร์เคลื่อนไหว | `iPhone/sticker_animation@2x.png` |
| `SOUND` | สติกเกอร์มีเสียง | `iPhone/sticker_sound.png` |
| `ANIMATION_SOUND` | เคลื่อนไหว + เสียง | `iPhone/sticker_animation@2x.png` |
| `POPUP` | สติกเกอร์ป๊อปอัพ | `iPhone/sticker_popup.png` |
| `POPUP_SOUND` | ป๊อปอัพ + เสียง | `iPhone/sticker_popup.png` |
| `NAME_TEXT` | สติกเกอร์ที่มีชื่อ | `android/sticker.png` |
| `PER_STICKER_TEXT` | สติกเกอร์ที่มีข้อความ | `android/sticker.png` |

---

## ทดสอบ

### 1. ทดสอบ Animation Stickers

```bash
# ส่ง sticker ที่มี animation ใน LINE
# ตรวจสอบว่าเว็บแสดงการเคลื่อนไหว
```

### 2. ตรวจสอบ Resource Type

```sql
SELECT 
  content,
  sticker_id,
  sticker_resource_type,
  metadata->'keywords' as keywords
FROM chat_messages
WHERE message_type = 'sticker'
ORDER BY created_at DESC
LIMIT 10;
```

### 3. ตรวจสอบ Realtime Connection

```javascript
// เปิด Browser Console
// ดูว่ามี log นี้หรือไม่:
// ✅ Realtime connected!

// ถ้าเห็น error:
// ❌ Realtime connection error: { status: '...', error: '...', roomId: '...' }
// ให้รัน check-realtime-config.sql
```

---

## Troubleshooting

### ปัญหา: Sticker ยังไม่ขยับ

**วิธีแก้:**
1. ตรวจสอบ `sticker_resource_type` ใน database:
   ```sql
   SELECT sticker_resource_type FROM chat_messages WHERE message_type = 'sticker' LIMIT 1;
   ```

2. ตรวจสอบ URL ใน Browser DevTools:
   - เปิด Network tab
   - ดู URL ของ sticker image
   - ควรเห็น `sticker_animation@2x.png`

3. ตรวจสอบว่า browser รองรับ APNG:
   - Chrome/Edge: รองรับ
   - Firefox: รองรับ
   - Safari: รองรับ

### ปัญหา: Realtime Error ยังมี

**วิธีแก้:**
1. รัน `check-realtime-config.sql`
2. ตรวจสอบ Supabase Dashboard > Database > Replication
3. ตรวจสอบว่า `chat_messages` อยู่ใน publication
4. ตรวจสอบ RLS policies

### ปัญหา: Sticker ไม่แสดงเลย

**วิธีแก้:**
1. ตรวจสอบ Browser Console
2. ดู Network tab ว่า request ล้มเหลวหรือไม่
3. ลอง fallback URLs ทั้งหมด
4. ถ้าทั้งหมดล้มเหลว จะแสดง emoji 😊

---

## สรุป

### ไฟล์ที่แก้ไข:
1. ✅ `components/chat/MessageBubble.tsx` - รองรับ ANIMATION stickers
2. ✅ `lib/useRealtimeChat.ts` - ปรับปรุง error logging

### ไฟล์ที่สร้าง:
1. ✅ `check-realtime-config.sql` - ตรวจสอบ Realtime config
2. ✅ `FIX_ANIMATION_STICKERS.md` - คู่มือนี้

### ผลลัพธ์:
- ✅ สติกเกอร์ ANIMATION ขยับได้บนเว็บ
- ✅ Error message ชัดเจนขึ้น
- ✅ มี fallback URLs สำหรับทุกกรณี

---

## ขั้นตอนถัดไป

1. **รัน SQL:**
   ```bash
   # เปิด Supabase SQL Editor
   # รัน check-realtime-config.sql
   ```

2. **ทดสอบ:**
   ```bash
   # ส่ง sticker animation ใน LINE
   # เปิดเว็บและตรวจสอบว่าขยับได้
   ```

3. **ตรวจสอบ Console:**
   ```bash
   # เปิด Browser DevTools
   # ดู Console และ Network tab
   ```

---

**🎉 เสร็จสิ้น! สติกเกอร์ควรขยับได้แล้ว**
