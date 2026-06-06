import { createServiceClient } from '@/lib/supabase-service'
import { NextRequest, NextResponse } from 'next/server'

// Simple admin check using a secret key
const ADMIN_SECRET = process.env.ADMIN_API_SECRET || 'your-secret-key-change-this'

export async function POST(request: NextRequest) {
  try {
    // Get admin secret from header
    const adminSecret = request.headers.get('x-admin-secret')
    
    if (adminSecret && adminSecret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Invalid admin secret' }, { status: 403 })
    }

    const body = await request.json()
    const serviceClient = createServiceClient()
    
    // Get next display order
    const { data: existing, error: orderError } = await serviceClient
      .from('testimonials')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)

    if (orderError) {
      console.error('Order error:', orderError)
    }

    const nextOrder = (existing?.[0]?.display_order || 0) + 1

    const { error } = await serviceClient
      .from('testimonials')
      .insert({
        ...body,
        display_order: nextOrder
      })

    if (error) {
      console.error('Insert error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
