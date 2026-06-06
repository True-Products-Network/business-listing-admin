-- Ensure pricing settings exist and are publicly readable
-- Run this in Supabase SQL Editor

-- Insert or update pricing settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
    ('premium_monthly_price', '47', 'number', 'Premium plan monthly price', 'pricing', true),
    ('vip_monthly_price', '97', 'number', 'VIP plan monthly price', 'pricing', true),
    ('founding_member_discount_percent', '50', 'number', 'Discount percentage for founding members', 'pricing', true),
    ('founding_member_end_date', '2026-12-31', 'date', 'Founding member discount end date', 'pricing', true)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    is_public = true;

-- Ensure RLS policy allows public read
DROP POLICY IF EXISTS "Allow public read public settings" ON system_settings;
CREATE POLICY "Allow public read public settings" ON system_settings
    FOR SELECT TO anon USING (is_public = true);

-- Grant select to anon
GRANT SELECT ON system_settings TO anon;

-- Verify
SELECT setting_key, setting_value, is_public FROM system_settings WHERE category = 'pricing';
