import { createServiceClient } from '@/lib/supabase-service'
import { NextRequest, NextResponse } from 'next/server'

// Simple admin check using a secret key
const ADMIN_SECRET = process.env.ADMIN_API_SECRET || 'your-secret-key-change-this'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get admin secret from header
    const adminSecret = request.headers.get('x-admin-secret')
    
    if (adminSecret && adminSecret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Invalid admin secret' }, { status: 403 })
    }

    const body = await request.json()
    const serviceClient = createServiceClient()
    
    const { error } = await serviceClient
      .from('testimonials')
      .update(body)
      .eq('id', id)

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating testimonial:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get admin secret from header
    const adminSecret = request.headers.get('x-admin-secret')
    
    if (adminSecret && adminSecret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Invalid admin secret' }, { status: 403 })
    }

    const serviceClient = createServiceClient()

    const { error } = await serviceClient
      .from('testimonials')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting testimonial:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
