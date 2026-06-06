-- Check if businesses have categories assigned
SELECT 
  b.business_name,
  c.name as category_name,
  bc.is_primary
FROM businesses b
LEFT JOIN business_categories bc ON bc.business_id = b.id
LEFT JOIN categories c ON c.id = bc.category_id
WHERE b.status = 'active'
ORDER BY b.business_name;

-- Also check what the view shows
SELECT 
  business_name,
  primary_category
FROM public_approved_listings;
