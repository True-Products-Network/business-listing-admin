import { createServiceClient } from '@/lib/supabase-service'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const serviceClient = createServiceClient()

    const { error } = await serviceClient
      .from('faqs')
      .update({
        question: body.question,
        answer: body.answer,
        category: body.category,
        display_order: body.display_order,
        is_active: body.is_active,
        is_help_center: body.is_help_center,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating FAQ:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const serviceClient = createServiceClient()

    const { error } = await serviceClient
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
