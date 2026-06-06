-- Check RLS status on all tables
-- Run this in Supabase SQL Editor

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE '_%'
ORDER BY tablename;

-- Check which tables have RLS policies
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = pg_tables.schemaname AND tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE '_%'
ORDER BY tablename;

-- Tables without RLS enabled (CRITICAL)
SELECT 
    tablename,
    'CRITICAL: No RLS enabled' as issue
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE '_%'
ORDER BY tablename;
