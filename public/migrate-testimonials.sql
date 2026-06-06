-- Migration script to populate testimonials table with existing STL Business Guide data
-- Run this in your Supabase SQL Editor

-- First, ensure the testimonials table exists
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_company TEXT,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert existing testimonials from STL Business Guide v2
INSERT INTO testimonials (author_name, author_company, author_title, content, rating, is_featured, display_order, created_at) VALUES
  (
    'Sarah Johnson',
    'Sarah''s Salon',
    'Chesterfield, MO',
    'Since upgrading to Premium, I''ve seen a 147% increase in new client inquiries. The priority placement on search results has made all the difference for my business. Results: 47 new clients in 30 days',
    5,
    true,
    1,
    NOW()
  ),
  (
    'Michael Chen',
    'Chen''s Auto Repair',
    'St. Louis, MO',
    'The VIP membership has been a game-changer. We''re now the top result for auto repair in our area, and the dedicated account manager helps us optimize our listing monthly. Results: 3x increase in phone calls',
    5,
    true,
    2,
    NOW()
  ),
  (
    'Jennifer Martinez',
    'Martinez Law Firm',
    'Clayton, MO',
    'As a professional services firm, visibility is everything. STL Business Guide has connected us with clients we never would have reached otherwise. Results: 12 new retained clients',
    5,
    true,
    3,
    NOW()
  ),
  (
    'David Thompson',
    'Thompson''s Landscaping',
    'Ballwin, MO',
    'The photo gallery feature lets us showcase our work beautifully. Potential customers can see our quality before they even call. Worth every penny! Results: 85% increase in quote requests',
    5,
    true,
    4,
    NOW()
  ),
  (
    'Lisa Wong',
    'Wong''s Kitchen',
    'Kirkwood, MO',
    'Being featured in the newsletter brought us so much traffic! The coupon feature helps us track exactly how many customers come from STL Business Guide. Results: 200+ coupon redemptions',
    5,
    false,
    5,
    NOW()
  ),
  (
    'Robert Taylor',
    'Taylor''s Fitness Center',
    'Wildwood, MO',
    'The analytics dashboard shows us exactly how people find us. We''ve used that data to improve our other marketing efforts too. Results: 50 new memberships',
    5,
    false,
    6,
    NOW()
  );

-- Enable RLS on testimonials table
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DROP POLICY IF EXISTS "Allow public read access" ON testimonials;
CREATE POLICY "Allow public read access" ON testimonials
  FOR SELECT USING (true);

-- Create policy for admin full access
DROP POLICY IF EXISTS "Allow admin full access" ON testimonials;
CREATE POLICY "Allow admin full access" ON testimonials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.auth_user_id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
