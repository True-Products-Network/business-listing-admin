-- SAFE CLEANUP: Remove duplicate pricing settings
-- This only deletes keys that are NOT used in the codebase

-- Step 1: Show what we have (including duplicates)
SELECT 
    setting_key,
    setting_value,
    created_at,
    CASE 
        WHEN setting_key IN ('premium_monthly_price', 'vip_monthly_price', 'founding_member_end_date', 'founding_member_enabled', 'founding_member_discount_percent') 
        THEN 'KEEP - Used in code'
        WHEN setting_key LIKE '% %' 
        THEN 'DELETE - Has spaces, not used'
        ELSE 'REVIEW - Check manually'
    END as action
FROM system_settings
WHERE category = 'pricing'
   OR setting_key LIKE '%price%'
   OR setting_key LIKE '%founding%'
   OR setting_key LIKE '%vip%'
   OR setting_key LIKE '%premium%'
ORDER BY setting_key, created_at;

-- Step 2: Show only the ones that will be deleted
SELECT setting_key, setting_value, created_at
FROM system_settings
WHERE setting_key IN ('Founding Member Deadline', 'VIP Monthly Price', 'Premier Price', 'Vip Price', 'Premium Price')
   OR (setting_key LIKE '% %' AND setting_key NOT IN ('support_phone', 'support_email', 'support_hours', 'business_name', 'site_url'));

-- Step 3: Delete only the unused duplicates
-- These keys are NOT referenced in any code files:
-- - 'Founding Member Deadline' (code uses 'founding_member_end_date')
-- - 'VIP Monthly Price' (code uses 'vip_monthly_price')
-- - 'Premier Price' (code uses 'premium_monthly_price')
-- - Any key with spaces (code always uses snake_case)

DELETE FROM system_settings
WHERE setting_key IN ('Founding Member Deadline', 'VIP Monthly Price', 'Premier Price', 'Vip Price', 'Premium Price')
   OR (setting_key LIKE '% %' 
       AND setting_key NOT IN ('support_phone', 'support_email', 'support_hours', 'business_name', 'site_url')
       AND category = 'pricing');

-- Step 4: Verify cleanup
SELECT setting_key, setting_value
FROM system_settings
WHERE category = 'pricing'
ORDER BY setting_key;
