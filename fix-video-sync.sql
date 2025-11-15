-- แก้ไขฟังก์ชัน sync_message_to_chat ให้ sync media_url และ media_duration จาก metadata

CREATE OR REPLACE FUNCTION sync_message_to_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
  v_sender_type TEXT;
  v_media_url TEXT;
  v_media_duration INTEGER;
BEGIN
  -- หา room_id จาก conversation_id
  SELECT id INTO v_room_id
  FROM chat_rooms
  WHERE conversation_id = NEW.conversation_id;

  -- ถ้าไม่มี room ให้ข้าม
  IF v_room_id IS NULL THEN
    RAISE NOTICE 'No room found for conversation_id: %', NEW.conversation_id;
    RETURN NEW;
  END IF;

  -- กำหนด sender_type
  v_sender_type := CASE 
    WHEN NEW.role = 'user' THEN 'customer'
    WHEN NEW.role = 'assistant' THEN 'ai'
    ELSE 'system'
  END;

  -- ดึง media_url จาก metadata ถ้าไม่มีใน media_url
  v_media_url := COALESCE(
    NEW.media_url,
    NEW.line_media_url,
    NEW.metadata->>'media_url',
    NEW.metadata->>'line_media_url'
  );

  -- ดึง media_duration จาก metadata ถ้าไม่มี
  v_media_duration := COALESCE(
    NEW.media_size,  -- ใช้ media_size แทน duration ถ้ามี
    (NEW.metadata->>'media_duration')::INTEGER,
    (NEW.metadata->>'duration')::INTEGER
  );

  -- Insert ข้อความลงใน chat_messages
  INSERT INTO chat_messages (
    room_id,
    sender_id,
    sender_type,
    message_type,
    content,
    media_url,
    media_type,
    media_size,
    media_duration,
    thumbnail_url,
    status,
    created_at,
    metadata,
    line_message_id,
    sticker_id,
    sticker_package_id,
    sticker_resource_type
  ) VALUES (
    v_room_id,
    NEW.user_id,
    v_sender_type,
    NEW.message_type,
    NEW.content,
    v_media_url,  -- ใช้ค่าที่ดึงจาก metadata
    NEW.media_type,
    NEW.media_size,
    v_media_duration,  -- ใช้ค่าที่ดึงจาก metadata
    NULL,  -- thumbnail_url
    'sent',
    NEW.created_at,
    jsonb_build_object(
      'original_table', 'messages',
      'conversation_id', NEW.conversation_id,
      'original_role', NEW.role,
      'tokens_in', NEW.tokens_in,
      'tokens_out', NEW.tokens_out,
      'synced_at', NOW(),
      'user_id', NEW.user_id,
      'line_message_id', NEW.line_message_id,
      'media_category', NEW.media_category,
      'media_description', NEW.media_description,
      'media_storage_path', NEW.media_storage_path,
      'line_media_url', NEW.line_media_url,
      'displayName_valid', (NEW.metadata->>'display_name') IS NOT NULL,
      'pictureUrl_valid', (NEW.metadata->>'picture_url') IS NOT NULL,
      'media_url', NEW.metadata->>'media_url',  -- เก็บไว้ใน metadata ด้วย
      'media_duration', NEW.metadata->>'media_duration'  -- เก็บไว้ใน metadata ด้วย
    ),
    NEW.line_message_id,
    NEW.sticker_id,
    NEW.sticker_package_id,
    NEW.sticker_resource_type
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger ใหม่
DROP TRIGGER IF EXISTS trigger_sync_message_to_chat ON messages;
CREATE TRIGGER trigger_sync_message_to_chat
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_message_to_chat();

-- ทดสอบ
COMMENT ON FUNCTION sync_message_to_chat() IS 'Sync messages to chat_messages with media_url and duration from metadata';

-- ตรวจสอบว่า trigger ทำงาน
SELECT 
  tgname,
  tgenabled,
  tgtype
FROM pg_trigger
WHERE tgname = 'trigger_sync_message_to_chat';

-- ตรวจสอบข้อความวิดีโอล่าสุด
SELECT 
  id,
  content,
  media_url,
  media_duration,
  metadata->>'media_url' as metadata_media_url,
  metadata->>'media_duration' as metadata_duration
FROM chat_messages
WHERE message_type = 'video'
ORDER BY created_at DESC
LIMIT 5;
