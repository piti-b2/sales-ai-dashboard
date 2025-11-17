-- ============================================
-- แก้ไข last_message_at ให้ตรงกับข้อความล่าสุด
-- ============================================

-- อัปเดต last_message_at ในทุกห้อง
UPDATE chat_rooms cr
SET last_message_at = (
  SELECT MAX(cm.created_at)
  FROM chat_messages cm
  WHERE cm.room_id = cr.id
)
WHERE EXISTS (
  SELECT 1 
  FROM chat_messages cm 
  WHERE cm.room_id = cr.id
);

-- ตรวจสอบผลลัพธ์
SELECT 
  cr.customer_name,
  cr.last_message_at,
  (SELECT MAX(cm.created_at) FROM chat_messages cm WHERE cm.room_id = cr.id) as actual_last_message,
  (SELECT content FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_content
FROM chat_rooms cr
ORDER BY cr.last_message_at DESC;
