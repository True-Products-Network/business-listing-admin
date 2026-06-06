import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const body = await request.json();
    const { businessId } = body;

    if (!listingId || !businessId) {
      return NextResponse.json(
        { error: 'Listing ID and Business ID are required' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Update listing status
    const { error: listingError } = await serviceClient
      .from('business_listings')
      .update({ listing_status: 'approved' })
      .eq('id', listingId);

    if (listingError) {
      console.error('Error updating listing:', listingError);
      return NextResponse.json(
        { error: listingError.message },
        { status: 500 }
      );
    }

    // Update business status
    const { error: businessError } = await serviceClient
      .from('businesses')
      .update({ status: 'active' })
      .eq('id', businessId);

    if (businessError) {
      console.error('Error updating business:', businessError);
      return NextResponse.json(
        { error: businessError.message },
        { status: 500 }
      );
    }

    // Update submission status if exists
    const { error: submissionError } = await serviceClient
      .from('listing_submissions')
      .update({ submission_status: 'approved' })
      .eq('business_id', businessId);

    if (submissionError) {
      console.error('Error updating submission:', submissionError);
      // Don't fail if submission doesn't exist
    }

    return NextResponse.json({
      success: true,
      message: 'Listing approved successfully'
    });
  } catch (error: any) {
    console.error('Approve API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
