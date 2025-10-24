-- ============================================
-- ตรวจสอบและแก้ไขปัญหา Login
-- ============================================

-- 1. ตรวจสอบว่ามี users อยู่หรือไม่
SELECT 
  id,
  email,
  full_name,
  role,
  status,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- 2. ตรวจสอบ RLS Policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users';

-- 3. แก้ไข RLS - ปิดชั่วคราวเพื่อให้ทำงานได้
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. ตรวจสอบว่า auth.users มีข้อมูลหรือไม่
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- ถ้ายังไม่มี users ให้รันคำสั่งนี้
-- ============================================

-- สร้าง Super Admin
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@maasai.com',
  crypt('Admin@123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- เพิ่มข้อมูลใน public.users (ใช้ id จากด้านบน)
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status
)
SELECT 
  id,
  'admin@maasai.com',
  'Super Admin',
  'super_admin',
  'active'
FROM auth.users
WHERE email = 'admin@maasai.com'
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ตรวจสอบอีกครั้ง
-- ============================================

SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.status,
  au.email_confirmed_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'admin@maasai.com';
