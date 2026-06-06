-- CLEANUP: Fix duplicate pricing settings and use correct schema
-- Run this in Supabase SQL Editor

-- First, let's see what we have
SELECT setting_key, setting_value, category, is_public, created_at
FROM system_settings
WHERE setting_key LIKE '%price%' 
   OR setting_key LIKE '%founding%'
   OR setting_key LIKE '%premium%'
   OR setting_key LIKE '%vip%'
ORDER BY setting_key, created_at;

-- Delete duplicates keeping only the most recent
DELETE FROM system_settings a
WHERE a.ctid NOT IN (
    SELECT MAX(b.ctid)
    FROM system_settings b
    WHERE b.setting_key = a.setting_key
)
AND a.setting_key IN (
    SELECT setting_key
    FROM system_settings
    GROUP BY setting_key
    HAVING COUNT(*) > 1
);

-- Now check what the actual field names are
SELECT setting_key, setting_value
FROM system_settings
WHERE category = 'pricing' 
   OR setting_key LIKE '%price%'
   OR setting_key LIKE '%founding%'
ORDER BY setting_key;

-- Standardize the naming - update to consistent keys
-- Map old names to new standard names
UPDATE system_settings 
SET setting_key = 'premium_monthly_price'
WHERE setting_key IN ('Premier Price', 'premier_price', 'premium_price', 'Premium Price')
  AND NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'premium_monthly_price');

UPDATE system_settings 
SET setting_key = 'vip_monthly_price'
WHERE setting_key IN ('VIP Price', 'vip_price', 'Vip Price')
  AND NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'vip_monthly_price');

UPDATE system_settings 
SET setting_key = 'founding_member_end_date'
WHERE setting_key IN ('Founding Member Deadline', 'founding_member_deadline', 'Founding Member End Date')
  AND NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'founding_member_end_date');

-- Delete any remaining duplicates after rename
DELETE FROM system_settings a
WHERE a.ctid NOT IN (
    SELECT MAX(b.ctid)
    FROM system_settings b
    WHERE b.setting_key = a.setting_key
)
AND a.setting_key IN (
    SELECT setting_key
    FROM system_settings
    GROUP BY setting_key
    HAVING COUNT(*) > 1
);

-- Ensure we have the required fields with correct names
-- Check if founding_member_enabled exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'founding_member_enabled') THEN
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
        VALUES ('founding_member_enabled', 'true', 'boolean', 'Enable/disable founding member pricing', 'pricing', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'premium_monthly_price') THEN
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
        VALUES ('premium_monthly_price', '47', 'number', 'Premium plan monthly price', 'pricing', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'vip_monthly_price') THEN
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
        VALUES ('vip_monthly_price', '97', 'number', 'VIP plan monthly price', 'pricing', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'founding_member_discount_percent') THEN
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
        VALUES ('founding_member_discount_percent', '50', 'number', 'Discount percentage for founding members', 'pricing', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'founding_member_end_date') THEN
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
        VALUES ('founding_member_end_date', '2026-12-31', 'date', 'Founding member discount end date', 'pricing', true);
    END IF;
END $$;

-- Show final state
SELECT setting_key, setting_value, category, is_public
FROM system_settings
WHERE category = 'pricing'
   OR setting_key LIKE '%price%'
   OR setting_key LIKE '%founding%'
ORDER BY setting_key;
