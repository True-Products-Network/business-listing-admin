'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2, MapPin, Phone, Mail, Globe, CheckCircle, XCircle, Eye, Loader2, ArrowLeft, Crown, Zap, Star, Trash2, Search } from 'lucide-react'
import Link from 'next/link'
import { handleListingApprovalForGHL } from '@/lib/ghl'

interface PendingListing {
  id: string
  listing_status: string
  created_at: string
  business_id: string
  plan_id: string | null
  plan_key: string
  plan_name: string
  monthly_price: number
  businesses: {
    id: string
    business_name: string
    description_long: string
    phone: string
    email: string
    website_url: string
    slug: string
  }
}

export default function PendingListingsPage() {
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([])
  const [filteredListings, setFilteredListings] = useState<PendingListing[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPendingListings()
  }, [])

  const fetchPendingListings = async () => {
    try {
      // Get pending listings with plan details
      const { data, error } = await supabase
        .from('business_listings')
        .select(`
          id,
          listing_status,
          created_at,
          business_id,
          plan_id,
          listing_plans:plan_id (
            plan_key,
            plan_name,
            monthly_price
          ),
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
        .eq('listing_status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending listings:', error)
        setError(error.message)
      } else {
        // Transform data to include plan info at top level
        const transformed = data?.map((item: any) => ({
          ...item,
          plan_key: item.listing_plans?.plan_key || 'free',
          plan_name: item.listing_plans?.plan_name || 'Free Listing',
          monthly_price: item.listing_plans?.monthly_price || 0
        })) || []
        
        // Sort by plan priority: VIP first, then Premium, then Free
        const sorted = transformed.sort((a: PendingListing, b: PendingListing) => {
          const priority = { vip: 3, premium: 2, free: 1 }
          return (priority[b.plan_key as keyof typeof priority] || 0) - (priority[a.plan_key as keyof typeof priority] || 0)
        })
        
        setPendingListings(sorted)
        setFilteredListings(sorted)
      }
    } catch (err: any) {
      console.error('Exception:', err)
      setError(err.message)
    }
    setLoading(false)
  }

  // Filter listings based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredListings(pendingListings)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = pendingListings.filter(listing => {
      const business = listing.businesses
      return (
        business?.business_name.toLowerCase().includes(query) ||
        business?.email.toLowerCase().includes(query) ||
        business?.phone?.toLowerCase().includes(query) ||
        listing.plan_name.toLowerCase().includes(query)
      )
    })
    setFilteredListings(filtered)
  }, [searchQuery, pendingListings])

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case 'vip':
        return <Crown className="h-4 w-4" />
      case 'premium':
        return <Zap className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  const getPlanBadgeColor = (planKey: string) => {
    switch (planKey) {
      case 'vip':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const handleApprove = async (listingId: string, businessId: string, business: any, planName: string) => {
    try {
      // Call API route to approve listing (bypasses RLS with service role)
      const response = await fetch(`/api/admin/listings/${listingId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to approve listing')
      }

      // Send to GHL CRM
      try {
        await handleListingApprovalForGHL(
          business?.email || '',
          business?.business_name || '',
          business?.contact_name || business?.business_name || '',
          business?.phone || '',
          planName,
          business?.website_url || ''
        );
      } catch (ghlError) {
        console.error('GHL integration error:', ghlError);
        // Don't fail the approval if GHL fails
      }

      // Refresh the list
      fetchPendingListings()
    } catch (err: any) {
      console.error('Error approving:', err)
      alert('Error approving: ' + err.message)
    }
  }

  const handleReject = async (listingId: string, businessId: string) => {
    try {
      // Call API route to reject listing (bypasses RLS with service role)
      const response = await fetch(`/api/admin/listings/${listingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to reject listing')
      }

      // Refresh the list
      fetchPendingListings()
    } catch (err: any) {
      console.error('Error rejecting:', err)
      alert('Error rejecting: ' + err.message)
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

      fetchPendingListings()
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

  // Group listings by plan for display
  const vipListings = filteredListings.filter(l => l.plan_key === 'vip')
  const premiumListings = filteredListings.filter(l => l.plan_key === 'premium')
  const freeListings = filteredListings.filter(l => l.plan_key === 'free' || !l.plan_key)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Listings ({filteredListings.length}{filteredListings.length !== pendingListings.length ? ` of ${pendingListings.length}` : ''})</h1>
          <p className="text-slate-600">Review and approve new business submissions</p>
        </div>
        <Link href="/admin" className="inline-flex">
          <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by business name, email, phone, or plan..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold text-indigo-900">{vipListings.length}</p>
                <p className="text-sm text-indigo-700">VIP Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{premiumListings.length}</p>
                <p className="text-sm text-purple-700">Premium Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{freeListings.length}</p>
                <p className="text-sm text-slate-700">Free Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredListings && filteredListings.length > 0 ? (
        <div className="space-y-4">
          {filteredListings.map((listing: PendingListing) => {
            const business = listing.businesses

            return (
              <Card key={listing.id} className={listing.plan_key === 'vip' ? 'border-indigo-300 shadow-md' : listing.plan_key === 'premium' ? 'border-purple-300' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Business Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-slate-900">
                              {business?.business_name}
                            </h3>
                            <Badge className={getPlanBadgeColor(listing.plan_key)}>
                              <span className="flex items-center gap-1">
                                {getPlanIcon(listing.plan_key)}
                                {listing.plan_name}
                              </span>
                            </Badge>
                            <Badge className="mt-1 bg-amber-100 text-amber-800">Pending</Badge>
                          </div>
                          {listing.monthly_price > 0 && (
                            <p className="text-sm font-medium text-emerald-600 mt-1">
                              ${listing.monthly_price}/month
                            </p>
                          )}
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

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => alert(`Business: ${business?.business_name}\nPlan: ${listing.plan_name}\n\nDescription: ${business?.description_long || 'No description'}\n\nPhone: ${business?.phone || 'N/A'}\nEmail: ${business?.email || 'N/A'}\n\nNote: Preview only shows approved listings`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApprove(listing.id, business?.id, business, listing.plan_name)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(listing.id, business?.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
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
            <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
            <p className="text-slate-600 mt-1">No pending listings to review</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
