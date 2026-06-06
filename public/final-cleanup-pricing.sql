-- FINAL CLEANUP: Keep only correct snake_case keys
-- Code uses: premium_monthly_price, vip_monthly_price, founding_member_end_date, founding_member_enabled

-- Step 1: Show current state
SELECT setting_key, setting_value
FROM system_settings
WHERE category = 'pricing'
   OR setting_key LIKE '%price%'
   OR setting_key LIKE '%founding%'
   OR setting_key LIKE '%vip%'
   OR setting_key LIKE '%premium%'
ORDER BY setting_key;

-- Step 2: Delete duplicates with wrong naming
-- Keep: premium_monthly_price, vip_monthly_price, founding_member_end_date, founding_member_enabled, founding_member_discount_percent, founding_member_limit
-- Delete: everything else

DELETE FROM system_settings
WHERE setting_key IN (
    'founding_member_deadline',      -- Use founding_member_end_date instead
    'premium_regular_price',          -- Not used in code
    'VIP_monthly_price',              -- Wrong case (VIP vs vip)
    'VIP_regular_price',              -- Not used in code
    'Founding Member Deadline',       -- Has spaces
    'VIP Monthly Price',              -- Has spaces
    'Premier Price',                  -- Has spaces, wrong name
    'Vip Price',                      -- Has spaces
    'Premium Price'                   -- Has spaces
);

-- Step 3: Ensure we have the correct values
-- Update premium to 47
UPDATE system_settings 
SET setting_value = '47'
WHERE setting_key = 'premium_monthly_price';

-- Update VIP to 97  
UPDATE system_settings 
SET setting_value = '97'
WHERE setting_key = 'vip_monthly_price';

-- Update founding member end date
UPDATE system_settings 
SET setting_value = '2026-12-01'
WHERE setting_key = 'founding_member_end_date';

-- Step 4: Show final clean state
SELECT setting_key, setting_value
FROM system_settings
WHERE category = 'pricing'
   OR setting_key IN ('premium_monthly_price', 'vip_monthly_price', 'founding_member_end_date', 'founding_member_enabled', 'founding_member_discount_percent', 'founding_member_limit')
ORDER BY setting_key;
