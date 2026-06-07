'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Search,
  HelpCircle,
  BookOpen,
  CheckCircle,
  FileText,
  Mail,
  Phone,
  Building2,
  CreditCard,
  Tag,
  TrendingUp,
  Settings,
} from 'lucide-react'
import Link from 'next/link'

const helpCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: CheckCircle,
    articles: [
      {
        id: 'create-account',
        title: 'How do I create an account?',
        content: 'Go to stlbusinessguide.com/submit and click Submit Your Business. Enter your email, create a password, and verify your email address. Use an email you check regularly for notifications.'
      },
      {
        id: 'submit-listing',
        title: 'How do I submit my business listing?',
        content: 'Log in, click Submit New Listing, enter your business name, select a category, add your address and phone, write a description, upload a photo, and submit for approval. Takes 10-15 minutes.'
      },
      {
        id: 'approval-time',
        title: 'How long does approval take?',
        content: 'Most listings are reviewed within 1-2 business days. You will receive an email when approved, if we need more info, or if rejected with an explanation.'
      },
      {
        id: 'why-rejected',
        title: 'Why was my listing rejected?',
        content: 'Common reasons: incomplete information, wrong category, low-quality photo, broken website link, cannot verify business, or duplicate listing. You will get an email explaining what to fix.'
      }
    ]
  },
  {
    id: 'managing-listing',
    title: 'Managing Your Listing',
    icon: Building2,
    articles: [
      {
        id: 'edit-listing',
        title: 'How do I edit my listing?',
        content: 'Log in, go to My Listing, click Edit, make your changes, and save. Most changes appear immediately. Category changes may require admin review.'
      },
      {
        id: 'photo-requirements',
        title: 'What are the photo requirements?',
        content: 'Logo: 400x400 pixels, square. Gallery: 1200x800 pixels, landscape. Format: JPG or PNG. Max 5MB per file. Free: 1 photo, Premium: 5 photos, VIP: 10 photos.'
      },
      {
        id: 'write-description',
        title: 'What should I write in my description?',
        content: 'Short description (50-100 words): What you do and who you serve. Long description (up to 500 words): Your story, services, experience. Include keywords customers search for.'
      },
      {
        id: 'change-category',
        title: 'How do I change my business category?',
        content: 'Log in, go to My Listing, click Edit, find the Category dropdown, select your new category, and save. Changes may require admin review. Email support if you need a new category added.'
      }
    ]
  },
  {
    id: 'plans-billing',
    title: 'Plans & Billing',
    icon: CreditCard,
    articles: [
      {
        id: 'plan-differences',
        title: 'What are the differences between plans?',
        content: 'Free: Basic info, 1 photo, standard placement. Premium ($97/month): 5 photos, priority placement, social links, coupons. VIP ($297/month): 10 photos, top placement, video, banner ads, homepage feature.'
      },
      {
        id: 'how-to-upgrade',
        title: 'How do I upgrade my plan?',
        content: 'Log in, go to My Listing, click Upgrade Plan, select Premium or VIP, enter payment info, and confirm. Features activate immediately. Receipt sent by email.'
      },
      {
        id: 'cancel-subscription',
        title: 'How do I cancel or downgrade?',
        content: 'Log in, go to Account Settings, click Cancel Subscription or Change Plan. Or email support@stlbusinessguide.com. Your plan stays active until the end of the billing period.'
      },
      {
        id: 'refund-policy',
        title: 'What is your refund policy?',
        content: 'Monthly plans: Cancel anytime, no refunds for current month. Annual plans: 30-day money-back guarantee. Founding member rates are lost if you cancel.'
      }
    ]
  },
  {
    id: 'coupons',
    title: 'Coupons & Offers',
    icon: Tag,
    articles: [
      {
        id: 'who-can-create-coupons',
        title: 'Who can create coupons?',
        content: 'Premium and VIP members can create unlimited coupons. Free listings cannot offer coupons. Upgrade to unlock this feature.'
      },
      {
        id: 'create-coupon',
        title: 'How do I create a coupon?',
        content: 'Log in, click Coupons, click New Coupon, enter title and description, set discount, set expiration date (30-90 days recommended), set usage limits, and create. Coupon appears immediately.'
      },
      {
        id: 'how-customers-redeem',
        title: 'How do customers redeem coupons?',
        content: 'Digital: Customer shows code on phone, you verify and mark used. Printed: Customer brings printed coupon, you collect it. You control the redemption rules.'
      },
      {
        id: 'coupon-limits',
        title: 'Can I limit how many times a coupon is used?',
        content: 'Yes. Set Total Available for maximum redemptions overall. Set Per Customer Limit for how many times one person can use it (usually 1).'
      }
    ]
  },
  {
    id: 'visibility',
    title: 'Visibility & Search',
    icon: TrendingUp,
    articles: [
      {
        id: 'rank-higher',
        title: 'How do I rank higher in search results?',
        content: 'Three factors: 1) Plan type (VIP first, Premium second, Free third), 2) Completeness (full listings rank higher), 3) Relevance (matching search terms). Upgrade your plan, add photos, complete all fields, use keywords.'
      },
      {
        id: 'what-areas-covered',
        title: 'What areas does STL Business Guide cover?',
        content: 'Greater St. Louis region: St. Louis City, St. Louis County, St. Charles County, Jefferson County MO, and Madison County, St. Clair County IL.'
      },
      {
        id: 'track-performance',
        title: 'Can I track my listing performance?',
        content: 'Premium and VIP members can view analytics: profile views, website clicks, phone clicks, coupon views, and coupon redemptions. Access from your dashboard.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Technical',
    icon: Settings,
    articles: [
      {
        id: 'forgot-password',
        title: 'I forgot my password',
        content: 'Go to login page, click Forgot Password, enter your email, check email for reset link, click link and create new password. Check spam folder if email does not arrive.'
      },
      {
        id: 'not-receiving-emails',
        title: 'I am not receiving emails',
        content: 'Check spam/junk folder. Add noreply@stlbusinessguide.com to contacts. Check if inbox is full. Verify email address in account settings. Contact support if still not working.'
      },
      {
        id: 'photos-wont-upload',
        title: 'My photos will not upload',
        content: 'Check: file under 5MB, JPG or PNG format, file not corrupted, try different browser, check internet speed. Email photo to support if still having trouble.'
      },
      {
        id: 'claim-listing',
        title: 'How do I claim a listing for my business?',
        content: 'Search for your business, click Claim This Listing, create account or log in, submit claim request, provide proof of ownership (license, utility bill), wait 1-2 days for approval.'
      },
      {
        id: 'delete-listing',
        title: 'How do I delete my listing?',
        content: 'Email support@stlbusinessguide.com with business name and account email. We process deletions within 48 hours. Or pause your listing instead: Log in - My Listing - Settings - Pause.'
      }
    ]
  }
]

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = searchQuery
    ? helpCategories.map(category => ({
        ...category,
        articles: category.articles.filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.articles.length > 0)
    : helpCategories

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Help Center</h1>
        <p className="text-slate-600">Find answers and get support</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search for help... (e.g., 'how do I upgrade', 'photo requirements')"
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Email Support</h3>
                <p className="text-sm text-slate-600 mt-1">support@stlbusinessguide.com</p>
                <p className="text-xs text-slate-500 mt-1">Response within 24 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100 hover:border-green-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Getting Started Guide</h3>
                <p className="text-sm text-slate-600 mt-1">New to the directory?</p>
                <Link href="/admin/help/getting-started">
                  <Button variant="link" className="p-0 h-auto text-green-600">
                    View Checklist
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Full FAQ</h3>
                <p className="text-sm text-slate-600 mt-1">Browse all questions</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-purple-600"
                  onClick={() => setSearchQuery('')}
                >
                  View All Topics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.id} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-orange-500" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.articles.map((article) => (
                    <AccordionItem key={article.id} value={article.id}>
                      <AccordionTrigger className="text-left text-sm hover:no-underline">
                        {article.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 text-sm">
                        {article.content}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCategories.length === 0 && (
        <Card className="p-12 text-center">
          <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
          <p className="text-slate-600 mb-4">Try different keywords or contact support</p>
          <Button 
            variant="outline" 
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </Button>
        </Card>
      )}
    </div>
  )
}
