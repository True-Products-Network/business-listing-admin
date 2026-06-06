-- Fix RLS policies for public submission
-- The issue: anonymous users can't submit because of RLS

-- Allow anonymous users to insert businesses
DROP POLICY IF EXISTS "Business owners can create businesses" ON businesses;

CREATE POLICY "Anyone can create businesses" ON businesses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to insert locations
DROP POLICY IF EXISTS "Public can view locations" ON business_locations;
DROP POLICY IF EXISTS "Owners can insert locations" ON business_locations;

CREATE POLICY "Anyone can view locations" ON business_locations
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create locations" ON business_locations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to insert listings
DROP POLICY IF EXISTS "Public can view approved listings" ON business_listings;

CREATE POLICY "Public can view approved listings" ON business_listings
  FOR SELECT TO anon
  USING (listing_status IN ('approved', 'active'));

CREATE POLICY "Anyone can create listings" ON business_listings
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to insert submissions
DROP POLICY IF EXISTS "Public can view submissions" ON listing_submissions;
DROP POLICY IF EXISTS "Owners can create submissions" ON listing_submissions;

CREATE POLICY "Anyone can create submissions" ON listing_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Verify
SELECT 'Submission policies updated' as status;
