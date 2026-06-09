-- ============================================
-- FIX OWNERSHIP TRANSFER FOR ADMIN
-- Date: June 9, 2026
-- Purpose: Allow admins to transfer business ownership
-- ============================================

-- ============================================
-- STEP 1: Create admin function to transfer ownership
-- This function bypasses the ownership change trigger
-- ============================================

CREATE OR REPLACE FUNCTION admin_transfer_ownership(
  p_business_id UUID,
  p_new_owner_profile_id UUID,
  p_new_email TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Only admins can transfer ownership';
  END IF;

  -- Verify the new owner exists
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_new_owner_profile_id 
    AND email = p_new_email
  ) THEN
    RAISE EXCEPTION 'New owner not found';
  END IF;

  -- Update the business ownership
  -- We use a direct UPDATE that bypasses the trigger
  UPDATE businesses 
  SET 
    owner_profile_id = p_new_owner_profile_id,
    email = p_new_email,
    updated_at = NOW()
  WHERE id = p_business_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

END;
$$;

-- Grant execute permission to authenticated users
-- (the function itself checks for admin role)
GRANT EXECUTE ON FUNCTION admin_transfer_ownership(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_transfer_ownership(UUID, UUID, TEXT) TO service_role;

-- ============================================
-- STEP 2: Alternative - Modify the trigger to allow admin bypass
-- This is a more robust solution that allows the admin API to work
-- ============================================

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS prevent_business_ownership_change ON businesses;

-- Create an improved trigger that allows admin/service role bypass
CREATE OR REPLACE FUNCTION prevent_ownership_change()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_is_service_role BOOLEAN;
BEGIN
  -- Check if the current user is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) INTO v_is_admin;

  -- Check if this is being called by service role (server-side API)
  -- Service role bypasses RLS and has a special JWT claim
  v_is_service_role := (
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );

  -- Allow ownership change if user is admin or service role
  IF v_is_admin OR v_is_service_role THEN
    RETURN NEW;
  END IF;

  -- Block ownership change for regular users
  IF OLD.owner_profile_id IS DISTINCT FROM NEW.owner_profile_id THEN
    RAISE EXCEPTION 'Ownership cannot be changed directly. Contact an admin for ownership transfers.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the improved function
CREATE TRIGGER prevent_business_ownership_change
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ownership_change();

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Verify the function was created:
-- SELECT proname, proargnames, prosecdef 
-- FROM pg_proc 
-- WHERE proname = 'admin_transfer_ownership';

-- Verify the trigger exists:
-- SELECT trigger_name, event_manipulation, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'prevent_business_ownership_change';