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

    // Fetch location data for this business
    console.log('Fetching location for business:', businessId);
    const { data: locationData, error: locationError } = await serviceClient
      .from('business_locations')
      .select('city, state, is_primary')
      .eq('business_id', businessId);

    console.log('Location query result:', { locationData, locationError });

    // Find primary location or any location
    const primaryLocation = locationData?.find((loc: any) => loc.is_primary) || locationData?.[0];
    console.log('Selected location:', primaryLocation);

    // Update business status and location
    const businessUpdate: any = { status: 'active' };
    if (primaryLocation?.city && primaryLocation?.state) {
      businessUpdate.location = `${primaryLocation.city}, ${primaryLocation.state}`;
      console.log('Setting location to:', businessUpdate.location);
    } else {
      console.log('No valid location found');
    }

    const { error: businessError } = await serviceClient
      .from('businesses')
      .update(businessUpdate)
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
