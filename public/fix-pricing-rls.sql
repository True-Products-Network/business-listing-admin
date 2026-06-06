-- Fix RLS to allow public read on all pricing settings
-- Run this in Supabase SQL Editor

-- Update all pricing settings to be public
UPDATE system_settings
SET is_public = true
WHERE category = 'pricing'
   OR setting_key IN (
       'premium_monthly_price',
       'vip_monthly_price',
       'premium_regular_price',
       'vip_regular_price',
       'founding_member_enabled',
       'founding_member_end_date',
       'founding_member_discount_percent',
       'founding_member_limit'
   );

-- Verify the change
SELECT setting_key, setting_value, is_public
FROM system_settings
WHERE category = 'pricing'
ORDER BY setting_key;
