-- Find Free listings that have a plan_id (should be NULL)
-- Run this in Supabase SQL Editor

SELECT 
    bl.id,
    bl.business_id,
    b.business_name,
    bl.plan_id,
    lp.plan_key,
    lp.plan_name,
    bl.listing_status
FROM business_listings bl
JOIN businesses b ON b.id = bl.business_id
JOIN listing_plans lp ON lp.id = bl.plan_id
WHERE lp.plan_key = 'free'
AND bl.listing_status IN ('approved', 'active');
