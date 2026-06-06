-- Migration script to populate FAQs table with existing STL Business Guide data
-- Run this in your Supabase SQL Editor

-- First, ensure the faqs table exists
CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_help_center BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert existing FAQs from STL Business Guide v2 Help Center
INSERT INTO faqs (question, answer, category, is_active, is_help_center, display_order, created_at) VALUES
  (
    'How do I create a business listing?',
    'Click ''List Your Business'' and follow the simple 3-step process. You''ll need to provide your business name, contact information, description, and select a plan (Free, Premium, or VIP).',
    'Getting Started',
    true,
    true,
    1,
    NOW()
  ),
  (
    'What''s the difference between Free, Premium, and VIP plans?',
    'Free plans include basic listing with 1 category and standard placement. Premium ($97/month) adds featured placement, up to 10 photos, and 3 categories. VIP ($497/month) includes top priority placement, unlimited photos, videos, and a dedicated account manager.',
    'Plans & Pricing',
    true,
    true,
    2,
    NOW()
  ),
  (
    'How long does it take for my listing to be approved?',
    'Most listings are reviewed and approved within 24-48 hours. You''ll receive an email notification once your listing is live.',
    'Getting Started',
    true,
    true,
    3,
    NOW()
  ),
  (
    'Can I edit my listing after it''s published?',
    'Yes! You can log into your account anytime to update your business information, photos, hours, and other details. Changes are typically reflected within a few hours.',
    'Managing Your Listing',
    true,
    true,
    4,
    NOW()
  ),
  (
    'How do I get more visibility for my business?',
    'Upgrade to Premium or VIP for better placement. Also, complete your full profile, add high-quality photos, encourage customer reviews, and keep your information up to date.',
    'Marketing & Visibility',
    true,
    true,
    5,
    NOW()
  ),
  (
    'What payment methods do you accept?',
    'We accept all major credit cards (Visa, MasterCard, American Express, Discover) for Premium and VIP subscriptions.',
    'Plans & Pricing',
    true,
    true,
    6,
    NOW()
  ),
  (
    'Can I cancel my subscription anytime?',
    'Yes, you can cancel your Premium or VIP subscription at any time. Your listing will remain active until the end of your current billing period, then revert to a Free plan.',
    'Plans & Pricing',
    true,
    true,
    7,
    NOW()
  ),
  (
    'How do customer reviews work?',
    'Customers can leave reviews on your listing page. We moderate all reviews to ensure authenticity. You can respond to reviews from your business dashboard.',
    'Managing Your Listing',
    true,
    true,
    8,
    NOW()
  );

-- Enable RLS on faqs table
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to active FAQs
DROP POLICY IF EXISTS "Allow public read access to active FAQs" ON faqs;
CREATE POLICY "Allow public read access to active FAQs" ON faqs
  FOR SELECT USING (is_active = true);

-- Create policy for admin full access
DROP POLICY IF EXISTS "Allow admin full access" ON faqs;
CREATE POLICY "Allow admin full access" ON faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.auth_user_id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
  );

-- Create updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
