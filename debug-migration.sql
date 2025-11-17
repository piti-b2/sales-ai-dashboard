-- ============================================
-- Debug Migration - ตรวจสอบว่า Migration ทำงานไหม
-- ============================================

-- 1. ดูจำนวนข้อความใน messages (ต้นทาง)
SELECT 
  '📊 Source: messages table' as info,
  COUNT(*) as total_messages,
  COUNT(DISTINCT user_id) as unique_users
FROM messages
WHERE user_id IS NOT NULL;

-- 2. ดูจำนวนห้องแชทที่สร้างแล้ว
SELECT 
  '📊 Target: chat_rooms' as info,
  COUNT(*) as total_rooms
FROM chat_rooms;

-- 3. ดูจำนวนข้อความที่ migrate แล้ว
SELECT 
  '📊 Target: chat_messages' as info,
  COUNT(*) as total_messages
FROM chat_messages;

-- 4. ดูว่า JOIN ระหว่าง messages และ chat_rooms ได้ไหม
SELECT 
  '🔍 JOIN Test' as info,
  COUNT(*) as joinable_messages
FROM messages m
JOIN chat_rooms cr ON cr.customer_user_id = m.user_id
WHERE m.user_id IS NOT NULL
  AND m.content IS NOT NULL
  AND m.content != '';

-- 5. ดูข้อความที่ JOIN ไม่ได้ (ไม่มีห้อง)
SELECT 
  '⚠️ Messages without room' as info,
  COUNT(*) as orphan_messages,
  COUNT(DISTINCT m.user_id) as orphan_users
FROM messages m
LEFT JOIN chat_rooms cr ON cr.customer_user_id = m.user_id
WHERE m.user_id IS NOT NULL
  AND cr.id IS NULL;

-- 6. ดูตัวอย่างข้อความที่ควร migrate
SELECT 
  m.id,
  m.user_id,
  m.content,
  m.role,
  m.message_type,
  cr.id as room_id,
  cr.customer_name
FROM messages m
LEFT JOIN chat_rooms cr ON cr.customer_user_id = m.user_id
WHERE m.user_id IS NOT NULL
ORDER BY m.created_at DESC
LIMIT 10;

-- 7. ดูห้องแชทที่ไม่มีข้อความ
SELECT 
  cr.id,
  cr.customer_user_id,
  cr.customer_name,
  COUNT(cm.id) as message_count
FROM chat_rooms cr
LEFT JOIN chat_messages cm ON cm.room_id = cr.id
GROUP BY cr.id, cr.customer_user_id, cr.customer_name
HAVING COUNT(cm.id) = 0
LIMIT 10;
