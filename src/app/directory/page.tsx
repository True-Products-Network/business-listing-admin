'use client'

import { useState, useEffect } from 'react'
import { createClient, BusinessListing } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Phone, Globe, Search, Loader2, Crown, LayoutGrid, List } from 'lucide-react'
import Link from 'next/link'

export default function DirectoryPage() {
  const [listings, setListings] = useState<BusinessListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const supabase = createClient()

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Use the public_approved_listings view
      let query = supabase
        .from('public_approved_listings')
        .select('*')

      if (searchQuery) {
        query = query.or(`business_name.ilike.%${searchQuery}%,description_long.ilike.%${searchQuery}%`)
      }
      
      // Always order by sort_priority descending (VIP first, then Premium, then Free)
      query = query.order('sort_priority', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching listings:', error)
        setError('Failed to load listings: ' + error.message + ' (Code: ' + error.code + ')')
      } else {
        console.log('Fetched listings count:', data?.length || 0)
        console.log('First listing:', data?.[0])
        setListings(data || [])
      }
    } catch (err: any) {
      console.error('Exception fetching listings:', err)
      setError('Error: ' + err.message)
    }
    setLoading(false)
  }

  const handleSearch = () => {
    setError(null)
    fetchListings()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-slate-900" />
            <span className="font-bold text-xl text-slate-900">Business Directory</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/submit">
              <Button variant="outline" size="sm">Submit Listing</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Admin</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Business Directory</h1>
          <p className="text-slate-600">Discover trusted local businesses</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Search and View Toggle */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No businesses found</h3>
              <p className="text-slate-600">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{listing.business_name}</CardTitle>
                      <p className="text-sm text-slate-500">{listing.primary_category}</p>
                    </div>
                    {(listing.plan_key === 'premium' || listing.plan_key === 'vip') && (
                      <Crown className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {listing.description_long}
                  </p>
                  
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="truncate">
                        {listing.city}, {listing.state}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{listing.phone}</span>
                    </div>
                    
                    {listing.website_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-slate-400" />
                        <a 
                          href={listing.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  {listing.plan_key === 'premium' && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      Premium
                    </Badge>
                  )}
                  {listing.plan_key === 'vip' && (
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                      VIP
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Business Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{listing.business_name}</h3>
                        {(listing.plan_key === 'premium' || listing.plan_key === 'vip') && (
                          <Crown className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{listing.primary_category}</p>
                      <p className="text-sm text-slate-600 line-clamp-2">{listing.description_long}</p>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-slate-600 md:border-l md:pl-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{listing.city}, {listing.state}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span>{listing.phone}</span>
                      </div>
                      
                      {listing.website_url && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <a 
                            href={listing.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* Plan Badge */}
                    <div className="flex-shrink-0">
                      {listing.plan_key === 'premium' && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          Premium
                        </Badge>
                      )}
                      {listing.plan_key === 'vip' && (
                        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                          VIP
                        </Badge>
                      )}
                      {listing.plan_key === 'free' && (
                        <Badge variant="outline" className="text-slate-500">
                          Free
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
