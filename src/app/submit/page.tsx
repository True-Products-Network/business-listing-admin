'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, Building2, Mail, Phone, Globe, MapPin, FileText, User, ArrowLeft, Home, List } from 'lucide-react'
import Link from 'next/link'

export default function SubmitListingPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [catsLoading, setCatsLoading] = useState(true)
  const [locsLoading, setLocsLoading] = useState(true)
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    brief_description: '',
    description: '',
    category: '',
    location: '',
    service_area: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
    fetchLocations()
  }, [])

  const fetchCategories = async () => {
    setCatsLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
      } else {
        setCategories(data?.map(c => c.name) || [])
      }
    } catch (err) {
      console.error('Exception fetching categories:', err)
    }
    setCatsLoading(false)
  }

  const fetchLocations = async () => {
    setLocsLoading(true)
    try {
      const { data, error } = await supabase
        .from('business_locations')
        .select('city')
        .not('city', 'is', null)
        .order('city')

      if (error) {
        console.error('Error fetching locations:', error)
      } else {
        // Get unique cities
        const uniqueCities = [...new Set(data?.map(l => l.city).filter(Boolean) || [])]
        setLocations(uniqueCities)
      }
    } catch (err) {
      console.error('Exception fetching locations:', err)
    }
    setLocsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Basic validation
    if (!formData.business_name || !formData.contact_name || !formData.email || !formData.phone || !formData.location || !formData.brief_description) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      // Step 1: Create or get profile for the submitter
      let profileId = null
      
      // Check if profile exists by email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle()
      
      if (existingProfile) {
        profileId = existingProfile.id
      } else {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            email: formData.email,
            full_name: formData.contact_name,
            phone: formData.phone,
            role: 'business_owner'
          }])
          .select()
          .single()
        
        if (profileError) throw profileError
        profileId = newProfile?.id
      }

      // Step 2: Create the business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert([{
          owner_profile_id: profileId,
          business_name: formData.business_name,
          slug: formData.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36),
          description_short: formData.brief_description,
          description_long: formData.description,
          phone: formData.phone,
          email: formData.email,
          website_url: formData.website,
          status: 'pending'
        }])
        .select()
        .single()

      if (businessError) throw businessError

      // Step 3: Create the location
      if (businessData) {
        const { error: locationError } = await supabase
          .from('business_locations')
          .insert([{
            business_id: businessData.id,
            address_line_1: formData.address,
            city: formData.location || formData.city,
            state: formData.state,
            zip_code: formData.zip,
            service_area: formData.service_area,
            is_primary: true
          }])

        if (locationError) throw locationError

        // Step 4: Get the free plan ID (with fallback)
        let freePlanId = null
        try {
          const { data: planData } = await supabase
            .from('listing_plans')
            .select('id')
            .eq('plan_key', 'free')
            .single()
          freePlanId = planData?.id
        } catch (e) {
          console.log('Free plan not found, using default')
        }

        // Step 5: Create the listing
        const { error: listingError } = await supabase
          .from('business_listings')
          .insert([{
            business_id: businessData.id,
            plan_id: freePlanId,
            listing_status: 'pending'
          }])

        if (listingError) throw listingError

        // Step 6: Create the business category (if category selected)
        if (formData.category) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('name', formData.category)
            .single()
          
          if (categoryData) {
            const { error: categoryError } = await supabase
              .from('business_categories')
              .insert([{
                business_id: businessData.id,
                category_id: categoryData.id,
                is_primary: true
              }])
            
            if (categoryError) {
              console.log('Category assignment error (non-critical):', categoryError)
            }
          }
        }

        // Step 7: Create the submission
        const { error: submissionError } = await supabase
          .from('listing_submissions')
          .insert([{
            business_id: businessData.id,
            submitted_by_profile_id: profileId,
            requested_plan_key: 'free',
            submission_status: 'submitted'
          }])

        if (submissionError) throw submissionError
      }

      setSuccess(true)
      setFormData({
        business_name: '',
        contact_name: '',
        email: '',
        phone: '',
        website: '',
        brief_description: '',
        description: '',
        category: '',
        location: '',
        service_area: '',
        address: '',
        city: '',
        state: '',
        zip: '',
      })
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Submission Received!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for submitting your business listing. Our team will review it and get back to you soon.
            </p>
            <div className="flex flex-col gap-3">
              <a href="/directory">
                <Button className="w-full">
                  View Business Directory
                </Button>
              </a>
              <Button onClick={() => setSuccess(false)} variant="outline" className="w-full">
                Submit Another Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-slate-900" />
            <Link href="/" className="font-bold text-xl text-slate-900 hover:text-slate-700">
              STL Business Guide
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/directory">
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 mr-2" />
                Directory
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">List Your Business</h1>
            <p className="text-slate-600">
              Submit your business information to be featured in our directory.
              All listings are reviewed before publication.
            </p>
          </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-500" />
              Business Information
            </CardTitle>
            <CardDescription>
              Fill out the form below. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b pb-2">Business Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.business_name}
                      onChange={(e) => handleChange('business_name', e.target.value)}
                      placeholder="Your Business Name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <Select 
                      value={formData.location} 
                      onValueChange={(value) => handleChange('location', value || '')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Brief Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={formData.brief_description}
                    onChange={(e) => handleChange('brief_description', e.target.value)}
                    placeholder="Short description of your business (shown in listings)..."
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Tell us more about your business, services, and what makes you unique..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Area</label>
                  <Input
                    value={formData.service_area}
                    onChange={(e) => handleChange('service_area', e.target.value)}
                    placeholder="e.g., St. Louis County, St. Charles County, Jefferson County"
                  />
                  <p className="text-xs text-slate-500">Areas you serve beyond your primary location</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleChange('category', value || '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Contact Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => handleChange('contact_name', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Business Address
                </h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Street Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State</label>
                    <Input
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ZIP Code</label>
                    <Input
                      value={formData.zip}
                      onChange={(e) => handleChange('zip', e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500 mb-4">
                  By submitting this form, you agree to our terms of service and confirm that all information provided is accurate.
                </p>
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Listing
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
