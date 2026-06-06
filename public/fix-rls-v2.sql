-- ============================================================
-- COMPLETE RLS FIX - Proper Security Policies (Fixed)
-- ============================================================

-- 1. CATEGORIES - Public read only
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- 2. LISTING_PLANS - Public read only
ALTER TABLE listing_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active plans" ON listing_plans;
CREATE POLICY "Public can view active plans" ON listing_plans
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- 3. BUSINESSES - Public can read active, anyone can create (for submissions)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active businesses" ON businesses;
DROP POLICY IF EXISTS "Anyone can create businesses" ON businesses;
DROP POLICY IF EXISTS "Admins can manage all businesses" ON businesses;

CREATE POLICY "Public can view active businesses" ON businesses
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Anyone can create businesses" ON businesses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all businesses" ON businesses
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'is_admin' = 'true' 
         OR auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
  ));

-- 4. BUSINESS_LOCATIONS - Public read, anyone can create
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view locations" ON business_locations;
DROP POLICY IF EXISTS "Anyone can create locations" ON business_locations;

CREATE POLICY "Anyone can view locations" ON business_locations
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create locations" ON business_locations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 5. BUSINESS_LISTINGS - Public read approved, anyone can create
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view approved listings" ON business_listings;
DROP POLICY IF EXISTS "Anyone can create listings" ON business_listings;
DROP POLICY IF EXISTS "Admins can manage all listings" ON business_listings;

CREATE POLICY "Public can view approved listings" ON business_listings
  FOR SELECT TO anon
  USING (listing_status IN ('approved', 'active'));

CREATE POLICY "Anyone can create listings" ON business_listings
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all listings" ON business_listings
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'is_admin' = 'true' 
         OR auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
  ));

-- 6. BUSINESS_CATEGORIES - Public read, anyone can create
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view business categories" ON business_categories;
DROP POLICY IF EXISTS "Anyone can create business categories" ON business_categories;

CREATE POLICY "Anyone can view business categories" ON business_categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create business categories" ON business_categories
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 7. LISTING_SUBMISSIONS - Anyone can create, admins can manage
ALTER TABLE listing_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create submissions" ON listing_submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON listing_submissions;

CREATE POLICY "Anyone can create submissions" ON listing_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage submissions" ON listing_submissions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'is_admin' = 'true' 
         OR auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
  ));

-- 8. PROFILES - Users can view own, admins can view all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (auth.users.raw_user_meta_data->>'is_admin' = 'true' 
         OR auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
  ));

-- Verify
SELECT 'RLS policies updated successfully' as status;
