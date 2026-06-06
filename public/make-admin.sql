-- Make a user an admin
-- Replace 'USER_EMAIL_HERE' with the actual email

-- First, let's see what users exist
SELECT id, email, raw_user_meta_data 
FROM auth.users 
LIMIT 10;

-- To make a specific user an admin, run this (replace email):
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'::jsonb
-- )
-- WHERE email = 'YOUR_EMAIL_HERE';
