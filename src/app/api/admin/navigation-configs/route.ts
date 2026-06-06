import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

// GET - Fetch all navigation configs with counts
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceClient();

    // Fetch all navigation configs
    const { data: configs, error: configsError } = await supabaseAdmin
      .from('navigation_configs')
      .select('*')
      .eq('is_active', true)
      .order('category_order', { ascending: true })
      .order('item_order', { ascending: true });

    if (configsError) {
      console.error('Error fetching navigation configs:', configsError);
      return NextResponse.json({ success: false, error: 'Failed to fetch navigation configs' }, { status: 500 });
    }

    // Get menu counts
    const { data: counts, error: countsError } = await supabaseAdmin
      .rpc('get_menu_counts');

    if (countsError) {
      console.error('Error fetching menu counts:', countsError);
    }

    // Create counts map
    const countsMap = (counts || []).reduce((acc: Record<string, number>, item: any) => {
      acc[item.badge_source] = parseInt(item.count);
      return acc;
    }, {});

    // Group by category
    const grouped = (configs || []).reduce((acc: Record<string, any[]>, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      
      // Add count if badge is enabled
      const configWithCount = {
        ...config,
        badge_count: config.show_badge && config.badge_source ? (countsMap[config.badge_source] || 0) : null
      };
      
      acc[config.category].push(configWithCount);
      return acc;
    }, {});

    return NextResponse.json({ 
      success: true, 
      configs,
      grouped,
      counts: countsMap
    });

  } catch (error) {
    console.error('Error in GET /api/admin/navigation-configs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update navigation config
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
      const { menu_key, ...updates } = config;
      
      if (!menu_key) {
        errors.push('Missing menu_key for an entry');
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from('navigation_configs')
        .update({
          ...updates,
          updated_by,
          updated_at: new Date().toISOString()
        })
        .eq('menu_key', menu_key);

      if (updateError) {
        console.error(`Error updating config ${menu_key}:`, updateError);
        errors.push(`Failed to update ${menu_key}: ${updateError.message}`);
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
          entity_type: 'navigation_configs',
          notes: `Updated ${updated} navigation config(s)`
        });
    }

    return NextResponse.json({ 
      success: errors.length === 0, 
      updated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in POST /api/admin/navigation-configs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Create new navigation config
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceClient();
    const body = await request.json();
    const { config, created_by } = body;

    if (!config || !config.menu_key || !config.label || !config.href) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: menu_key, label, and href are required' 
      }, { status: 400 });
    }

    // Check if menu_key already exists
    const { data: existing } = await supabaseAdmin
      .from('navigation_configs')
      .select('id')
      .eq('menu_key', config.menu_key)
      .single();

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        error: `Menu item with key '${config.menu_key}' already exists` 
      }, { status: 409 });
    }

    // Insert new config
    const { data: newConfig, error: insertError } = await supabaseAdmin
      .from('navigation_configs')
      .insert({
        ...config,
        created_by,
        updated_by: created_by,
        created_at: new Date().toISOString(),
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
          entity_type: 'navigation_configs',
          notes: `Created new navigation config: ${config.menu_key}`
        });
    }

    return NextResponse.json({ 
      success: true, 
      config: newConfig,
      message: `Created menu item '${config.label}' successfully`
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/navigation-configs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete navigation config
export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceClient();
    const { searchParams } = new URL(request.url);
    const menu_key = searchParams.get('menu_key');
    const deleted_by = searchParams.get('deleted_by');

    if (!menu_key) {
      return NextResponse.json({ success: false, error: 'menu_key is required' }, { status: 400 });
    }

    // Soft delete - set is_active to false
    const { error: deleteError } = await supabaseAdmin
      .from('navigation_configs')
      .update({
        is_active: false,
        updated_by: deleted_by,
        updated_at: new Date().toISOString()
      })
      .eq('menu_key', menu_key);

    if (deleteError) {
      console.error('Error deleting config:', deleteError);
      return NextResponse.json({ success: false, error: 'Failed to delete config' }, { status: 500 });
    }

    // Log the activity
    if (deleted_by) {
      await supabaseAdmin
        .from('admin_activity_log')
        .insert({
          admin_profile_id: deleted_by,
          action_type: 'delete',
          entity_type: 'navigation_configs',
          notes: `Deleted navigation config: ${menu_key}`
        });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Deleted menu item '${menu_key}' successfully`
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/navigation-configs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
