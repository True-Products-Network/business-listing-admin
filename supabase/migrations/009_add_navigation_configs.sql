-- Migration: Add navigation_configs table for dynamic menu management
-- Created: 2026-06-04

-- Create navigation_configs table
CREATE TABLE IF NOT EXISTS navigation_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Menu item identification
    menu_key VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(200) NOT NULL,
    
    -- Navigation
    href VARCHAR(500) NOT NULL,
    
    -- Icon (Lucide icon name)
    icon_name VARCHAR(100) NOT NULL DEFAULT 'Settings',
    
    -- Category/Group for sidebar organization
    category VARCHAR(100) NOT NULL DEFAULT 'main',
    category_label VARCHAR(200),
    category_order INTEGER NOT NULL DEFAULT 0,
    
    -- Menu item order within category
    item_order INTEGER NOT NULL DEFAULT 0,
    
    -- Visibility control
    is_visible BOOLEAN NOT NULL DEFAULT true,
    
    -- Role-based access
    required_role VARCHAR(50) DEFAULT NULL, -- NULL = all roles, 'admin', 'super_admin'
    
    -- Badge/count configuration
    show_badge BOOLEAN NOT NULL DEFAULT false,
    badge_source VARCHAR(100), -- e.g., 'listings.pending', 'claims.pending'
    
    -- Styling
    highlight_color VARCHAR(50), -- e.g., 'gradient', 'blue', 'red'
    
    -- Parent/child relationship for submenus
    parent_key VARCHAR(100) REFERENCES navigation_configs(menu_key),
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create index for efficient querying
CREATE INDEX idx_navigation_configs_category ON navigation_configs(category);
CREATE INDEX idx_navigation_configs_visible ON navigation_configs(is_visible, is_active);
CREATE INDEX idx_navigation_configs_order ON navigation_configs(category_order, item_order);
CREATE INDEX idx_navigation_configs_parent ON navigation_configs(parent_key);

-- Enable RLS
ALTER TABLE navigation_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read active visible menu items
CREATE POLICY "navigation_configs_read_all" 
    ON navigation_configs FOR SELECT 
    USING (is_active = true);

-- Only admins can manage navigation configs
CREATE POLICY "navigation_configs_admin_manage" 
    ON navigation_configs FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- Grant access
GRANT ALL ON navigation_configs TO authenticated;
GRANT ALL ON navigation_configs TO anon;

-- Insert default navigation items
INSERT INTO navigation_configs (menu_key, label, href, icon_name, category, category_label, category_order, item_order, is_visible, required_role, show_badge, badge_source, description) VALUES

-- Main Category
('home', 'Home', '/', 'Home', 'main', 'Main', 1, 1, true, NULL, false, NULL, 'Public home page'),
('dashboard', 'Dashboard', '/admin', 'LayoutDashboard', 'main', 'Main', 1, 2, true, 'admin', false, NULL, 'Admin dashboard'),

-- Listings Category
('listings_approved', 'Approved Listings', '/admin/listings', 'Building2', 'listings', 'Listings', 2, 1, true, 'admin', true, 'listings.approved', 'All approved business listings'),
('listings_pending', 'Pending Review', '/admin/listings/pending', 'Clock', 'listings', 'Listings', 2, 2, true, 'admin', true, 'listings.pending', 'Listings awaiting approval'),
('listings_rejected', 'Rejected Listings', '/admin/listings/rejected', 'XCircle', 'listings', 'Listings', 2, 3, true, 'admin', false, NULL, 'Rejected listings'),
('categories', 'Categories', '/admin/categories', 'Tag', 'listings', 'Listings', 2, 4, true, 'admin', false, NULL, 'Manage business categories'),
('claims', 'Claim Requests', '/admin/claims', 'FileText', 'listings', 'Listings', 2, 5, true, 'admin', true, 'claims.pending', 'Business ownership claims'),
('upgrade_requests', 'Upgrade Requests', '/admin/upgrade-requests', 'Crown', 'listings', 'Listings', 2, 6, true, 'admin', false, NULL, 'Plan upgrade requests'),
('bulk_upload', 'Bulk Upload', '/admin/bulk-upload', 'Upload', 'listings', 'Listings', 2, 7, true, 'admin', false, NULL, 'Bulk import listings'),

-- Marketing Category
('coupons', 'Coupon Mania', '/admin/coupons', 'Ticket', 'marketing', 'Marketing', 3, 1, true, 'admin', true, 'coupons.total', 'Manage coupons and deals'),
('banner_ads', 'Banner Ads', '/admin/banner-ads', 'Image', 'marketing', 'Marketing', 3, 2, true, 'admin', false, NULL, 'Manage banner advertisements'),
('blog', 'Blog', '/admin/blog', 'Newspaper', 'marketing', 'Marketing', 3, 3, true, 'admin', false, NULL, 'Manage blog posts'),
('testimonials', 'Testimonials', '/admin/testimonials', 'Quote', 'marketing', 'Marketing', 3, 4, true, 'admin', false, NULL, 'Customer testimonials'),
('faqs', 'FAQs', '/admin/faqs', 'HelpCircle', 'marketing', 'Marketing', 3, 5, true, 'admin', false, NULL, 'Frequently asked questions'),

-- Management Category
('users', 'Users', '/admin/users', 'Users', 'management', 'Management', 4, 1, true, 'admin', true, 'users.total', 'User management'),
('fees', 'Fees', '/admin/fees', 'DollarSign', 'management', 'Management', 4, 2, true, 'admin', false, NULL, 'Business fee settings'),
('past_due', 'Past Due', '/admin/past-due', 'AlertCircle', 'management', 'Management', 4, 3, true, 'admin', true, 'subscriptions.pastDue', 'Past due accounts'),
('analytics', 'Analytics', '/admin/analytics', 'BarChart3', 'management', 'Management', 4, 4, true, 'admin', false, NULL, 'Analytics dashboard'),
('settings', 'System Settings', '/admin/settings', 'Settings', 'management', 'Management', 4, 5, true, 'admin', false, NULL, 'System settings'),
('integrations', 'Integrations', '/admin/integrations', 'Key', 'management', 'Management', 4, 6, true, 'super_admin', false, NULL, 'Integration configurations'),

-- Public Pages (for reference)
('submit_listing', 'Submit Listing', '/submit', 'FileText', 'public', 'Public', 5, 1, true, NULL, false, NULL, 'Public submission form'),
('directory', 'Directory', '/directory', 'List', 'public', 'Public', 5, 2, true, NULL, false, NULL, 'Public directory page')

ON CONFLICT (menu_key) DO NOTHING;

-- Create function to get menu counts
CREATE OR REPLACE FUNCTION get_menu_counts()
RETURNS TABLE (badge_source TEXT, count BIGINT) AS $$
BEGIN
    -- Listings counts
    RETURN QUERY SELECT 'listings.approved'::TEXT, COUNT(*)::BIGINT 
                 FROM business_listings 
                 WHERE listing_status = 'approved' OR listing_status = 'active';
    
    RETURN QUERY SELECT 'listings.pending'::TEXT, COUNT(*)::BIGINT 
                 FROM business_listings 
                 WHERE listing_status = 'pending';
    
    RETURN QUERY SELECT 'listings.rejected'::TEXT, COUNT(*)::BIGINT 
                 FROM business_listings 
                 WHERE listing_status = 'rejected';
    
    -- Claims count
    RETURN QUERY SELECT 'claims.pending'::TEXT, COUNT(*)::BIGINT 
                 FROM claim_requests 
                 WHERE status = 'pending';
    
    -- Coupons count
    RETURN QUERY SELECT 'coupons.total'::TEXT, COUNT(*)::BIGINT 
                 FROM coupons;
    
    -- Users count
    RETURN QUERY SELECT 'users.total'::TEXT, COUNT(*)::BIGINT 
                 FROM profiles;
    
    -- Past due count
    RETURN QUERY SELECT 'subscriptions.pastDue'::TEXT, COUNT(*)::BIGINT 
                 FROM subscriptions 
                 WHERE status = 'past_due';
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_menu_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_menu_counts() TO anon;

-- Log the migration
INSERT INTO admin_activity_log (action_type, entity_type, notes)
VALUES ('create', 'navigation_configs', 'Created navigation_configs table with default menu items');
