-- Add regular prices as fallback when founding member pricing ends
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
    ('premium_regular_price', '97', 'number', 'Regular Premium price (after founding member period)', 'pricing', true),
    ('vip_regular_price', '497', 'number', 'Regular VIP price (after founding member period)', 'pricing', true)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    is_public = true;

-- Show final pricing settings
SELECT setting_key, setting_value
FROM system_settings
WHERE category = 'pricing'
   OR setting_key IN ('premium_monthly_price', 'vip_monthly_price', 'premium_regular_price', 'vip_regular_price', 'founding_member_end_date', 'founding_member_enabled', 'founding_member_discount_percent', 'founding_member_limit')
ORDER BY setting_key;
