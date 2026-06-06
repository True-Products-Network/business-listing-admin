'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

export async function approveListing(listingId: string, businessId: string) {
  const supabase = await createClient()

  try {
    // Update listing status
    const { error: listingError } = await supabase
      .from('business_listings')
      .update({ listing_status: 'approved' })
      .eq('id', listingId)

    if (listingError) throw listingError

    // Update business status
    const { error: businessError } = await supabase
      .from('businesses')
      .update({ status: 'active' })
      .eq('id', businessId)

    if (businessError) throw businessError

    // Update submission status
    const { error: submissionError } = await supabase
      .from('listing_submissions')
      .update({ submission_status: 'approved' })
      .eq('business_id', businessId)

    if (submissionError) throw submissionError

    revalidatePath('/admin/listings/pending')
    revalidatePath('/admin')
    revalidatePath('/directory')

    return { success: true }
  } catch (error: any) {
    console.error('Error approving listing:', error)
    return { success: false, error: error.message }
  }
}

export async function rejectListing(listingId: string, businessId: string) {
  const supabase = await createClient()

  try {
    // Update listing status
    const { error: listingError } = await supabase
      .from('business_listings')
      .update({ listing_status: 'rejected' })
      .eq('id', listingId)

    if (listingError) throw listingError

    // Update submission status
    const { error: submissionError } = await supabase
      .from('listing_submissions')
      .update({ submission_status: 'rejected' })
      .eq('business_id', businessId)

    if (submissionError) throw submissionError

    revalidatePath('/admin/listings/pending')
    revalidatePath('/admin')

    return { success: true }
  } catch (error: any) {
    console.error('Error rejecting listing:', error)
    return { success: false, error: error.message }
  }
}

export async function ApproveButton({ listingId, businessId }: { listingId: string; businessId: string }) {
  return (
    <form action={async () => {
      'use server'
      await approveListing(listingId, businessId)
    }}>
      <Button type="submit" size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
        <CheckCircle className="h-4 w-4 mr-2" />
        Approve
      </Button>
    </form>
  )
}

export async function RejectButton({ listingId, businessId }: { listingId: string; businessId: string }) {
  return (
    <form action={async () => {
      'use server'
      await rejectListing(listingId, businessId)
    }}>
      <Button type="submit" variant="outline" size="sm" className="w-full border-red-200 text-red-600 hover:bg-red-50">
        <XCircle className="h-4 w-4 mr-2" />
        Reject
      </Button>
    </form>
  )
}
