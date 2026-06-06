-- Debug and fix admin access
-- Run this to see your users and their metadata

-- See all users
SELECT 
  id, 
  email, 
  raw_user_meta_data,
  raw_user_meta_data->>'is_admin' as is_admin_flag,
  raw_user_meta_data->>'role' as role_flag
FROM auth.users;

-- To make a user admin, uncomment and run (replace email):
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'::jsonb
-- )
-- WHERE email = 'YOUR_EMAIL_HERE';

-- Alternative: Set role to admin
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"admin"'::jsonb
-- )
-- WHERE email = 'YOUR_EMAIL_HERE';
