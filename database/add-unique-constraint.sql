-- ========================================
-- เพิ่ม UNIQUE Constraint ให้ line_message_id
-- ========================================

-- 1. ลบข้อมูลซ้ำที่มีอยู่ (ถ้ามี)
DELETE FROM messages
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY line_message_id 
        ORDER BY created_at, id
      ) as rn
    FROM messages
    WHERE line_message_id IS NOT NULL
  ) t
  WHERE t.rn > 1
);

-- 2. เพิ่ม UNIQUE constraint
ALTER TABLE messages
ADD CONSTRAINT messages_line_message_id_key 
UNIQUE (line_message_id);

-- 3. ตรวจสอบ
SELECT 
  COUNT(*) as total_messages,
  COUNT(DISTINCT line_message_id) as unique_line_ids
FROM messages
WHERE line_message_id IS NOT NULL;

-- ควรได้ total_messages = unique_line_ids ✅
