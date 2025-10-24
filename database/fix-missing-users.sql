-- ============================================
-- แก้ไขปัญหา: เพิ่มข้อมูลใน public.users
-- ============================================

-- 1. ลบข้อมูลเก่าถ้ามี (เผื่อมีข้อมูลซ้ำ)
DELETE FROM public.users;

-- 2. เพิ่มข้อมูลทั้ง 3 users จาก auth.users ไปยัง public.users

-- Super Admin
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status,
  phone,
  created_at,
  updated_at
)
VALUES (
  '7a20b30f-56bb-4055-8637-d4ae392406bd',
  'admin@maasai.com',
  'Super Admin',
  'super_admin',
  'active',
  '081-234-5678',
  NOW(),
  NOW()
);

-- Admin
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status,
  phone,
  created_at,
  updated_at
)
VALUES (
  '45010789-7467-472f-9270-ce239080712b',
  'manager@maasai.com',
  'Manager User',
  'admin',
  'active',
  '082-345-6789',
  NOW(),
  NOW()
);

-- User
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status,
  phone,
  created_at,
  updated_at
)
VALUES (
  '1e0121ad-2e58-4140-a922-a099f74850d7',
  'user@maasai.com',
  'Test User',
  'user',
  'active',
  '083-456-7890',
  NOW(),
  NOW()
);

-- 3. ตรวจสอบว่าเพิ่มสำเร็จ
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.status,
  au.email_confirmed_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.role;

-- 4. ปิด RLS (ถ้ายังไม่ได้ปิด)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
