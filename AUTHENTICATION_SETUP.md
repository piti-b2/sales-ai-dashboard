# 🔐 MAAS AI System - Authentication Setup Guide

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. ติดตั้ง Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 2. ไฟล์ที่สร้างแล้ว

#### Authentication Files
- ✅ `lib/supabase.ts` - Supabase client และ Types
- ✅ `lib/auth.ts` - Authentication functions (signIn, signOut, getCurrentUser)
- ✅ `middleware.ts` - Route protection middleware
- ✅ `app/api/auth/logout/route.ts` - Logout API endpoint

#### Updated Files
- ✅ `app/login/page.tsx` - Login page with Supabase integration
- ✅ `components/Header.tsx` - User info display และ logout button

#### Database Files
- ✅ `database/supabase-schema.sql` - Database schema
- ✅ `database/create-test-user.sql` - Test users creation script

---

## 🚀 ขั้นตอนการใช้งาน

### 1. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ที่ root ของโปรเจค:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**หา Keys ได้ที่:**
1. เปิด Supabase Dashboard
2. ไปที่ Settings → API
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. สร้าง Database Schema

1. เปิด Supabase Dashboard
2. ไปที่ SQL Editor
3. Copy code จาก `database/supabase-schema.sql`
4. รัน SQL

### 3. สร้าง Test Users

1. ใน SQL Editor
2. Copy code จาก `database/create-test-user.sql`
3. รัน SQL

**Test Users ที่สร้าง:**

| Email | Password | Role |
|-------|----------|------|
| admin@maasai.com | Admin@123456 | super_admin |
| manager@maasai.com | Manager@123456 | admin |
| user@maasai.com | User@123456 | user |

### 4. รันโปรเจค

```bash
npm run dev
```

เปิดเบราว์เซอร์: http://localhost:3000/login

---

## 🔒 Features ที่ทำงานแล้ว

### ✅ Login System
- Email/Password authentication
- Form validation
- Error handling
- Loading states
- Auto redirect หลัง login สำเร็จ

### ✅ Route Protection
- Middleware ป้องกันหน้าที่ต้อง login
- Auto redirect ไป `/login` ถ้ายังไม่ login
- ป้องกันเข้าหน้า login ถ้า login แล้ว

### ✅ User Session
- แสดงข้อมูล user ที่ login
- แสดง role (Super Admin, Admin, Manager, User)
- Dropdown menu พร้อมปุ่ม logout

### ✅ Logout System
- ปุ่ม logout ใน Header
- API endpoint สำหรับ logout
- Auto redirect ไป `/login` หลัง logout

### ✅ Security
- Row Level Security (RLS) enabled
- Password hashing (bcrypt)
- Session management
- Protected routes

---

## 📋 การทำงานของระบบ

### Login Flow
```
1. User กรอก email/password
2. Frontend เรียก signIn() function
3. Supabase Auth ตรวจสอบ credentials
4. ดึงข้อมูล user จาก public.users table
5. ตรวจสอบ status (ต้องเป็น 'active')
6. อัปเดต last_login_at
7. Redirect ไป Dashboard
```

### Route Protection Flow
```
1. User พยายามเข้าหน้าใดๆ
2. Middleware ตรวจสอบ session
3. ถ้าไม่มี session และไม่ใช่ public route → redirect /login
4. ถ้ามี session และพยายามเข้า /login → redirect /
5. อนุญาตให้เข้าหน้าได้
```

### Logout Flow
```
1. User คลิกปุ่ม logout
2. เรียก signOut() function
3. Supabase ลบ session
4. Redirect ไป /login
```

---

## 🛠️ การปรับแต่ง

### เพิ่ม Public Routes
แก้ไขใน `middleware.ts`:

```typescript
const publicRoutes = ['/login', '/forgot-password', '/your-new-route']
```

### เปลี่ยนหน้า Redirect หลัง Login
แก้ไขใน `app/login/page.tsx`:

```typescript
if (user) {
  router.push('/your-dashboard') // เปลี่ยนจาก '/'
  router.refresh()
}
```

### เพิ่ม User Permissions
ใช้ตาราง `user_permissions`:

```sql
INSERT INTO public.user_permissions (user_id, permission, granted_by)
VALUES (
  'user-uuid',
  'manage_customers',
  'admin-uuid'
);
```

---

## 🐛 Troubleshooting

### ปัญหา: Login ไม่ได้
**แก้ไข:**
1. ตรวจสอบ `.env.local` ว่ามี keys ครบ
2. ตรวจสอบว่า user มีใน `auth.users` และ `public.users`
3. ตรวจสอบ user status เป็น 'active'
4. เช็ค Console ใน Browser (F12)

### ปัญหา: Redirect loop
**แก้ไข:**
1. Clear browser cookies
2. ตรวจสอบ middleware config
3. ลอง logout แล้ว login ใหม่

### ปัญหา: User data ไม่แสดง
**แก้ไข:**
1. ตรวจสอบ RLS policies ใน Supabase
2. เช็คว่า user มีข้อมูลใน `public.users`
3. ดู Network tab ใน Browser DevTools

---

## 📚 API Reference

### signIn(email, password)
```typescript
const { user, error } = await signIn(
  'admin@maasai.com',
  'Admin@123456'
)
```

### signOut()
```typescript
const { error } = await signOut()
```

### getCurrentUser()
```typescript
const user = await getCurrentUser()
// Returns: User | null
```

### getSession()
```typescript
const session = await getSession()
// Returns: Session | null
```

---

## 🔐 Security Best Practices

1. ✅ **ไม่เก็บ password แบบ plain text** - ใช้ bcrypt
2. ✅ **ใช้ HTTPS** - ใน production
3. ✅ **Enable RLS** - ทุกตาราง
4. ✅ **Validate input** - ทั้ง client และ server
5. ✅ **Session timeout** - Supabase จัดการให้
6. ✅ **Rate limiting** - ควรเพิ่มใน production

---

## 📝 Next Steps

### Features ที่ควรเพิ่ม:
- [ ] Forgot Password
- [ ] Change Password
- [ ] Two-Factor Authentication (2FA)
- [ ] Email Verification
- [ ] Remember Me (longer session)
- [ ] Activity Log
- [ ] Session Management (view/revoke sessions)

### Admin Features:
- [ ] User Management (CRUD)
- [ ] Role Management
- [ ] Permission Management
- [ ] Audit Logs

---

## 🎉 สรุป

ระบบ Authentication พร้อมใช้งานแล้ว! คุณสามารถ:

✅ Login ด้วย email/password  
✅ ป้องกัน routes ที่ต้อง authentication  
✅ แสดงข้อมูล user ที่ login  
✅ Logout ออกจากระบบ  
✅ จัดการ user roles และ permissions  

**ทดสอบได้ที่:** http://localhost:3000/login

**Test Account:**
- Email: `admin@maasai.com`
- Password: `Admin@123456`
