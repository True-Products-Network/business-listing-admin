-- Check business statuses
-- Run this in Supabase SQL Editor

-- Check businesses table status values
SELECT DISTINCT status, COUNT(*) as count
FROM businesses
GROUP BY status;

-- Check business_listings status values
SELECT DISTINCT listing_status, COUNT(*) as count
FROM business_listings
GROUP BY listing_status;

-- Count approved businesses
SELECT COUNT(*) as approved_businesses
FROM business_listings
WHERE listing_status IN ('approved', 'active');
