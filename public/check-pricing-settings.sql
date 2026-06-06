-- Check all pricing-related settings
SELECT 
    setting_key,
    setting_value,
    setting_type,
    category,
    is_public
FROM system_settings
WHERE category = 'pricing'
   OR setting_key LIKE '%founding%'
   OR setting_key LIKE '%price%'
   OR setting_key LIKE '%premium%'
   OR setting_key LIKE '%vip%'
ORDER BY setting_key;
