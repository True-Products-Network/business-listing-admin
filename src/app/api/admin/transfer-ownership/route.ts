import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceClient();
    const body = await request.json();
    const { businessId, newOwnerEmail } = body;

    if (!businessId || !newOwnerEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Business ID and new owner email are required' 
      }, { status: 400 });
    }

    console.log('Admin ownership transfer request:', { businessId, newOwnerEmail });

    // Find the new owner by email
    const { data: newOwner, error: ownerError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', newOwnerEmail)
      .single();

    if (ownerError || !newOwner) {
      console.error('User not found:', ownerError);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found. They must have an account first.' 
      }, { status: 404 });
    }

    // Get current business data for logging
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, business_name, owner_profile_id, email')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      console.error('Business not found:', businessError);
      return NextResponse.json({ 
        success: false, 
        error: 'Business not found' 
      }, { status: 404 });
    }

    // Update the business ownership
    // The trigger now allows service role to bypass the ownership change restriction
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({
        owner_profile_id: newOwner.id,
        email: newOwnerEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (updateError) {
      console.error('Ownership transfer failed:', updateError);
      
      // Check if it's the ownership change trigger blocking us
      if (updateError.message.includes('Ownership cannot be changed directly')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Database trigger is still blocking ownership transfers. The migration may not have been applied correctly.' 
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: updateError.message 
      }, { status: 500 });
    }

    // Log the ownership transfer
    const { error: logError } = await supabaseAdmin
      .from('admin_activity_log')
      .insert({
        action_type: 'ownership_transfer',
        entity_type: 'business',
        entity_id: businessId,
        notes: `Ownership transferred from ${business.owner_profile_id || 'unassigned'} to ${newOwner.id} (${newOwnerEmail})`
      });

    if (logError) {
      console.error('Failed to log activity:', logError);
      // Don't fail the request if logging fails
    }

    console.log('Ownership transferred successfully to:', newOwner.email);
    
    return NextResponse.json({ 
      success: true,
      message: `Ownership transferred to ${newOwner.full_name || newOwner.email}`,
      businessId,
      newOwnerId: newOwner.id,
      newOwnerEmail: newOwner.email,
      newOwnerName: newOwner.full_name
    });

  } catch (error: any) {
    console.error('Error in ownership transfer API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}