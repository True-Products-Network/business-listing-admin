-- Check images for AIM Training
-- Run this in Supabase SQL Editor

-- Find the business ID first
SELECT id, business_name 
FROM businesses 
WHERE business_name ILIKE '%AIM Training%';

-- Then check all images for that business (replace with actual ID)
SELECT 
    bi.id,
    bi.image_url,
    bi.image_type,
    bi.sort_order,
    bi.created_at
FROM business_images bi
WHERE bi.business_id = 'a5234705-7584-40bc-9e48-8af00e51acd3'
ORDER BY bi.sort_order, bi.created_at;

-- Check what the view returns
SELECT 
    id,
    business_name,
    gallery_images,
    json_array_length(gallery_images) as image_count
FROM public_approved_listings
WHERE business_name ILIKE '%AIM Training%';
