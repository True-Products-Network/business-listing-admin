-- Create system_settings table for global configuration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text', -- text, number, boolean, json
    description TEXT,
    category VARCHAR(50) DEFAULT 'general', -- general, contact, branding, notifications
    is_public BOOLEAN DEFAULT false, -- if true, available to public/anonymous users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin read system_settings" ON system_settings;
DROP POLICY IF EXISTS "Allow admin update system_settings" ON system_settings;
DROP POLICY IF EXISTS "Allow public read public settings" ON system_settings;

-- Allow authenticated admins to read all settings
CREATE POLICY "Allow admin read system_settings" ON system_settings
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated admins to update settings
CREATE POLICY "Allow admin update system_settings" ON system_settings
    FOR UPDATE TO authenticated USING (true);

-- Allow admins to insert new settings
CREATE POLICY "Allow admin insert system_settings" ON system_settings
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow public to read public settings (like contact info)
CREATE POLICY "Allow public read public settings" ON system_settings
    FOR SELECT TO anon USING (is_public = true);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON system_settings TO authenticated;
GRANT SELECT ON system_settings TO anon;

-- Insert default contact settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
    ('support_phone', '(314) 886-8084', 'text', 'Customer support phone number', 'contact', true),
    ('support_email', 'support@stlbusinessguide.com', 'text', 'Customer support email address', 'contact', true),
    ('support_hours', 'Mon-Fri, 9am-5pm CST', 'text', 'Customer support hours', 'contact', true),
    ('business_name', 'STL Business Guide', 'text', 'Business name for emails and branding', 'branding', true),
    ('site_url', 'https://www.stlbusinessguide.com', 'text', 'Main website URL', 'branding', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Verify
SELECT * FROM system_settings ORDER BY category, setting_key;
