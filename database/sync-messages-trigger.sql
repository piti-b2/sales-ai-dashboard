-- =====================================================
-- Supabase Trigger: Sync messages → chat_messages
-- =====================================================
-- ฟังก์ชันนี้จะทำงานอัตโนมัติทุกครั้งที่มีข้อความใหม่
-- ในตาราง messages และซิงค์ไปยัง chat_messages + chat_rooms
-- =====================================================

-- 1. สร้าง Function
CREATE OR REPLACE FUNCTION sync_message_to_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
  v_customer_user_id TEXT;
  v_sender_type TEXT;
  v_message_type TEXT;
  v_customer_name TEXT;
  v_customer_avatar TEXT;
BEGIN
  -- Log เพื่อ debug
  RAISE NOTICE 'Syncing message: % from conversation: %', NEW.id, NEW.conversation_id;

  -- กำหนด customer_user_id จาก user_id ใน messages โดยตรง
  v_customer_user_id := COALESCE(NEW.user_id, 'unknown');
  
  -- ถ้าไม่มี user_id ให้ skip
  IF v_customer_user_id = 'unknown' THEN
    RAISE WARNING 'No user_id found in message: %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- กำหนด sender_type จาก role
  v_sender_type := CASE 
    WHEN NEW.role = 'user' THEN 'customer'
    WHEN NEW.role = 'assistant' THEN 'ai'
    WHEN NEW.role = 'system' THEN 'agent'
    ELSE 'customer'
  END;

  -- ดึงข้อมูล customer จาก metadata
  v_customer_name := COALESCE(
    NEW.metadata->>'displayName',
    v_customer_user_id
  );
  v_customer_avatar := NEW.metadata->>'pictureUrl';

  -- กำหนด message_type
  v_message_type := COALESCE(NEW.message_type, 'text');

  -- หา/สร้าง chat_room
  SELECT id INTO v_room_id
  FROM chat_rooms
  WHERE customer_user_id = v_customer_user_id
  LIMIT 1;

  -- ถ้าไม่มี room ให้สร้างใหม่
  IF v_room_id IS NULL THEN
    RAISE NOTICE 'Creating new chat room for user: %', v_customer_user_id;
    
    INSERT INTO chat_rooms (
      customer_user_id,
      customer_name,
      customer_avatar,
      status,
      is_ai_enabled,
      last_message_at,
      created_at,
      metadata
    ) VALUES (
      v_customer_user_id,
      v_customer_name,
      v_customer_avatar,
      'active',
      true, -- เปิด AI ตั้งต้น
      NEW.created_at,
      NEW.created_at,
      jsonb_build_object(
        'source', 'line',
        'synced_from_messages', true
      )
    )
    RETURNING id INTO v_room_id;
    
    RAISE NOTICE 'Created room: %', v_room_id;
  ELSE
    -- อัพเดท room ที่มีอยู่
    UPDATE chat_rooms
    SET 
      last_message_at = NEW.created_at,
      customer_name = COALESCE(v_customer_name, customer_name),
      customer_avatar = COALESCE(v_customer_avatar, customer_avatar)
    WHERE id = v_room_id;
    
    RAISE NOTICE 'Updated room: %', v_room_id;
  END IF;

  -- ตรวจสอบว่ามีข้อความนี้อยู่แล้วหรือไม่ (ป้องกันซ้ำ)
  IF EXISTS (
    SELECT 1 FROM chat_messages 
    WHERE metadata->>'line_message_id' = NEW.line_message_id::text
  ) THEN
    RAISE NOTICE 'Message already exists, skipping: %', NEW.line_message_id;
    RETURN NEW;
  END IF;

  -- Insert ลง chat_messages
  INSERT INTO chat_messages (
    room_id,
    sender_id,
    sender_type,
    message_type,
    content,
    media_url,
    media_type,
    media_size,
    status,
    created_at,
    metadata
  ) VALUES (
    v_room_id,
    v_customer_user_id,
    v_sender_type,
    v_message_type,
    NEW.content,
    COALESCE(NEW.media_url, NEW.line_media_url), -- ใช้ media_url หรือ line_media_url
    NEW.media_type,
    NEW.media_size,
    'delivered', -- ข้อความจาก messages ถือว่าส่งสำเร็จแล้ว
    NEW.created_at,
    jsonb_build_object(
      'line_message_id', NEW.line_message_id,
      'user_id', NEW.user_id,
      'conversation_id', NEW.conversation_id,
      'original_table', 'messages',
      'original_role', NEW.role,
      'synced_at', NOW(),
      'line_media_url', NEW.line_media_url,
      'media_category', NEW.media_category,
      'media_description', NEW.media_description,
      'media_storage_path', NEW.media_storage_path,
      'tokens_in', NEW.tokens_in,
      'tokens_out', NEW.tokens_out
    )
  );

  RAISE NOTICE 'Synced message to chat_messages successfully';
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error แต่ไม่ block transaction
    RAISE WARNING 'Error syncing message: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. ลบ Trigger เก่า (ถ้ามี)
DROP TRIGGER IF EXISTS trigger_sync_message_to_chat ON messages;

-- 3. สร้าง Trigger ใหม่
CREATE TRIGGER trigger_sync_message_to_chat
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION sync_message_to_chat();

-- 4. เปิดใช้งาน Trigger
ALTER TABLE messages ENABLE TRIGGER trigger_sync_message_to_chat;

-- =====================================================
-- ทดสอบ Trigger
-- =====================================================
-- ใช้คำสั่งนี้เพื่อทดสอบ:
-- 
-- INSERT INTO messages (
--   line_user_id,
--   line_message_id,
--   direction,
--   message_type,
--   content,
--   created_at
-- ) VALUES (
--   'U1234567890',
--   'test-message-001',
--   'incoming',
--   'text',
--   'สวัสดีครับ',
--   NOW()
-- );
--
-- ตรวจสอบผลลัพธ์:
-- SELECT * FROM chat_rooms WHERE customer_user_id = 'U1234567890';
-- SELECT * FROM chat_messages WHERE sender_id = 'U1234567890';
-- =====================================================

-- =====================================================
-- Monitoring & Logs
-- =====================================================
-- ดู logs:
-- SELECT * FROM pg_stat_user_functions 
-- WHERE funcname = 'sync_message_to_chat';
--
-- ดูจำนวนข้อความที่ซิงค์:
-- SELECT 
--   COUNT(*) as total_messages,
--   COUNT(DISTINCT room_id) as total_rooms
-- FROM chat_messages
-- WHERE metadata->>'original_table' = 'messages';
-- =====================================================
