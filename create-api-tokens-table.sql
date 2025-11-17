-- สร้างตาราง api_tokens สำหรับเก็บ OAuth tokens
CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- 'kbank', 'scb', etc.
  access_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- สร้าง index สำหรับค้นหาเร็วขึ้น
CREATE INDEX idx_api_tokens_provider_expires ON api_tokens(provider, expires_at);

-- ลบ token ที่หมดอายุอัตโนมัติ (optional - ใช้ pg_cron หรือ Supabase Edge Function)
-- หรือสามารถลบด้วย query ธรรมดา:
-- DELETE FROM api_tokens WHERE expires_at < NOW();

-- Grant permissions (ถ้าใช้ RLS)
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: อนุญาตให้ service role เข้าถึงได้ทั้งหมด
CREATE POLICY "Service role can manage tokens"
  ON api_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ตัวอย่างการ query token ที่ยังไม่หมดอายุ
-- SELECT * FROM api_tokens 
-- WHERE provider = 'kbank' 
-- AND expires_at > NOW() 
-- ORDER BY created_at DESC 
-- LIMIT 1;
