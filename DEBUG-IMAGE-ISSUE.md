# Debug Image Loading Issue

## ปัญหา
- รูปจาก Supabase Storage แสดงได้
- รูปจาก LINE (ผ่าน proxy API) แสดงไม่ได้ (สีดำ)
- วีดีโอจาก LINE แสดงได้

## ตรวจสอบ

### 1. เปิด DevTools (F12)
- ไปที่แท็บ **Network**
- Filter: **Img**
- Refresh หน้าเว็บ

### 2. ดูรายการรูป
ควรเห็น:
```
✅ payment_slip-b2fb3e09-585169535368692258.jpg (200 OK)
❌ /api/line-media?url=https%3A%2F%2Fapi-data.line.me... (???)
```

### 3. คลิกที่ request ที่ fail
ดู:
- **Status Code:** 200? 401? 403? 500?
- **Response:** มีข้อมูลอะไร?
- **Headers:** มี CORS error?

## สาเหตุที่เป็นไปได้

### A. Proxy API ไม่ทำงาน
```
Status: 500
Response: {"error":"LINE token not configured"}
```
**แก้:** เช็ค `.env.local` มี `LINE_CHANNEL_ACCESS_TOKEN`

### B. LINE API Error
```
Status: 200
Response: {"message":"Authentication failed..."}
```
**แก้:** Token หมดอายุหรือไม่ถูกต้อง

### C. CORS Error
```
Console: Access to image at '...' has been blocked by CORS policy
```
**แก้:** เพิ่ม CORS headers ใน proxy API

### D. Image ใหญ่เกินไป
```
Status: 200
Response: (binary data)
Size: > 10MB
```
**แก้:** เพิ่ม timeout หรือ limit

## วิธีแก้ชั่วคราว

ถ้าต้องการดูรูปด่วน ให้:
1. คลิกขวาที่รูปสีดำ
2. เลือก "Open image in new tab"
3. ดู URL และ error message
