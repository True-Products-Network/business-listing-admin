-- Check why listings aren't showing in directory
-- 1. Check the view definition
SELECT 
  b.business_name,
  b.status as business_status,
  lst.listing_status,
  lp.plan_key,
  bl.city,
  bl.state
FROM businesses b
JOIN business_listings lst ON lst.business_id = b.id
JOIN listing_plans lp ON lp.id = lst.plan_id
LEFT JOIN business_locations bl ON bl.business_id = b.id AND bl.is_primary = true
WHERE lst.listing_status IN ('approved', 'active')
  AND b.status = 'active';

-- 2. Check if RLS is enabled on businesses
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('businesses', 'business_listings', 'business_locations');

-- 3. Temporarily disable RLS to test
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_locations DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled for testing' as status;
