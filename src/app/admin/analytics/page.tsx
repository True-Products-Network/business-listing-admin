'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Eye,
  MousePointer,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Building2,
  Search,
  Calendar,
  Crown,
  Zap,
  Star,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

interface BusinessAnalytics {
  business_id: string
  business_name: string
  slug: string
  plan_key: string
  plan_name: string
  listing_status: string
  is_featured: boolean
  has_paid_subscription: boolean
  profile_views: number
  website_clicks: number
  phone_clicks: number
  email_clicks: number
  direction_clicks: number
  total_engagement: number
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<BusinessAnalytics[]>([])
  const [filteredAnalytics, setFilteredAnalytics] = useState<BusinessAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('30')
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  useEffect(() => {
    if (searchQuery) {
      setFilteredAnalytics(
        analytics.filter((a) =>
          a.business_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredAnalytics(analytics)
    }
  }, [searchQuery, analytics])

  async function loadAnalytics() {
    try {
      setLoading(true)

      // Get the current session for the auth token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('No access token available')
      }

      // Fetch data from admin API endpoint
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch analytics')
      }

      const data = await response.json()

      // Process the data
      const processedData = processAnalyticsData(data.businesses || [], data.analytics || [], dateRange)
      setAnalytics(processedData)
      setFilteredAnalytics(processedData)
    } catch (err: any) {
      console.error('Error loading analytics:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  function processAnalyticsData(businesses: any[], analyticsData: any[], dateRange: string): BusinessAnalytics[] {
    // Calculate date cutoff - use UTC to avoid timezone issues
    let cutoffDate: Date | null = null
    if (dateRange !== 'all') {
      cutoffDate = new Date()
      cutoffDate.setUTCDate(cutoffDate.getUTCDate() - parseInt(dateRange))
      cutoffDate.setUTCHours(0, 0, 0, 0) // Start of day UTC
    }

    // Build business to listings map
    const businessData = new Map<string, {
      business_name: string
      slug: string
      plan_key: string
      plan_name: string
      listing_status: string
      has_paid_subscription: boolean
      is_featured: boolean
      listing_ids: string[]
    }>()

    businesses.forEach((business: any) => {
      const listings = business.business_listings || []
      const activeListing = listings.find((l: any) => l.listing_status === 'approved' || l.listing_status === 'active') || listings[0]
      const plan = activeListing?.listing_plans

      businessData.set(business.id, {
        business_name: business.business_name,
        slug: business.slug,
        plan_key: plan?.plan_key || 'free',
        plan_name: plan?.plan_name || 'Free',
        listing_status: activeListing?.listing_status || 'unknown',
        has_paid_subscription: business.has_paid_subscription || false,
        is_featured: activeListing?.is_featured || false,
        listing_ids: listings.map((l: any) => l.id)
      })
    })

    // Aggregate analytics by business
    const aggregatedData = new Map<string, {
      profile_views: number
      website_clicks: number
      phone_clicks: number
      email_clicks: number
      direction_clicks: number
    }>()

    analyticsData.forEach((record: any) => {
      // Find which business this analytics record belongs to
      let businessId: string | null = null

      for (const [bid, data] of businessData.entries()) {
        if (data.listing_ids.includes(record.business_id)) {
          businessId = bid
          break
        }
      }

      if (!businessId) {
        businessId = record.business_id
      }

      if (!businessId) return

      // Check date range - compare dates properly using UTC
      if (cutoffDate && record.date) {
        // Parse record date as UTC to avoid timezone shifts
        const recordDate = new Date(record.date + 'T00:00:00Z')
        if (recordDate < cutoffDate) return
      }

      if (!aggregatedData.has(businessId)) {
        aggregatedData.set(businessId, {
          profile_views: 0,
          website_clicks: 0,
          phone_clicks: 0,
          email_clicks: 0,
          direction_clicks: 0
        })
      }

      const agg = aggregatedData.get(businessId)
      if (agg) {
        agg.profile_views += record.profile_views || 0
        agg.website_clicks += record.website_clicks || 0
        agg.phone_clicks += record.phone_clicks || 0
        agg.email_clicks += record.email_clicks || 0
        agg.direction_clicks += record.direction_clicks || 0
      }
    })

    // Build final results
    const results: BusinessAnalytics[] = []

    for (const [businessId, data] of businessData.entries()) {
      const agg = aggregatedData.get(businessId) || {
        profile_views: 0,
        website_clicks: 0,
        phone_clicks: 0,
        email_clicks: 0,
        direction_clicks: 0
      }

      results.push({
        business_id: businessId,
        business_name: data.business_name,
        slug: data.slug,
        plan_key: data.plan_key,
        plan_name: data.plan_name,
        listing_status: data.listing_status,
        has_paid_subscription: data.has_paid_subscription,
        is_featured: data.is_featured,
        profile_views: agg.profile_views,
        website_clicks: agg.website_clicks,
        phone_clicks: agg.phone_clicks,
        email_clicks: agg.email_clicks,
        direction_clicks: agg.direction_clicks,
        total_engagement: agg.website_clicks + agg.phone_clicks + agg.email_clicks + agg.direction_clicks
      })
    }

    // Sort by total engagement
    return results.sort((a, b) => b.total_engagement - a.total_engagement)
  }

  const totalStats = {
    profile_views: analytics.reduce((sum, a) => sum + (a.profile_views || 0), 0),
    website_clicks: analytics.reduce((sum, a) => sum + (a.website_clicks || 0), 0),
    phone_clicks: analytics.reduce((sum, a) => sum + (a.phone_clicks || 0), 0),
    email_clicks: analytics.reduce((sum, a) => sum + (a.email_clicks || 0), 0),
    direction_clicks: analytics.reduce((sum, a) => sum + (a.direction_clicks || 0), 0),
  }

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case 'vip':
        return <Crown className="h-5 w-5 text-purple-500" />
      case 'premium':
        return <Zap className="h-5 w-5 text-blue-500" />
      default:
        return <Star className="h-5 w-5 text-slate-400" />
    }
  }

  const getPlanBadgeColor = (planKey: string) => {
    switch (planKey) {
      case 'vip':
        return 'bg-purple-100 text-purple-700'
      case 'premium':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
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
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Failed to Load Analytics</h2>
        <p className="text-slate-600 mt-2">{error}</p>
        <Button onClick={loadAnalytics} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600">Track business listing performance</p>
        </div>
        <Link href="/admin" className="inline-flex">
          <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <Input
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalStats.profile_views.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Profile Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MousePointer className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalStats.website_clicks.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Website Clicks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Phone className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalStats.phone_clicks.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Phone Clicks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalStats.email_clicks.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Email Clicks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalStats.direction_clicks.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Directions</p>
          </CardContent>
        </Card>
      </div>

      {/* Business List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Business Performance ({filteredAnalytics.length} businesses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAnalytics.map((business) => (
              <div
                key={business.business_id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-lg gap-4"
              >
                <div className="flex items-center gap-3">
                  {getPlanIcon(business.plan_key)}
                  <div>
                    <p className="font-medium text-slate-900">{business.business_name}</p>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Badge className={`text-xs ${getPlanBadgeColor(business.plan_key)}`}>
                        {business.plan_name}
                      </Badge>
                      <Badge className={`text-xs ${getStatusBadgeColor(business.listing_status)}`}>
                        {business.listing_status}
                      </Badge>
                      {business.has_paid_subscription && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      )}
                      {business.is_featured && (
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{business.profile_views}</p>
                    <p className="text-slate-500">views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{business.website_clicks}</p>
                    <p className="text-slate-500">web</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{business.phone_clicks}</p>
                    <p className="text-slate-500">phone</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{business.email_clicks}</p>
                    <p className="text-slate-500">email</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{business.direction_clicks}</p>
                    <p className="text-slate-500">maps</p>
                  </div>
                  <div className="text-center bg-blue-50 rounded-lg px-3 py-2">
                    <p className="font-bold text-blue-600">{business.total_engagement}</p>
                    <p className="text-blue-500 text-xs">total</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredAnalytics.length === 0 && (
              <p className="text-slate-500 text-center py-8">No analytics data found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
