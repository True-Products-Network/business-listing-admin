-- Check premium/VIP counts
-- Run this in Supabase SQL Editor

-- Count by plan type
SELECT 
    lp.plan_key,
    lp.plan_name,
    COUNT(*) as count
FROM business_listings bl
JOIN listing_plans lp ON lp.id = bl.plan_id
WHERE bl.listing_status IN ('approved', 'active')
GROUP BY lp.plan_key, lp.plan_name;

-- Total paid listings (Premium + VIP)
SELECT COUNT(*) as total_paid
FROM business_listings
WHERE plan_id IS NOT NULL
AND listing_status IN ('approved', 'active');

-- Check if there's a listing with plan_id that doesn't exist in listing_plans
SELECT bl.id, bl.plan_id, bl.listing_status
FROM business_listings bl
LEFT JOIN listing_plans lp ON lp.id = bl.plan_id
WHERE bl.plan_id IS NOT NULL
AND lp.id IS NULL;
