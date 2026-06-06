-- Check all images stored for a specific business
-- Run this in Supabase SQL Editor

-- Step 1: Find the business by name (replace with the actual business name)
SELECT id, business_name, logo_url
FROM businesses
WHERE business_name ILIKE '%BUSINESS_NAME_HERE%';

-- Step 2: Check all images for that business (replace BUSINESS_ID with actual ID)
SELECT 
    bi.id as image_id,
    bi.image_url,
    bi.image_type,
    bi.sort_order,
    bi.is_primary,
    bi.created_at
FROM business_images bi
WHERE bi.business_id = 'BUSINESS_ID_HERE'
ORDER BY bi.image_type, bi.sort_order, bi.created_at;

-- Step 3: Check what the view returns for featured_image_url
SELECT 
    id,
    business_name,
    featured_image_url,
    logo_url,
    gallery_images
FROM public_approved_listings
WHERE business_name ILIKE '%BUSINESS_NAME_HERE%';

-- Step 4: See the COALESCE logic in action
SELECT 
    b.business_name,
    b.logo_url as business_logo,
    (
        SELECT bi.image_url 
        FROM business_images bi 
        WHERE bi.business_id = b.id 
        AND bi.image_type = 'gallery'
        ORDER BY bi.sort_order 
        LIMIT 1
    ) as first_gallery_image,
    COALESCE(
        (
            SELECT bi.image_url 
            FROM business_images bi 
            WHERE bi.business_id = b.id 
            AND bi.image_type = 'gallery'
            ORDER BY bi.sort_order 
            LIMIT 1
        ),
        b.logo_url
    ) as featured_image_result
FROM businesses b
WHERE b.business_name ILIKE '%BUSINESS_NAME_HERE%';
