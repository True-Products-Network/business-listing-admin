-- ============================================
-- CLEAN UP TESTIMONIAL AND FAQ POLICIES
-- Remove conflicting policies, keep only admin and public read
-- ============================================

-- ============================================
-- TESTIMONIALS - Remove all conflicting policies
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated delete testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow authenticated read testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow authenticated update testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow public read testimonials" ON testimonials;
DROP POLICY IF EXISTS "Public can read all testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admins can manage testimonials" ON testimonials;

-- Public can read all testimonials
CREATE POLICY "Public can read testimonials" ON testimonials
    FOR SELECT USING (true);

-- Only admins and super_admins can manage
CREATE POLICY "Admins and super admins can manage testimonials" ON testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- FAQS - Remove all conflicting policies
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated delete faqs" ON faqs;
DROP POLICY IF EXISTS "Allow authenticated read faqs" ON faqs;
DROP POLICY IF EXISTS "Allow authenticated update faqs" ON faqs;
DROP POLICY IF EXISTS "Allow public read faqs" ON faqs;
DROP POLICY IF EXISTS "Public can read FAQs" ON faqs;
DROP POLICY IF EXISTS "Admins can manage FAQs" ON faqs;

-- Public can read active FAQs
CREATE POLICY "Public can read FAQs" ON faqs
    FOR SELECT USING (is_active = true);

-- Only admins and super_admins can manage
CREATE POLICY "Admins and super admins can manage FAQs" ON faqs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- VERIFY FINAL POLICIES
-- ============================================

SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('testimonials', 'faqs')
ORDER BY tablename, cmd;
