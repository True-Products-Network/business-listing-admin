'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  FileText,
  Tag,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  Crown,
  Zap,
  Star,
  ArrowRight,
  Loader2,
  Key,
  Newspaper
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  listings: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  subscriptions: {
    total: number
    active: number
    pastDue: number
    premium: number
    vip: number
    free: number
  }
  foundingMembers: {
    current: number
    limit: number
    percentage: number
  }
  gracePeriods: {
    expiringToday: number
    inGracePeriod: number
  }
  revenue: {
    monthly: number
    foundingMemberLocked: number
  }
  coupons: {
    total: number
    active: number
  }
  claims: {
    pending: number
    total: number
  }
  users: {
    total: number
  }
  blogPosts: number
}

interface SystemSetting {
  setting_key: string
  setting_value: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch system settings
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')

      const settingsMap = settingsData?.reduce((acc: any, s: any) => {
        acc[s.setting_key] = s.setting_value
        return acc
      }, {}) || {}
      setSettings(settingsMap)

      // Fetch listing stats
      const { data: listings } = await supabase
        .from('business_listings')
        .select('id, listing_status')

      const listingStats = {
        total: listings?.length || 0,
        pending: listings?.filter((l: any) => l.listing_status === 'pending').length || 0,
        approved: listings?.filter((l: any) => l.listing_status === 'approved' || l.listing_status === 'active').length || 0,
        rejected: listings?.filter((l: any) => l.listing_status === 'rejected').length || 0,
      }

      // Fetch subscription stats
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status, plan_key, is_founding_member, grace_period_ends_at')

      const now = new Date().toISOString()
      const subscriptionStats = {
        total: subscriptions?.length || 0,
        active: subscriptions?.filter((s: any) => s.status === 'active').length || 0,
        pastDue: subscriptions?.filter((s: any) => s.status === 'past_due').length || 0,
        premium: subscriptions?.filter((s: any) => s.plan_key === 'premium').length || 0,
        vip: subscriptions?.filter((s: any) => s.plan_key === 'vip').length || 0,
        free: subscriptions?.filter((s: any) => !s.plan_key || s.plan_key === 'free').length || 0,
      }

      // Fetch founding member stats
      const foundingCount = subscriptions?.filter((s: any) => s.is_founding_member).length || 0
      const foundingLimit = parseInt(settingsMap.founding_member_limit || '100')

      // Fetch grace period stats
      const expiringToday = subscriptions?.filter((s: any) => {
        if (!s.grace_period_ends_at) return false
        const graceEnd = new Date(s.grace_period_ends_at)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return graceEnd > new Date() && graceEnd < tomorrow
      }).length || 0

      const inGracePeriod = subscriptions?.filter((s: any) =>
        s.grace_period_ends_at && new Date(s.grace_period_ends_at) > new Date()
      ).length || 0

      // Calculate revenue
      const premiumPrice = parseFloat(settingsMap.premium_monthly_price || '29')
      const vipPrice = parseFloat(settingsMap.vip_monthly_price || '97')
      const monthlyRevenue = (subscriptionStats.premium * premiumPrice) + (subscriptionStats.vip * vipPrice)

      // Fetch coupon stats - count all coupons
      const { count: couponCount } = await supabase
        .from('coupons')
        .select('*', { count: 'exact', head: true })

      // Fetch claim stats - count pending claims
      const { count: pendingClaimsCount } = await supabase
        .from('claim_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: totalClaimsCount } = await supabase
        .from('claim_requests')
        .select('*', { count: 'exact', head: true })

      // Fetch blog post count
      const { count: blogCount } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      setStats({
        listings: listingStats,
        subscriptions: subscriptionStats,
        foundingMembers: {
          current: foundingCount,
          limit: foundingLimit,
          percentage: (foundingCount / foundingLimit) * 100,
        },
        gracePeriods: {
          expiringToday,
          inGracePeriod,
        },
        revenue: {
          monthly: monthlyRevenue,
          foundingMemberLocked: foundingCount > 0 ? monthlyRevenue : 0,
        },
        coupons: {
          total: couponCount || 0,
          active: couponCount || 0,
        },
        claims: {
          pending: pendingClaimsCount || 0,
          total: totalClaimsCount || 0,
        },
        users: {
          total: usersCount || 0,
        },
        blogPosts: blogCount || 0,
      })

      // Fetch recent activity
      const { data: recentListings } = await supabase
        .from('business_listings')
        .select(`
          id,
          listing_status,
          created_at,
          business_id,
          businesses:business_id (business_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentActivity(recentListings || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Failed to load dashboard</h2>
        <p className="text-slate-600 mt-2">Please try refreshing the page</p>
      </div>
    )
  }

  // First row: All Listings, Review Pending, Manage Coupons, Review Claims
  const firstRowActions = [
    { title: 'All Listings', href: '/admin/listings', count: stats.listings.total, icon: Building2, color: 'text-white', bgColor: 'bg-gradient-to-r from-[#ffc107] to-[#f68712]' },
    { title: 'Review Pending', href: '/admin/listings/pending', count: stats.listings.pending, icon: Clock, color: 'text-white', bgColor: 'bg-gradient-to-r from-[#ffc107] to-[#f68712]' },
    { title: 'Manage Coupons', href: '/admin/coupons', count: stats.coupons.total, icon: Tag, color: 'text-white', bgColor: 'bg-gradient-to-r from-[#ffc107] to-[#f68712]' },
    { title: 'Review Claims', href: '/admin/claims', count: stats.claims.pending, icon: FileText, color: 'text-white', bgColor: 'bg-gradient-to-r from-[#ffc107] to-[#f68712]' },
  ]

  // Second row: System Settings, Integrations, Analytics, Users
  const secondRowActions = [
    { title: 'System Settings', href: '/admin/settings', count: null, icon: Settings, color: 'text-white', bgColor: 'bg-gradient-to-r from-[#ffc107] to-[#f68712]' },
    { title: 'Integrations', href: '/admin/integrations', count: null, icon: Key, color: 'text-white', bgColor: 'bg-gradient-to-r from-[#ffc107] to-[#f68712]' },
    { title: 'Analytics', href: '/admin/analytics', count: null, icon: TrendingUp, color: 'text-white', bgColor: 'bg-gradient-to-r from-[#ffc107] to-[#f68712]' },
    { title: 'Users', href: '/admin/users', count: stats.users?.total || null, icon: Users, color: 'text-white', bgColor: 'bg-gradient-to-r from-[#ffc107] to-[#f68712]' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Manage your business directory</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Founding Member:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            settings.founding_member_enabled === 'true'
              ? 'bg-green-100 text-green-800'
              : 'bg-slate-100 text-slate-800'
          }`}>
            {settings.founding_member_enabled === 'true' ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* First Row Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {firstRowActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-2 border-transparent hover:border-orange-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${action.bgColor} p-2 rounded-lg shadow-sm`}>
                        <Icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <span className="font-medium text-slate-900">{action.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {action.count !== null && (
                        <span className="bg-white/90 text-slate-700 px-2 py-1 rounded-full text-sm font-semibold shadow-sm border border-orange-200">
                          {action.count}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Second Row Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {secondRowActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${action.bgColor} p-2 rounded-lg shadow-sm`}>
                        <Icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <span className="font-medium text-slate-900">{action.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {action.count !== null && (
                        <span className="bg-white/90 text-slate-700 px-2 py-1 rounded-full text-sm font-semibold shadow-sm">
                          {action.count}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Listings Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total</span>
                <span className="text-2xl font-bold text-slate-900">{stats.listings.total}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-amber-50 rounded-lg p-2">
                  <p className="text-lg font-semibold text-amber-700">{stats.listings.pending}</p>
                  <p className="text-xs text-amber-600">Pending</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2">
                  <p className="text-lg font-semibold text-emerald-700">{stats.listings.approved}</p>
                  <p className="text-xs text-emerald-600">Approved</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-lg font-semibold text-red-700">{stats.listings.rejected}</p>
                  <p className="text-xs text-red-600">Rejected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Monthly Revenue</span>
                <span className="text-2xl font-bold text-green-600">${stats.revenue.monthly.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 text-slate-400" />
                    <p className="text-lg font-semibold text-slate-700">{stats.subscriptions.free}</p>
                  </div>
                  <p className="text-xs text-slate-500">Free</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3 text-blue-500" />
                    <p className="text-lg font-semibold text-blue-700">{stats.subscriptions.premium}</p>
                  </div>
                  <p className="text-xs text-blue-600">Premium</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Crown className="h-3 w-3 text-purple-500" />
                    <p className="text-lg font-semibold text-purple-700">{stats.subscriptions.vip}</p>
                  </div>
                  <p className="text-xs text-purple-600">VIP</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Founding Members */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              Founding Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Spots Filled</span>
                <span className="text-2xl font-bold text-purple-600">
                  {stats.foundingMembers.current} / {stats.foundingMembers.limit}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(stats.foundingMembers.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{stats.foundingMembers.percentage.toFixed(1)}% full</span>
                <span className="text-slate-500">{stats.foundingMembers.limit - stats.foundingMembers.current} remaining</span>
              </div>
              {stats.gracePeriods.inGracePeriod > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                  <p className="text-sm text-orange-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {stats.gracePeriods.inGracePeriod} in grace period
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row - More Focused Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Blog Posts</p>
                <p className="text-2xl font-bold text-slate-900">{stats.blogPosts}</p>
              </div>
              <Newspaper className="h-8 w-8 text-blue-500" />
            </div>
            <Link href="/admin/blog">
              <Button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white">
                Manage Blog
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Coupons</p>
                <p className="text-2xl font-bold text-slate-900">{stats.coupons.active}</p>
              </div>
              <Tag className="h-8 w-8 text-green-500" />
            </div>
            <Link href="/admin/coupons">
              <Button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white">
                Manage Coupons
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Claims</p>
                <p className="text-2xl font-bold text-slate-900">{stats.claims.pending}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
            <Link href="/admin/claims">
              <Button className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white">
                Review Claims
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 hover:border-red-400 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Past Due</p>
                <p className="text-2xl font-bold text-red-600">{stats.subscriptions.pastDue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <Link href="/admin/past-due">
              <Button className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white">
                View Past Due
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((listing: any) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {listing.businesses?.business_name || 'Unknown Business'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {listing.businesses?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      listing.listing_status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : listing.listing_status === 'approved' || listing.listing_status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : listing.listing_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {listing.listing_status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-8">No recent submissions</p>
            )}
          </div>
          <Link href="/admin/listings">
            <Button className="w-full mt-4 bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90">
              View Approved Listings
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
