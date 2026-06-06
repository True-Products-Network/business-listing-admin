-- Fix banner_ads table - check existing columns and recreate if needed
-- Run this in your Supabase SQL Editor

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'banner_ads'
ORDER BY ordinal_position;
