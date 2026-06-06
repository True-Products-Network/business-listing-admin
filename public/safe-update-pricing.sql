-- SAFE UPDATE: Check schema before making changes
-- This script prevents duplicates and validates existing structure

-- Step 1: Show current pricing-related settings
SELECT 
    setting_key,
    setting_value,
    setting_type,
    category,
    is_public,
    created_at
FROM system_settings
WHERE category = 'pricing'
   OR setting_key LIKE '%price%'
   OR setting_key LIKE '%founding%'
   OR setting_key LIKE '%premier%'
   OR setting_key LIKE '%vip%'
ORDER BY setting_key;

-- Step 2: Count duplicates
SELECT 
    setting_key,
    COUNT(*) as count
FROM system_settings
WHERE category = 'pricing'
   OR setting_key LIKE '%price%'
   OR setting_key LIKE '%founding%'
GROUP BY setting_key
HAVING COUNT(*) > 1;

-- Step 3: Only proceed if no duplicates exist
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT setting_key
        FROM system_settings
        WHERE category = 'pricing'
           OR setting_key LIKE '%price%'
           OR setting_key LIKE '%founding%'
        GROUP BY setting_key
        HAVING COUNT(*) > 1
    ) dupes;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % duplicate setting keys. Run cleanup first.', duplicate_count;
    ELSE
        RAISE NOTICE 'No duplicates found. Safe to proceed.';
        
        -- Ensure standard fields exist (only if not present)
        IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'founding_member_enabled') THEN
            INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
            VALUES ('founding_member_enabled', 'true', 'boolean', 'Enable/disable founding member pricing', 'pricing', true);
            RAISE NOTICE 'Created: founding_member_enabled';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'premium_monthly_price') THEN
            INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
            VALUES ('premium_monthly_price', '47', 'number', 'Premium plan monthly price', 'pricing', true);
            RAISE NOTICE 'Created: premium_monthly_price';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'vip_monthly_price') THEN
            INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
            VALUES ('vip_monthly_price', '97', 'number', 'VIP plan monthly price', 'pricing', true);
            RAISE NOTICE 'Created: vip_monthly_price';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'founding_member_discount_percent') THEN
            INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
            VALUES ('founding_member_discount_percent', '50', 'number', 'Discount percentage for founding members', 'pricing', true);
            RAISE NOTICE 'Created: founding_member_discount_percent';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'founding_member_end_date') THEN
            INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public)
            VALUES ('founding_member_end_date', '2026-12-31', 'date', 'Founding member discount end date', 'pricing', true);
            RAISE NOTICE 'Created: founding_member_end_date';
        END IF;
    END IF;
END $$;

-- Step 4: Show final state
SELECT 
    setting_key,
    setting_value,
    is_public
FROM system_settings
WHERE category = 'pricing'
ORDER BY setting_key;
