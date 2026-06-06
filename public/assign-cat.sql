-- Assign categories to existing businesses
-- Since they were submitted before the category fix

-- Assign "Professional Services" to True Products Network LLC
INSERT INTO business_categories (business_id, category_id, is_primary)
SELECT 
  b.id,
  c.id,
  true
FROM businesses b, categories c
WHERE b.business_name = 'True Products Network LLC'
  AND c.name = 'Professional Services'
ON CONFLICT DO NOTHING;

-- Assign a category to AIM Training (you may want to change this)
INSERT INTO business_categories (business_id, category_id, is_primary)
SELECT 
  b.id,
  c.id,
  true
FROM businesses b, categories c
WHERE b.business_name = 'AIM Training'
  AND c.name = 'Coaching'
ON CONFLICT DO NOTHING;

-- Verify the assignments
SELECT 
  b.business_name,
  c.name as category_name
FROM businesses b
JOIN business_categories bc ON bc.business_id = b.id
JOIN categories c ON c.id = bc.category_id
WHERE b.status = 'active';

-- Check the view now
SELECT business_name, primary_category 
FROM public_approved_listings;
