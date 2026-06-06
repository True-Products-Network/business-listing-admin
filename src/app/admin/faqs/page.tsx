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
  Edit, 
  Trash2,
  HelpCircle,
  GripVertical,
  Eye,
  EyeOff
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

interface FAQ {
  id: string
  question: string
  answer: string
  category: string | null
  display_order: number
  is_active: boolean
  is_help_center: boolean
  created_at: string
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('is_help_center', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching FAQs:', error)
        if (error.code === '42P01') {
          setFaqs([])
          setLoading(false)
          return
        }
      } else {
        setFaqs(data || [])
      }
    } catch (err: any) {
      console.error('Exception:', err)
    }
    setLoading(false)
  }

  const toggleHelpCenter = async (faq: FAQ) => {
    try {
      const helpCenterCount = faqs.filter(f => f.is_help_center).length
      
      if (!faq.is_help_center && helpCenterCount >= 10) {
        alert('You can only have 10 FAQs in the Help Center. Please remove one first.')
        return
      }

      const { error } = await supabase
        .from('faqs')
        .update({ is_help_center: !faq.is_help_center })
        .eq('id', faq.id)

      if (error) throw error

      fetchFAQs()
    } catch (err: any) {
      console.error('Error updating FAQ:', err)
      alert('Error: ' + err.message)
    }
  }

  const toggleActive = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_active: !faq.is_active })
        .eq('id', faq.id)

      if (error) throw error

      fetchFAQs()
    } catch (err: any) {
      console.error('Error updating FAQ:', err)
      alert('Error: ' + err.message)
    }
  }

  const openDeleteDialog = (faq: FAQ) => {
    setFaqToDelete(faq)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!faqToDelete) return
    
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', faqToDelete.id)

      if (error) throw error

      setDeleteDialogOpen(false)
      setFaqToDelete(null)
      fetchFAQs()
    } catch (err: any) {
      console.error('Error deleting:', err)
      alert('Error deleting: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const helpCenterCount = faqs.filter(f => f.is_help_center).length

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
          <h1 className="text-2xl font-bold text-slate-900">FAQs</h1>
          <p className="text-slate-600">
            Manage frequently asked questions
            {helpCenterCount > 0 && (
              <span className="ml-2 text-sm">
                ({helpCenterCount}/10 in Help Center)
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
          <Link href="/admin/faqs/new">
            <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </Link>
        </div>
      </div>

      {/* Help Center Counter */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-slate-900">Help Center FAQs</p>
                <p className="text-sm text-slate-600">
                  {helpCenterCount === 0 
                    ? 'No FAQs in Help Center yet'
                    : `${helpCenterCount} of 10 FAQs in STL Business Guide Help Center`
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={i}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                    i < helpCenterCount 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs List */}
      {faqs.length > 0 ? (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.id} className={faq.is_help_center ? 'border-blue-300 shadow-md' : ''}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Drag Handle */}
                  <div className="hidden md:flex items-center text-slate-400 cursor-move">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-slate-900">{faq.question}</h3>
                      {faq.category && (
                        <Badge variant="outline" className="text-xs">
                          {faq.category}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-600 line-clamp-2">{faq.answer}</p>

                    <div className="flex items-center gap-2 mt-3">
                      <Badge className={faq.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}>
                        {faq.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {faq.is_help_center && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Help Center
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <Button
                      variant={faq.is_help_center ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleHelpCenter(faq)}
                      className={faq.is_help_center ? 'bg-blue-500 hover:bg-blue-600' : ''}
                    >
                      <HelpCircle className={`h-4 w-4 mr-2 ${faq.is_help_center ? 'text-white' : ''}`} />
                      {faq.is_help_center ? 'In Help Center' : 'Add to Help Center'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(faq)}
                    >
                      {faq.is_active ? (
                        <><EyeOff className="h-4 w-4 mr-2" /> Deactivate</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-2" /> Activate</>
                      )}
                    </Button>
                    <Link href={`/admin/faqs/edit/${faq.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                      onClick={() => openDeleteDialog(faq)}
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
            <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No FAQs yet</h3>
            <p className="text-slate-600 mt-1 mb-4">Add your first FAQ to help users find answers</p>
            <Link href="/admin/faqs/new">
              <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
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
              Delete FAQ
            </DialogTitle>
            <DialogDescription className="pt-4">
              Are you sure you want to delete this FAQ?
              <p className="font-medium text-slate-900 mt-2">{faqToDelete?.question}</p>
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