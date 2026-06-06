-- Fix listings with null plan_id
-- The view joins with listing_plans, so null plan_id causes no results

-- First, check what plan_ids are available
SELECT id, plan_key, plan_name FROM listing_plans;

-- Update the listing to have a valid plan_id (Free plan)
UPDATE business_listings 
SET plan_id = (
  SELECT id FROM listing_plans WHERE plan_key = 'free' LIMIT 1
)
WHERE plan_id IS NULL;

-- Also update the view to handle null plan_id with LEFT JOIN
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
  COALESCE(lp.plan_key, 'free') as plan_key,
  COALESCE(lp.plan_name, 'Free Listing') as plan_name,
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
LEFT JOIN listing_plans lp ON lp.id = lst.plan_id
LEFT JOIN business_locations bl ON bl.business_id = b.id AND bl.is_primary = true
LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = true
LEFT JOIN categories c ON c.id = bc.category_id
WHERE lst.listing_status IN ('approved', 'active')
  AND b.status = 'active';

-- Verify the fix
SELECT 
  b.business_name,
  lst.listing_status,
  lp.plan_key
FROM businesses b
JOIN business_listings lst ON lst.business_id = b.id
LEFT JOIN listing_plans lp ON lp.id = lst.plan_id
WHERE lst.listing_status = 'approved';
