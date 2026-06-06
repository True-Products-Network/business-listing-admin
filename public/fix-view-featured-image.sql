-- Fix the view to use 'featured' image type first, then gallery
-- This restores the original behavior

DROP VIEW IF EXISTS public_approved_listings;

CREATE VIEW public_approved_listings AS
SELECT DISTINCT ON (bl.id)
    bl.id,
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
    lp.plan_key,
    lp.plan_name,
    lp.max_images,
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
    CASE 
        WHEN bl.plan_id IS NOT NULL THEN true 
        ELSE false 
    END as is_paid,
    (
        SELECT json_agg(json_build_object('name', c.name, 'slug', c.slug))
        FROM business_categories bc
        JOIN categories c ON c.id = bc.category_id
        WHERE bc.business_id = b.id
    ) as categories,
    -- Featured image: check for 'featured' type first, then 'gallery', then logo
    COALESCE(
        (
            SELECT bi.image_url 
            FROM business_images bi 
            WHERE bi.business_id = b.id 
            AND bi.image_type = 'featured'
            ORDER BY bi.sort_order 
            LIMIT 1
        ),
        (
            SELECT bi.image_url 
            FROM business_images bi 
            WHERE bi.business_id = b.id 
            AND bi.image_type = 'gallery'
            ORDER BY bi.sort_order 
            LIMIT 1
        ),
        b.logo_url
    ) as featured_image_url,
    -- All gallery images (including featured)
    (
        SELECT json_agg(bi.image_url ORDER BY 
            CASE bi.image_type 
                WHEN 'featured' THEN 0 
                WHEN 'gallery' THEN 1 
                ELSE 2 
            END,
            bi.sort_order
        )
        FROM business_images bi 
        WHERE bi.business_id = b.id 
        AND bi.image_type IN ('featured', 'gallery')
    ) as gallery_images
FROM business_listings bl
JOIN businesses b ON b.id = bl.business_id
LEFT JOIN listing_plans lp ON lp.id = bl.plan_id
LEFT JOIN business_locations loc ON loc.business_id = b.id AND loc.is_primary = true
WHERE bl.listing_status IN ('approved', 'active')
ORDER BY bl.id, bl.is_featured DESC, bl.sort_priority ASC;

GRANT SELECT ON public_approved_listings TO anon;
GRANT SELECT ON public_approved_listings TO authenticated;

-- Verify the fix
SELECT 
    business_name,
    featured_image_url
FROM public_approved_listings
WHERE business_name ILIKE '%Your business could be here%';
