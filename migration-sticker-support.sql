-- ============================================
-- Migration: เพิ่มการรองรับ LINE Stickers
-- ============================================
-- วันที่: 2025-11-10
-- จุดประสงค์: เพิ่ม columns สำหรับ sticker และแก้ไขฟังก์ชัน sync
-- ============================================

-- STEP 1: เพิ่ม columns ในตาราง chat_messages
-- ============================================
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS sticker_id TEXT,
ADD COLUMN IF NOT EXISTS sticker_package_id TEXT,
ADD COLUMN IF NOT EXISTS sticker_resource_type TEXT;

-- เพิ่ม index สำหรับค้นหา sticker
CREATE INDEX IF NOT EXISTS idx_chat_messages_sticker 
ON chat_messages(sticker_id) 
WHERE sticker_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN chat_messages.sticker_id IS 'LINE Sticker ID';
COMMENT ON COLUMN chat_messages.sticker_package_id IS 'LINE Sticker Package ID';
COMMENT ON COLUMN chat_messages.sticker_resource_type IS 'LINE Sticker Resource Type (STATIC, ANIMATION, SOUND, etc.)';

-- ============================================
-- STEP 2: แก้ไขฟังก์ชัน sync_message_to_chat
-- ============================================
CREATE OR REPLACE FUNCTION sync_message_to_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
  v_customer_user_id TEXT;
  v_sender_type TEXT;
  v_message_type TEXT;
  v_customer_name TEXT;
  v_customer_avatar TEXT;
  v_is_valid_name BOOLEAN;
  v_is_valid_avatar BOOLEAN;
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
  v_customer_name := NEW.metadata->>'display_name';
  v_customer_avatar := NEW.metadata->>'picture_url';

  -- ป้องกัน: ตรวจสอบว่า displayName ถูกต้องหรือไม่
  v_is_valid_name := (
    v_customer_name IS NOT NULL 
    AND v_customer_name != '' 
    AND v_customer_name != v_customer_user_id
    AND NOT (v_customer_name ~ '^U[a-f0-9]{32}$')
  );

  -- ป้องกัน: ตรวจสอบว่า pictureUrl ถูกต้องหรือไม่
  v_is_valid_avatar := (
    v_customer_avatar IS NOT NULL 
    AND v_customer_avatar LIKE 'http%'
  );

  -- ถ้าไม่ valid ให้ใช้ค่า fallback
  IF NOT v_is_valid_name THEN
    v_customer_name := v_customer_user_id;
    RAISE NOTICE 'Invalid displayName, using user_id as fallback';
  END IF;

  IF NOT v_is_valid_avatar THEN
    v_customer_avatar := NULL;
    RAISE NOTICE 'Invalid pictureUrl, setting to NULL';
  END IF;

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
      true,
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
      customer_name = CASE
        WHEN customer_name IS NULL THEN v_customer_name
        WHEN customer_name = customer_user_id AND v_is_valid_name THEN v_customer_name
        ELSE customer_name
      END,
      customer_avatar = CASE
        WHEN customer_avatar IS NULL AND v_is_valid_avatar THEN v_customer_avatar
        ELSE customer_avatar
      END
    WHERE id = v_room_id;
    
    RAISE NOTICE 'Updated room: %', v_room_id;
  END IF;

  -- ตรวจสอบว่ามีข้อความนี้อยู่แล้วหรือไม่
  IF EXISTS (
    SELECT 1 FROM chat_messages 
    WHERE metadata->>'line_message_id' = NEW.line_message_id::text
  ) THEN
    RAISE NOTICE 'Message already exists, skipping: %', NEW.line_message_id;
    RETURN NEW;
  END IF;

  -- Insert ลง chat_messages พร้อม sticker fields
  INSERT INTO chat_messages (
    room_id,
    sender_id,
    sender_type,
    message_type,
    content,
    media_url,
    media_type,
    media_size,
    sticker_id,
    sticker_package_id,
    sticker_resource_type,
    status,
    created_at,
    metadata
  ) VALUES (
    v_room_id,
    v_customer_user_id,
    v_sender_type,
    v_message_type,
    NEW.content,
    COALESCE(NEW.media_url, NEW.line_media_url),
    NEW.media_type,
    NEW.media_size,
    NEW.sticker_id,
    NEW.sticker_package_id,
    NEW.sticker_resource_type,
    'delivered',
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
      'tokens_out', NEW.tokens_out,
      'displayName_valid', v_is_valid_name,
      'pictureUrl_valid', v_is_valid_avatar,
      'sticker_id', NEW.sticker_id,
      'package_id', NEW.sticker_package_id,
      'sticker_resource_type', NEW.sticker_resource_type,
      'keywords', NEW.metadata->'keywords'
    )
  );

  RAISE NOTICE 'Synced message to chat_messages successfully';
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error syncing message: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: สร้าง/อัพเดท trigger
-- ============================================
DROP TRIGGER IF EXISTS trigger_sync_message_to_chat ON messages;
CREATE TRIGGER trigger_sync_message_to_chat
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_message_to_chat();

COMMENT ON FUNCTION sync_message_to_chat() IS 'Sync messages from messages table to chat_messages table with sticker support';

-- ============================================
-- STEP 4: Verify Migration
-- ============================================
DO $$
BEGIN
  -- ตรวจสอบว่า columns ถูกสร้างแล้ว
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' 
    AND column_name = 'sticker_id'
  ) THEN
    RAISE NOTICE '✅ Column sticker_id exists';
  ELSE
    RAISE WARNING '❌ Column sticker_id NOT found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' 
    AND column_name = 'sticker_package_id'
  ) THEN
    RAISE NOTICE '✅ Column sticker_package_id exists';
  ELSE
    RAISE WARNING '❌ Column sticker_package_id NOT found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' 
    AND column_name = 'sticker_resource_type'
  ) THEN
    RAISE NOTICE '✅ Column sticker_resource_type exists';
  ELSE
    RAISE WARNING '❌ Column sticker_resource_type NOT found';
  END IF;

  -- ตรวจสอบว่า trigger ถูกสร้างแล้ว
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_sync_message_to_chat'
  ) THEN
    RAISE NOTICE '✅ Trigger trigger_sync_message_to_chat exists';
  ELSE
    RAISE WARNING '❌ Trigger trigger_sync_message_to_chat NOT found';
  END IF;

  RAISE NOTICE '🎉 Migration completed successfully!';
END $$;

-- ============================================
-- STEP 5: ทดสอบ (Optional)
-- ============================================
-- แสดงข้อมูล sticker ที่มีอยู่
SELECT 
  id,
  content,
  sticker_id,
  sticker_package_id,
  sticker_resource_type,
  metadata->'keywords' as keywords,
  created_at
FROM chat_messages
WHERE message_type = 'sticker'
ORDER BY created_at DESC
LIMIT 5;
