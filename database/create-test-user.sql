-- ============================================
-- MAAS AI System - Create Test Users
-- ============================================

-- สร้าง Super Admin (ผู้ดูแลระบบสูงสุด)
-- Email: admin@maasai.com
-- Password: Admin@123456

DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- สร้าง User ใน auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'admin@maasai.com',
    crypt('Admin@123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- สร้างข้อมูลใน public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status,
    phone,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'admin@maasai.com',
    'Super Admin',
    'super_admin',
    'active',
    '081-234-5678',
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Super Admin created successfully with ID: %', new_user_id;
END $$;

-- ============================================
-- สร้าง Admin (ผู้ดูแลระบบ)
-- Email: manager@maasai.com
-- Password: Manager@123456
-- ============================================

DO $$
DECLARE
  new_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'manager@maasai.com',
    crypt('Manager@123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Manager User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status,
    phone,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'manager@maasai.com',
    'Manager User',
    'admin',
    'active',
    '082-345-6789',
    (SELECT id FROM public.users WHERE email = 'admin@maasai.com'),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Admin created successfully with ID: %', new_user_id;
END $$;

-- ============================================
-- สร้าง User ทั่วไป (สำหรับทดสอบ)
-- Email: user@maasai.com
-- Password: User@123456
-- ============================================

DO $$
DECLARE
  new_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'user@maasai.com',
    crypt('User@123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status,
    phone,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'user@maasai.com',
    'Test User',
    'user',
    'active',
    '083-456-7890',
    (SELECT id FROM public.users WHERE email = 'admin@maasai.com'),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'User created successfully with ID: %', new_user_id;
END $$;

-- ============================================
-- ตรวจสอบผู้ใช้ที่สร้าง
-- ============================================

SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.status,
  u.created_at
FROM public.users u
ORDER BY 
  CASE u.role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'user' THEN 4
  END;

-- ============================================
-- สรุปข้อมูล Login
-- ============================================

/*
==============================================
✅ Test Users Created Successfully!
==============================================

1. Super Admin
   Email: admin@maasai.com
   Password: Admin@123456
   Role: super_admin
   
2. Admin
   Email: manager@maasai.com
   Password: Manager@123456
   Role: admin
   
3. User
   Email: user@maasai.com
   Password: User@123456
   Role: user

==============================================
🔐 ใช้ข้อมูลเหล่านี้เพื่อ Login ที่:
http://localhost:3000/login
==============================================
*/
