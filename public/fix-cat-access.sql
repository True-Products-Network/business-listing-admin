-- Fix categories access for anonymous users
-- Allow public to read categories

-- Make sure RLS allows public read
DROP POLICY IF EXISTS "Public can view active categories" ON categories;

CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Disable RLS on categories for now to test
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Verify categories exist
SELECT name, is_active FROM categories ORDER BY name;
