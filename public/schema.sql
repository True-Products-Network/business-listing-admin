-- ============================================================
-- SUPABASE DIRECTORY BACKEND - COMPLETE SCHEMA (NO MIGRATION)
-- Business Listing Admin (STL Business Guide)
-- Use this if starting fresh with no existing data
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE (User management linked to Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'visitor' 
    CHECK (role IN ('visitor', 'business_owner', 'premium_owner', 'vip_owner', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auth_user_id)
);

CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- 2. BUSINESSES TABLE (Core business profile)
-- ============================================================
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_profile_id UUID REFERENCES profiles(id),
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_short TEXT,
  description_long TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('draft', 'pending', 'active', 'paused', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_businesses_owner ON businesses(owner_profile_id);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_status ON businesses(status);

-- ============================================================
-- 3. BUSINESS_LOCATIONS TABLE
-- ============================================================
CREATE TABLE business_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  county TEXT,
  service_area TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_locations_business ON business_locations(business_id);
CREATE INDEX idx_locations_city ON business_locations(city);
CREATE INDEX idx_locations_zip ON business_locations(zip_code);

-- ============================================================
-- 4. CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  parent_category_id UUID REFERENCES categories(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_category_id);

-- ============================================================
-- 5. BUSINESS_CATEGORIES (Join table)
-- ============================================================
CREATE TABLE business_categories (
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (business_id, category_id)
);

CREATE INDEX idx_biz_cat_business ON business_categories(business_id);
CREATE INDEX idx_biz_cat_category ON business_categories(category_id);

-- ============================================================
-- 6. LISTING_PLANS TABLE (Free, Premium, VIP)
-- ============================================================
CREATE TABLE listing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_key TEXT UNIQUE NOT NULL,
  plan_name TEXT NOT NULL,
  monthly_price NUMERIC DEFAULT 0,
  yearly_price NUMERIC DEFAULT 0,
  max_images INTEGER DEFAULT 1,
  allows_coupon BOOLEAN DEFAULT false,
  allows_video BOOLEAN DEFAULT false,
  allows_banner_ads BOOLEAN DEFAULT false,
  allows_social_links BOOLEAN DEFAULT false,
  allows_priority_placement BOOLEAN DEFAULT false,
  featured_priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed listing plans
INSERT INTO listing_plans (plan_key, plan_name, monthly_price, yearly_price, max_images, allows_coupon, allows_video, allows_banner_ads, allows_social_links, allows_priority_placement, featured_priority) VALUES
('free', 'Free Listing', 0, 0, 1, false, false, false, false, false, 10),
('premium', 'Premium Listing', 97, 997, 5, true, false, false, true, true, 50),
('vip', 'VIP Listing', 297, NULL, 10, true, true, true, true, true, 100);

-- ============================================================
-- 7. BUSINESS_LISTINGS TABLE (Active listings with plan info)
-- ============================================================
CREATE TABLE business_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES listing_plans(id),
  listing_status TEXT DEFAULT 'pending' 
    CHECK (listing_status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'paused', 'expired', 'archived')),
  start_date DATE,
  end_date DATE,
  is_featured BOOLEAN DEFAULT false,
  sort_priority INTEGER DEFAULT 0,
  cta_button_text TEXT,
  cta_button_url TEXT,
  video_url TEXT,
  facebook_url TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_listings_business ON business_listings(business_id);
CREATE INDEX idx_listings_plan ON business_listings(plan_id);
CREATE INDEX idx_listings_status ON business_listings(listing_status);
CREATE INDEX idx_listings_featured ON business_listings(is_featured, sort_priority);

-- ============================================================
-- 8. LISTING_SUBMISSIONS TABLE (Approval workflow)
-- ============================================================
CREATE TABLE listing_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  submitted_by_profile_id UUID REFERENCES profiles(id),
  requested_plan_key TEXT,
  submission_status TEXT DEFAULT 'submitted' 
    CHECK (submission_status IN ('started', 'submitted', 'under_review', 'needs_edits', 'approved', 'rejected', 'abandoned')),
  admin_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by_profile_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_submissions_business ON listing_submissions(business_id);
CREATE INDEX idx_submissions_status ON listing_submissions(submission_status);
CREATE INDEX idx_submissions_submitted ON listing_submissions(submitted_at);

-- ============================================================
-- 9. BUSINESS_IMAGES TABLE
-- ============================================================
CREATE TABLE business_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'gallery' 
    CHECK (image_type IN ('logo', 'gallery', 'banner', 'coupon')),
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_images_business ON business_images(business_id);
CREATE INDEX idx_images_type ON business_images(image_type);

-- ============================================================
-- 10. COUPONS TABLE
-- ============================================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  coupon_title TEXT NOT NULL,
  coupon_description TEXT,
  coupon_code TEXT,
  coupon_image_url TEXT,
  destination_url TEXT,
  start_date DATE,
  expiration_date DATE,
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('draft', 'pending', 'active', 'expired', 'paused', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coupons_business ON coupons(business_id);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_expiration ON coupons(expiration_date);

-- ============================================================
-- 11. BANNER_ADS TABLE
-- ============================================================
CREATE TABLE banner_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  ad_title TEXT,
  image_url TEXT NOT NULL,
  destination_url TEXT,
  placement_area TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('draft', 'pending', 'active', 'paused', 'expired', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_banners_business ON banner_ads(business_id);
CREATE INDEX idx_banners_status ON banner_ads(status);
CREATE INDEX idx_banners_dates ON banner_ads(start_date, end_date);

-- ============================================================
-- 12. CLAIM_REQUESTS TABLE
-- ============================================================
CREATE TABLE claim_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  requesting_profile_id UUID REFERENCES profiles(id),
  claimant_name TEXT,
  claimant_email TEXT,
  claimant_phone TEXT,
  proof_notes TEXT,
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_claims_business ON claim_requests(business_id);
CREATE INDEX idx_claims_status ON claim_requests(status);

-- ============================================================
-- 13. CONTACT_INQUIRIES TABLE
-- ============================================================
CREATE TABLE contact_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  source_page TEXT,
  sent_to_ghl BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inquiries_business ON contact_inquiries(business_id);
CREATE INDEX idx_inquiries_created ON contact_inquiries(created_at);

-- ============================================================
-- 14. ADVERTISING_INQUIRIES TABLE
-- ============================================================
CREATE TABLE advertising_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT,
  contact_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  interest_type TEXT 
    CHECK (interest_type IN ('premium', 'vip', 'coupon', 'banner', 'marketing_services')),
  message TEXT,
  preferred_area TEXT,
  sent_to_ghl BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ad_inquiries_type ON advertising_inquiries(interest_type);
CREATE INDEX idx_ad_inquiries_created ON advertising_inquiries(created_at);

-- ============================================================
-- 15. PAYMENTS TABLE
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  plan_key TEXT,
  billing_frequency TEXT 
    CHECK (billing_frequency IN ('monthly', 'yearly')),
  amount NUMERIC,
  payment_status TEXT 
    CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  start_date DATE,
  renewal_date DATE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_business ON payments(business_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_renewal ON payments(renewal_date);

-- ============================================================
-- 16. ADMIN_ACTIVITY_LOG TABLE
-- ============================================================
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_profile_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_admin ON admin_activity_log(admin_profile_id);
CREATE INDEX idx_activity_entity ON admin_activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_created ON admin_activity_log(created_at);

-- ============================================================
-- 17. SETTINGS TABLE
-- ============================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text' 
    CHECK (setting_type IN ('text', 'number', 'boolean', 'json')),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed categories
INSERT INTO categories (name, slug, description) VALUES
('Restaurants', 'restaurants', 'Local dining and food establishments'),
('Marketing', 'marketing', 'Marketing and advertising services'),
('Coaching', 'coaching', 'Business and personal coaching'),
('Lawyers', 'lawyers', 'Legal services and attorneys'),
('Plumbers', 'plumbers', 'Plumbing services'),
('Electricians', 'electricians', 'Electrical services'),
('CPA / Accountants', 'cpa-accountants', 'Accounting and tax services'),
('Landscaping', 'landscaping', 'Lawn and garden services'),
('Website Design', 'website-design', 'Web design and development'),
('Reputation Management', 'reputation-management', 'Online reputation services'),
('Home Services', 'home-services', 'General home maintenance'),
('Professional Services', 'professional-services', 'Business and professional services');

-- Seed locations
INSERT INTO business_locations (city, state, county, is_primary) VALUES
('St. Louis', 'MO', 'St. Louis City', true),
('Chesterfield', 'MO', 'St. Louis County', true),
('St. Charles', 'MO', 'St. Charles County', true),
('Clayton', 'MO', 'St. Louis County', true);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertising_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- ============================================================
-- BUSINESSES POLICIES
-- ============================================================
CREATE POLICY "Public can view active businesses" ON businesses
  FOR SELECT TO anon
  USING (status = 'active');

CREATE POLICY "Business owners can view own businesses" ON businesses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = businesses.owner_profile_id AND profiles.auth_user_id = auth.uid()
  ));

CREATE POLICY "Business owners can create businesses" ON businesses
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Business owners can update own businesses" ON businesses
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = businesses.owner_profile_id AND profiles.auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all businesses" ON businesses
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- ============================================================
-- BUSINESS_LISTINGS POLICIES
-- ============================================================
CREATE POLICY "Public can view approved listings" ON business_listings
  FOR SELECT TO anon
  USING (listing_status IN ('approved', 'active'));

CREATE POLICY "Admins can manage all listings" ON business_listings
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- ============================================================
-- CATEGORIES POLICIES
-- ============================================================
CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- ============================================================
-- LISTING_PLANS POLICIES
-- ============================================================
CREATE POLICY "Public can view active plans" ON listing_plans
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON listing_plans
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- ============================================================
-- COUPONS POLICIES
-- ============================================================
CREATE POLICY "Public can view active coupons" ON coupons
  FOR SELECT TO anon
  USING (status = 'active' AND expiration_date >= CURRENT_DATE);

CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- ============================================================
-- BANNER_ADS POLICIES
-- ============================================================
CREATE POLICY "Public can view active banners" ON banner_ads
  FOR SELECT TO anon
  USING (status = 'active' AND end_date >= CURRENT_DATE);

CREATE POLICY "Admins can manage banners" ON banner_ads
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- ============================================================
-- PUBLIC VIEWS
-- ============================================================

-- Public approved listings view
CREATE OR REPLACE VIEW public_approved_listings AS
SELECT 
  b.id,
  b.business_name,
  b.slug,
  b.description_short,
  b.description_long,
  b.phone,
  b.email,
  b.website_url,
  b.logo_url,
  bl.city,
  bl.state,
  bl.zip_code,
  bl.service_area,
  c.name as primary_category,
  lp.plan_key,
  lp.plan_name,
  lst.listing_status,
  lst.is_featured,
  lst.sort_priority,
  lst.video_url,
  lst.facebook_url,
  lst.linkedin_url,
  lst.instagram_url,
  lst.youtube_url
FROM businesses b
JOIN business_listings lst ON lst.business_id = b.id
JOIN listing_plans lp ON lp.id = lst.plan_id
LEFT JOIN business_locations bl ON bl.business_id = b.id AND bl.is_primary = true
LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = true
LEFT JOIN categories c ON c.id = bc.category_id
WHERE lst.listing_status IN ('approved', 'active')
  AND b.status = 'active';

-- Admin pending submissions view
CREATE OR REPLACE VIEW admin_pending_submissions AS
SELECT 
  ls.id as submission_id,
  ls.submission_status,
  ls.submitted_at,
  ls.admin_notes,
  b.id as business_id,
  b.business_name,
  b.slug,
  b.phone,
  b.email,
  b.website_url,
  p.full_name as submitted_by_name,
  p.email as submitted_by_email,
  lp.plan_name as requested_plan
FROM listing_submissions ls
JOIN businesses b ON b.id = ls.business_id
LEFT JOIN profiles p ON p.id = ls.submitted_by_profile_id
LEFT JOIN listing_plans lp ON lp.plan_key = ls.requested_plan_key
WHERE ls.submission_status IN ('submitted', 'under_review', 'needs_edits');

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON business_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON business_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON listing_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'Schema created successfully!' as status;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_plans FROM listing_plans;
