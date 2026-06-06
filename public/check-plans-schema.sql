-- Check listing_plans table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listing_plans' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check what data is in the table
SELECT * FROM listing_plans;
