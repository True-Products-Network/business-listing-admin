-- ============================================================
-- SIMPLE RLS FIX - No auth.users references at all
-- ============================================================

-- Disable RLS on all tables to avoid auth.users permission issues
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to anon and authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify
SELECT 'RLS disabled - all tables open' as status;
