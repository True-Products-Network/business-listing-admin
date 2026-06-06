'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Building2, MapPin, CheckCircle, XCircle, Star, Crown, Loader2, Circle, ArrowLeft, Trash2, Edit, Eye, ExternalLink, DollarSign, Tag, Plus, X, Users } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Listing {
  id: string
  listing_id: string
  business_name: string
  email: string
  phone: string
  description_long: string
  logo_url: string
  city: string
  state: string
  address_line_1: string
  address_line_2: string
  zip_code: string
  contact_name?: string
  website_url: string
  slug: string
  plan_name: string
  plan_id: string | null
  plan_key: string
  listing_status: string
  end_date: string | null
  is_paid: boolean
  categories?: string[]
  owner_profile_id?: string | null
  owner_email?: string | null
  owner_name?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function ApprovedListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [ownerDialogOpen, setOwnerDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [saving, setSaving] = useState(false)
  const [newOwnerEmail, setNewOwnerEmail] = useState('')
  const supabase = createClient()

  const [editForm, setEditForm] = useState({
    business_name: '',
    description_long: '',
    phone: '',
    email: '',
    contact_name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    website_url: '',
    end_date: '',
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categorySelectKey, setCategorySelectKey] = useState<number>(0)

  useEffect(() => {
    fetchListings()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }
      setCategories(data || [])
    } catch (err) {
      console.error('Exception fetching categories:', err)
    }
  }

  const fetchListings = async () => {
    try {
      const { data: listingData, error: listingError } = await supabase
        .from('business_listings')
        .select('id, business_id, plan_id, listing_status, end_date')
        .in('listing_status', ['approved', 'active'])
        .order('created_at', { ascending: false })

      if (listingError) {
        console.error('Error fetching listings:', listingError)
        setError(listingError.message)
        setLoading(false)
        return
      }

      if (!listingData || listingData.length === 0) {
        setListings([])
        setLoading(false)
        return
      }

      const businessIds = listingData.map((item: any) => item.business_id)

      const { data: businessesData, error: bizError } = await supabase
        .from('businesses')
        .select('id, business_name, email, phone, description_long, logo_url, website_url, slug, owner_profile_id')
        .in('id', businessIds)

      if (bizError) {
        console.error('Error fetching businesses:', bizError)
        setError(bizError.message)
        setLoading(false)
        return
      }

      // Fetch locations - use distinct to avoid duplicates
      const { data: locationsData, error: locError } = await supabase
        .from('business_locations')
        .select('id, business_id, city, state, address_line_1, address_line_2, zip_code, is_primary, created_at')
        .in('business_id', businessIds)
        .eq('is_primary', true)
        .order('created_at', { ascending: false })

      if (locError) {
        console.error('Error fetching locations:', locError)
      }

      // Remove duplicate locations (keep only the most recent for each business)
      const uniqueLocations: any[] = locationsData ? 
        Object.values(
          locationsData.reduce((acc: Record<string, any>, loc: any) => {
            if (!acc[loc.business_id]) {
              acc[loc.business_id] = loc
            }
            return acc
          }, {})
        ) : []

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('listing_plans')
        .select('id, plan_name, plan_key')

      if (plansError) {
        console.error('Error fetching plans:', plansError)
      }

      // Fetch categories for all businesses
      const { data: businessCategoriesData, error: catError } = await supabase
        .from('business_categories')
        .select('business_id, category_id, categories(name)')
        .in('business_id', businessIds)

      if (catError) {
        console.error('Error fetching business categories:', catError)
      }

      // Fetch owner info for businesses with owners
      const ownerIds = businessesData
        ?.filter((b: any) => b.owner_profile_id)
        .map((b: any) => b.owner_profile_id) || []
      
      let ownersData: any[] = []
      if (ownerIds.length > 0) {
        const { data: owners, error: ownersError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', ownerIds)
        
        if (!ownersError && owners) {
          ownersData = owners
        }
      }

      // Find the free plan for fallback
      const freePlan = plansData?.find((p: any) => p.plan_key === 'free')

      // Combine data
      const combined = listingData.map((item: any) => {
        const biz = businessesData?.find((b: any) => b.id === item.business_id)
        const loc = uniqueLocations?.find((l: any) => l.business_id === item.business_id)
        const plan = plansData?.find((p: any) => p.id === item.plan_id)
        const owner = ownersData?.find((o: any) => o.id === biz?.owner_profile_id)
        const bizCategories = businessCategoriesData
          ?.filter((bc: any) => bc.business_id === item.business_id)
          .map((bc: any) => bc.categories?.name)
          .filter(Boolean) || []

        return {
          listing_id: item.id,
          id: item.business_id,
          business_name: biz?.business_name || 'Unknown',
          email: biz?.email || '',
          phone: biz?.phone || '',
          description_long: biz?.description_long || '',
          logo_url: biz?.logo_url || '',
          website_url: biz?.website_url || '',
          slug: biz?.slug || '',
          city: loc?.city || '',
          state: loc?.state || '',
          address_line_1: loc?.address_line_1 || '',
          address_line_2: loc?.address_line_2 || '',
          zip_code: loc?.zip_code || '',
          plan_name: plan?.plan_name || freePlan?.plan_name || 'Free Listing',
          plan_id: item.plan_id,
          plan_key: plan?.plan_key || 'free',
          listing_status: item.listing_status,
          end_date: item.end_date,
          is_paid: !!item.plan_id && item.listing_status === 'active',
          categories: bizCategories,
          owner_profile_id: biz?.owner_profile_id,
          owner_email: owner?.email,
          owner_name: owner?.full_name,
        }
      })

      setListings(combined)
    } catch (err: any) {
      console.error('Exception fetching listings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openViewDialog = (listing: Listing) => {
    setSelectedListing(listing)
    setViewDialogOpen(true)
  }

  const openEditDialog = async (listing: Listing) => {
    setSelectedListing(listing)
    setEditForm({
      business_name: listing.business_name || '',
      description_long: listing.description_long || '',
      phone: listing.phone || '',
      email: listing.email || '',
      contact_name: listing.contact_name || '',
      address_line_1: listing.address_line_1 || '',
      address_line_2: listing.address_line_2 || '',
      city: listing.city || '',
      state: listing.state || '',
      zip_code: listing.zip_code || '',
      website_url: listing.website_url || '',
      end_date: listing.end_date ? listing.end_date.split('T')[0] : '',
    })
    
    // Fetch current categories for this business
    const { data: bizCats } = await supabase
      .from('business_categories')
      .select('category_id')
      .eq('business_id', listing.id)
    
    setSelectedCategories(bizCats?.map((bc: any) => bc.category_id) || [])
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedListing) return
    
    setSaving(true)
    try {
      console.log('Saving business:', selectedListing.id)
      console.log('Form data:', editForm)
      console.log('Address fields:', {
        address_line_1: editForm.address_line_1,
        address_line_2: editForm.address_line_2,
        city: editForm.city,
        state: editForm.state,
        zip_code: editForm.zip_code,
      })

      // Update business
      const { error: bizError } = await supabase
        .from('businesses')
        .update({
          business_name: editForm.business_name,
          description_long: editForm.description_long,
          phone: editForm.phone,
          email: editForm.email,
          website_url: editForm.website_url,
        })
        .eq('id', selectedListing.id)

      if (bizError) {
        console.error('Business update error:', bizError)
        throw bizError
      }
      console.log('Business updated successfully')

      // Update or insert location
      const { data: existingLoc } = await supabase
        .from('business_locations')
        .select('id')
        .eq('business_id', selectedListing.id)
        .eq('is_primary', true)
        .single()

      if (existingLoc) {
        // Update existing location
        const { error: locError } = await supabase
          .from('business_locations')
          .update({
            address_line_1: editForm.address_line_1,
            address_line_2: editForm.address_line_2,
            city: editForm.city,
            state: editForm.state,
            zip_code: editForm.zip_code,
          })
          .eq('id', existingLoc.id)

        if (locError) {
          console.error('Location update error:', locError)
          throw locError
        }
        console.log('Location updated successfully')
      } else {
        // Insert new primary location
        const { error: locError } = await supabase
          .from('business_locations')
          .insert({
            business_id: selectedListing.id,
            address_line_1: editForm.address_line_1,
            address_line_2: editForm.address_line_2,
            city: editForm.city,
            state: editForm.state,
            zip_code: editForm.zip_code,
            is_primary: true,
          })

        if (locError) {
          console.error('Location insert error:', locError)
          throw locError
        }
        console.log('Location inserted successfully')
      }

      // Update listing expiry date
      const { error: listingError } = await supabase
        .from('business_listings')
        .update({
          end_date: editForm.end_date || null,
        })
        .eq('id', selectedListing.listing_id)

      if (listingError) {
        console.error('Listing update error:', listingError)
        throw listingError
      }
      console.log('Listing updated successfully')

      // Update categories - first delete existing
      const { error: deleteCatError } = await supabase
        .from('business_categories')
        .delete()
        .eq('business_id', selectedListing.id)

      if (deleteCatError) {
        console.error('Category delete error:', deleteCatError)
        throw deleteCatError
      }

      // Then insert new categories
      if (selectedCategories.length > 0) {
        const categoryInserts = selectedCategories.map((catId, index) => ({
          business_id: selectedListing.id,
          category_id: catId,
          is_primary: index === 0,
        }))

        const { error: insertCatError } = await supabase
          .from('business_categories')
          .insert(categoryInserts)

        if (insertCatError) {
          console.error('Category insert error:', insertCatError)
          throw insertCatError
        }
      }
      console.log('Categories updated successfully')

      setEditDialogOpen(false)
      fetchListings()
      alert('Changes saved successfully!')
    } catch (err: any) {
      console.error('Error saving:', err)
      alert('Error saving: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async (listingId: string) => {
    if (!listingId) {
      alert('Error: Listing ID not found')
      return
    }
    
    try {
      const { error } = await supabase
        .from('business_listings')
        .update({ listing_status: 'pending' })
        .eq('id', listingId)

      if (error) throw error

      fetchListings()
      alert('Listing moved to pending')
    } catch (err: any) {
      console.error('Error rejecting:', err)
      alert('Error: ' + err.message)
    }
  }

  const handleUpgrade = async (listingId: string, plan: 'free' | 'premium' | 'vip') => {
    if (!listingId) return
    
    try {
      const { data: planData, error: planError } = await supabase
        .from('listing_plans')
        .select('id')
        .eq('plan_key', plan)
        .single()

      if (planError) throw planError
      if (!planData) {
        alert(`${plan} plan not found`)
        return
      }

      const { error } = await supabase
        .from('business_listings')
        .update({ plan_id: planData.id })
        .eq('id', listingId)

      if (error) throw error

      fetchListings()
      alert(`Upgraded to ${plan}`)
    } catch (err: any) {
      console.error('Error upgrading:', err)
      alert('Error: ' + err.message)
    }
  }

  const handleDelete = async (businessId: string, businessName: string) => {
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

      fetchListings()
      alert(`"${businessName}" has been deleted.`)
    } catch (err: any) {
      console.error('Error deleting:', err)
      alert('Error: ' + err.message)
    }
  }

  const getListingUrl = (slug: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stlbusinessguide.com'
    return `${baseUrl}/listing/${slug}`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString()
  }

  const getMaxCategories = (planKey: string) => {
    switch (planKey) {
      case 'free': return 1
      case 'premium': return 5
      case 'vip': return Infinity
      default: return 1
    }
  }

  const addCategory = (categoryId: string | null) => {
    if (!categoryId || !selectedListing) return;
    const maxCategories = getMaxCategories(selectedListing.plan_key)
    if (selectedCategories.length >= maxCategories) {
      alert(`This listing is on the ${selectedListing.plan_name} plan. You can only select up to ${maxCategories === Infinity ? 'unlimited' : maxCategories} categor${maxCategories === 1 ? 'y' : 'ies'}.`)
      // Reset the select by changing its key
      setCategorySelectKey(prev => prev + 1)
      return
    }
    if (!selectedCategories.includes(categoryId)) {
      setSelectedCategories([...selectedCategories, categoryId])
    }
    // Reset the select after adding
    setCategorySelectKey(prev => prev + 1)
  }

  const removeCategory = (categoryId: string) => {
    setSelectedCategories(selectedCategories.filter(id => id !== categoryId))
  }

  const handleChangeOwner = async () => {
    if (!selectedListing || !newOwnerEmail) return
    
    setSaving(true)
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', newOwnerEmail)
        .single()

      if (userError || !userData) {
        throw new Error('User not found. They must have an account first.')
      }

      // Update business ownership (owner is stored in businesses table only)
      const { error: businessError } = await supabase
        .from('businesses')
        .update({
          owner_profile_id: userData.id,
        })
        .eq('id', selectedListing.id)

      if (businessError) throw businessError

      setOwnerDialogOpen(false)
      setNewOwnerEmail('')
      fetchListings()
      alert(`Ownership transferred to ${userData.full_name || userData.email}`)
    } catch (err: any) {
      console.error('Error changing owner:', err)
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const openOwnerDialog = (listing: Listing) => {
    setSelectedListing(listing)
    setNewOwnerEmail('')
    setOwnerDialogOpen(true)
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
          <h1 className="text-2xl font-bold text-slate-900">Approved Listings ({listings.length})</h1>
          <p className="text-slate-600">Manage all approved business listings</p>
        </div>
        <Link href="/admin" className="inline-flex">
          <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Business</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Categories</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings && listings.length > 0 ? (
                  listings.map((listing: Listing) => {
                    return (
                      <tr key={listing.listing_id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{listing.business_name}</p>
                              <p className="text-sm text-slate-500">{listing.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {listing.city ? (
                            <div className="flex items-center gap-1 text-slate-600">
                              <MapPin className="h-4 w-4" />
                              <span>{listing.city}, {listing.state}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {listing.categories && listing.categories.length > 0 ? (
                              listing.categories.slice(0, 2).map((cat, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {cat}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-slate-400 text-sm">No categories</span>
                            )}
                            {listing.categories && listing.categories.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{listing.categories.length - 2}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {listing.plan_name ? (
                            <Badge variant="outline">{listing.plan_name}</Badge>
                          ) : (
                            <span className="text-slate-400">Free</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <Badge className="bg-emerald-100 text-emerald-800 w-fit">
                              <CheckCircle className="h-3 w-3 mr-1" /> Approved
                            </Badge>
                            {listing.is_paid && (
                              <Badge className="bg-amber-100 text-amber-800 w-fit text-xs">
                                <DollarSign className="h-3 w-3 mr-1" /> Paid
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openViewDialog(listing)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(listing)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openOwnerDialog(listing)}
                              className="text-purple-600"
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Owner
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-slate-600"
                              onClick={() => handleUpgrade(listing.listing_id, 'free')}
                            >
                              <Circle className="h-4 w-4 mr-1" />
                              Free
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-amber-600"
                              onClick={() => handleReject(listing.listing_id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-600"
                              onClick={() => handleUpgrade(listing.listing_id, 'premium')}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Premium
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-purple-600"
                              onClick={() => handleUpgrade(listing.listing_id, 'vip')}
                            >
                              <Crown className="h-4 w-4 mr-1" />
                              VIP
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDelete(listing.id, listing.business_name)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No listings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedListing?.business_name}
            </DialogTitle>
            <DialogDescription>
              Business listing details
            </DialogDescription>
          </DialogHeader>
          
          {selectedListing && (
            <div className="space-y-4 py-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{selectedListing.plan_name}</Badge>
                <Badge className={selectedListing.is_paid ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}>
                  {selectedListing.is_paid ? 'Paid' : 'Free'}
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-800">Approved</Badge>
              </div>

              {selectedListing.categories && selectedListing.categories.length > 0 && (
                <div>
                  <label className="text-sm text-slate-500 block">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedListing.categories.map((cat, idx) => (
                      <Badge key={idx} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedListing.description_long && (
                <div>
                  <label className="text-sm text-slate-500 block">Description</label>
                  <p className="text-sm mt-1">{selectedListing.description_long}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-500 block">Phone</label>
                  <p className="text-sm font-medium">{selectedListing.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-500 block">Email</label>
                  <p className="text-sm font-medium">{selectedListing.email || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-500 block">Address</label>
                <div className="text-sm mt-1">
                  {selectedListing.address_line_1 && <p>{selectedListing.address_line_1}</p>}
                  {selectedListing.address_line_2 && <p>{selectedListing.address_line_2}</p>}
                  <p>{selectedListing.city}{selectedListing.city && selectedListing.state ? ', ' : ''}{selectedListing.state} {selectedListing.zip_code}</p>
                  {(!selectedListing.address_line_1 && !selectedListing.city) && <p className="text-slate-400">No address on file</p>}
                </div>
              </div>

              {selectedListing.website_url && (
                <div>
                  <label className="text-sm text-slate-500 block">Website</label>
                  <p className="text-sm font-medium truncate">
                    <a href={selectedListing.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedListing.website_url}
                    </a>
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-500 block">Listing URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded flex-1 truncate">
                    {getListingUrl(selectedListing.slug)}
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(getListingUrl(selectedListing.slug), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-500 block">Listing Expires</label>
                <p className="text-sm font-medium">{formatDate(selectedListing.end_date)}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Listing
            </DialogTitle>
            <DialogDescription>
              Make changes to {selectedListing?.business_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="business_name" className="text-sm font-medium block mb-2">Business Name</label>
              <Input
                id="business_name"
                value={editForm.business_name}
                onChange={(e) => setEditForm({...editForm, business_name: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="description_long" className="text-sm font-medium block mb-2">Description</label>
              <Textarea
                id="description_long"
                value={editForm.description_long}
                onChange={(e) => setEditForm({...editForm, description_long: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="text-sm font-medium block mb-2">Phone</label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium block mb-2">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label htmlFor="website_url" className="text-sm font-medium block mb-2">Website URL</label>
              <Input
                id="website_url"
                value={editForm.website_url}
                onChange={(e) => setEditForm({...editForm, website_url: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Categories</label>
              <div className="space-y-2">
                <Select key={categorySelectKey} onValueChange={addCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(cat => !selectedCategories.includes(cat.id))
                      .map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCategories.map(catId => {
                    const cat = categories.find(c => c.id === catId)
                    return cat ? (
                      <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {cat.name}
                        <button
                          onClick={() => removeCategory(catId)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="address_line_1" className="text-sm font-medium block mb-2">Address Line 1</label>
              <Input
                id="address_line_1"
                value={editForm.address_line_1}
                onChange={(e) => setEditForm({...editForm, address_line_1: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="address_line_2" className="text-sm font-medium block mb-2">Address Line 2</label>
              <Input
                id="address_line_2"
                value={editForm.address_line_2}
                onChange={(e) => setEditForm({...editForm, address_line_2: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="text-sm font-medium block mb-2">City</label>
                <Input
                  id="city"
                  value={editForm.city}
                  onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="state" className="text-sm font-medium block mb-2">State</label>
                <Input
                  id="state"
                  value={editForm.state}
                  onChange={(e) => {
                    const stateValue = e.target.value
                    // Convert to uppercase and take first 2 characters
                    const stateCode = stateValue.toUpperCase().slice(0, 2)
                    setEditForm({...editForm, state: stateCode})
                  }}
                  placeholder="e.g. MO"
                  maxLength={2}
                />
                <p className="text-xs text-slate-500 mt-1">Enter state name or 2-letter code</p>
              </div>
              <div>
                <label htmlFor="zip_code" className="text-sm font-medium block mb-2">ZIP</label>
                <Input
                  id="zip_code"
                  value={editForm.zip_code}
                  onChange={(e) => setEditForm({...editForm, zip_code: e.target.value})}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label htmlFor="end_date" className="text-sm font-medium block mb-2">Listing Expiry Date</label>
              <Input
                id="end_date"
                type="date"
                value={editForm.end_date}
                onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                className="max-w-xs"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty for no expiry</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={saving}
              className="bg-gradient-to-r from-[#ffc107] to-[#f68712]"
            >
              {saving ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Owner Change Dialog */}
      <Dialog open={ownerDialogOpen} onOpenChange={setOwnerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Change Business Owner
            </DialogTitle>
            <DialogDescription>
              Transfer ownership of {selectedListing?.business_name} to a different user.
              <br /><br />
              <span className="text-amber-600 font-medium">⚠️ Current owner: {selectedListing?.owner_email || 'Unassigned (Free Plan)'}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="new_owner_email" className="text-sm font-medium block mb-2">
                New Owner Email Address
              </label>
              <Input
                id="new_owner_email"
                type="email"
                value={newOwnerEmail}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
                placeholder="owner@example.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                User must already have an account. They will receive full access to manage this business.
              </p>
            </div>
            
            {selectedListing?.is_paid && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This is a {selectedListing.plan_name} listing. 
                  Changing the owner will transfer all billing responsibilities to the new owner.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOwnerDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangeOwner}
              disabled={saving || !newOwnerEmail}
              className="bg-gradient-to-r from-[#ffc107] to-[#f68712]"
            >
              {saving ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </span>
              ) : (
                'Transfer Ownership'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
