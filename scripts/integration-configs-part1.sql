-- ============================================================
-- INTEGRATION CONFIGURATIONS TABLE - PART 1: CREATE TABLE
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

-- Grant permissions
GRANT ALL ON integration_configs TO authenticated;
GRANT ALL ON integration_configs TO anon;

-- Verify table was created
SELECT 'Integration configs table created successfully!' as status;
SELECT COUNT(*) as total_configs FROM integration_configs;