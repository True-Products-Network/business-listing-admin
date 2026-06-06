-- ============================================
-- FIX TESTIMONIAL AND FAQ POLICIES
-- Allow admins to manage testimonials and FAQs
-- ============================================

-- ============================================
-- TESTIMONIALS POLICIES
-- ============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage testimonials" ON testimonials;
DROP POLICY IF EXISTS "Public can read featured testimonials" ON testimonials;
DROP POLICY IF EXISTS "Public can read all testimonials" ON testimonials;

-- Public can read all testimonials
CREATE POLICY "Public can read all testimonials" ON testimonials
    FOR SELECT USING (true);

-- Admins can manage all testimonials (CRUD operations)
CREATE POLICY "Admins can manage testimonials" ON testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- FAQS POLICIES
-- ============================================

-- Check if faqs table exists and create policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faqs') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Admins can manage FAQs" ON faqs;
        DROP POLICY IF EXISTS "Public can read FAQs" ON faqs;
        
        -- Public can read active FAQs
        CREATE POLICY "Public can read FAQs" ON faqs
            FOR SELECT USING (is_active = true);
        
        -- Admins can manage all FAQs
        CREATE POLICY "Admins can manage FAQs" ON faqs
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'super_admin')
                )
            );
        
        RAISE NOTICE 'FAQ policies created';
    ELSE
        RAISE NOTICE 'FAQs table does not exist - skipping FAQ policies';
    END IF;
END $$;

-- ============================================
-- VERIFY POLICIES
-- ============================================

SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('testimonials', 'faqs')
ORDER BY tablename, cmd;