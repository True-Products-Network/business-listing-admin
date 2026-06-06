-- Create system_settings table for admin dashboard
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    category VARCHAR(50),
    is_editable BOOLEAN DEFAULT TRUE,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
-- Pricing Settings
('premium_monthly_price', '29', 'number', 'pricing', 'Current Premium monthly price (Founding Member rate)'),
('premium_regular_price', '97', 'number', 'pricing', 'Regular Premium monthly price after Founding Member period'),
('vip_monthly_price', '97', 'number', 'pricing', 'Current VIP monthly price (Founding Member rate)'),
('vip_regular_price', '497', 'number', 'pricing', 'Regular VIP monthly price after Founding Member period'),
('founding_member_enabled', 'true', 'boolean', 'pricing', 'Enable Founding Member special pricing'),
('founding_member_deadline', '2026-11-30T23:59:59-06:00', 'date', 'pricing', 'Deadline for Founding Member pricing'),
('founding_member_limit', '100', 'number', 'pricing', 'Maximum number of Founding Members'),

-- System Settings
('regular_grace_period_days', '7', 'number', 'system', 'Standard payment grace period in days'),
('founding_grace_period_days', '14', 'number', 'system', 'Founding Member grace period in days'),
('auto_downgrade_enabled', 'true', 'boolean', 'system', 'Automatically downgrade after grace period'),
('payment_reminder_emails', 'true', 'boolean', 'system', 'Send 3-day and 1-day payment reminder emails'),
('site_maintenance_mode', 'false', 'boolean', 'system', 'Put site in maintenance mode'),
('new_registrations_enabled', 'true', 'boolean', 'system', 'Allow new business registrations'),
('require_approval_for_listings', 'true', 'boolean', 'system', 'Manual approval required for new listings'),

-- Feature Toggles
('analytics_enabled_for_premium', 'true', 'boolean', 'features', 'Enable analytics for Premium tier'),
('analytics_enabled_for_vip', 'true', 'boolean', 'features', 'Enable enhanced analytics for VIP tier'),
('coupons_enabled', 'true', 'boolean', 'features', 'Enable coupon/deal feature'),
('reviews_enabled', 'true', 'boolean', 'features', 'Enable customer reviews feature'),
('banner_ads_enabled', 'false', 'boolean', 'features', 'Enable banner ad placements'),
('newsletter_enabled', 'true', 'boolean', 'features', 'Enable weekly newsletter feature'),
('social_promotion_enabled', 'true', 'boolean', 'features', 'Enable social media promotion for VIP'),

-- Content Settings
('founding_member_headline', 'Founding Member Special', 'string', 'content', 'Headline for Founding Member promotion'),
('founding_member_description', 'Lock in these rates forever. Available for the first 100 businesses or until November 30, 2026.', 'string', 'content', 'Description shown on pricing page'),
('pricing_page_note', 'All plans include secure hosting, SSL certificate, mobile optimization, and SEO-friendly structure.', 'string', 'content', 'Additional note on pricing page'),
('upgrade_cta_text', 'Lock in forever', 'string', 'content', 'Call-to-action text for upgrades'),

-- Integration Settings
('stripe_webhook_url', '', 'string', 'integration', 'Stripe webhook endpoint URL'),
('ghl_webhook_url', 'https://services.leadconnectorhq.com/hooks/Y75D8z0j5aPHXtDyWr3y/webhook-trigger/J2zc1lACds7YZTbRXGxc', 'string', 'integration', 'GoHighLevel webhook URL for new listings'),
('email_provider', 'sendgrid', 'string', 'integration', 'Email service provider (sendgrid, resend, etc.)')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (you can restrict further if needed)
CREATE POLICY "Allow authenticated read" ON system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON system_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert" ON system_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant access
GRANT ALL ON system_settings TO authenticated;
GRANT ALL ON system_settings TO anon;

-- Create function to get setting value
CREATE OR REPLACE FUNCTION get_setting(p_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT setting_value FROM system_settings WHERE setting_key = p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify settings were created
SELECT category, COUNT(*) as count 
FROM system_settings 
GROUP BY category 
ORDER BY category;
