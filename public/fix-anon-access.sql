-- Fix RLS policies for public (anon) access to testimonials and FAQs
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow public read faqs" ON faqs;

-- Create policy to allow anon (public) users to read testimonials
CREATE POLICY "Allow public read testimonials" ON testimonials
    FOR SELECT TO anon USING (true);

-- Create policy to allow anon (public) users to read active FAQs
CREATE POLICY "Allow public read faqs" ON faqs
    FOR SELECT TO anon USING (is_active = true);

-- Grant select access to anon
GRANT SELECT ON testimonials TO anon;
GRANT SELECT ON faqs TO anon;

-- Verify data exists
SELECT 'Testimonials: ' || COUNT(*) || ' records' FROM testimonials;
SELECT 'FAQs: ' || COUNT(*) || ' records (active: ' || (SELECT COUNT(*) FROM faqs WHERE is_active = true) || ')' FROM faqs;
