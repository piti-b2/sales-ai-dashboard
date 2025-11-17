-- ========================================
-- อัพเดทรูปโปรไฟล์จาก messages.metadata
-- ไปยัง chat_rooms
-- ========================================
-- 
-- วิธีใช้:
-- 1. รันใน Supabase SQL Editor
-- 2. ตรวจสอบผลลัพธ์ด้านล่าง
-- 3. รันซ้ำได้ตามต้องการ (safe to re-run)
--
-- ========================================

-- อัพเดท customer_name, customer_avatar, metadata
UPDATE chat_rooms cr
SET 
  customer_name = COALESCE(
    cr.customer_name,
    (
      SELECT m.metadata->>'displayName'
      FROM messages m
      WHERE m.user_id = cr.customer_user_id
        AND m.metadata->>'displayName' IS NOT NULL
        AND m.metadata->>'displayName' != ''
        -- ป้องกัน: ห้ามเป็น user_id
        AND m.metadata->>'displayName' != cr.customer_user_id
        -- ป้องกัน: ห้ามมีรูปแบบ LINE user_id (U + 32 hex chars)
        AND NOT (m.metadata->>'displayName' ~ '^U[a-f0-9]{32}$')
      ORDER BY m.created_at DESC
      LIMIT 1
    ),
    cr.customer_user_id
  ),
  customer_avatar = COALESCE(
    cr.customer_avatar,
    (
      SELECT m.metadata->>'pictureUrl'
      FROM messages m
      WHERE m.user_id = cr.customer_user_id
        AND m.metadata->>'pictureUrl' IS NOT NULL
        AND m.metadata->>'pictureUrl' != ''
        -- ป้องกัน: ต้องเป็น URL จริงๆ
        AND m.metadata->>'pictureUrl' LIKE 'http%'
      ORDER BY m.created_at DESC
      LIMIT 1
    )
  ),
  metadata = COALESCE(cr.metadata, '{}'::jsonb) || jsonb_build_object(
    'statusMessage', (
      SELECT m.metadata->>'statusMessage'
      FROM messages m
      WHERE m.user_id = cr.customer_user_id
        AND m.metadata->>'statusMessage' IS NOT NULL
      ORDER BY m.created_at DESC
      LIMIT 1
    ),
    'language', (
      SELECT m.metadata->>'language'
      FROM messages m
      WHERE m.user_id = cr.customer_user_id
        AND m.metadata->>'language' IS NOT NULL
      ORDER BY m.created_at DESC
      LIMIT 1
    ),
    'profile_updated_at', NOW()
  )
WHERE EXISTS (
  SELECT 1 
  FROM messages m 
  WHERE m.user_id = cr.customer_user_id
    AND (
      (
        m.metadata->>'displayName' IS NOT NULL 
        AND m.metadata->>'displayName' != ''
        -- ป้องกัน: ห้ามเป็น user_id
        AND m.metadata->>'displayName' != cr.customer_user_id
        AND NOT (m.metadata->>'displayName' ~ '^U[a-f0-9]{32}$')
      )
      OR (
        m.metadata->>'pictureUrl' IS NOT NULL 
        AND m.metadata->>'pictureUrl' LIKE 'http%'
      )
    )
);

-- ========================================
-- ตรวจสอบผลลัพธ์
-- ========================================

-- 1. สรุปภาพรวม
SELECT 
  COUNT(*) as total_rooms,
  COUNT(customer_name) as has_name,
  COUNT(customer_avatar) as has_avatar,
  COUNT(CASE WHEN customer_name IS NOT NULL AND customer_name != customer_user_id THEN 1 END) as has_real_name,
  COUNT(CASE WHEN customer_avatar IS NOT NULL THEN 1 END) as has_picture,
  -- ✅ เพิ่ม: นับที่มี user_id เป็นชื่อ (ผิดปกติ)
  COUNT(CASE WHEN customer_name = customer_user_id THEN 1 END) as name_is_userid,
  COUNT(CASE WHEN customer_name ~ '^U[a-f0-9]{32}$' THEN 1 END) as name_looks_like_userid
FROM chat_rooms;

-- 2. ดูตัวอย่างที่อัพเดทแล้ว
SELECT 
  customer_user_id,
  customer_name,
  CASE 
    WHEN customer_name = customer_user_id THEN '⚠️ user_id'
    WHEN customer_name ~ '^U[a-f0-9]{32}$' THEN '⚠️ looks like user_id'
    ELSE '✅ OK'
  END as name_status,
  LEFT(customer_avatar, 50) || '...' as avatar_preview,
  metadata->>'statusMessage' as status_message,
  metadata->>'language' as language,
  metadata->>'profile_updated_at' as updated_at,
  created_at
FROM chat_rooms
WHERE customer_name IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 3. ดูที่ยังไม่มีข้อมูล
SELECT 
  customer_user_id,
  customer_name,
  customer_avatar,
  created_at,
  (
    SELECT COUNT(*) 
    FROM messages m 
    WHERE m.user_id = chat_rooms.customer_user_id
  ) as message_count
FROM chat_rooms
WHERE customer_avatar IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. ตรวจสอบข้อมูลใน messages
SELECT 
  user_id,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN metadata->>'displayName' IS NOT NULL THEN 1 END) as has_display_name,
  COUNT(CASE WHEN metadata->>'pictureUrl' IS NOT NULL THEN 1 END) as has_picture_url,
  MAX(metadata->>'displayName') as display_name_sample,
  MAX(created_at) as last_message_at
FROM messages
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY last_message_at DESC
LIMIT 10;

-- ========================================
-- ✅ ตรวจสอบข้อมูลผิดปกติ
-- ========================================

-- 4. หา customer_name ที่เป็น user_id (ผิดปกติ)
SELECT 
  customer_user_id,
  customer_name,
  '⚠️ customer_name = user_id' as issue
FROM chat_rooms
WHERE customer_name = customer_user_id
  AND customer_name IS NOT NULL;

-- 5. หา customer_name ที่มีรูปแบบ user_id (ผิดปกติ)
SELECT 
  customer_user_id,
  customer_name,
  '⚠️ customer_name looks like user_id' as issue
FROM chat_rooms
WHERE customer_name ~ '^U[a-f0-9]{32}$'
  AND customer_name != customer_user_id;

-- 6. หา pictureUrl ที่ไม่ใช่ URL (ผิดปกติ)
SELECT 
  customer_user_id,
  customer_name,
  customer_avatar,
  '⚠️ invalid pictureUrl' as issue
FROM chat_rooms
WHERE customer_avatar IS NOT NULL
  AND customer_avatar NOT LIKE 'http%';

-- ========================================
-- ทำความสะอาด (Optional)
-- ========================================

-- ลบ chat_rooms ที่ไม่มี messages เลย
-- (ระวัง! ตรวจสอบก่อนรัน)
/*
DELETE FROM chat_rooms
WHERE NOT EXISTS (
  SELECT 1 FROM messages WHERE user_id = chat_rooms.customer_user_id
);
*/

-- ========================================
-- สรุป
-- ========================================
-- 
-- SQL นี้จะ:
-- 1. ดึง displayName, pictureUrl จาก messages.metadata
-- 2. อัพเดทลง chat_rooms.customer_name, customer_avatar
-- 3. เก็บ statusMessage, language ใน chat_rooms.metadata
-- 4. ใช้ข้อความล่าสุดเป็นหลัก (ORDER BY created_at DESC)
-- 5. ไม่เขียนทับข้อมูลที่มีอยู่แล้ว (ใช้ COALESCE)
-- 6. รันซ้ำได้ไม่มีปัญหา (idempotent)
-- 
-- ✅ เงื่อนไขป้องกันข้อมูลผิดพลาด:
-- - ห้าม displayName เป็น user_id
-- - ห้าม displayName มีรูปแบบ LINE user_id (U + 32 hex chars)
-- - ห้าม pictureUrl ไม่ใช่ URL (ต้องขึ้นต้นด้วย http)
--
-- ========================================
