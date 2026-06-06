-- Fix system_settings table - run this if you get errors

-- First, check if table exists and add missing columns
DO $$
BEGIN
    -- Add is_public column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'system_settings' AND column_name = 'is_public') THEN
        ALTER TABLE system_settings ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
    
    -- Add setting_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'system_settings' AND column_name = 'setting_type') THEN
        ALTER TABLE system_settings ADD COLUMN setting_type VARCHAR(50) DEFAULT 'text';
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'system_settings' AND column_name = 'category') THEN
        ALTER TABLE system_settings ADD COLUMN category VARCHAR(50) DEFAULT 'general';
    END IF;
END $$;

-- Enable RLS (safe to run multiple times)
ALTER TABLE IF EXISTS system_settings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Allow admin read system_settings" ON system_settings;
DROP POLICY IF EXISTS "Allow admin update system_settings" ON system_settings;
DROP POLICY IF EXISTS "Allow admin insert system_settings" ON system_settings;
DROP POLICY IF EXISTS "Allow public read public settings" ON system_settings;

-- Create policies
CREATE POLICY "Allow admin read system_settings" ON system_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin update system_settings" ON system_settings
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow admin insert system_settings" ON system_settings
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow public read public settings" ON system_settings
    FOR SELECT TO anon USING (is_public = true);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON system_settings TO authenticated;
GRANT SELECT ON system_settings TO anon;

-- Insert or update default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
    ('support_phone', '(314) 886-8084', 'text', 'Customer support phone number', 'contact', true),
    ('support_email', 'support@stlbusinessguide.com', 'text', 'Customer support email address', 'contact', true),
    ('support_hours', 'Mon-Fri, 9am-5pm CST', 'text', 'Customer support hours', 'contact', true),
    ('business_name', 'STL Business Guide', 'text', 'Business name for emails and branding', 'branding', true),
    ('site_url', 'https://www.stlbusinessguide.com', 'text', 'Main website URL', 'branding', true)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    setting_type = EXCLUDED.setting_type,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_public = EXCLUDED.is_public;

-- Verify
SELECT * FROM system_settings ORDER BY category, setting_key;
