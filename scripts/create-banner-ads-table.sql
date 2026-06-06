-- Create banner_ads table for managing banner advertisements
-- Run this in your Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS banner_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT NOT NULL,
    ad_position TEXT NOT NULL CHECK (ad_position IN ('home_top', 'home_middle', 'sidebar', 'listing_page')),
    status TEXT NOT NULL DEFAULT 'paused' CHECK (status IN ('active', 'paused', 'expired')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_banner_ads_business_id ON banner_ads(business_id);
CREATE INDEX IF NOT EXISTS idx_banner_ads_status ON banner_ads(status);
CREATE INDEX IF NOT EXISTS idx_banner_ads_position ON banner_ads(ad_position);
CREATE INDEX IF NOT EXISTS idx_banner_ads_dates ON banner_ads(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE banner_ads ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins can view all banner ads
CREATE POLICY "Admins can view all banner ads"
    ON banner_ads
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Admins can insert banner ads
CREATE POLICY "Admins can insert banner ads"
    ON banner_ads
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Admins can update banner ads
CREATE POLICY "Admins can update banner ads"
    ON banner_ads
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Admins can delete banner ads
CREATE POLICY "Admins can delete banner ads"
    ON banner_ads
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Business owners can view their own banner ads
CREATE POLICY "Business owners can view their own banner ads"
    ON banner_ads
    FOR SELECT
    TO authenticated
    USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
        )
    );

-- Anyone can view active banner ads (for public display)
CREATE POLICY "Anyone can view active banner ads"
    ON banner_ads
    FOR SELECT
    TO anon
    USING (status = 'active');

-- Grant access to the table
GRANT ALL ON banner_ads TO authenticated;
GRANT ALL ON banner_ads TO anon;

-- Add comment for documentation
COMMENT ON TABLE banner_ads IS 'Stores banner advertisements for VIP businesses';
