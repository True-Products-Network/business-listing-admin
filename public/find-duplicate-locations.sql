-- Find businesses with duplicate primary locations
-- Run this in Supabase SQL Editor

-- Step 1: Find all businesses with duplicate primary locations
SELECT 
    b.business_name,
    bl.business_id,
    COUNT(*) as location_count
FROM business_locations bl
JOIN businesses b ON b.id = bl.business_id
WHERE bl.is_primary = true
GROUP BY bl.business_id, b.business_name
HAVING COUNT(*) > 1
ORDER BY location_count DESC;

-- Step 2: See all locations for businesses with duplicates
SELECT 
    b.business_name,
    bl.id,
    bl.business_id,
    bl.address_line_1,
    bl.city,
    bl.state,
    bl.created_at
FROM business_locations bl
JOIN businesses b ON b.id = bl.business_id
WHERE bl.is_primary = true
AND bl.business_id IN (
    SELECT business_id
    FROM business_locations
    WHERE is_primary = true
    GROUP BY business_id
    HAVING COUNT(*) > 1
)
ORDER BY bl.business_id, bl.created_at DESC;

-- Step 3: Delete older duplicate locations (keep only the newest)
-- WARNING: Run this only after verifying Step 2 shows the correct duplicates
-- DELETE FROM business_locations
-- WHERE id IN (
--     SELECT id FROM (
--         SELECT 
--             id,
--             ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY created_at DESC) as rn
--         FROM business_locations
--         WHERE is_primary = true
--     ) ranked
--     WHERE rn > 1
-- );
