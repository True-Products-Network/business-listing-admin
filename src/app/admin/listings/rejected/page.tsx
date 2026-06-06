'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, Phone, Mail, Globe, CheckCircle, XCircle, Eye, Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function RejectedListingsPage() {
  const [rejectedListings, setRejectedListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchRejectedListings()
  }, [])

  const fetchRejectedListings = async () => {
    try {
      const { data, error } = await supabase
        .from('business_listings')
        .select(`
          id,
          listing_status,
          created_at,
          business_id,
          businesses:business_id (
            id,
            business_name,
            description_long,
            phone,
            email,
            website_url,
            slug
          )
        `)
        .eq('listing_status', 'rejected')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching rejected listings:', error)
        setError(error.message)
      } else {
        setRejectedListings(data || [])
      }
    } catch (err: any) {
      console.error('Exception:', err)
      setError(err.message)
    }
    setLoading(false)
  }

  const handleReapprove = async (listingId: string, businessId: string) => {
    try {
      // Call API route to approve listing (bypasses RLS with service role)
      const response = await fetch(`/api/admin/listings/${listingId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to re-approve listing')
      }

      fetchRejectedListings()
    } catch (err: any) {
      console.error('Error reapproving:', err)
      alert('Error reapproving: ' + err.message)
    }
  }

  const handleDelete = async (listingId: string, businessId: string, businessName: string) => {
    if (!businessId) return
    
    if (!confirm(`Are you sure you want to delete "${businessName}"?\n\nThis will permanently delete all data. This action cannot be undone.`)) {
      return
    }
    
    try {
      const response = await fetch('/api/admin/delete-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete business')
      }

      fetchRejectedListings()
      alert(`"${businessName}" has been deleted.`)
    } catch (err: any) {
      console.error('Error deleting:', err)
      alert('Error: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rejected Listings</h1>
          <p className="text-slate-600">View and manage rejected business submissions</p>
        </div>
        <Link href="/admin" className="inline-flex">
          <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {rejectedListings && rejectedListings.length > 0 ? (
        <div className="space-y-4">
          {rejectedListings.map((listing: any) => {
            const business = listing.businesses

            return (
              <Card key={listing.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <Building2 className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900">
                            {business?.business_name}
                          </h3>
                          <Badge className="mt-1 bg-red-100 text-red-800">Rejected</Badge>
                        </div>
                      </div>

                      <p className="text-slate-600 mt-3 line-clamp-2">
                        {business?.description_long || 'No description provided'}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-sm">
                        {business?.phone && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="h-4 w-4" />
                            <span>{business.phone}</span>
                          </div>
                        )}
                        {business?.email && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-4 w-4" />
                            <span>{business.email}</span>
                          </div>
                        )}
                        {business?.website_url && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Globe className="h-4 w-4" />
                            <span className="truncate">{business.website_url}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-4">
                        Submitted: {new Date(listing.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <Button 
                        size="sm" 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleReapprove(listing.id, business?.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Re-approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() => handleDelete(listing.id, business?.id, business?.business_name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No rejected listings</h3>
            <p className="text-slate-600 mt-1">All listings are either approved or pending</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
