-- ============================================
-- MAAS AI System - Supabase Database Schema
-- Marketing Automation AI Assistant System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'manager', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url TEXT,
  phone TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- User permissions
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

-- ============================================
-- 2. CUSTOMERS & LEADS
-- ============================================

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id TEXT UNIQUE,
  email TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  lead_status TEXT DEFAULT 'cold' CHECK (lead_status IN ('cold', 'warm', 'hot', 'converted')),
  customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'enterprise')),
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  tags TEXT[],
  notes TEXT,
  source TEXT,
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead score history
CREATE TABLE public.lead_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  old_score INTEGER,
  new_score INTEGER,
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  changed_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PRODUCTS & COURSES
-- ============================================

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('course', 'book', 'bundle')),
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ORDERS & PAYMENTS
-- ============================================

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'credit_card', 'promptpay', 'installment', 'cod')),
  shipping_address JSONB,
  tracking_number TEXT,
  notes TEXT,
  closed_by TEXT CHECK (closed_by IN ('ai', 'admin')),
  closed_by_user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Installment plans
CREATE TABLE public.installment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  installments INTEGER NOT NULL,
  installment_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Installment payments
CREATE TABLE public.installment_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installment_plan_id UUID NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_slip_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CUSTOMER PURCHASES & ACCESS
-- ============================================

-- Customer purchases (course access)
CREATE TABLE public.customer_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  order_id UUID REFERENCES public.orders(id),
  access_granted_at TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ, -- 3 years from purchase
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. MESSAGES & CONVERSATIONS
-- ============================================

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'line' CHECK (channel IN ('line', 'web', 'email')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  assigned_to UUID REFERENCES public.users(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'ai', 'admin')),
  sender_id UUID REFERENCES public.users(id),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'sticker')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. AI INTERACTIONS & PERFORMANCE
-- ============================================

-- AI interactions
CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  message_id UUID REFERENCES public.messages(id),
  intent TEXT,
  confidence_score DECIMAL(5,2),
  ai_response TEXT,
  was_escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales statistics (AI vs Admin)
CREATE TABLE public.sales_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  closed_by TEXT NOT NULL CHECK (closed_by IN ('ai', 'admin')),
  user_id UUID REFERENCES public.users(id),
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  avg_response_time_seconds DECIMAL(10,2),
  conversion_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, closed_by, user_id)
);

-- ============================================
-- 8. SUPPORT TICKETS
-- ============================================

-- Support tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('technical', 'billing', 'product', 'shipping', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket messages
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin', 'system')),
  sender_id UUID REFERENCES public.users(id),
  message TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. FOLLOW-UPS & AUTOMATION
-- ============================================

-- Follow-ups
CREATE TABLE public.follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  follow_up_type TEXT NOT NULL CHECK (follow_up_type IN ('day_7', 'course_completion', 'upsell', 'feedback', 'custom')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  message_template TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. PROMOTIONS & DISCOUNTS
-- ============================================

-- Promotions
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. COMMON ISSUES (AI Knowledge Base)
-- ============================================

-- Common issues
CREATE TABLE public.common_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  issue TEXT NOT NULL,
  solution TEXT NOT NULL,
  keywords TEXT[],
  occurrence_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. SYSTEM SETTINGS
-- ============================================

-- System settings
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Users
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);

-- Customers
CREATE INDEX idx_customers_lead_status ON public.customers(lead_status);
CREATE INDEX idx_customers_lead_score ON public.customers(lead_score);
CREATE INDEX idx_customers_line_user_id ON public.customers(line_user_id);
CREATE INDEX idx_customers_email ON public.customers(email);

-- Orders
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

-- Messages
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- AI Interactions
CREATE INDEX idx_ai_interactions_customer_id ON public.ai_interactions(customer_id);
CREATE INDEX idx_ai_interactions_created_at ON public.ai_interactions(created_at);

-- Support Tickets
CREATE INDEX idx_support_tickets_customer_id ON public.support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Customers policies
CREATE POLICY "Authenticated users can view customers"
  ON public.customers FOR SELECT
  USING (auth.role() = 'authenticated');

-- Orders policies
CREATE POLICY "Authenticated users can view orders"
  ON public.orders FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate customer lifetime value
CREATE OR REPLACE FUNCTION calculate_customer_lifetime_value()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.customers
  SET 
    total_spent = (
      SELECT COALESCE(SUM(final_amount), 0)
      FROM public.orders
      WHERE customer_id = NEW.customer_id AND payment_status = 'paid'
    ),
    total_orders = (
      SELECT COUNT(*)
      FROM public.orders
      WHERE customer_id = NEW.customer_id AND payment_status = 'paid'
    ),
    lifetime_value = (
      SELECT COALESCE(SUM(final_amount), 0)
      FROM public.orders
      WHERE customer_id = NEW.customer_id AND payment_status = 'paid'
    )
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer stats when order is paid
CREATE TRIGGER update_customer_stats_on_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid')
  EXECUTE FUNCTION calculate_customer_lifetime_value();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('ai_model', '{"provider": "openai", "model": "gpt-4"}', 'AI model configuration'),
  ('lead_score_thresholds', '{"cold": 39, "warm": 79, "hot": 100}', 'Lead score thresholds'),
  ('auto_escalation_rules', '{"vip_customer": true, "hot_lead": true, "technical_issue": true}', 'Auto escalation rules'),
  ('business_hours', '{"start": "09:00", "end": "18:00", "timezone": "Asia/Bangkok"}', 'Business hours'),
  ('course_access_duration_years', '3', 'Default course access duration in years');

-- ============================================
-- END OF SCHEMA
-- ============================================
