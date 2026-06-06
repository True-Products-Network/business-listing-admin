-- Create upgrade_requests table for managing plan upgrade requests
-- Run this in your Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS upgrade_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    current_plan TEXT NOT NULL,
    requested_plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    requested_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_business_id ON upgrade_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status ON upgrade_requests(status);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_created_at ON upgrade_requests(created_at);

-- Enable Row Level Security
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins can view all upgrade requests
CREATE POLICY "Admins can view all upgrade requests"
    ON upgrade_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Admins can insert upgrade requests
CREATE POLICY "Admins can insert upgrade requests"
    ON upgrade_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Admins can update upgrade requests
CREATE POLICY "Admins can update upgrade requests"
    ON upgrade_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Admins can delete upgrade requests
CREATE POLICY "Admins can delete upgrade requests"
    ON upgrade_requests
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Business owners can view their own upgrade requests
CREATE POLICY "Business owners can view their own upgrade requests"
    ON upgrade_requests
    FOR SELECT
    TO authenticated
    USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
        )
    );

-- Business owners can create upgrade requests for their businesses
CREATE POLICY "Business owners can create upgrade requests"
    ON upgrade_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE owner_profile_id = auth.uid()
        )
    );

-- Grant access to the table
GRANT ALL ON upgrade_requests TO authenticated;
GRANT ALL ON upgrade_requests TO anon;

-- Add comment for documentation
COMMENT ON TABLE upgrade_requests IS 'Stores plan upgrade requests from businesses (Free -> Premium -> VIP)';
