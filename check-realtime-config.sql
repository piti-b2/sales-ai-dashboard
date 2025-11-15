-- ตรวจสอบการตั้งค่า Realtime สำหรับ chat_messages

-- 1. ตรวจสอบว่าตาราง chat_messages อยู่ใน publication หรือไม่
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'chat_messages';

-- ถ้าไม่มีผลลัพธ์ ให้รันคำสั่งนี้:
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 2. ตรวจสอบ RLS (Row Level Security)
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'chat_messages';

-- 3. ตรวจสอบ policies ที่เกี่ยวข้อง
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'chat_messages';

-- 4. ถ้า Realtime ยังไม่ทำงาน ให้เปิดใช้งาน
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS chat_messages;

-- 5. ตรวจสอบว่า Realtime ทำงานหรือไม่
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

COMMENT ON TABLE chat_messages IS 'Realtime enabled for live chat updates';
