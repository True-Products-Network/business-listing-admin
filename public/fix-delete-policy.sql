-- Fix delete permissions for testimonials and FAQs
-- Run this in Supabase SQL Editor

-- Allow authenticated users to delete testimonials
CREATE POLICY "Allow authenticated delete testimonials" ON testimonials
    FOR DELETE TO authenticated USING (true);

-- Allow authenticated users to delete FAQs
CREATE POLICY "Allow authenticated delete faqs" ON faqs
    FOR DELETE TO authenticated USING (true);

-- Also allow anon to delete (for testing)
CREATE POLICY "Allow anon delete testimonials" ON testimonials
    FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon delete faqs" ON faqs
    FOR DELETE TO anon USING (true);
