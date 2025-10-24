-- ============================================
-- แก้ไข RLS Policy สำหรับตาราง users
-- ============================================

-- วิธีที่ 1: ปิด RLS ชั่วคราว (สำหรับ Development)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- หรือ วิธีที่ 2: เพิ่ม Policy ที่อนุญาตให้อ่านได้ทั้งหมด
-- (ถ้าต้องการเปิด RLS แต่อนุญาตให้ทุกคนที่ login แล้วอ่านได้)

-- ลบ Policy เดิม
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.users;

-- สร้าง Policy ใหม่ที่อนุญาตให้ทุกคนที่ authenticated อ่านได้
CREATE POLICY "Allow authenticated users to read all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- เปิด RLS อีกครั้ง
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ตรวจสอบ Policy
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users';
