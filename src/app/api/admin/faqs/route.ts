import { createServiceClient } from '@/lib/supabase-service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const serviceClient = createServiceClient()

    const { error } = await serviceClient
      .from('faqs')
      .insert({
        question: body.question,
        answer: body.answer,
        category: body.category,
        display_order: body.display_order || 0,
        is_active: body.is_active ?? true
      })

    if (error) {
      console.error('Insert error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error creating FAQ:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
