-- ============================================
-- AI Configuration Table
-- ============================================
-- ตารางสำหรับเก็บการตั้งค่า AI Assistant
-- รองรับการปรับแต่ง prompt, model, parameters ผ่านหน้าเว็บ

CREATE TABLE IF NOT EXISTS public.ai_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- ชื่อและคำอธิบาย
  config_name TEXT NOT NULL DEFAULT 'Default AI Config',
  description TEXT,
  
  -- AI Model Settings
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER NOT NULL DEFAULT 1000 CHECK (max_tokens > 0),
  
  -- Context Settings
  context_message_limit INTEGER NOT NULL DEFAULT 30 CHECK (context_message_limit > 0),
  
  -- System Prompt
  system_prompt TEXT NOT NULL DEFAULT 'คุณเป็น AI Assistant สำหรับพนักงานขายและซัพพอร์ต',
  
  -- Prompt Guidelines (JSONB for flexibility)
  prompt_guidelines JSONB DEFAULT '{
    "tone": ["สุภาพ", "เป็นมิตร", "เป็นมืออาชีพ"],
    "style": ["ตรงประเด็นและชัดเจน", "ใช้ภาษาไทยที่เข้าใจง่าย", "ไม่ยาวเกินไป (2-3 ประโยค)"],
    "context": ["เหมาะสมกับบริบทของสถาบันสอนพิเศษเด็ก"]
  }'::jsonb,
  
  -- Business Context
  business_type TEXT NOT NULL DEFAULT 'สถาบันสอนพิเศษเด็ก',
  business_description TEXT,
  
  -- Additional Instructions
  additional_instructions TEXT,
  
  -- Fallback Message
  fallback_message TEXT NOT NULL DEFAULT 'ขออภัยค่ะ ไม่สามารถสร้างคำตอบได้ในขณะนี้',
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Usage Stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_ai_config_active ON public.ai_config(is_active);
CREATE INDEX idx_ai_config_default ON public.ai_config(is_default);
CREATE INDEX idx_ai_config_created_at ON public.ai_config(created_at DESC);

-- Ensure only one default config
CREATE UNIQUE INDEX idx_ai_config_unique_default ON public.ai_config(is_default) WHERE is_default = true;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_config_updated_at
  BEFORE UPDATE ON public.ai_config
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_config_updated_at();

-- RLS Policies
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active configs
CREATE POLICY "Allow authenticated users to read active AI configs"
  ON public.ai_config
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow admins to manage AI configs
CREATE POLICY "Allow admins to manage AI configs"
  ON public.ai_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = auth.uid()
      AND permission IN ('admin', 'manage_ai_config')
    )
  );

-- ============================================
-- Insert Default Configuration
-- ============================================
INSERT INTO public.ai_config (
  config_name,
  description,
  model,
  temperature,
  max_tokens,
  context_message_limit,
  system_prompt,
  prompt_guidelines,
  business_type,
  business_description,
  fallback_message,
  is_active,
  is_default
) VALUES (
  'Default AI Assistant Config',
  'การตั้งค่า AI Assistant เริ่มต้นสำหรับระบบแชท',
  'gpt-4o-mini',
  0.7,
  1000,
  30,
  'คุณเป็น AI Assistant สำหรับพนักงานขายและซัพพอร์ตของสถาบันสอนพิเศษเด็ก
งานของคุณคือแนะนำคำตอบที่เหมาะสมให้พนักงานใช้ตอบลูกค้า',
  '{
    "tone": ["สุภาพ", "เป็นมิตร", "เป็นมืออาชีพ"],
    "style": ["ตรงประเด็นและชัดเจน", "ใช้ภาษาไทยที่เข้าใจง่าย", "ไม่ยาวเกินไป (2-3 ประโยค)"],
    "context": ["เหมาะสมกับบริบทของสถาบันสอนพิเศษเด็ก"]
  }'::jsonb,
  'สถาบันสอนพิเศษเด็ก',
  'สถาบันสอนพิเศษที่มุ่งเน้นการพัฒนาศักยภาพเด็กในทุกวิชา',
  'ขออภัยค่ะ ไม่สามารถสร้างคำตอบได้ในขณะนี้',
  true,
  true
) ON CONFLICT DO NOTHING;

-- ============================================
-- Helper Function: Get Active Config
-- ============================================
CREATE OR REPLACE FUNCTION get_active_ai_config()
RETURNS TABLE (
  id UUID,
  model TEXT,
  temperature DECIMAL,
  max_tokens INTEGER,
  context_message_limit INTEGER,
  system_prompt TEXT,
  prompt_guidelines JSONB,
  business_type TEXT,
  fallback_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.model,
    ac.temperature,
    ac.max_tokens,
    ac.context_message_limit,
    ac.system_prompt,
    ac.prompt_guidelines,
    ac.business_type,
    ac.fallback_message
  FROM public.ai_config ac
  WHERE ac.is_active = true
  AND ac.is_default = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Helper Function: Update Usage Stats
-- ============================================
CREATE OR REPLACE FUNCTION increment_ai_config_usage(config_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.ai_config
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.ai_config TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_ai_config() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ai_config_usage(UUID) TO authenticated;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.ai_config IS 'การตั้งค่า AI Assistant สำหรับระบบแชท';
COMMENT ON COLUMN public.ai_config.model IS 'OpenAI model (gpt-4o-mini, gpt-4o, etc.)';
COMMENT ON COLUMN public.ai_config.temperature IS 'ความสร้างสรรค์ของ AI (0-2)';
COMMENT ON COLUMN public.ai_config.max_tokens IS 'จำนวน tokens สูงสุดในคำตอบ';
COMMENT ON COLUMN public.ai_config.context_message_limit IS 'จำนวนข้อความที่ AI จะอ่านเพื่อเข้าใจบริบท';
COMMENT ON COLUMN public.ai_config.system_prompt IS 'System prompt หลักสำหรับ AI';
COMMENT ON COLUMN public.ai_config.prompt_guidelines IS 'แนวทางการตอบกลับในรูปแบบ JSON';
COMMENT ON COLUMN public.ai_config.is_default IS 'การตั้งค่าเริ่มต้น (มีได้เพียง 1 รายการ)';
