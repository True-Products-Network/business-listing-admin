-- Fix access for testimonials and FAQs tables
-- Run this in Supabase SQL Editor

-- Enable RLS on testimonials table
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Enable RLS on faqs table
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read testimonials
CREATE POLICY "Allow authenticated read testimonials" ON testimonials
    FOR SELECT TO authenticated USING (true);

-- Create policy to allow all authenticated users to read FAQs
CREATE POLICY "Allow authenticated read faqs" ON faqs
    FOR SELECT TO authenticated USING (true);

-- Create policy to allow all users (including anon) to read active testimonials
CREATE POLICY "Allow public read testimonials" ON testimonials
    FOR SELECT TO anon USING (true);

-- Create policy to allow all users (including anon) to read active FAQs
CREATE POLICY "Allow public read faqs" ON faqs
    FOR SELECT TO anon USING (is_active = true);

-- Grant access to tables
GRANT ALL ON testimonials TO authenticated;
GRANT ALL ON testimonials TO anon;
GRANT ALL ON faqs TO authenticated;
GRANT ALL ON faqs TO anon;

-- Verify data exists
SELECT 'Testimonials count: ' || COUNT(*) FROM testimonials;
SELECT 'FAQs count: ' || COUNT(*) FROM faqs;
