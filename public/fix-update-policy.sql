-- Fix UPDATE permissions for testimonials and FAQs
-- Run this in Supabase SQL Editor

-- Allow authenticated users to update testimonials
CREATE POLICY "Allow authenticated update testimonials" ON testimonials
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to update FAQs
CREATE POLICY "Allow authenticated update faqs" ON faqs
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Also allow anon to update (for testing if needed)
CREATE POLICY "Allow anon update testimonials" ON testimonials
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon update faqs" ON faqs
    FOR UPDATE TO anon USING (true) WITH CHECK (true);
