-- Check for duplicates in the public_approved_listings view for AIM Training
-- Run this in Supabase SQL Editor

-- Find the business first
SELECT id, business_name, slug
FROM businesses
WHERE business_name ILIKE '%AIM Training%';

-- Check if there are duplicate entries in public_approved_listings
SELECT 
    id,
    business_name,
    slug,
    plan_key,
    listing_status,
    city,
    state
FROM public_approved_listings
WHERE business_name ILIKE '%AIM Training%'
ORDER BY plan_key, is_featured DESC;

-- Check business_listings table directly
SELECT 
    bl.id as listing_id,
    bl.business_id,
    bl.plan_id,
    bl.listing_status,
    bl.is_featured,
    bl.created_at,
    b.business_name
FROM business_listings bl
JOIN businesses b ON b.id = bl.business_id
WHERE b.business_name ILIKE '%AIM Training%'
ORDER BY bl.created_at DESC;
