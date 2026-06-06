-- Fix the public_approved_listings view with ALL columns
-- Drop and recreate with DISTINCT to prevent duplicates

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS public_approved_listings;

-- Step 2: Recreate the view with all original columns plus DISTINCT
CREATE VIEW public_approved_listings AS
SELECT DISTINCT ON (bl.id)
    bl.id,
    b.id as business_id,
    b.business_name,
    b.slug,
    b.description_short,
    b.description_long,
    b.phone,
    b.email,
    b.website_url,
    b.logo_url,
    loc.city,
    loc.state,
    loc.address_line_1,
    loc.address_line_2,
    loc.zip_code,
    loc.service_area,
    loc.latitude,
    loc.longitude,
    lp.plan_key,
    lp.plan_name,
    bl.listing_status,
    bl.is_featured,
    bl.end_date,
    bl.sort_priority,
    bl.cta_button_text,
    bl.cta_button_url,
    bl.video_url,
    bl.facebook_url,
    bl.linkedin_url,
    bl.instagram_url,
    bl.youtube_url,
    bl.max_images,
    bl.allows_social_links,
    bl.allows_coupon,
    bl.allows_banner_ads,
    bl.allows_analytics,
    CASE 
        WHEN bl.plan_id IS NOT NULL THEN true 
        ELSE false 
    END as is_paid,
    -- Aggregated categories as JSON
    (
        SELECT json_agg(json_build_object('name', c.name, 'slug', c.slug))
        FROM business_categories bc
        JOIN categories c ON c.id = bc.category_id
        WHERE bc.business_id = b.id
    ) as categories,
    -- Featured image (first gallery image or logo)
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
    ) as featured_image_url
FROM business_listings bl
JOIN businesses b ON b.id = bl.business_id
LEFT JOIN listing_plans lp ON lp.id = bl.plan_id
LEFT JOIN business_locations loc ON loc.business_id = b.id AND loc.is_primary = true
WHERE bl.listing_status IN ('approved', 'active')
ORDER BY bl.id, bl.is_featured DESC, bl.sort_priority ASC;

-- Step 3: Grant access
GRANT SELECT ON public_approved_listings TO anon;
GRANT SELECT ON public_approved_listings TO authenticated;

-- Step 4: Verify
SELECT 
    id,
    business_name,
    slug,
    plan_key,
    featured_image_url,
    video_url,
    categories
FROM public_approved_listings
WHERE business_name ILIKE '%AIM Training%'
LIMIT 5;
