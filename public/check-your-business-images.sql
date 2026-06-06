-- Check images for "Your business could be here"
-- Run this in Supabase SQL Editor

-- Step 1: Find the business
SELECT id, business_name, logo_url
FROM businesses
WHERE business_name ILIKE '%Your business could be here%';

-- Step 2: Check all images (replace with actual ID from Step 1)
SELECT 
    bi.id,
    bi.image_url,
    bi.image_type,
    bi.sort_order,
    bi.is_primary,
    bi.created_at
FROM business_images bi
WHERE bi.business_id IN (
    SELECT id FROM businesses WHERE business_name ILIKE '%Your business could be here%'
)
ORDER BY bi.image_type, bi.sort_order, bi.created_at;

-- Step 3: Check what the view returns
SELECT 
    id,
    business_name,
    featured_image_url,
    logo_url,
    gallery_images
FROM public_approved_listings
WHERE business_name ILIKE '%Your business could be here%';
