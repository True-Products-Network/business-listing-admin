-- Fix categories RLS for anonymous users
-- Ensure categories can be read by anyone

-- First, check current RLS status
SELECT 
  tablename,
  relrowsecurity as rls_enabled
FROM pg_tables 
JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE schemaname = 'public' 
AND tablename = 'categories';

-- Disable RLS on categories to allow public read
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Or if you want RLS enabled, create a permissive policy
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Public can view active categories" ON categories;
-- CREATE POLICY "Public can view active categories" ON categories
--   FOR SELECT TO anon, authenticated
--   USING (is_active = true);

-- Verify categories exist
SELECT name, is_active FROM categories ORDER BY name;
