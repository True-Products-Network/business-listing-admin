'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2, 
  User,
  FileText,
  Search,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface ClaimRequest {
  id: string
  business_id: string
  business_name: string
  business_slug?: string
  claimant_name: string
  claimant_email: string
  claimant_phone: string
  proof_notes: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<ClaimRequest[]>([])
  const [filteredClaims, setFilteredClaims] = useState<ClaimRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [siteUrl, setSiteUrl] = useState('https://stl-business-guide-v2-rho.vercel.app')
  const supabase = createClient()

  useEffect(() => {
    loadSiteUrl()
  }, [])

  async function loadSiteUrl() {
    try {
      const { data } = await supabase
        .from('integration_configs')
        .select('config_value')
        .eq('config_key', 'next_public_site_url')
        .single()
      
      if (data?.config_value) {
        setSiteUrl(data.config_value)
      }
    } catch (err) {
      console.log('Using default site URL')
    }
  }

  useEffect(() => {
    loadClaims()
  }, [])

  useEffect(() => {
    filterClaims()
  }, [statusFilter, searchQuery, claims])

  async function loadClaims() {
    try {
      const { data, error } = await supabase
        .from('claim_requests')
        .select(`
          *,
          business:business_id (business_name, slug)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformed = data?.map((claim: any) => ({
        ...claim,
        business_name: claim.business?.business_name || 'Unknown Business',
        business_slug: claim.business?.slug,
      })) || []

      setClaims(transformed)
      setFilteredClaims(transformed)
    } catch (err: any) {
      console.error('Error loading claims:', err)
      setError('Failed to load claim requests')
    }
    setLoading(false)
  }

  function filterClaims() {
    let filtered = claims

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.business_name.toLowerCase().includes(query) ||
          c.claimant_name.toLowerCase().includes(query) ||
          c.claimant_email.toLowerCase().includes(query)
      )
    }

    setFilteredClaims(filtered)
  }

  async function updateClaimStatus(claimId: string, status: 'approved' | 'rejected') {
    setProcessing(claimId)
    try {
      // Get the claim details first
      const { data: claim, error: claimError } = await supabase
        .from('claim_requests')
        .select('*')
        .eq('id', claimId)
        .single()

      if (claimError) throw claimError

      // Update the claim status
      const { error: updateError } = await supabase
        .from('claim_requests')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', claimId)

      if (updateError) throw updateError

      // If approved, update the business ownership via admin API
      if (status === 'approved') {
        try {
          const response = await fetch('/api/admin/transfer-ownership', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId: claim.business_id,
              newOwnerEmail: claim.claimant_email
            })
          })

          const result = await response.json()

          if (!response.ok || !result.success) {
            console.error('Ownership transfer failed:', result.error)
            alert(`Claim approved but ownership transfer failed: ${result.error || 'Unknown error'}`)
          } else {
            // Update the owner's profile with name from claim
            if (result.newOwnerId && claim.claimant_name) {
              const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({ 
                  full_name: claim.claimant_name,
                  email: claim.claimant_email 
                })
                .eq('id', result.newOwnerId)
              
              if (profileUpdateError) {
                console.error('Error updating profile name:', profileUpdateError)
              } else {
                console.log('Updated owner profile name to:', claim.claimant_name)
              }
            }

            // Also update the phone if provided
            if (claim.claimant_phone) {
              const { error: phoneError } = await supabase
                .from('businesses')
                .update({ phone: claim.claimant_phone })
                .eq('id', claim.business_id)
              
              if (phoneError) {
                console.error('Error updating phone:', phoneError)
              }
            }
          }
        } catch (err: any) {
          console.error('Error in ownership transfer:', err)
          alert('Claim approved but error transferring ownership: ' + err.message)
        }
      }

      setAdminNotes('')
      await loadClaims()
      alert(`Claim ${status} successfully`)
    } catch (err: any) {
      console.error('Error updating claim:', err)
      alert('Error: ' + err.message)
    }
    setProcessing(null)
  }

  const statusCounts = {
    all: claims.length,
    pending: claims.filter((c) => c.status === 'pending').length,
    approved: claims.filter((c) => c.status === 'approved').length,
    rejected: claims.filter((c) => c.status === 'rejected').length,
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
          <h1 className="text-2xl font-bold text-slate-900">Claim Requests</h1>
          <p className="text-slate-600">Review and manage business listing claims</p>
        </div>
        <Link href="/admin" className="inline-flex">
          <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Claims</p>
                <p className="text-2xl font-bold text-slate-900">{statusCounts.all}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{statusCounts.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Approved</p>
                <p className="text-2xl font-bold text-emerald-600">{statusCounts.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-1 text-xs bg-white/20 px-1.5 rounded">
                    {statusCounts[status]}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => (
            <Card key={claim.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Claim Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">
                          {claim.business_name}
                        </h3>
                        <Badge 
                          className={`mt-1 ${
                            claim.status === 'pending' 
                              ? 'bg-amber-100 text-amber-800' 
                              : claim.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {claim.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">{claim.claimant_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">Email:</span>
                        <span className="text-slate-700">{claim.claimant_email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">Phone:</span>
                        <span className="text-slate-700">{claim.claimant_phone}</span>
                      </div>
                    </div>

                    {claim.proof_notes && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600">
                          <strong>Proof:</strong> {claim.proof_notes}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-4">
                      Submitted: {new Date(claim.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 min-w-[200px]">
                    <a 
                      href={`${siteUrl}/listing/${claim.business_slug || claim.business_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Building2 className="h-4 w-4 mr-2" />
                        View Business
                      </Button>
                    </a>
                    
                    {claim.status === 'pending' ? (
                      <>
                        <textarea
                          placeholder="Admin notes (optional)"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="w-full p-2 border rounded-lg text-sm mb-2"
                          rows={2}
                        />
                        <Button
                          size="sm"
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => updateClaimStatus(claim.id, 'approved')}
                          disabled={processing === claim.id}
                        >
                          {processing === claim.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => updateClaimStatus(claim.id, 'rejected')}
                          disabled={processing === claim.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <Badge 
                          className={`mb-2 ${
                            claim.status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {claim.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </Badge>
                        {claim.admin_notes && (
                          <p className="text-sm text-slate-600">
                            <strong>Notes:</strong> {claim.admin_notes}
                          </p>
                        )}
                        {claim.reviewed_at && (
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(claim.reviewed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No claims found</h3>
              <p className="text-slate-600 mt-1">
                {statusFilter === 'all' 
                  ? 'No claim requests have been submitted yet' 
                  : `No ${statusFilter} claims`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
