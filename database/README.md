# MAAS - Database Schema

## 📊 ภาพรวมฐานข้อมูล

ระบบ MAAS AI ใช้ Supabase (PostgreSQL) เป็นฐานข้อมูลหลัก ประกอบด้วย 12 กลุ่มตารางหลัก

## 🗂️ โครงสร้างตาราง

### 1. Users & Authentication (2 ตาราง)
- **`users`** - ข้อมูลผู้ใช้งานระบบ (Admin เท่านั้น)
  - Roles: `super_admin`, `admin`, `manager`, `user`
  - Status: `active`, `inactive`, `suspended`
  - **ไม่มีการสมัครสมาชิกเอง - Admin สร้างให้เท่านั้น**
  
- **`user_permissions`** - สิทธิ์การใช้งานของผู้ใช้

### 2. Customers & Leads (2 ตาราง)
- **`customers`** - ข้อมูลลูกค้าและ Lead
  - Lead Score: 0-100
  - Lead Status: `cold`, `warm`, `hot`, `converted`
  - Customer Type: `regular`, `vip`, `enterprise`
  
- **`lead_score_history`** - ประวัติการเปลี่ยนแปลง Lead Score

### 3. Products & Courses (1 ตาราง)
- **`products`** - สินค้าและคอร์สเรียน
  - Types: `course`, `book`, `bundle`

### 4. Orders & Payments (4 ตาราง)
- **`orders`** - คำสั่งซื้อ
  - ติดตามว่าปิดโดย AI หรือ Admin
  
- **`order_items`** - รายการสินค้าในคำสั่งซื้อ

- **`installment_plans`** - แผนผ่อนชำระ

- **`installment_payments`** - การชำระแต่ละงวด

### 5. Customer Purchases (1 ตาราง)
- **`customer_purchases`** - สิทธิ์การเข้าถึงคอร์ส
  - หมดอายุ 3 ปีหลังซื้อ

### 6. Messages & Conversations (2 ตาราง)
- **`conversations`** - การสนทนา

- **`messages`** - ข้อความ
  - Sender Types: `customer`, `ai`, `admin`

### 7. AI Interactions (2 ตาราง)
- **`ai_interactions`** - บันทึกการทำงานของ AI
  - Confidence Score
  - Escalation tracking
  - Token usage & cost
  
- **`sales_statistics`** - สถิติการขาย AI vs Admin

### 8. Support Tickets (2 ตาราง)
- **`support_tickets`** - ระบบ Ticket
  - Priority: `low`, `medium`, `high`, `critical`
  
- **`ticket_messages`** - ข้อความใน Ticket

### 9. Follow-ups (1 ตาราง)
- **`follow_ups`** - การติดตามลูกค้าอัตโนมัติ
  - Types: `day_7`, `course_completion`, `upsell`, `feedback`

### 10. Promotions (1 ตาราง)
- **`promotions`** - โปรโมชั่นและส่วนลด

### 11. Common Issues (1 ตาราง)
- **`common_issues`** - ฐานความรู้ AI (FAQ)

### 12. System Settings (1 ตาราง)
- **`system_settings`** - การตั้งค่าระบบ

---

## 🔐 ระบบความปลอดภัย

### Row Level Security (RLS)
- เปิดใช้งาน RLS บนทุกตารางสำคัญ
- Policy แยกตาม Role
- ผู้ใช้ทั่วไปเห็นเฉพาะข้อมูลของตัวเอง
- Admin เห็นข้อมูลทั้งหมด

### Authentication
- ใช้ Supabase Auth
- **ไม่มี Public Registration**
- Admin สร้าง User ผ่าน Dashboard เท่านั้น

---

## 📈 Features สำคัญ

### 1. Lead Scoring System
```sql
Lead Score: 0-100
- Cold: 0-39
- Warm: 40-79
- Hot: 80-100
- Converted: ปิดการขายแล้ว
```

### 2. AI vs Admin Tracking
- ติดตามว่าใครปิดการขาย
- เปรียบเทียบประสิทธิภาพ
- วัด Response Time, Conversion Rate

### 3. Auto Escalation
- VIP Customer → แจ้งแอดมินทันที
- Hot Lead (>80) → แจ้งแอดมิน
- Technical Issues → Escalate

### 4. Customer Lifetime Value
- คำนวณอัตโนมัติจาก Orders
- อัปเดตทุกครั้งที่มีการชำระเงิน

### 5. Course Access Management
- หมดอายุ 3 ปีหลังซื้อ
- ติดตามสิทธิ์การเข้าถึง

---

## 🚀 การติดตั้ง

### 1. สร้าง Supabase Project
1. ไปที่ https://supabase.com
2. สร้าง Project ใหม่
3. เลือก Region: Singapore (ใกล้ไทยที่สุด)

### 2. รัน Schema
1. เปิด SQL Editor ใน Supabase Dashboard
2. Copy code จาก `supabase-schema.sql`
3. รัน SQL

### 3. ตั้งค่า Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. สร้าง Super Admin แรก
```sql
-- รันใน SQL Editor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  'admin@maasai.com',
  crypt('your_password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- เพิ่มข้อมูลใน users table
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@maasai.com'),
  'admin@maasai.com',
  'Super Admin',
  'super_admin',
  'active'
);
```

---

## 📊 Indexes

มี Indexes สำหรับ:
- Customer lookups (email, LINE ID, lead status)
- Order queries (customer, status, date)
- Message searches (conversation, date)
- AI interactions (customer, date)
- Support tickets (customer, status, priority)

---

## 🔄 Triggers & Functions

### Auto-update Triggers
- `updated_at` - อัปเดตอัตโนมัติทุกครั้งที่แก้ไข

### Business Logic Triggers
- `calculate_customer_lifetime_value()` - คำนวณ CLV เมื่อมีการชำระเงิน

---

## 📝 ตัวอย่างการใช้งาน

### สร้าง User ใหม่ (Admin only)
```typescript
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'secure_password',
  email_confirm: true,
  user_metadata: {
    full_name: 'John Doe',
    role: 'user'
  }
})
```

### ดึงข้อมูล Hot Leads
```typescript
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('lead_status', 'hot')
  .order('lead_score', { ascending: false })
```

### บันทึก AI Interaction
```typescript
const { data } = await supabase
  .from('ai_interactions')
  .insert({
    customer_id: customerId,
    intent: 'product_inquiry',
    confidence_score: 0.95,
    ai_response: 'AI response text',
    tokens_used: 150,
    cost: 0.003
  })
```

---

## 🎯 KPIs ที่ติดตาม

1. **Lead Conversion Rate** - จาก cold → hot → converted
2. **AI vs Admin Performance** - ใครปิดเซลส์เก่งกว่า
3. **Response Time** - เวลาตอบกลับเฉลี่ย
4. **Customer Lifetime Value** - มูลค่าลูกค้าตลอดชีพ
5. **AI Accuracy** - Confidence Score เฉลี่ย
6. **Escalation Rate** - อัตราการส่งต่อแอดมิน

---

## 📞 Support

หากมีปัญหาหรือคำถาม:
- Email: support@maasai.com
- Documentation: https://docs.maasai.com
