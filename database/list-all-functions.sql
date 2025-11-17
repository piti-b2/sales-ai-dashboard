-- =====================================================
-- ดูฟังก์ชันและ Triggers ทั้งหมดใน Supabase
-- =====================================================

-- =====================================================
-- 1. ดูรายการฟังก์ชันทั้งหมด
-- =====================================================
SELECT 
  routine_name as function_name,
  routine_type as type,
  data_type as return_type,
  routine_schema as schema
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =====================================================
-- 2. ดู Code ของฟังก์ชันทั้งหมด
-- =====================================================
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- f = function
ORDER BY p.proname;

-- =====================================================
-- 3. ดู Code ของฟังก์ชันเฉพาะ
-- =====================================================
-- แทนที่ 'sync_message_to_chat' ด้วยชื่อฟังก์ชันที่ต้องการ
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'sync_message_to_chat';

-- =====================================================
-- 4. ดู Triggers ทั้งหมด
-- =====================================================
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_statement as function_call,
  event_manipulation as event,
  action_timing as timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 5. ดู Trigger + Function Code
-- =====================================================
SELECT 
  t.trigger_name,
  t.event_object_table as table_name,
  t.event_manipulation as event,
  t.action_timing as timing,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_code
FROM information_schema.triggers t
JOIN pg_proc p ON t.action_statement LIKE '%' || p.proname || '%'
WHERE t.trigger_schema = 'public'
ORDER BY t.event_object_table, t.trigger_name;

-- =====================================================
-- 6. ดูข้อมูลละเอียดของฟังก์ชัน
-- =====================================================
SELECT 
  p.proname as function_name,
  pg_catalog.pg_get_function_arguments(p.oid) as arguments,
  pg_catalog.pg_get_function_result(p.oid) as return_type,
  l.lanname as language,
  CASE p.provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility,
  p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- =====================================================
-- 7. Export ทั้งหมดเป็น SQL Script
-- =====================================================
-- สำหรับ backup หรือ migrate
SELECT 
  'CREATE OR REPLACE FUNCTION ' || p.proname || E'\n' ||
  pg_get_functiondef(p.oid) || E';\n\n' as create_statement
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- =====================================================
-- 8. ดูฟังก์ชันที่ถูกเรียกใช้บ่อย
-- =====================================================
SELECT 
  funcname as function_name,
  calls as total_calls,
  total_time as total_time_ms,
  self_time as self_time_ms,
  (total_time / NULLIF(calls, 0)) as avg_time_per_call_ms
FROM pg_stat_user_functions
ORDER BY calls DESC;

-- =====================================================
-- 9. ค้นหาฟังก์ชันที่มีคำว่า 'sync'
-- =====================================================
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.proname LIKE '%sync%'
ORDER BY p.proname;

-- =====================================================
-- 10. ดูฟังก์ชันที่สร้างล่าสุด
-- =====================================================
-- (ต้องมี created_at ในระบบ - อาจไม่มีใน Postgres ปกติ)
-- ใช้วิธีนี้แทน: ดูจาก pg_stat_user_functions
SELECT 
  funcname as function_name,
  calls as total_calls
FROM pg_stat_user_functions
ORDER BY funcid DESC
LIMIT 10;

-- =====================================================
-- สรุป
-- =====================================================
-- 
-- Query ที่ใช้บ่อย:
-- 
-- 1. ดูรายการฟังก์ชัน:
--    SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
--
-- 2. ดู code ฟังก์ชัน:
--    SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'function_name';
--
-- 3. ดู triggers:
--    SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';
--
-- =====================================================
