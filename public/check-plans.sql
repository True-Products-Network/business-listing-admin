-- Check if listing_plans table exists and has data
SELECT * FROM listing_plans;

-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listing_plans' 
AND table_schema = 'public';
