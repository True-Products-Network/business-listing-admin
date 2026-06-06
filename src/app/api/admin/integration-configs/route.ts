import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

// GET - Fetch all integration configs
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceClient();

    // Fetch all integration configs
    const { data: configs, error: configsError } = await supabaseAdmin
      .from('integration_configs')
      .select('*')
      .order('category', { ascending: true })
      .order('config_key', { ascending: true });

    if (configsError) {
      console.error('Error fetching integration configs:', configsError);
      return NextResponse.json({ success: false, error: 'Failed to fetch configs' }, { status: 500 });
    }

    // Group by category
    const grouped = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({ 
      success: true, 
      configs,
      grouped
    });

  } catch (error) {
    console.error('Error in GET /api/admin/integration-configs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update integration configs
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceClient();
    const body = await request.json();
    const { configs, updated_by } = body;

    if (!Array.isArray(configs) || configs.length === 0) {
      return NextResponse.json({ success: false, error: 'No configs provided' }, { status: 400 });
    }

    // Update each config
    let updated = 0;
    const errors: string[] = [];

    for (const config of configs) {
      const { config_key, config_value } = config;
      
      if (!config_key) {
        errors.push('Missing config_key for an entry');
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from('integration_configs')
        .update({
          config_value: config_value || '',
          last_updated_by: updated_by,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', config_key);

      if (updateError) {
        console.error(`Error updating config ${config_key}:`, updateError);
        errors.push(`Failed to update ${config_key}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    // Log the activity
    if (updated > 0 && updated_by) {
      await supabaseAdmin
        .from('admin_activity_log')
        .insert({
          admin_profile_id: updated_by,
          action_type: 'update',
          entity_type: 'integration_configs',
          notes: `Updated ${updated} integration config(s)`
        });
    }

    return NextResponse.json({ 
      success: errors.length === 0, 
      updated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in POST /api/admin/integration-configs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Create new integration config (for adding webhooks)
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceClient();
    const body = await request.json();
    const { config, created_by } = body;

    if (!config || !config.config_key || !config.category) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: config_key and category are required' 
      }, { status: 400 });
    }

    // Check if config_key already exists
    const { data: existing } = await supabaseAdmin
      .from('integration_configs')
      .select('id')
      .eq('config_key', config.config_key)
      .single();

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        error: `Config with key '${config.config_key}' already exists` 
      }, { status: 409 });
    }

    // Insert new config
    const { data: newConfig, error: insertError } = await supabaseAdmin
      .from('integration_configs')
      .insert({
        config_key: config.config_key,
        config_value: config.config_value || '',
        config_type: config.config_type || 'text',
        category: config.category,
        description: config.description || '',
        is_sensitive: config.is_sensitive || false,
        is_active: config.is_active !== false, // default to true
        is_required: config.is_required || false,
        last_updated_by: created_by,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating config:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to create config: ${insertError.message}` 
      }, { status: 500 });
    }

    // Log the activity
    if (created_by) {
      await supabaseAdmin
        .from('admin_activity_log')
        .insert({
          admin_profile_id: created_by,
          action_type: 'create',
          entity_type: 'integration_configs',
          notes: `Created new integration config: ${config.config_key} in category ${config.category}`
        });
    }

    return NextResponse.json({ 
      success: true, 
      config: newConfig,
      message: `Created config '${config.config_key}' successfully`
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/integration-configs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
