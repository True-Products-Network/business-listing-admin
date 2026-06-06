-- Debug bulk upload issues
-- Check if slug is required and what constraints exist

-- Check businesses table constraints
SELECT 
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

-- Check if slug has unique constraint
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'businesses'
AND tc.constraint_type = 'UNIQUE';

-- Check for any NOT NULL constraints that might be missing
SELECT 
    column_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
AND is_nullable = 'NO';
