-- Fix RLS for business_categories
-- Allow anonymous users to create business_categories

-- Enable RLS
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view business categories" ON business_categories;
DROP POLICY IF EXISTS "Anyone can create business categories" ON business_categories;

-- Create policies
CREATE POLICY "Anyone can view business categories" ON business_categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create business categories" ON business_categories
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Also ensure categories table has the right data
SELECT name FROM categories WHERE is_active = true ORDER BY name;
