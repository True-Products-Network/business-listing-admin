-- Quick fix: Just update the founding member end date
-- Run this in Supabase SQL Editor

-- Update the founding member end date to 2026-12-01
UPDATE system_settings 
SET setting_value = '2026-12-01'
WHERE setting_key = 'founding_member_end_date';

-- Also ensure founding_member_enabled is set to 'true'
UPDATE system_settings 
SET setting_value = 'true'
WHERE setting_key = 'founding_member_enabled';

-- Show current pricing settings
SELECT setting_key, setting_value
FROM system_settings
WHERE setting_key IN (
    'premium_monthly_price',
    'vip_monthly_price', 
    'founding_member_discount_percent',
    'founding_member_end_date',
    'founding_member_enabled'
)
ORDER BY setting_key;
