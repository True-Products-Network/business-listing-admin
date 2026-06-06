-- ============================================================
-- PROPER RLS SETUP - Using profiles table for admin checks
-- ============================================================

-- 1. First, ensure your user is in the profiles table as admin
INSERT INTO profiles (auth_user_id, email, role, is_active)
SELECT id, email, 'super_admin', true
FROM auth.users
WHERE email = 'nigel@trueproductsnetwork.com'
ON CONFLICT (auth_user_id) DO UPDATE 
SET role = 'super_admin', is_active = true;

-- 2. Create function to check if user is admin (avoids auth.users reference)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE auth_user_id = user_uuid 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "listing_plans_select" ON listing_plans;
DROP POLICY IF EXISTS "businesses_select" ON businesses;
DROP POLICY IF EXISTS "businesses_insert" ON businesses;
DROP POLICY IF EXISTS "businesses_admin" ON businesses;
DROP POLICY IF EXISTS "locations_select" ON business_locations;
DROP POLICY IF EXISTS "locations_insert" ON business_locations;
DROP POLICY IF EXISTS "listings_select" ON business_listings;
DROP POLICY IF EXISTS "listings_insert" ON business_listings;
DROP POLICY IF EXISTS "listings_admin" ON business_listings;
DROP POLICY IF EXISTS "biz_categories_select" ON business_categories;
DROP POLICY IF EXISTS "biz_categories_insert" ON business_categories;
DROP POLICY IF EXISTS "submissions_insert" ON listing_submissions;
DROP POLICY IF EXISTS "submissions_admin" ON listing_submissions;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin" ON profiles;

-- 5. Create new policies

-- Categories: Public read
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (is_active = true);

-- Listing Plans: Public read
CREATE POLICY "listing_plans_select" ON listing_plans
  FOR SELECT USING (is_active = true);

-- Businesses: Public read active, anyone insert, admin all
CREATE POLICY "businesses_select" ON businesses
  FOR SELECT USING (status = 'active');

CREATE POLICY "businesses_insert" ON businesses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "businesses_admin" ON businesses
  FOR ALL USING (is_admin(auth.uid()));

-- Business Locations: Public read, anyone insert, admin all
CREATE POLICY "locations_select" ON business_locations
  FOR SELECT USING (true);

CREATE POLICY "locations_insert" ON business_locations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "locations_admin" ON business_locations
  FOR ALL USING (is_admin(auth.uid()));

-- Business Listings: Public read approved, anyone insert, admin all
CREATE POLICY "listings_select" ON business_listings
  FOR SELECT USING (listing_status IN ('approved', 'active'));

CREATE POLICY "listings_insert" ON business_listings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "listings_admin" ON business_listings
  FOR ALL USING (is_admin(auth.uid()));

-- Business Categories: Public read, anyone insert, admin all
CREATE POLICY "biz_categories_select" ON business_categories
  FOR SELECT USING (true);

CREATE POLICY "biz_categories_insert" ON business_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "biz_categories_admin" ON business_categories
  FOR ALL USING (is_admin(auth.uid()));

-- Listing Submissions: Anyone insert, admin all
CREATE POLICY "submissions_insert" ON listing_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "submissions_admin" ON listing_submissions
  FOR ALL USING (is_admin(auth.uid()));

-- Profiles: Users read own, admin all
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "profiles_admin" ON profiles
  FOR ALL USING (is_admin(auth.uid()));

-- 6. Verify
SELECT 'RLS properly configured' as status;
SELECT tablename, relrowsecurity as rls_enabled 
FROM pg_tables 
JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE schemaname = 'public' 
AND tablename IN ('businesses', 'business_listings', 'business_locations', 'categories', 'listing_plans', 'business_categories', 'listing_submissions', 'profiles');
