-- Add Supabase Anon Key to integration configs
-- This allows the key to be managed via the admin panel

INSERT INTO integration_configs (
  config_key,
  config_value,
  category,
  description,
  is_sensitive,
  is_required,
  created_at,
  updated_at
) VALUES (
  'supabase_anon_key',
  '',
  'supabase',
  'Supabase Public/Anon Key - used for client-side database access',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (config_key) DO UPDATE SET
  description = EXCLUDED.description,
  is_sensitive = EXCLUDED.is_sensitive,
  is_required = EXCLUDED.is_required,
  updated_at = NOW();

-- Also add the Supabase URL if not exists
INSERT INTO integration_configs (
  config_key,
  config_value,
  category,
  description,
  is_sensitive,
  is_required,
  created_at,
  updated_at
) VALUES (
  'supabase_url',
  '',
  'supabase',
  'Supabase Project URL',
  false,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (config_key) DO UPDATE SET
  description = EXCLUDED.description,
  is_sensitive = EXCLUDED.is_sensitive,
  is_required = EXCLUDED.is_required,
  updated_at = NOW();
