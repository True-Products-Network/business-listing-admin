-- ============================================
-- FIX FAQ RLS POLICIES
-- Allow public to read all FAQs (not just active ones)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read FAQs" ON faqs;
DROP POLICY IF EXISTS "Admins and super admins can manage FAQs" ON faqs;

-- Allow anyone to read all FAQs (needed for admin to see inactive ones)
CREATE POLICY "Anyone can read FAQs" ON faqs
    FOR SELECT USING (true);

-- Allow admins to manage all FAQs
CREATE POLICY "Admins can manage FAQs" ON faqs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Show current policies
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'faqs'
ORDER BY policyname;
