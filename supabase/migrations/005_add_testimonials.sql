-- ============================================
-- TESTIMONIALS TABLE
-- For managing customer testimonials and reviews
-- ============================================

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name TEXT NOT NULL,
    author_title TEXT,
    author_company TEXT,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Public can read featured testimonials (for homepage)
CREATE POLICY "Public can read featured testimonials" ON testimonials
    FOR SELECT USING (is_featured = true);

-- Public can read all testimonials (for testimonials page)
CREATE POLICY "Public can read all testimonials" ON testimonials
    FOR SELECT USING (true);

-- Admins can manage all testimonials
CREATE POLICY "Admins can manage testimonials" ON testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create index for featured testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON testimonials(display_order);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS testimonials_updated_at ON testimonials;
CREATE TRIGGER testimonials_updated_at
    BEFORE UPDATE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample testimonials
INSERT INTO testimonials (author_name, author_title, author_company, content, rating, is_featured, display_order)
VALUES 
    (
        'John Smith', 
        'Owner', 
        'Smith Construction',
        'The STL Business Guide has been instrumental in helping us reach new customers. Our business has grown 40% since listing!',
        5,
        true,
        1
    ),
    (
        'Sarah Johnson',
        'Marketing Director',
        'Johnson Family Dental',
        'Easy to use platform and great support. Highly recommend for any local business looking to increase visibility.',
        5,
        true,
        2
    ),
    (
        'Mike Williams',
        'CEO',
        'Williams Auto Repair',
        'Fantastic ROI. The premium listing paid for itself within the first month.',
        5,
        true,
        3
    )
ON CONFLICT DO NOTHING;
