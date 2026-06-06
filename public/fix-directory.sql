-- Fix the directory view to properly show approved listings
-- The issue: business_listings uses 'listing_status' not 'status'

DROP VIEW IF EXISTS public_approved_listings;

CREATE OR REPLACE VIEW public_approved_listings AS
SELECT 
  b.id,
  b.business_name,
  b.slug,
  b.description_short,
  b.description_long,
  b.phone,
  b.email,
  b.website_url,
  b.logo_url,
  bl.city,
  bl.state,
  bl.zip_code,
  bl.service_area,
  c.name as primary_category,
  lp.plan_key,
  lp.plan_name,
  lst.listing_status,
  lst.is_featured,
  lst.sort_priority,
  lst.video_url,
  lst.facebook_url,
  lst.linkedin_url,
  lst.instagram_url,
  lst.youtube_url
FROM businesses b
JOIN business_listings lst ON lst.business_id = b.id
JOIN listing_plans lp ON lp.id = lst.plan_id
LEFT JOIN business_locations bl ON bl.business_id = b.id AND bl.is_primary = true
LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = true
LEFT JOIN categories c ON c.id = bc.category_id
WHERE lst.listing_status IN ('approved', 'active')
  AND b.status = 'active';

-- Also need to re-enable RLS on businesses for security but allow public read
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policy for public to read active/approved businesses
DROP POLICY IF EXISTS "Public can view active businesses" ON businesses;
CREATE POLICY "Public can view active businesses" ON businesses
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- Check what's in the database
SELECT 
  b.business_name,
  b.status as business_status,
  lst.listing_status,
  lp.plan_key
FROM businesses b
JOIN business_listings lst ON lst.business_id = b.id
JOIN listing_plans lp ON lp.id = lst.plan_id
LIMIT 5;
