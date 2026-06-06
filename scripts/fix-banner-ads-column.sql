-- Fix banner_ads table - rename position column to ad_position
-- Run this in your Supabase SQL Editor

-- Rename the column from position to ad_position
ALTER TABLE banner_ads RENAME COLUMN position TO ad_position;

-- Update the check constraint if it exists
-- First drop the old constraint if it exists
ALTER TABLE banner_ads DROP CONSTRAINT IF EXISTS banner_ads_position_check;

-- Add the new check constraint
ALTER TABLE banner_ads ADD CONSTRAINT banner_ads_ad_position_check 
    CHECK (ad_position IN ('home_top', 'home_middle', 'sidebar', 'listing_page'));

-- Update the index
DROP INDEX IF EXISTS idx_banner_ads_position;
CREATE INDEX IF NOT EXISTS idx_banner_ads_ad_position ON banner_ads(ad_position);

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'banner_ads';
