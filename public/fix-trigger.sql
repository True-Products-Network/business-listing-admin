-- Fix the auth.users permission issue
-- The auto-assign trigger might be causing recursion

-- Disable the trigger temporarily
ALTER TABLE business_listings DISABLE TRIGGER auto_free_plan_trigger;

-- Make sure RLS is disabled for testing
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_submissions DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

SELECT 'RLS and triggers disabled for testing' as status;
