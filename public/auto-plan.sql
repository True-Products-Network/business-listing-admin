-- Auto-assign Free plan to new listings
-- This trigger ensures all listings have a plan

CREATE OR REPLACE FUNCTION auto_assign_free_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- If no plan_id is provided, assign the Free plan
  IF NEW.plan_id IS NULL THEN
    SELECT id INTO NEW.plan_id
    FROM listing_plans
    WHERE plan_key = 'free'
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on business_listings
DROP TRIGGER IF EXISTS auto_free_plan_trigger ON business_listings;
CREATE TRIGGER auto_free_plan_trigger
  BEFORE INSERT ON business_listings
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_free_plan();

-- Also ensure Free plan exists
INSERT INTO listing_plans (plan_key, plan_name, monthly_price, yearly_price, max_images, allows_coupon, allows_video, allows_banner_ads, allows_social_links, allows_priority_placement, featured_priority)
SELECT 'free', 'Free Listing', 0, 0, 1, false, false, false, false, false, 10
WHERE NOT EXISTS (SELECT 1 FROM listing_plans WHERE plan_key = 'free');

SELECT 'Auto-assign Free plan trigger created' as status;
