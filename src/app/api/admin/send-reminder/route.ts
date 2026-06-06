import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    const { 
      subscriptionId, 
      businessId, 
      email, 
      businessName, 
      message, 
      amountDue, 
      daysPastDue,
      reminderType = 'general'
    } = body;

    // Validate required fields
    if (!subscriptionId || !email || !businessName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get GHL webhook URL from integration configs
    const { data: webhookConfig } = await supabase
      .from('integration_configs')
      .select('config_value')
      .eq('config_key', 'ghl_past_due_webhook_url')
      .single();

    const ghlWebhookUrl = webhookConfig?.config_value;

    // Prepare the webhook payload for GHL
    const webhookPayload = {
      event: 'payment_reminder',
      reminderType: reminderType,
      subscriptionId,
      businessId,
      contact: {
        email,
        businessName,
      },
      payment: {
        amountDue,
        daysPastDue,
        currency: 'USD',
      },
      message,
      timestamp: new Date().toISOString(),
    };

    // Send webhook to GHL if URL is configured
    if (ghlWebhookUrl) {
      try {
        const webhookResponse = await fetch(ghlWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
          console.error('GHL webhook failed:', await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error('Error sending GHL webhook:', webhookError);
      }
    }

    // Log the reminder in admin activity log
    const { error: logError } = await supabase
      .from('admin_activity_log')
      .insert({
        action_type: 'payment_reminder_sent',
        entity_type: 'subscription',
        entity_id: subscriptionId,
        notes: `Payment reminder (${reminderType}) sent to ${businessName} (${email}). Amount due: $${amountDue}, Days past due: ${daysPastDue}`,
      });

    if (logError) {
      console.error('Error logging reminder:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      sentTo: email,
      reminderType,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Send reminder API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
