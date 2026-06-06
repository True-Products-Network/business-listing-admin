import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceClient();
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Business ID is required' 
      }, { status: 400 });
    }

    console.log('Admin delete request for business:', businessId);

    // Delete related records in order (respecting foreign key constraints)
    
    // 1. Delete analytics
    const { error: analyticsError } = await supabaseAdmin
      .from('business_analytics')
      .delete()
      .eq('business_id', businessId);
    if (analyticsError) console.error('Analytics delete error:', analyticsError);
    else console.log('Deleted analytics');

    // 2. Delete coupon redemptions (first get coupon IDs)
    const { data: coupons } = await supabaseAdmin
      .from('coupons')
      .select('id')
      .eq('business_id', businessId);
    
    if (coupons && coupons.length > 0) {
      const couponIds = coupons.map(c => c.id);
      const { error: redemptionError } = await supabaseAdmin
        .from('coupon_redemptions')
        .delete()
        .in('coupon_id', couponIds);
      if (redemptionError) console.error('Redemption delete error:', redemptionError);
      else console.log('Deleted redemptions');
    }

    // 3. Delete coupons
    const { error: couponsError } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('business_id', businessId);
    if (couponsError) console.error('Coupons delete error:', couponsError);
    else console.log('Deleted coupons');

    // 4. Delete images
    const { error: imagesError } = await supabaseAdmin
      .from('business_images')
      .delete()
      .eq('business_id', businessId);
    if (imagesError) console.error('Images delete error:', imagesError);
    else console.log('Deleted images');

    // 5. Delete business listings
    const { error: listingError } = await supabaseAdmin
      .from('business_listings')
      .delete()
      .eq('business_id', businessId);
    if (listingError) console.error('Listing delete error:', listingError);
    else console.log('Deleted business_listings');

    // 6. Delete categories
    const { error: categoriesError } = await supabaseAdmin
      .from('business_categories')
      .delete()
      .eq('business_id', businessId);
    if (categoriesError) console.error('Categories delete error:', categoriesError);
    else console.log('Deleted categories');

    // 7. Delete locations
    const { error: locationsError } = await supabaseAdmin
      .from('business_locations')
      .delete()
      .eq('business_id', businessId);
    if (locationsError) console.error('Locations delete error:', locationsError);
    else console.log('Deleted locations');

    // 8. Delete fees
    const { error: feesError } = await supabaseAdmin
      .from('business_fees')
      .delete()
      .eq('business_id', businessId);
    if (feesError) console.error('Fees delete error:', feesError);
    else console.log('Deleted fees');

    // 9. Finally delete the business
    console.log('Deleting business record...');
    const { error: deleteError } = await supabaseAdmin
      .from('businesses')
      .delete()
      .eq('id', businessId);

    if (deleteError) {
      console.error('Business delete error:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: deleteError.message 
      }, { status: 500 });
    }

    console.log('Business deleted successfully');
    return NextResponse.json({ 
      success: true 
    });

  } catch (error: any) {
    console.error('Error in admin delete API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
