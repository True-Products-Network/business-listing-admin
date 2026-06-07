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
  Crown
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

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
    description: 'Premium and VIP plans get priority placement, more photos, coupons, and better visibility.',
    phase: 4,
    icon: <CreditCard className="h-5 w-5" />,
    action: { label: 'View Plans', href: '/admin/help/plans' }
  },
  {
    id: 'create-coupon',
    title: 'Create a Coupon (Premium/VIP)',
    description: 'Attract new customers with a special offer or discount.',
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

  const toggleItem = (id: string) => {
    setCompletedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const progress = Math.round((completedItems.length / checklistItems.length) * 100)

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

      {/* Plan Comparison */}
      <Card className="border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Plan Features Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-slate-200 p-4 rounded-lg text-center">
              <Star className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <h3 className="font-semibold">Free</h3>
              <p className="text-2xl font-bold text-slate-900">$0</p>
              <p className="text-sm text-slate-600">/month</p>
              <ul className="text-sm text-slate-600 mt-4 space-y-1 text-left">
                <li>• 1 photo</li>
                <li>• Basic listing</li>
                <li>• Standard placement</li>
              </ul>
            </div>
            <div className="border-2 border-blue-300 p-4 rounded-lg text-center bg-blue-50">
              <Zap className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Premium</h3>
              <p className="text-2xl font-bold text-blue-900">$97</p>
              <p className="text-sm text-blue-700">/month</p>
              <ul className="text-sm text-blue-800 mt-4 space-y-1 text-left">
                <li>• 5 photos</li>
                <li>• Priority placement</li>
                <li>• Coupons</li>
                <li>• Social links</li>
              </ul>
            </div>
            <div className="border-2 border-purple-300 p-4 rounded-lg text-center bg-purple-50">
              <Crown className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">VIP</h3>
              <p className="text-2xl font-bold text-purple-900">$297</p>
              <p className="text-sm text-purple-700">/month</p>
              <ul className="text-sm text-purple-800 mt-4 space-y-1 text-left">
                <li>• 10 photos</li>
                <li>• Top placement</li>
                <li>• Video embed</li>
                <li>• Homepage feature</li>
                <li>• Banner ads</li>
              </ul>
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
