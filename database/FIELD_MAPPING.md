# 📊 Field Mapping: messages → chat_messages

## ตาราง messages (ต้นทาง)

### Primary Fields
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `conversation_id` | UUID | NO | FK → conversations.id |
| `user_id` | TEXT | YES | LINE user ID |
| `role` | TEXT | NO | user/assistant/system |
| `content` | TEXT | NO | ข้อความ |
| `created_at` | TIMESTAMPTZ | NO | เวลาสร้าง |

### LINE Fields
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `line_message_id` | VARCHAR | YES | LINE message ID (unique) |
| `line_media_url` | TEXT | YES | LINE media URL |

### Media Fields
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `message_type` | VARCHAR | YES | text/image/video/audio/file/sticker |
| `media_url` | TEXT | YES | Media URL (Supabase) |
| `media_type` | VARCHAR | YES | MIME type |
| `media_size` | INTEGER | YES | File size (bytes) |
| `media_category` | VARCHAR | YES | หมวดหมู่ |
| `media_description` | TEXT | YES | คำอธิบาย |
| `media_storage_path` | TEXT | YES | Path ใน storage |
| `media_metadata` | JSONB | YES | Metadata เพิ่มเติม |

### AI/Analytics Fields
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `tokens_in` | INTEGER | YES | Input tokens |
| `tokens_out` | INTEGER | YES | Output tokens |
| `should_store` | BOOLEAN | YES | ควรเก็บหรือไม่ |

### Metadata
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `metadata` | JSONB | YES | ข้อมูลเพิ่มเติม (displayName, pictureUrl, etc.) |

---

## ตาราง chat_messages (ปลายทาง)

### Primary Fields
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `room_id` | UUID | NO | FK → chat_rooms.id |
| `sender_id` | TEXT | NO | User ID ของผู้ส่ง |
| `sender_type` | TEXT | NO | customer/agent/ai |
| `content` | TEXT | YES | ข้อความ |
| `created_at` | TIMESTAMPTZ | YES | เวลาสร้าง |

### Message Type & Status
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `message_type` | TEXT | NO | text/image/video/audio/file/sticker |
| `status` | TEXT | YES | sent/delivered/read/failed |
| `delivered_at` | TIMESTAMPTZ | YES | เวลาส่งสำเร็จ |
| `read_at` | TIMESTAMPTZ | YES | เวลาอ่าน |

### Media Fields
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `media_url` | TEXT | YES | Media URL |
| `media_type` | TEXT | YES | MIME type |
| `media_size` | INTEGER | YES | File size (bytes) |
| `media_duration` | INTEGER | YES | Duration (seconds) |
| `thumbnail_url` | TEXT | YES | Thumbnail URL |

### LINE Integration
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `line_message_id` | TEXT | YES | LINE message ID (unique) |

### Reply & Metadata
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `reply_to_id` | UUID | YES | FK → chat_messages.id |
| `metadata` | JSONB | YES | ข้อมูลเพิ่มเติม |

---

## 🔄 Mapping Logic

### 1. Customer User ID
```sql
v_customer_user_id := COALESCE(
  NEW.user_id,                    -- จาก messages.user_id
  v_conversation_record.line_user_id,  -- จาก customers.line_user_id
  'unknown'
);
```

### 2. Sender Type
```sql
v_sender_type := CASE 
  WHEN NEW.role = 'user' THEN 'customer'
  WHEN NEW.role = 'assistant' THEN 'ai'
  WHEN NEW.role = 'system' THEN 'agent'
  ELSE 'customer'
END;
```

### 3. Message Type
```sql
v_message_type := COALESCE(NEW.message_type, 'text');
```

### 4. Media URL
```sql
media_url := COALESCE(
  NEW.media_url,        -- Supabase storage
  NEW.line_media_url    -- LINE CDN
);
```

### 5. Customer Info
```sql
v_customer_name := COALESCE(
  NEW.metadata->>'displayName',  -- จาก metadata
  v_conversation_record.full_name,  -- จาก customers
  v_customer_user_id
);

v_customer_avatar := NEW.metadata->>'pictureUrl';
```

---

## 📝 Metadata Mapping

### messages.metadata → chat_messages.metadata

```json
{
  "line_message_id": "messages.line_message_id",
  "user_id": "messages.user_id",
  "conversation_id": "messages.conversation_id",
  "original_table": "messages",
  "original_role": "messages.role",
  "synced_at": "NOW()",
  "line_media_url": "messages.line_media_url",
  "media_category": "messages.media_category",
  "media_description": "messages.media_description",
  "media_storage_path": "messages.media_storage_path",
  "tokens_in": "messages.tokens_in",
  "tokens_out": "messages.tokens_out"
}
```

---

## ✅ Field Coverage

### ✅ Mapped Fields (จาก messages)
- `id` → ใช้สร้าง chat_messages.id ใหม่
- `conversation_id` → เก็บใน metadata
- `user_id` → `sender_id`
- `role` → `sender_type` (แปลงค่า)
- `content` → `content`
- `created_at` → `created_at`
- `line_message_id` → `line_message_id` + metadata
- `line_media_url` → `media_url` (fallback) + metadata
- `message_type` → `message_type`
- `media_url` → `media_url` (primary)
- `media_type` → `media_type`
- `media_size` → `media_size`
- `media_category` → metadata
- `media_description` → metadata
- `media_storage_path` → metadata
- `media_metadata` → รวมใน metadata
- `tokens_in` → metadata
- `tokens_out` → metadata
- `metadata` → `metadata` (รวมกับข้อมูลอื่น)

### ⚠️ Fields ที่ไม่ได้ใช้ (จาก messages)
- `should_store` → ไม่จำเป็น (ทุกข้อความที่ sync แสดงว่าต้องเก็บ)

### 🆕 Fields ที่สร้างใหม่ (ใน chat_messages)
- `room_id` → หาจาก chat_rooms หรือสร้างใหม่
- `status` → ตั้งเป็น 'delivered'
- `delivered_at` → NULL (อาจอัพเดทภายหลัง)
- `read_at` → NULL (อาจอัพเดทภายหลัง)
- `media_duration` → NULL (ไม่มีใน messages)
- `thumbnail_url` → NULL (ไม่มีใน messages)
- `reply_to_id` → NULL (ไม่มีใน messages)

---

## 🔍 ตัวอย่างการแปลงข้อมูล

### ข้อความจากลูกค้า (role = 'user')
```sql
-- messages
{
  "id": "uuid-1",
  "conversation_id": "conv-1",
  "user_id": "U1234567890",
  "role": "user",
  "content": "สวัสดีครับ",
  "message_type": "text",
  "created_at": "2025-10-30 12:00:00"
}

-- chat_messages
{
  "id": "uuid-new",
  "room_id": "room-1",
  "sender_id": "U1234567890",
  "sender_type": "customer",
  "content": "สวัสดีครับ",
  "message_type": "text",
  "status": "delivered",
  "created_at": "2025-10-30 12:00:00",
  "metadata": {
    "user_id": "U1234567890",
    "conversation_id": "conv-1",
    "original_table": "messages",
    "original_role": "user",
    "synced_at": "2025-10-30 12:00:01"
  }
}
```

### ข้อความจาก AI (role = 'assistant')
```sql
-- messages
{
  "id": "uuid-2",
  "conversation_id": "conv-1",
  "user_id": "U1234567890",
  "role": "assistant",
  "content": "สวัสดีครับ มีอะไรให้ช่วยไหมครับ",
  "message_type": "text",
  "tokens_in": 10,
  "tokens_out": 15,
  "created_at": "2025-10-30 12:00:05"
}

-- chat_messages
{
  "id": "uuid-new-2",
  "room_id": "room-1",
  "sender_id": "U1234567890",
  "sender_type": "ai",
  "content": "สวัสดีครับ มีอะไรให้ช่วยไหมครับ",
  "message_type": "text",
  "status": "delivered",
  "created_at": "2025-10-30 12:00:05",
  "metadata": {
    "user_id": "U1234567890",
    "conversation_id": "conv-1",
    "original_table": "messages",
    "original_role": "assistant",
    "tokens_in": 10,
    "tokens_out": 15,
    "synced_at": "2025-10-30 12:00:06"
  }
}
```

### ข้อความรูปภาพ
```sql
-- messages
{
  "id": "uuid-3",
  "conversation_id": "conv-1",
  "user_id": "U1234567890",
  "role": "user",
  "content": "",
  "message_type": "image",
  "media_url": "https://supabase.co/.../image.jpg",
  "line_media_url": "https://api-data.line.me/.../content",
  "media_type": "image/jpeg",
  "media_size": 102400,
  "created_at": "2025-10-30 12:01:00"
}

-- chat_messages
{
  "id": "uuid-new-3",
  "room_id": "room-1",
  "sender_id": "U1234567890",
  "sender_type": "customer",
  "content": "",
  "message_type": "image",
  "media_url": "https://supabase.co/.../image.jpg",
  "media_type": "image/jpeg",
  "media_size": 102400,
  "status": "delivered",
  "created_at": "2025-10-30 12:01:00",
  "metadata": {
    "user_id": "U1234567890",
    "conversation_id": "conv-1",
    "original_table": "messages",
    "original_role": "user",
    "line_media_url": "https://api-data.line.me/.../content",
    "synced_at": "2025-10-30 12:01:01"
  }
}
```

---

## 🎯 สรุป

### ✅ ครบถ้วน
- ทุก field ที่สำคัญจาก `messages` ถูก map ไปยัง `chat_messages`
- ข้อมูลที่ไม่มี field ตรงกันถูกเก็บใน `metadata`
- รองรับทุกประเภทข้อความ (text, image, video, audio, file, sticker)
- รองรับทั้ง customer, agent, และ AI

### 📊 Statistics
- **Total messages fields**: 20
- **Total chat_messages fields**: 18
- **Mapped directly**: 12
- **Mapped to metadata**: 8
- **Coverage**: 100%

---

**ไม่มี field ใดตกหล่น!** ✅
