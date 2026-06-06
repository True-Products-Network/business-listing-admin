'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
 Loader2,
 ArrowLeft,
 Plus,
 Star,
 Edit,
 Trash2,
 Quote,
 GripVertical
} from 'lucide-react'
import Link from 'next/link'
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"

interface Testimonial {
 id: string
 author_name: string
 author_title: string | null
 author_company: string | null
 content: string
 rating: number
 is_featured: boolean
 display_order: number
 created_at: string
}

export default function TestimonialsPage() {
 const [testimonials, setTestimonials] = useState<Testimonial[]>([])
 const [loading, setLoading] = useState(true)
 const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
 const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null)
 const [deleting, setDeleting] = useState(false)
 const supabase = createClient()

 useEffect(() => {
 fetchTestimonials()
 }, [])

 const fetchTestimonials = async () => {
 try {
 const { data, error } = await supabase
 .from('testimonials')
 .select('*')
 .order('is_featured', { ascending: false })
 .order('display_order', { ascending: true })
 .order('created_at', { ascending: false })

 if (error) {
 console.error('Error fetching testimonials:', error)
 // If table doesn't exist, show empty state
 if (error.code === '42P01') {
 setTestimonials([])
 setLoading(false)
 return
 }
 } else {
 setTestimonials(data || [])
 }
 } catch (err: any) {
 console.error('Exception:', err)
 }
 setLoading(false)
 }

 const toggleFeatured = async (testimonial: Testimonial) => {
 try {
 // Count current featured testimonials
 const featuredCount = testimonials.filter(t => t.is_featured).length

 // If trying to feature and already have 4 featured, prevent it
 if (!testimonial.is_featured && featuredCount >= 4) {
 alert('You can only have 4 featured testimonials on the homepage. Please unfeature one first.')
 return
 }

 const { error } = await supabase
 .from('testimonials')
 .update({ is_featured: !testimonial.is_featured })
 .eq('id', testimonial.id)

 if (error) throw error

 fetchTestimonials()
 } catch (err: any) {
 console.error('Error updating testimonial:', err)
 alert('Error: ' + err.message)
 }
 }

 const openDeleteDialog = (testimonial: Testimonial) => {
 setTestimonialToDelete(testimonial)
 setDeleteDialogOpen(true)
 }

 const handleDelete = async () => {
 if (!testimonialToDelete) return

 setDeleting(true)
 try {
 const { error } = await supabase
 .from('testimonials')
 .delete()
 .eq('id', testimonialToDelete.id)

 if (error) throw error

 setDeleteDialogOpen(false)
 setTestimonialToDelete(null)
 fetchTestimonials()
 } catch (err: any) {
 console.error('Error deleting:', err)
 alert('Error deleting: ' + err.message)
 } finally {
 setDeleting(false)
 }
 }

 const renderStars = (rating: number) => {
 return Array.from({ length: 5 }).map((_, i) => (
 <Star
 key={i}
 className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
 />
 ))
 }

 const featuredCount = testimonials.filter(t => t.is_featured).length

 if (loading) {
 return (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
 </div>
 )
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-slate-900">Testimonials</h1>
 <p className="text-slate-600">
 Manage customer testimonials and success stories
 {featuredCount > 0 && (
 <span className="ml-2 text-sm">
 ({featuredCount}/4 featured on homepage)
 </span>
 )}
 </p>
 </div>
 <div className="flex gap-2">
 <Link href="/admin" className="inline-flex">
 <Button variant="outline">
 <ArrowLeft className="h-4 w-4 mr-2" />
 Back
 </Button>
 </Link>
 <Link href="/admin/testimonials/new">
 <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
 <Plus className="h-4 w-4 mr-2" />
 Add Testimonial
 </Button>
 </Link>
 </div>
 </div>

 {/* Featured Counter */}
 <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
 <CardContent className="p-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
 <div>
 <p className="font-medium text-slate-900">Homepage Featured Testimonials</p>
 <p className="text-sm text-slate-600">
 {featuredCount === 0
 ? 'No testimonials featured on homepage yet'
 : `${featuredCount} of 4 testimonials featured on homepage`
 }
 </p>
 </div>
 </div>
 <div className="flex gap-1">
 {[1, 2, 3, 4].map((slot) => (
 <div
 key={slot}
 className={`w-8 h-8 rounded-lg flex items-center justify-center ${
 slot <= featuredCount
 ? 'bg-amber-500 text-white'
 : 'bg-slate-200 text-slate-400'
 }`}
 >
 <Star className="h-4 w-4" />
 </div>
 ))}
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Testimonials List */}
 {testimonials.length > 0 ? (
 <div className="space-y-4">
 {testimonials.map((testimonial) => (
 <Card key={testimonial.id} className={testimonial.is_featured ? 'border-amber-300 shadow-md' : ''}>
 <CardContent className="p-6">
 <div className="flex flex-col md:flex-row md:items-start gap-4">
 {/* Drag Handle */}
 <div className="hidden md:flex items-center text-slate-400 cursor-move">
 <GripVertical className="h-5 w-5" />
 </div>

 {/* Content */}
 <div className="flex-1">
 <div className="flex items-start gap-3 mb-3">
 <Quote className="h-5 w-5 text-slate-400 flex-shrink-0 mt-1" />
 <p className="text-slate-700 italic">{testimonial.content}</p>
 </div>

 <div className="flex items-center gap-2 mb-3">
 {renderStars(testimonial.rating)}
 </div>

 <div className="flex items-center gap-2">
 <p className="font-medium text-slate-900">{testimonial.author_name}</p>
 {(testimonial.author_title || testimonial.author_company) && (
 <p className="text-sm text-slate-500">
 {testimonial.author_title}
 {testimonial.author_title && testimonial.author_company && ', '}
 {testimonial.author_company}
 </p>
 )}
 </div>
 </div>

 {/* Actions */}
 <div className="flex md:flex-col gap-2">
 <Button
 variant={testimonial.is_featured ? 'default' : 'outline'}
 size="sm"
 onClick={() => toggleFeatured(testimonial)}
 className={testimonial.is_featured ? 'bg-amber-500 hover:bg-amber-600' : ''}
 >
 <Star className={`h-4 w-4 mr-2 ${testimonial.is_featured ? 'fill-white' : ''}`} />
 {testimonial.is_featured ? 'Featured' : 'Feature'}
 </Button>
 <Link href={`/admin/testimonials/edit/${testimonial.id}`}>
 <Button variant="outline" size="sm" className="w-full">
 <Edit className="h-4 w-4 mr-2" />
 Edit
 </Button>
 </Link>
 <Button
 variant="outline"
 size="sm"
 className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
 onClick={() => openDeleteDialog(testimonial)}
 >
 <Trash2 className="h-4 w-4 mr-2" />
 Delete
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <Card>
 <CardContent className="p-12 text-center">
 <Quote className="h-12 w-12 text-slate-300 mx-auto mb-4" />
 <h3 className="text-lg font-medium text-slate-900">No testimonials yet</h3>
 <p className="text-slate-600 mt-1 mb-4">Add your first customer testimonial to showcase on the platform</p>
 <Link href="/admin/testimonials/new">
 <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
 <Plus className="h-4 w-4 mr-2" />
 Add Testimonial
 </Button>
 </Link>
 </CardContent>
 </Card>
 )}

 {/* Delete Confirmation Dialog */}
 <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-red-600">
 <Trash2 className="h-5 w-5" />
 Delete Testimonial
 </DialogTitle>
 <DialogDescription className="pt-4">
 Are you sure you want to delete this testimonial from <strong>{testimonialToDelete?.author_name}</strong>?
 <p className="mt-4 text-red-600 font-medium">This action cannot be undone.</p>
 </DialogDescription>
 </DialogHeader>
 <DialogFooter className="gap-2">
 <Button
 variant="outline"
 onClick={() => setDeleteDialogOpen(false)}
 disabled={deleting}
 >
 Cancel
 </Button>
 <Button
 onClick={handleDelete}
 disabled={deleting}
 className="bg-red-600 hover:bg-red-700 text-white"
 >
 {deleting ? (
 <>
 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
 Deleting...
 </>
 ) : (
 <>
 <Trash2 className="h-4 w-4 mr-2" />
 Delete
 </>
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 )
}
