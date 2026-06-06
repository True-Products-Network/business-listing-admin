'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Save, Star } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'

interface Testimonial {
  id: string
  author_name: string
  author_title: string | null
  author_company: string | null
  content: string
  rating: number
  is_featured: boolean
}

export default function EditTestimonialPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const testimonialId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Testimonial>({
    id: '',
    author_name: '',
    author_title: '',
    author_company: '',
    content: '',
    rating: 5,
    is_featured: false,
  })

  useEffect(() => {
    fetchTestimonial()
  }, [])

  const fetchTestimonial = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('id', testimonialId)
        .single()

      if (error) throw error

      if (data) {
        setForm(data)
      }
    } catch (err: any) {
      console.error('Error fetching testimonial:', err)
      alert('Error loading testimonial: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.author_name.trim() || !form.content.trim()) {
      alert('Please fill in the author name and testimonial content')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/testimonials/${testimonialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: form.author_name,
          author_title: form.author_title || null,
          author_company: form.author_company || null,
          content: form.content,
          rating: form.rating,
          is_featured: form.is_featured,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update testimonial')
      }

      router.push('/admin/testimonials')
    } catch (err: any) {
      console.error('Error updating testimonial:', err)
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const renderStarInput = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setForm({ ...form, rating: star })}
            className="focus:outline-none"
          >
            <Star 
              className={`h-6 w-6 ${star <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
            />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Testimonial</h1>
          <p className="text-slate-600">Update testimonial details</p>
        </div>
        <Link href="/admin/testimonials">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Testimonials
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Testimonial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label htmlFor="author_name" className="text-sm font-medium block mb-2">Author Name *</label>
              <Input
                id="author_name"
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                placeholder="e.g., John Smith"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="author_title" className="text-sm font-medium block mb-2">Title/Position</label>
                <Input
                  id="author_title"
                  value={form.author_title || ''}
                  onChange={(e) => setForm({ ...form, author_title: e.target.value })}
                  placeholder="e.g., CEO"
                />
              </div>
              <div>
                <label htmlFor="author_company" className="text-sm font-medium block mb-2">Company</label>
                <Input
                  id="author_company"
                  value={form.author_company || ''}
                  onChange={(e) => setForm({ ...form, author_company: e.target.value })}
                  placeholder="e.g., Acme Inc"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Rating</label>
              <div className="mt-2">{renderStarInput()}</div>
            </div>

            <div>
              <label htmlFor="content" className="text-sm font-medium block mb-2">Testimonial Content *</label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="What did they say about your business?"
                rows={5}
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_featured"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="is_featured" className="text-sm font-medium">
                Feature on homepage (max 4)
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/admin/testimonials">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0"
              >
                {saving ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
