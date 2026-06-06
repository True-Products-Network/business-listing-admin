-- Fix duplicate locations for a business
-- Run this in Supabase SQL Editor

-- First, check for duplicate locations
SELECT 
    business_id,
    COUNT(*) as location_count
FROM business_locations
WHERE is_primary = true
GROUP BY business_id
HAVING COUNT(*) > 1;

-- If you find duplicates, keep only the most recent one and delete others
-- Replace 'BUSINESS_ID_HERE' with the actual business ID

-- Example: For business with ID 'xxx-xxx-xxx', keep only the newest:
-- DELETE FROM business_locations
-- WHERE id IN (
--     SELECT id
--     FROM business_locations
--     WHERE business_id = 'xxx-xxx-xxx'
--     AND is_primary = true
--     ORDER BY created_at DESC
--     OFFSET 1
-- );

-- Or to see all locations for a specific business:
-- SELECT * FROM business_locations 
-- WHERE business_id = 'xxx-xxx-xxx'
-- ORDER BY created_at DESC;
