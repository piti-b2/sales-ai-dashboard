-- เพิ่ม columns สำหรับ LINE Stickers ในตาราง chat_messages
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS sticker_id TEXT,
ADD COLUMN IF NOT EXISTS sticker_package_id TEXT,
ADD COLUMN IF NOT EXISTS sticker_resource_type TEXT;

-- เพิ่ม index สำหรับค้นหา sticker
CREATE INDEX IF NOT EXISTS idx_chat_messages_sticker ON chat_messages(sticker_id) WHERE sticker_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN chat_messages.sticker_id IS 'LINE Sticker ID';
COMMENT ON COLUMN chat_messages.sticker_package_id IS 'LINE Sticker Package ID';
COMMENT ON COLUMN chat_messages.sticker_resource_type IS 'LINE Sticker Resource Type (STATIC, ANIMATION, SOUND, etc.)';
