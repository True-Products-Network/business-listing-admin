-- ============================================================
-- CLEANUP: Drop all existing tables from old schema
-- Run this first, then run the complete schema
-- ============================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS admin_users CASCADE;
DROP VIEW IF EXISTS public_approved_listings CASCADE;
DROP VIEW IF EXISTS admin_pending_submissions CASCADE;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS admin_activity_log CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS advertising_inquiries CASCADE;
DROP TABLE IF EXISTS contact_inquiries CASCADE;
DROP TABLE IF EXISTS claim_requests CASCADE;
DROP TABLE IF EXISTS banner_ads CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS business_images CASCADE;
DROP TABLE IF EXISTS listing_submissions CASCADE;
DROP TABLE IF EXISTS business_listings CASCADE;
DROP TABLE IF EXISTS listing_plans CASCADE;
DROP TABLE IF EXISTS business_categories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS business_locations CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS log_listing_change() CASCADE;
DROP FUNCTION IF EXISTS log_new_submission() CASCADE;

SELECT 'All old tables dropped successfully!' as status;
