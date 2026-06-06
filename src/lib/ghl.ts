/**
 * GoHighLevel (GHL) Webhook Integration for Listing Approvals
 * Sends new listing data to GHL when approved
 * Webhook URLs are stored in integration_configs table
 */

import { createClient } from '@/lib/supabase';

interface GHLListingPayload {
  fullName: string;
  email: string;
  phone?: string;
  businessName: string;
  planName: string;
  websiteUrl?: string;
  tags: string[];
  source: string;
}

/**
 * Get GHL webhook URL from integration configs
 */
async function getGHLWebhookUrl(): Promise<string | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('integration_configs')
    .select('config_value')
    .eq('config_key', 'ghl_webhook_url')
    .single();
  
  if (error || !data?.config_value) {
    console.error('GHL webhook URL not found in integration configs');
    return null;
  }
  
  return data.config_value;
}

/**
 * Send listing approval to GHL via webhook
 */
export async function sendListingToGHL(payload: GHLListingPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const GHL_WEBHOOK_URL = await getGHLWebhookUrl();
    
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
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL webhook failed:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    console.log('GHL webhook sent successfully for listing:', payload.businessName);
    return { success: true };
  } catch (error: any) {
    console.error('GHL webhook error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle listing approval - send to GHL CRM with "New Listing" tag
 */
export async function handleListingApprovalForGHL(
  email: string,
  businessName: string,
  contactName: string,
  phone: string,
  planName: string,
  websiteUrl?: string
) {
  // Send to GHL via webhook with full name
  const result = await sendListingToGHL({
    fullName: contactName,
    email,
    phone,
    businessName,
    planName,
    websiteUrl,
    tags: ['new listing', 'stl business guide', planName.toLowerCase()],
    source: 'stl business guide - listing approved',
  });

  if (result.success) {
    console.log(`✅ NEW LISTING sent to GHL: ${email} - ${businessName}`);
  } else {
    console.error(`❌ Failed to send new listing to GHL: ${result.error}`);
  }

  return result;
}
