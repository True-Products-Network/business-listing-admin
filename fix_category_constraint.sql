-- Fix the category constraint to include github and env_vars

-- First, drop the existing constraint
ALTER TABLE integration_configs 
DROP CONSTRAINT IF EXISTS integration_configs_category_check;

-- Add the new constraint with all allowed categories
ALTER TABLE integration_configs 
ADD CONSTRAINT integration_configs_category_check 
CHECK (category IN (
    'stripe', 
    'vercel', 
    'vercel_admin',
    'vercel_production', 
    'domain', 
    'supabase', 
    'ghl', 
    'email', 
    'general', 
    'api_keys',
    'env_vars',
    'github'
));

-- Now run the inserts
-- ============================================
-- GITHUB CODE STORAGE CATEGORY
-- ============================================

-- GitHub Organisation
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
    'github_organisation',
    'True-Products-Network',
    'text',
    'github',
    'GitHub Organisation name (e.g., True-Products-Network)',
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

-- GitHub Repository
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
    'github_repository',
    'business-listing-admin',
    'text',
    'github',
    'GitHub Repository name for code storage',
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

-- GitHub Auth Code (Personal Access Token)
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
    'github_auth_code',
    '',
    'password',
    'github',
    'GitHub Personal Access Token for API authentication',
    true,
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

-- Vercel Access API Key
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
    'vercel_access_api_key',
    '',
    'password',
    'github',
    'Vercel Access API Key for deployment integration',
    true,
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

-- ============================================
-- ADDITIONAL SUPABASE FIELDS
-- ============================================

-- Supabase Published Key (Anon/Public Key)
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
    'supabase_published_key',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZXVxZXdsbmV1ZmlzdXNzb2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1OTU4NzksImV4cCI6MjA5NTE3MTg3OX0.z8gC3tUUcr3OGUtd490Z-0ZPJLYPZbax1TGxfwDtaj4',
    'password',
    'supabase',
    'Supabase Published/Anon Key (public-facing, safe for client-side)',
    true,
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

-- Supabase Project Name
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
    'supabase_project_name',
    'Business Listing Admin',
    'text',
    'supabase',
    'Supabase Project Name for identification',
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

-- Supabase Project ID
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
    'supabase_project_id',
    'eceuqewlneufisussofc',
    'text',
    'supabase',
    'Supabase Project ID (found in project URL)',
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

-- Supabase Project Password (Service Role Key)
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
    'supabase_project_password',
    '',
    'password',
    'supabase',
    'Supabase Service Role Key (server-side only - NEVER expose to client!)',
    true,
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

-- Supabase GitHub Location
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
    'supabase_github_location',
    'https://github.com/True-Products-Network/business-listing-admin',
    'url',
    'supabase',
    'GitHub repository URL linked to this Supabase project',
    false,
    true,
    false,
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

-- Supabase Secret Key (JWT Secret)
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
    'supabase_secret_key',
    '',
    'password',
    'supabase',
    'Supabase JWT Secret for token signing/verification',
    true,
    true,
    false,
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

-- ============================================
-- VERIFY ALL INSERTS
-- ============================================

SELECT 
    config_key, 
    category, 
    config_type,
    description, 
    is_sensitive,
    is_required,
    CASE 
        WHEN config_value = '' THEN '[EMPTY]'
        WHEN is_sensitive = true AND config_value != '' THEN '***'
        ELSE LEFT(config_value, 50)
    END as value_preview
FROM integration_configs 
WHERE category IN ('github', 'supabase')
ORDER BY category, config_key;