-- Check what happened with bulk upload
-- Run this in Supabase SQL Editor

-- Step 1: Check for recent businesses created
SELECT 
    id,
    business_name,
    status,
    created_at
FROM businesses
ORDER BY created_at DESC
LIMIT 20;

-- Step 2: Check for recent listings
SELECT 
    bl.id,
    bl.business_id,
    bl.listing_status,
    bl.created_at,
    b.business_name
FROM business_listings bl
JOIN businesses b ON b.id = bl.business_id
ORDER BY bl.created_at DESC
LIMIT 20;

-- Step 3: Check for recent submissions
SELECT 
    ls.id,
    ls.business_id,
    ls.submission_status,
    ls.submitted_at,
    b.business_name
FROM listing_submissions ls
JOIN businesses b ON b.id = ls.business_id
ORDER BY ls.submitted_at DESC
LIMIT 20;

-- Step 4: Check for any businesses with 'pending' status
SELECT 
    id,
    business_name,
    status,
    created_at
FROM businesses
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 20;
