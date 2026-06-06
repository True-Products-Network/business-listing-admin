-- Check the public_approved_listings view definition
-- Run this in Supabase SQL Editor

-- First, let's see the view definition
SELECT 
    viewname, 
    definition 
FROM pg_views 
WHERE viewname = 'public_approved_listings';

-- Check if there are multiple locations causing the duplicate
SELECT 
    bl.id as business_id,
    b.business_name,
    COUNT(DISTINCT loc.id) as location_count,
    COUNT(DISTINCT bc.category_id) as category_count
FROM business_listings bl
JOIN businesses b ON b.id = bl.business_id
LEFT JOIN business_locations loc ON loc.business_id = b.id
LEFT JOIN business_categories bc ON bc.business_id = b.id
WHERE b.business_name ILIKE '%AIM Training%'
GROUP BY bl.id, b.business_name;

-- Fix: Recreate the view with DISTINCT to prevent duplicates
-- This ensures each business appears only once
CREATE OR REPLACE VIEW public_approved_listings AS
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
    loc.address_line_1,
    loc.address_line_2,
    loc.zip_code,
    lp.plan_key,
    lp.plan_name,
    bl.listing_status,
    bl.is_featured,
    bl.end_date,
    bl.sort_priority,
    CASE 
        WHEN bl.plan_id IS NOT NULL THEN true 
        ELSE false 
    END as is_paid
FROM business_listings bl
JOIN businesses b ON b.id = bl.business_id
LEFT JOIN listing_plans lp ON lp.id = bl.plan_id
LEFT JOIN business_locations loc ON loc.business_id = b.id AND loc.is_primary = true
WHERE bl.listing_status = 'approved'
ORDER BY bl.id, bl.is_featured DESC, bl.sort_priority ASC;
