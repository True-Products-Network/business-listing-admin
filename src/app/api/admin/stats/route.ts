import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const stats = {
      foundingMembers: {
        current: 0,
        limit: 100,
        remaining: 0,
        percentage: 0,
      },
      gracePeriods: {
        expiringToday: 0,
        expiringThisWeek: 0,
        inGracePeriod: 0,
      },
      subscriptions: {
        total: 0,
        active: 0,
        pastDue: 0,
        canceled: 0,
        premium: 0,
        vip: 0,
      },
      revenue: {
        monthly: 0,
        foundingMemberLocked: 0,
      },
    };

    // Count founding members
    const { count: foundingCount, error: foundingError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_founding_member', true)
      .in('status', ['active', 'past_due', 'trialing']);

    if (!foundingError && foundingCount !== null) {
      stats.foundingMembers.current = foundingCount;
      stats.foundingMembers.remaining = Math.max(0, 100 - foundingCount);
      stats.foundingMembers.percentage = (foundingCount / 100) * 100;
    }

    // Get founding member limit from settings
    const { data: limitSetting } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'founding_member_limit')
      .single();

    if (limitSetting) {
      const limit = parseInt(limitSetting.setting_value) || 100;
      stats.foundingMembers.limit = limit;
      stats.foundingMembers.remaining = Math.max(0, limit - stats.foundingMembers.current);
      stats.foundingMembers.percentage = (stats.foundingMembers.current / limit) * 100;
    }

    // Count grace periods
    const now = new Date().toISOString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { count: expiringToday, error: todayError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .lt('grace_period_ends_at', tomorrow.toISOString())
      .gte('grace_period_ends_at', now)
      .neq('status', 'canceled')
      .neq('status', 'downgraded');

    if (!todayError && expiringToday !== null) {
      stats.gracePeriods.expiringToday = expiringToday;
    }

    const { count: expiringThisWeek, error: weekError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .lt('grace_period_ends_at', nextWeek.toISOString())
      .gte('grace_period_ends_at', now)
      .neq('status', 'canceled')
      .neq('status', 'downgraded');

    if (!weekError && expiringThisWeek !== null) {
      stats.gracePeriods.expiringThisWeek = expiringThisWeek;
    }

    const { count: inGracePeriod, error: graceError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .not('grace_period_ends_at', 'is', null)
      .neq('status', 'canceled')
      .neq('status', 'downgraded');

    if (!graceError && inGracePeriod !== null) {
      stats.gracePeriods.inGracePeriod = inGracePeriod;
    }

    // Count subscriptions by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('subscriptions')
      .select('status, plan_key');

    if (!statusError && statusCounts) {
      stats.subscriptions.total = statusCounts.length;
      stats.subscriptions.active = statusCounts.filter(s => s.status === 'active').length;
      stats.subscriptions.pastDue = statusCounts.filter(s => s.status === 'past_due').length;
      stats.subscriptions.canceled = statusCounts.filter(s => s.status === 'canceled').length;
      stats.subscriptions.premium = statusCounts.filter(s => s.plan_key === 'premium').length;
      stats.subscriptions.vip = statusCounts.filter(s => s.plan_key === 'vip').length;
    }

    // Calculate estimated monthly revenue
    const { data: prices } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['premium_monthly_price', 'vip_monthly_price']);

    if (prices) {
      const premiumPrice = parseFloat(prices.find(p => p.setting_key === 'premium_monthly_price')?.setting_value || '29');
      const vipPrice = parseFloat(prices.find(p => p.setting_key === 'vip_monthly_price')?.setting_value || '97');
      
      stats.revenue.monthly = (stats.subscriptions.premium * premiumPrice) + 
                               (stats.subscriptions.vip * vipPrice);
      stats.revenue.foundingMemberLocked = stats.foundingMembers.current > 0 ? 
        stats.revenue.monthly : 0;
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
