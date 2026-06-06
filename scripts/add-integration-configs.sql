-- ============================================================
-- INTEGRATION CONFIGURATIONS TABLE
-- Store sensitive integration variables (Stripe, Vercel, domains, etc.)
-- ============================================================

-- Create integration_configs table
CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  config_type TEXT DEFAULT 'text' 
    CHECK (config_type IN ('text', 'password', 'url', 'email', 'json', 'number', 'boolean')),
  category TEXT DEFAULT 'general'
    CHECK (category IN ('stripe', 'vercel', 'domain', 'supabase', 'ghl', 'email', 'general', 'api_keys')),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integration_configs_category ON integration_configs(category);
CREATE INDEX IF NOT EXISTS idx_integration_configs_key ON integration_configs(config_key);

-- Enable RLS
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

-- Only admins can view integration configs
CREATE POLICY "Admins can view integration configs" ON integration_configs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Only super_admins can modify integration configs
CREATE POLICY "Super admins can manage integration configs" ON integration_configs
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'super_admin'
  ));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_integration_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_integration_configs_updated_at ON integration_configs;
CREATE TRIGGER update_integration_configs_updated_at
  BEFORE UPDATE ON integration_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_configs_updated_at();

-- ============================================================
-- SEED DEFAULT CONFIGURATION VALUES
-- ============================================================

-- Domain Configuration
INSERT INTO integration_configs (config_key, config_value, config_type, category, description, is_sensitive) VALUES
('site_url', 'https://stl-business-guide-v2-rho.vercel.app', 'url', 'domain', 'Primary site URL for the STL Business Guide', false),
('production_domain', 'https://stlbusinessguide.com', 'url', 'domain', 'Production domain (when cutover is complete)', false),
('site_name', 'STL Business Guide', 'text', 'domain', 'Site name displayed throughout the application', false)
ON CONFLICT (config_key) DO NOTHING;

-- Stripe Configuration
INSERT INTO integration_configs (config_key, config_value, config_type, category, description, is_sensitive) VALUES
('stripe_publishable_key', 'pk_test_...', 'password', 'stripe', 'Stripe Publishable Key (pk_test_ or pk_live_)', true),
('stripe_secret_key', 'sk_test_...', 'password', 'stripe', 'Stripe Secret Key (sk_test_ or sk_live_) - NEVER EXPOSE TO CLIENT', true),
('stripe_webhook_secret', 'whsec_...', 'password', 'stripe', 'Stripe Webhook Endpoint Secret', true),
('stripe_premium_price_id', 'price_...', 'text', 'stripe', 'Stripe Price ID for Premium plan', false),
('stripe_vip_price_id', 'price_...', 'text', 'stripe', 'Stripe Price ID for VIP plan', false),
('stripe_webhook_url', 'https://stl-business-guide-v2-rho.vercel.app/api/webhooks/stripe', 'url', 'stripe', 'Full URL for Stripe webhook endpoint', false)
ON CONFLICT (config_key) DO NOTHING;

-- Vercel Configuration
INSERT INTO integration_configs (config_key, config_value, config_type, category, description, is_sensitive) VALUES
('vercel_project_id', '', 'text', 'vercel', 'Vercel Project ID', false),
('vercel_team_id', '', 'text', 'vercel', 'Vercel Team/Scope ID (e.g., true-products-network)', false),
('vercel_token', '', 'password', 'vercel', 'Vercel API Token (for automated deployments)', true)
ON CONFLICT (config_key) DO NOTHING;

-- Supabase Configuration
INSERT INTO integration_configs (config_key, config_value, config_type, category, description, is_sensitive) VALUES
('supabase_url', 'https://eceuqewlneufisussofc.supabase.co', 'url', 'supabase', 'Supabase Project URL', false),
('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 'password', 'supabase', 'Supabase Anonymous Key (public)', true),
('supabase_service_role_key', '', 'password', 'supabase', 'Supabase Service Role Key (server-side only)', true)
ON CONFLICT (config_key) DO NOTHING;

-- GoHighLevel Configuration
INSERT INTO integration_configs (config_key, config_value, config_type, category, description, is_sensitive) VALUES
('ghl_webhook_url', 'https://services.leadconnectorhq.com/hooks/...', 'url', 'ghl', 'GHL Webhook URL for new listing notifications', false),
('ghl_location_id', '', 'text', 'ghl', 'GHL Location ID', false),
('ghl_api_key', '', 'password', 'ghl', 'GHL API Key', true)
ON CONFLICT (config_key) DO NOTHING;

-- Email Configuration
INSERT INTO integration_configs (config_key, config_value, config_type, category, description, is_sensitive) VALUES
('smtp_host', '', 'text', 'email', 'SMTP Server Host', false),
('smtp_port', '587', 'number', 'email', 'SMTP Server Port', false),
('smtp_user', '', 'text', 'email', 'SMTP Username', false),
('smtp_password', '', 'password', 'email', 'SMTP Password', true),
('email_from', 'noreply@stlbusinessguide.com', 'email', 'email', 'Default From email address', false),
('email_from_name', 'STL Business Guide', 'text', 'email', 'Default From name', false)
ON CONFLICT (config_key) DO NOTHING;

-- API Keys / External Services
INSERT INTO integration_configs (config_key, config_value, config_type, category, description, is_sensitive) VALUES
('google_maps_api_key', '', 'password', 'api_keys', 'Google Maps API Key (for geocoding)', true),
('openai_api_key', '', 'password', 'api_keys', 'OpenAI API Key', true)
ON CONFLICT (config_key) DO NOTHING;

-- Grant permissions
GRANT ALL ON integration_configs TO authenticated;
GRANT ALL ON integration_configs TO anon;

-- ============================================================
-- CREATE HELPER VIEW FOR ACTIVE CONFIGS
-- ============================================================

CREATE OR REPLACE VIEW active_integration_configs AS
SELECT 
  id,
  config_key,
  CASE 
    WHEN is_sensitive THEN '••••••••' 
    ELSE config_value 
  END as display_value,
  config_value as raw_value,
  config_type,
  category,
  description,
  is_sensitive,
  is_active,
  updated_at
FROM integration_configs
WHERE is_active = true
ORDER BY category, config_key;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'Integration configs table created successfully!' as status;
SELECT COUNT(*) as total_configs FROM integration_configs;
SELECT category, COUNT(*) as count FROM integration_configs GROUP BY category ORDER BY category;