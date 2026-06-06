-- Business Listing Platform Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Business Listings Table
CREATE TABLE business_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  website VARCHAR(500),
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  
  -- Status and Tier
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'premium', 'vip')),
  tier VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'premium', 'vip')),
  
  -- Media
  logo_url TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin tracking
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  -- GHL Integration
  ghl_contact_id VARCHAR(100),
  ghl_opportunity_id VARCHAR(100),
  
  -- Metadata
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX idx_listings_status ON business_listings(status);
CREATE INDEX idx_listings_tier ON business_listings(tier);
CREATE INDEX idx_listings_category ON business_listings(category);
CREATE INDEX idx_listings_submitted_at ON business_listings(submitted_at DESC);
CREATE INDEX idx_listings_reviewed_by ON business_listings(reviewed_by);

-- Audit Log Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES business_listings(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL 
    CHECK (action IN ('submitted', 'approved', 'rejected', 'edited', 'upgraded', 'deleted', 'coupon_applied')),
  performed_by UUID REFERENCES auth.users(id),
  performed_by_email VARCHAR(255),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_listing_id ON audit_logs(listing_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Admin Users View (combines auth.users with admin metadata)
CREATE OR REPLACE VIEW admin_users AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at as last_login,
  COALESCE(
    (au.raw_user_meta_data->>'full_name')::TEXT,
    au.email
  ) as full_name,
  COALESCE(
    (au.raw_user_meta_data->>'role')::TEXT,
    'admin'
  ) as role
FROM auth.users au
WHERE au.raw_user_meta_data->>'is_admin' = 'true'
   OR au.email IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'super_admin');

-- Row Level Security (RLS) Policies

-- Enable RLS on business_listings
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public submission form)
CREATE POLICY "Allow public submissions" ON business_listings
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only admins can view all listings
CREATE POLICY "Admins can view all listings" ON business_listings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'is_admin' = 'true' 
           OR auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
    )
  );

-- Policy: Only admins can update listings
CREATE POLICY "Admins can update listings" ON business_listings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'is_admin' = 'true' 
           OR auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
    )
  );

-- Policy: Only admins can delete listings
CREATE POLICY "Admins can delete listings" ON business_listings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'is_admin' = 'true' 
           OR auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
    )
  );

-- Policy: Public can only view approved listings
CREATE POLICY "Public can view approved listings" ON business_listings
  FOR SELECT TO anon
  USING (status IN ('approved', 'premium', 'vip'));

-- Policy: Authenticated non-admins can only view approved listings
CREATE POLICY "Users can view approved listings" ON business_listings
  FOR SELECT TO authenticated
  USING (
    status IN ('approved', 'premium', 'vip')
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'is_admin' = 'true' 
           OR auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
    )
  );

-- Audit Logs Policies
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'is_admin' = 'true' 
           OR auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
    )
  );

CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Function to automatically create audit log on listing status change
CREATE OR REPLACE FUNCTION log_listing_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (listing_id, action, performed_by, performed_by_email, details)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'approved'
        WHEN NEW.status = 'rejected' THEN 'rejected'
        WHEN NEW.status = 'premium' THEN 'upgraded'
        WHEN NEW.status = 'vip' THEN 'upgraded'
        ELSE 'edited'
      END,
      NEW.reviewed_by,
      (SELECT email FROM auth.users WHERE id = NEW.reviewed_by),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_tier', OLD.tier,
        'new_tier', NEW.tier,
        'notes', NEW.notes
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit logging
CREATE TRIGGER listing_status_change_trigger
  AFTER UPDATE ON business_listings
  FOR EACH ROW
  EXECUTE FUNCTION log_listing_change();

-- Function to log new submissions
CREATE OR REPLACE FUNCTION log_new_submission()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (listing_id, action, performed_by_email, details)
  VALUES (
    NEW.id,
    'submitted',
    NEW.email,
    jsonb_build_object(
      'business_name', NEW.business_name,
      'email', NEW.email,
      'category', NEW.category
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new submissions
CREATE TRIGGER listing_submission_trigger
  AFTER INSERT ON business_listings
  FOR EACH ROW
  EXECUTE FUNCTION log_new_submission();

-- Categories lookup table (optional, for data integrity)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Insert default categories
INSERT INTO categories (name, slug, description, display_order) VALUES
('Restaurant & Food', 'restaurant-food', 'Restaurants, cafes, food trucks, catering', 1),
('Retail & Shopping', 'retail-shopping', 'Retail stores, boutiques, online shops', 2),
('Professional Services', 'professional-services', 'Legal, accounting, consulting, marketing', 3),
('Health & Wellness', 'health-wellness', 'Medical, dental, fitness, wellness', 4),
('Home Services', 'home-services', 'Contractors, cleaning, landscaping, repairs', 5),
('Technology', 'technology', 'IT services, web design, software', 6),
('Education & Training', 'education-training', 'Schools, tutors, training programs', 7),
('Automotive', 'automotive', 'Auto repair, dealerships, detailing', 8),
('Real Estate', 'real-estate', 'Agents, property management, rentals', 9),
('Other', 'other', 'Other business types', 99);

-- Enable RLS on categories (public read, admin write)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories" ON categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'is_admin' = 'true' 
           OR auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
    )
  );