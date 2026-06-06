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
  Save, 
  Percent, 
  Search,
  DollarSign,
  ArrowLeft,
  Crown,
  Zap,
  Star
} from 'lucide-react'
import Link from 'next/link'

interface BusinessFee {
  id: string
  business_id: string
  business_name: string
  plan_name: string
  plan_key: string
  listing_status: string
  stl_fee_percentage: number
  notes: string | null
  updated_at: string
}

export default function AdminFeesPage() {
  const [fees, setFees] = useState<BusinessFee[]>([])
  const [filteredFees, setFilteredFees] = useState<BusinessFee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadFees()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      setFilteredFees(
        fees.filter((f) =>
          f.business_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredFees(fees)
    }
  }, [searchQuery, fees])

  async function loadFees() {
    try {
      // Get all businesses with their fee info
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('id, business_name')
        .order('business_name')

      if (businessError) throw businessError

      // Get fee settings for all businesses
      const { data: feesData, error: feesError } = await supabase
        .from('business_fees')
        .select('*')

      if (feesError) throw feesError

      // Get business listings for plan info
      const businessIds = businesses?.map((b: any) => b.id) || []
      const { data: listingsData, error: listingsError } = await supabase
        .from('business_listings')
        .select('business_id, plan_id, listing_status')
        .in('business_id', businessIds)

      if (listingsError) console.error('Error fetching listings:', listingsError)

      // Get plans
      const planIds = listingsData?.map((l: any) => l.plan_id).filter(Boolean) || []
      const { data: plansData, error: plansError } = await supabase
        .from('listing_plans')
        .select('id, plan_name, plan_key')
        .in('id', planIds)

      if (plansError) console.error('Error fetching plans:', plansError)

      // Create lookup maps
      const feesMap = new Map(feesData?.map((f: any) => [f.business_id, f]))
      const listingsMap = new Map()
      listingsData?.forEach((l: any) => {
        listingsMap.set(l.business_id, l)
      })
      const plansMap = new Map(plansData?.map((p: any) => [p.id, p]))
      
      // Find free plan for fallback
      const freePlan = plansData?.find((p: any) => p.plan_key === 'free')

      // Merge business data with fee data
      const mergedFees: BusinessFee[] = businesses?.map((business: any) => {
        const feeData = feesMap.get(business.id)
        const listing = listingsMap.get(business.id)
        const plan = listing?.plan_id ? plansMap.get(listing.plan_id) : null
        
        return {
          id: feeData?.id || '',
          business_id: business.id,
          business_name: business.business_name,
          plan_name: plan?.plan_name || freePlan?.plan_name || 'Free Listing',
          plan_key: plan?.plan_key || 'free',
          listing_status: listing?.listing_status || 'unknown',
          stl_fee_percentage: feeData?.stl_fee_percentage || 10, // Default 10%
          notes: feeData?.notes || null,
          updated_at: feeData?.updated_at || new Date().toISOString(),
        }
      }) || []

      setFees(mergedFees)
      setFilteredFees(mergedFees)
    } catch (err: any) {
      console.error('Error loading fees:', err)
      setMessage({ type: 'error', text: 'Failed to load fees' })
    }
    setLoading(false)
  }

  async function updateFee(businessId: string, percentage: number, notes: string) {
    setSaving(businessId)
    try {
      const { error } = await supabase
        .from('business_fees')
        .upsert({
          business_id: businessId,
          stl_fee_percentage: percentage,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      // Update local state
      setFees((prev) =>
        prev.map((f) =>
          f.business_id === businessId
            ? { ...f, stl_fee_percentage: percentage, notes: notes || null }
            : f
        )
      )

      setMessage({ type: 'success', text: 'Fee updated successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      console.error('Error updating fee:', err)
      setMessage({ type: 'error', text: 'Failed to update fee' })
    }
    setSaving(null)
  }

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case 'vip':
        return <Crown className="h-4 w-4 text-purple-500" />
      case 'premium':
        return <Zap className="h-4 w-4 text-blue-500" />
      default:
        return <Star className="h-4 w-4 text-slate-400" />
    }
  }

  const getPlanBadgeColor = (planKey: string) => {
    switch (planKey) {
      case 'vip':
        return 'bg-purple-100 text-purple-800'
      case 'premium':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-emerald-100 text-emerald-800'
      case 'pending':
        return 'bg-amber-100 text-amber-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Fees</h1>
          <p className="text-slate-600">Manage revenue share percentages for each business</p>
        </div>
        <Link href="/admin" className="inline-flex">
          <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          <AlertCircle className="h-5 w-5 mr-2" />
          {message.text}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fees List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Settings ({filteredFees.length} businesses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFees.map((fee) => (
              <FeeRow
                key={fee.business_id}
                fee={fee}
                onSave={updateFee}
                saving={saving === fee.business_id}
                planIcon={getPlanIcon(fee.plan_key)}
                planBadgeColor={getPlanBadgeColor(fee.plan_key)}
                statusBadgeColor={getStatusBadgeColor(fee.listing_status)}
              />
            ))}
            {filteredFees.length === 0 && (
              <p className="text-slate-500 text-center py-8">No businesses found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FeeRow({
  fee,
  onSave,
  saving,
  planIcon,
  planBadgeColor,
  statusBadgeColor,
}: {
  fee: BusinessFee
  onSave: (businessId: string, percentage: number, notes: string) => void
  saving: boolean
  planIcon: React.ReactNode
  planBadgeColor: string
  statusBadgeColor: string
}) {
  const [percentage, setPercentage] = useState(fee.stl_fee_percentage)
  const [notes, setNotes] = useState(fee.notes || '')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setHasChanges(
      percentage !== fee.stl_fee_percentage || notes !== (fee.notes || '')
    )
  }, [percentage, notes, fee])

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-lg gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-slate-900">{fee.business_name}</p>
          <Badge className={`text-xs ${planBadgeColor}`}>
            <span className="flex items-center gap-1">
              {planIcon}
              {fee.plan_name}
            </span>
          </Badge>
          <Badge className={`text-xs ${statusBadgeColor}`}>
            {fee.listing_status}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">ID: {fee.business_id}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-slate-400" />
          <Input
            type="number"
            min="0"
            max="100"
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-20 text-center"
          />
          <span className="text-slate-500">%</span>
        </div>
        <Input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-48"
        />
        <Button
          onClick={() => onSave(fee.business_id, percentage, notes)}
          disabled={!hasChanges || saving}
          size="sm"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
