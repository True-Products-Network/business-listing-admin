-- Debug why listings aren't showing
-- Check all businesses and their listing status

SELECT 
  'All businesses' as check_type,
  COUNT(*) as count
FROM businesses
UNION ALL
SELECT 
  'Active businesses',
  COUNT(*)
FROM businesses
WHERE status = 'active'
UNION ALL
SELECT 
  'All listings',
  COUNT(*)
FROM business_listings
UNION ALL
SELECT 
  'Approved listings',
  COUNT(*)
FROM business_listings
WHERE listing_status IN ('approved', 'active')
UNION ALL
SELECT 
  'Approved + Active businesses',
  COUNT(*)
FROM businesses b
JOIN business_listings lst ON lst.business_id = b.id
WHERE lst.listing_status IN ('approved', 'active')
  AND b.status = 'active';

-- Show the actual data
SELECT 
  b.id,
  b.business_name,
  b.status as business_status,
  lst.id as listing_id,
  lst.listing_status,
  lst.plan_id
FROM businesses b
JOIN business_listings lst ON lst.business_id = b.id
ORDER BY b.created_at DESC
LIMIT 5;
