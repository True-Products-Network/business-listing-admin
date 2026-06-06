-- Approve the most recent business listing
-- This updates both the business_listings and businesses tables

-- First, see what listings are pending
SELECT 
  b.id as business_id,
  b.business_name,
  lst.id as listing_id,
  lst.listing_status,
  b.status as business_status
FROM businesses b
JOIN business_listings lst ON lst.business_id = b.id
WHERE lst.listing_status = 'pending'
ORDER BY b.created_at DESC
LIMIT 5;

-- Approve the most recent listing
UPDATE business_listings 
SET listing_status = 'approved'
WHERE id = (
  SELECT lst.id 
  FROM business_listings lst
  JOIN businesses b ON b.id = lst.business_id
  WHERE lst.listing_status = 'pending'
  ORDER BY b.created_at DESC
  LIMIT 1
);

-- Also set the business to active
UPDATE businesses 
SET status = 'active'
WHERE id = (
  SELECT b.id 
  FROM businesses b
  JOIN business_listings lst ON lst.business_id = b.id
  WHERE lst.listing_status = 'approved'
  ORDER BY b.created_at DESC
  LIMIT 1
);

-- Verify the approval
SELECT 
  b.business_name,
  b.status as business_status,
  lst.listing_status
FROM businesses b
JOIN business_listings lst ON lst.business_id = b.id
WHERE lst.listing_status = 'approved'
ORDER BY b.created_at DESC
LIMIT 5;
