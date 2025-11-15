# 🛍️ Product Carousel Guide

## ปัญหาที่พบ

เมื่อ AI ส่งข้อความแนะนำสินค้า ระบบบันทึก `content` เป็น JSON string:

```json
{
  "message": "สำหรับน้อง 3-6 ขวบ...",
  "action": "show_product_carousel",
  "products": [
    {
      "product_id": "prod_phonics_chart_th",
      "name": "Phonics Charts",
      "description": "ชาร์ตโฟนิกส์ 44 เสียง สำหรับเด็ก 3-6 ปี",
      "image_url": "https://i.ibb.co/...",
      "price": "฿590"
    }
  ]
}
```

แต่เว็บแสดงเป็น **ข้อความ JSON** แทนที่จะเป็น **Product Card**

---

## การแก้ไข

### ✅ แก้ไข MessageBubble.tsx

เพิ่มการตรวจจับและ parse JSON content:

```typescript
case 'text':
  // 1. ตรวจสอบว่า content เป็น JSON หรือไม่
  let parsedContent = null
  try {
    if (message.content?.startsWith('{') || message.content?.startsWith('[')) {
      parsedContent = JSON.parse(message.content)
    }
  } catch (e) {
    // ไม่ใช่ JSON ให้แสดงเป็นข้อความธรรมดา
  }

  // 2. ถ้าเป็น product carousel ให้แสดงเป็น card
  if (parsedContent?.action === 'show_product_carousel' && parsedContent?.products) {
    return <ProductCard products={parsedContent.products} />
  }

  // 3. แสดงข้อความธรรมดา
  return <div>{parsedContent?.message || message.content}</div>
```

---

## Product Card Component

### Layout Structure:

```
┌─────────────────────────┐
│   Product Image         │ ← aspect-video
├─────────────────────────┤
│ Product Name            │ ← font-bold text-lg
│ Description             │ ← text-sm text-gray-600
│ ฿590                    │ ← text-xl text-green-600
├─────────────────────────┤
│ [ดูรายละเอียด]          │ ← bg-green-500
│ [สั่งซื้อเลย]           │ ← bg-white border
└─────────────────────────┘
```

### CSS Classes:

```css
/* Card Container */
rounded-2xl overflow-hidden shadow-md bg-white max-w-sm

/* Image */
aspect-video object-cover

/* Product Name */
font-bold text-lg text-gray-900

/* Description */
text-sm text-gray-600

/* Price */
text-xl font-bold text-green-600

/* Primary Button */
bg-green-500 hover:bg-green-600 text-white

/* Secondary Button */
bg-white hover:bg-gray-50 text-gray-700 border
```

---

## ตัวอย่างการใช้งาน

### Input (จาก AI):

```json
{
  "message": "สำหรับน้อง 3-6 ขวบที่ยังไม่เคยเรียนโฟนิกส์ ครูโบว์แนะนำ Phonics Charts ค่ะ",
  "action": "show_product_carousel",
  "products": [
    {
      "product_id": "prod_phonics_chart_th",
      "name": "Phonics Charts",
      "description": "ชาร์ตโฟนิกส์ 44 เสียง สำหรับเด็ก 3-6 ปี",
      "image_url": "https://i.ibb.co/bRdKLp90/LINE-ALBUM-tie-in-250425-13.jpg",
      "price": "฿590"
    }
  ]
}
```

### Output (บนเว็บ):

```
┌─────────────────────────────────┐
│ สำหรับน้อง 3-6 ขวบที่ยังไม่เคย │
│ เรียนโฟนิกส์ ครูโบว์แนะนำ      │
│ Phonics Charts ค่ะ              │
├─────────────────────────────────┤
│ [รูปภาพ Phonics Charts]         │
├─────────────────────────────────┤
│ Phonics Charts                  │
│ ชาร์ตโฟนิกส์ 44 เสียง          │
│ สำหรับเด็ก 3-6 ปี               │
│ ฿590                            │
├─────────────────────────────────┤
│ [ดูรายละเอียด]                  │
│ [สั่งซื้อเลย]                   │
└─────────────────────────────────┘
```

---

## JSON Content Types

### 1. Product Carousel (แนะนำสินค้า)

```json
{
  "message": "ข้อความแนะนำ",
  "action": "show_product_carousel",
  "products": [...]
}
```

**แสดงเป็น:** Product Card พร้อมรูปภาพและปุ่ม

### 2. Text Message (ข้อความธรรมดา)

```json
{
  "message": "สวัสดีค่ะ"
}
```

**แสดงเป็น:** ข้อความธรรมดา

### 3. Plain Text (ไม่ใช่ JSON)

```
"สวัสดีค่ะ ยินดีต้อนรับ"
```

**แสดงเป็น:** ข้อความธรรมดา

---

## การทดสอบ

### 1. ทดสอบ Product Carousel:

```bash
# 1. ส่งข้อความถามเกี่ยวกับสินค้า
"อยากให้ลูกเรียนโฟนิกส์"

# 2. AI ตอบพร้อมแนะนำสินค้า
# 3. ตรวจสอบว่าเว็บแสดง Product Card
```

### 2. ตรวจสอบ Database:

```sql
SELECT 
  id,
  content,
  message_type,
  sender_type
FROM chat_messages
WHERE content LIKE '%show_product_carousel%'
ORDER BY created_at DESC
LIMIT 1;
```

### 3. ตรวจสอบ Browser Console:

```javascript
// ควรเห็น log นี้เมื่อคลิกปุ่ม:
// View details: { product_id: '...', name: '...', ... }
// Order: { product_id: '...', name: '...', ... }
```

---

## Button Actions (TODO)

ปัจจุบันปุ่มยังไม่ได้เชื่อมต่อกับ backend ต้องเพิ่ม:

### 1. ดูรายละเอียด:

```typescript
onClick={() => {
  // เปิดหน้ารายละเอียดสินค้า
  window.open(`/products/${product.product_id}`, '_blank')
}}
```

### 2. สั่งซื้อเลย:

```typescript
onClick={() => {
  // เปิดหน้าชำระเงิน
  window.open(`/checkout?product=${product.product_id}`, '_blank')
}}
```

### 3. ส่งข้อความกลับไป LINE:

```typescript
onClick={async () => {
  // ส่งข้อความว่าสนใจสินค้า
  await sendMessage(`สนใจ ${product.name} ค่ะ`)
}}
```

---

## Troubleshooting

### ปัญหา: ยังแสดงเป็น JSON string

**วิธีแก้:**
1. ตรวจสอบว่า `message.content` เริ่มต้นด้วย `{` หรือไม่
2. ลอง parse ใน Browser Console:
   ```javascript
   JSON.parse(message.content)
   ```
3. ตรวจสอบว่ามี `action: "show_product_carousel"` หรือไม่

### ปัญหา: รูปภาพไม่แสดง

**วิธีแก้:**
1. ตรวจสอบ `image_url` ใน database
2. ลองเปิด URL ในเบราว์เซอร์
3. ตรวจสอบ CORS settings
4. ดู Network tab ใน DevTools

### ปัญหา: ปุ่มไม่ทำงาน

**วิธีแก้:**
1. เปิด Browser Console
2. คลิกปุ่ม
3. ดู log ว่ามี `View details:` หรือ `Order:` หรือไม่
4. ถ้าไม่มี ตรวจสอบ `onClick` handler

---

## Future Enhancements

### 1. Multiple Products Carousel:

```typescript
// แสดงหลายสินค้าในแนวนอน (scrollable)
<div className="flex gap-4 overflow-x-auto">
  {products.map(product => <ProductCard />)}
</div>
```

### 2. Quick Buy Button:

```typescript
// ซื้อด่วนโดยไม่ต้องเปิดหน้าใหม่
<button onClick={() => quickBuy(product)}>
  ซื้อเลย ฿{product.price}
</button>
```

### 3. Add to Cart:

```typescript
// เพิ่มลงตะกร้า
<button onClick={() => addToCart(product)}>
  🛒 เพิ่มลงตะกร้า
</button>
```

### 4. Product Variants:

```typescript
// เลือกตัวเลือกสินค้า (สี, ขนาด)
{product.variants && (
  <select>
    {product.variants.map(v => <option>{v.name}</option>)}
  </select>
)}
```

---

## สรุป

### ก่อนแก้ไข:
```
{"message":"สำหรับน้อง 3-6 ขวบ...","action":"show_product_carousel",...}
```
❌ แสดงเป็น JSON string

### หลังแก้ไข:
```
┌─────────────────────┐
│ [รูป Phonics Charts]│
│ Phonics Charts      │
│ ฿590                │
│ [ดูรายละเอียด]      │
└─────────────────────┘
```
✅ แสดงเป็น Product Card

---

**🎉 Product Carousel พร้อมใช้งานแล้ว!**
