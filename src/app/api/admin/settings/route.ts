import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

// GET all settings or filter by category
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('setting_key', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by category for easier frontend consumption
    const grouped = data?.reduce((acc: any, setting: any) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    return NextResponse.json({ 
      success: true, 
      settings: data,
      grouped 
    });
  } catch (error: any) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST update settings (bulk update)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    const { settings, updated_by } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings array required' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const setting of settings) {
      const { setting_key, setting_value } = setting;

      const { data, error } = await supabase
        .from('system_settings')
        .update({
          setting_value: String(setting_value),
          updated_by,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', setting_key)
        .eq('is_editable', true)
        .select()
        .single();

      if (error) {
        errors.push({ setting_key, error: error.message });
      } else {
        results.push(data);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      updated: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
