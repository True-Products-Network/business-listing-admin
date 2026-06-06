-- Add Supabase redirection URL to integration_configs
-- This is the URL used for Supabase Auth redirect after login/signup

INSERT INTO integration_configs (
    config_key,
    config_value,
    config_type,
    category,
    description,
    is_sensitive,
    is_active,
    is_required,
    created_at,
    updated_at
) VALUES (
    'supabase_redirect_url',
    'https://business-listing-admin.vercel.app/auth/callback',
    'url',
    'supabase',
    'Supabase Auth redirect URL - where users are sent after authentication (login/signup)',
    false,
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    config_type = EXCLUDED.config_type,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    is_sensitive = EXCLUDED.is_sensitive,
    is_active = EXCLUDED.is_active,
    is_required = EXCLUDED.is_required,
    updated_at = NOW();

-- Also add Google Maps API Key if not exists (for geocoding/location features)
INSERT INTO integration_configs (
    config_key,
    config_value,
    config_type,
    category,
    description,
    is_sensitive,
    is_active,
    is_required,
    created_at,
    updated_at
) VALUES (
    'google_maps_api_key',
    '',
    'password',
    'api_keys',
    'Google Maps API Key for geocoding and location services',
    true,
    true,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (config_key) DO NOTHING;

-- Also add CRON Secret for secure cron job execution
INSERT INTO integration_configs (
    config_key,
    config_value,
    config_type,
    category,
    description,
    is_sensitive,
    is_active,
    is_required,
    created_at,
    updated_at
) VALUES (
    'cron_secret',
    '',
    'password',
    'env_vars',
    'CRON Secret for authenticating scheduled job requests (Vercel Cron)',
    true,
    true,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (config_key) DO NOTHING;

-- Verify the inserts
SELECT config_key, category, description, is_required 
FROM integration_configs 
WHERE config_key IN ('supabase_redirect_url', 'google_maps_api_key', 'cron_secret')
ORDER BY config_key;