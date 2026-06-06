-- Fix Free listings that have a plan_id assigned
-- Run this in Supabase SQL Editor

-- Set plan_id to NULL for Free listings
UPDATE business_listings
SET plan_id = NULL
WHERE id IN (
    SELECT bl.id
    FROM business_listings bl
    JOIN listing_plans lp ON lp.id = bl.plan_id
    WHERE lp.plan_key = 'free'
);

-- Verify the fix
SELECT 
    lp.plan_key,
    COUNT(*) as count
FROM business_listings bl
LEFT JOIN listing_plans lp ON lp.id = bl.plan_id
WHERE bl.listing_status IN ('approved', 'active')
GROUP BY lp.plan_key;
