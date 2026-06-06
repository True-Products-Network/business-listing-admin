// GHL Webhook Integration for Coupon Redemptions
// Webhook URL is stored in integration_configs table

import { createClient } from '@/lib/supabase';

interface GHLRedemptionPayload {
  name: string;
  email: string;
  phone?: string;
  redemptionCode: string;
  couponCode: string;
  couponTitle: string;
  couponExpiryDate?: string;
  businessName: string;
  businessId: string;
  tags: string[];
}

/**
 * Get GHL claim webhook URL from integration configs
 */
async function getGHLClaimWebhookUrl(): Promise<string | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('integration_configs')
    .select('config_value')
    .eq('config_key', 'ghl_claim_webhook_url')
    .single();
  
  if (error || !data?.config_value) {
    console.error('GHL claim webhook URL not found in integration configs');
    return null;
  }
  
  return data.config_value;
}

export async function sendRedemptionToGHL(payload: GHLRedemptionPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const GHL_WEBHOOK_URL = await getGHLClaimWebhookUrl();
    
    if (!GHL_WEBHOOK_URL) {
      console.error('GHL_WEBHOOK_URL not configured in integration configs');
      return { success: false, error: 'GHL webhook URL not configured' };
    }
    
    const response = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        source: 'STL Business Guide',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL webhook failed:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    console.log('GHL webhook sent successfully for redemption:', payload.redemptionCode);
    return { success: true };
  } catch (error: any) {
    console.error('GHL webhook error:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to format redemption data for GHL
export function formatRedemptionForGHL(
  customerName: string,
  customerEmail: string,
  customerPhone: string | null,
  redemptionCode: string,
  coupon: { code: string; title: string; end_date?: string | null },
  business: { id: string; business_name: string }
): GHLRedemptionPayload {
  return {
    name: customerName,
    email: customerEmail,
    phone: customerPhone || undefined,
    redemptionCode,
    couponCode: coupon.code,
    couponTitle: coupon.title,
    couponExpiryDate: coupon.end_date || undefined,
    businessName: business.business_name,
    businessId: business.id,
    tags: ['conv | businesscouponredeemed'],
  };
}
