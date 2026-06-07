'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  Circle,
  Building2,
  Image,
  CreditCard,
  Tag,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Star,
  Zap,
  Crown,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface ChecklistItem {
  id: string
  title: string
  description: string
  phase: number
  icon: React.ReactNode
  action?: {
    label: string
    href: string
  }
}

interface PricingData {
  premiumPrice: number
  vipPrice: number
  isFoundingMemberActive: boolean
  foundingMemberDeadline: string
  foundingMemberLimit: number
  foundingMemberCurrent: number
}

const checklistItems: ChecklistItem[] = [
  // Phase 1: Create Account
  {
    id: 'create-account',
    title: 'Create Your Account',
    description: 'Sign up with your email and verify your account. Use an email you check regularly.',
    phase: 1,
    icon: <CheckCircle className="h-5 w-5" />,
    action: { label: 'Go to Submit', href: '/submit' }
  },
  {
    id: 'complete-profile',
    title: 'Complete Your Profile',
    description: 'Add your name and phone number to your profile.',
    phase: 1,
    icon: <CheckCircle className="h-5 w-5" />
  },
  // Phase 2: Submit Listing
  {
    id: 'business-name',
    title: 'Enter Business Name',
    description: 'Use the name customers know you by. Be consistent with your branding.',
    phase: 2,
    icon: <Building2 className="h-5 w-5" />
  },
  {
    id: 'select-category',
    title: 'Select Your Category',
    description: 'Choose the category that best describes your business. This helps customers find you.',
    phase: 2,
    icon: <Building2 className="h-5 w-5" />
  },
  {
    id: 'add-address',
    title: 'Add Your Address',
    description: 'Enter your complete business address so customers can find you.',
    phase: 2,
    icon: <Building2 className="h-5 w-5" />
  },
  {
    id: 'add-contact',
    title: 'Add Contact Information',
    description: 'Add the phone number and email customers should use to reach you.',
    phase: 2,
    icon: <Building2 className="h-5 w-5" />
  },
  {
    id: 'write-description',
    title: 'Write Your Description',
    description: 'Write a short description (50-100 words) about what you do and who you serve.',
    phase: 2,
    icon: <Building2 className="h-5 w-5" />
  },
  {
    id: 'upload-photo',
    title: 'Upload a Photo',
    description: 'Add your logo or a photo of your business. First impressions matter!',
    phase: 2,
    icon: <Image className="h-5 w-5" />
  },
  {
    id: 'submit-for-approval',
    title: 'Submit for Approval',
    description: 'Review everything and submit. Most listings are approved within 1-2 business days.',
    phase: 2,
    icon: <CheckCircle className="h-5 w-5" />
  },
  // Phase 3: Complete Listing
  {
    id: 'add-long-description',
    title: 'Add Full Description',
    description: 'Write a longer description (up to 500 words) with your story, services, and what makes you different.',
    phase: 3,
    icon: <Building2 className="h-5 w-5" />
  },
  {
    id: 'upload-gallery',
    title: 'Upload Gallery Photos',
    description: 'Add 3-5 photos showing your business, products, or team.',
    phase: 3,
    icon: <Image className="h-5 w-5" />
  },
  {
    id: 'add-hours',
    title: 'Add Business Hours',
    description: 'Let customers know when you are open.',
    phase: 3,
    icon: <Building2 className="h-5 w-5" />
  },
  {
    id: 'add-social',
    title: 'Add Social Media Links',
    description: 'Connect your Facebook, Instagram, LinkedIn, and other social profiles.',
    phase: 3,
    icon: <Building2 className="h-5 w-5" />
  },
  // Phase 4: Upgrade (Optional)
  {
    id: 'consider-upgrade',
    title: 'Consider Upgrading',
    description: 'Premium and VIP plans get priority placement, more photos, and better visibility.',
    phase: 4,
    icon: <CreditCard className="h-5 w-5" />,
    action: { label: 'View Plans', href: '/admin/help/getting-started' }
  },
  {
    id: 'view-analytics',
    title: 'View Your Analytics (Premium/VIP)',
    description: 'Track profile views, website clicks, phone calls, and coupon redemptions.',
    phase: 4,
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    id: 'create-coupon',
    title: 'Create a Coupon (VIP Only)',
    description: 'Attract new customers with special offers and discounts. VIP members only.',
    phase: 4,
    icon: <Tag className="h-5 w-5" />
  }
]

const phases = [
  { number: 1, title: 'Create Account', description: 'Get started with your account', time: '5 minutes' },
  { number: 2, title: 'Submit Listing', description: 'Add your business information', time: '10-15 minutes' },
  { number: 3, title: 'Complete Profile', description: 'Enhance your listing', time: '15-20 minutes' },
  { number: 4, title: 'Maximize Visibility', description: 'Optional upgrades and features', time: 'Ongoing' }
]

export default function GettingStartedPage() {
  const [completedItems, setCompletedItems] = useState<string[]>([])
  const [pricing, setPricing] = useState<PricingData>({
    premiumPrice: 29,
    vipPrice: 97,
    isFoundingMemberActive: true,
    foundingMemberDeadline: '',
    foundingMemberLimit: 100,
    foundingMemberCurrent: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPricingData()
  }, [])

  const fetchPricingData = async () => {
    try {
      // Fetch system settings for pricing
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'premium_monthly_price',
          'premium_regular_price',
          'vip_monthly_price',
          'vip_regular_price',
          'founding_member_enabled',
          'founding_member_deadline',
          'founding_member_limit'
        ])

      const settingsMap = settings?.reduce((acc: any, s: any) => {
        acc[s.setting_key] = s.setting_value
        return acc
      }, {}) || {}

      // Check if founding member period is active
      const isEnabled = settingsMap.founding_member_enabled === 'true'
      const deadline = settingsMap.founding_member_deadline
      
      // Parse deadline - handle various date formats from database
      let isBeforeDeadline = false
      if (deadline) {
        // Try parsing as ISO string first, then as plain date
        const deadlineDate = new Date(deadline)
        const now = new Date()
        isBeforeDeadline = !isNaN(deadlineDate.getTime()) && now < deadlineDate
        
        // Debug logging
        console.log('Founding member deadline:', deadline)
        console.log('Parsed deadline:', deadlineDate)
        console.log('Current time:', now)
        console.log('Is before deadline:', isBeforeDeadline)
      }

      // Count current founding members
      const { count: foundingCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_member', true)
        .in('status', ['active', 'past_due', 'trialing'])

      const limit = parseInt(settingsMap.founding_member_limit || '100')
      const currentCount = foundingCount || 0
      const hasSpotsRemaining = currentCount < limit

      const isFoundingActive = isEnabled && isBeforeDeadline && hasSpotsRemaining

      // Use monthly prices from system settings (these are the founders rates)
      // Regular prices are used when founding member period ends
      const monthlyPremium = parseInt(settingsMap.premium_monthly_price || '29')
      const monthlyVIP = parseInt(settingsMap.vip_monthly_price || '97')
      const regularPremium = parseInt(settingsMap.premium_regular_price || '97')
      const regularVIP = parseInt(settingsMap.vip_regular_price || '297')

      console.log('Settings fetched:', {
        premium_monthly_price: settingsMap.premium_monthly_price,
        vip_monthly_price: settingsMap.vip_monthly_price,
        premium_regular_price: settingsMap.premium_regular_price,
        vip_regular_price: settingsMap.vip_regular_price,
        founding_member_enabled: settingsMap.founding_member_enabled,
        founding_member_deadline: settingsMap.founding_member_deadline,
        isEnabled,
        isBeforeDeadline,
        hasSpotsRemaining,
        isFoundingActive
      })

      setPricing({
        premiumPrice: isFoundingActive ? monthlyPremium : regularPremium,
        vipPrice: isFoundingActive ? monthlyVIP : regularVIP,
        isFoundingMemberActive: isFoundingActive,
        foundingMemberDeadline: deadline || '',
        foundingMemberLimit: limit,
        foundingMemberCurrent: currentCount
      })
    } catch (error) {
      console.error('Error fetching pricing:', error)
    }
    setLoading(false)
  }

  const toggleItem = (id: string) => {
    setCompletedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const progress = Math.round((completedItems.length / checklistItems.length) * 100)

  const remainingSpots = pricing.foundingMemberLimit - pricing.foundingMemberCurrent
  
  // Get regular prices for strikethrough display
  const [regularPrices, setRegularPrices] = useState({ premium: 97, vip: 297 })
  
  useEffect(() => {
    const fetchRegularPrices = async () => {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['premium_regular_price', 'vip_regular_price'])
      
      const settingsMap = settings?.reduce((acc: any, s: any) => {
        acc[s.setting_key] = s.setting_value
        return acc
      }, {}) || {}
      
      setRegularPrices({
        premium: parseInt(settingsMap.premium_regular_price || '97'),
        vip: parseInt(settingsMap.vip_regular_price || '297')
      })
    }
    fetchRegularPrices()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Getting Started Checklist</h1>
          <p className="text-slate-600">Complete these steps to get the most from your listing</p>
        </div>
        <Link href="/admin/help">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Help
          </Button>
        </Link>
      </div>

      {/* Progress */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Your Progress</h2>
              <p className="text-slate-600">
                {completedItems.length} of {checklistItems.length} steps completed
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-orange-600">{progress}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Founding Member Banner */}
      {pricing.isFoundingMemberActive && (
        <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 text-white p-2 rounded-full">
                <Star className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Founding Member Special</h3>
                <p className="text-sm text-amber-800">
                  Lock in these rates forever! Only {remainingSpots} spots remaining. 
                  Offer ends {new Date(pricing.foundingMemberDeadline).toLocaleDateString()}.
                </p>
              </div>
              <Badge className="bg-amber-500 text-white">Limited Time</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison */}
      <Card className="border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Plan Features Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free Plan */}
            <div className="border-2 border-slate-200 p-4 rounded-lg text-center">
              <Star className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <h3 className="font-semibold">Free</h3>
              <p className="text-2xl font-bold text-slate-900">$0</p>
              <p className="text-sm text-slate-600">/month</p>
              <ul className="text-sm text-slate-600 mt-4 space-y-1 text-left">
                <li>• 1 photo</li>
                <li>• Basic listing</li>
                <li>• Standard placement</li>
                <li>• Basic contact info</li>
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="border-2 border-blue-300 p-4 rounded-lg text-center bg-blue-50">
              <Zap className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Premium</h3>
              <div className="flex items-baseline justify-center gap-1">
                <p className="text-2xl font-bold text-blue-900">${pricing.premiumPrice}</p>
                <p className="text-sm text-blue-700">/month</p>
              </div>
              {pricing.isFoundingMemberActive && (
                <p className="text-xs text-blue-600 line-through">Regular: ${regularPrices.premium}/month</p>
              )}
              <ul className="text-sm text-blue-800 mt-4 space-y-1 text-left">
                <li>• 5 photos</li>
                <li>• Priority placement</li>
                <li>• Social media links</li>
                <li>• Analytics dashboard</li>
                <li>• "Premium" badge</li>
              </ul>
            </div>

            {/* VIP Plan */}
            <div className="border-2 border-purple-300 p-4 rounded-lg text-center bg-purple-50">
              <Crown className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">VIP</h3>
              <div className="flex items-baseline justify-center gap-1">
                <p className="text-2xl font-bold text-purple-900">${pricing.vipPrice}</p>
                <p className="text-sm text-purple-700">/month</p>
              </div>
              {pricing.isFoundingMemberActive && (
                <p className="text-xs text-purple-600 line-through">Regular: ${regularPrices.vip}/month</p>
              )}
              <ul className="text-sm text-purple-800 mt-4 space-y-1 text-left">
                <li>• 10 photos</li>
                <li>• Top placement</li>
                <li>• Video embed</li>
                <li>• Analytics dashboard</li>
                <li>• Coupons & offers</li>
                <li>• Homepage feature</li>
                <li>• Banner ads</li>
                <li>• "VIP" badge</li>
              </ul>
            </div>
          </div>

          {/* Feature Legend */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Feature Availability</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Premium includes:</span>
                <ul className="text-slate-600 mt-1 space-y-1">
                  <li>• Analytics dashboard</li>
                  <li>• Priority search placement</li>
                  <li>• Social media links</li>
                  <li>• Up to 5 photos</li>
                </ul>
              </div>
              <div>
                <span className="font-medium text-purple-700">VIP includes everything in Premium, plus:</span>
                <ul className="text-slate-600 mt-1 space-y-1">
                  <li>• Coupons & special offers</li>
                  <li>• Video embed</li>
                  <li>• Homepage featuring</li>
                  <li>• Banner advertising</li>
                  <li>• Up to 10 photos</li>
                </ul>
              </div>
              <div>
                <span className="font-medium text-slate-700">All paid plans include:</span>
                <ul className="text-slate-600 mt-1 space-y-1">
                  <li>• Enhanced analytics</li>
                  <li>• Priority support</li>
                  <li>• Custom CTA buttons</li>
                  <li>• Advanced listing options</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist by Phase */}
      {phases.map((phase) => {
        const phaseItems = checklistItems.filter(item => item.phase === phase.number)
        const phaseCompleted = phaseItems.filter(item => completedItems.includes(item.id)).length

        return (
          <Card key={phase.number} className="overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold">
                    {phase.number}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{phase.title}</CardTitle>
                    <p className="text-sm text-slate-600">{phase.description} • ~{phase.time}</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {phaseCompleted}/{phaseItems.length} done
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {phaseItems.map((item, index) => {
                const isCompleted = completedItems.includes(item.id)
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 ${
                      index !== phaseItems.length - 1 ? 'border-b border-slate-100' : ''
                    } ${isCompleted ? 'bg-green-50/50' : ''}`}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="mt-1"
                    />
                    <div className={`${isCompleted ? 'opacity-50' : ''} flex-1`}>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500">{item.icon}</span>
                        <h3 className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                      {item.action && (
                        <Link href={item.action.href}>
                          <Button variant="link" className="p-0 h-auto mt-2">
                            {item.action.label}
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Photo Requirements</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>Logo: 400x400 pixels (square)</li>
                <li>Gallery: 1200x800 pixels</li>
                <li>Format: JPG or PNG</li>
                <li>Max: 5MB per file</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Support Contact</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>Email: support@stlbusinessguide.com</li>
                <li>Response time: Within 24 hours</li>
                <li>Hours: Monday-Friday, 9am-5pm CT</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
