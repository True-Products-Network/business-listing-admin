'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  ArrowLeft, 
  AlertCircle,
  Mail,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PastDueSubscription {
  id: string
  business_id: string
  business_name: string
  email: string
  phone: string | null
  plan_key: string
  plan_name: string
  status: string
  amount_due: number
  current_period_end: string | null
  grace_period_ends_at: string | null
  days_past_due: number
  stripe_subscription_id: string | null
  created_at: string
}

export default function PastDuePage() {
  const [subscriptions, setSubscriptions] = useState<PastDueSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<PastDueSubscription | null>(null)
  const [reminderMessage, setReminderMessage] = useState('')
  const [reminderType, setReminderType] = useState<'0-7' | '7-14' | '21-cutoff'>('0-7')
  const [suspensionRisk, setSuspensionRisk] = useState<PastDueSubscription[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchPastDueSubscriptions()
  }, [])

  const fetchPastDueSubscriptions = async () => {
    try {
      setLoading(true)
      
      // Fetch subscriptions with past_due status
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          business_id,
          plan_key,
          status,
          current_period_end,
          grace_period_ends_at,
          stripe_subscription_id,
          created_at
        `)
        .eq('status', 'past_due')
        .order('grace_period_ends_at', { ascending: true })

      if (subsError) {
        console.error('Error fetching subscriptions:', subsError)
        setLoading(false)
        return
      }

      if (!subsData || subsData.length === 0) {
        setSubscriptions([])
        setSuspensionRisk([])
        setLoading(false)
        return
      }

      // Get business IDs
      const businessIds = subsData.map((sub: any) => sub.business_id)

      // Fetch business details
      const { data: businessesData, error: bizError } = await supabase
        .from('businesses')
        .select('id, business_name, email, phone')
        .in('id', businessIds)

      if (bizError) {
        console.error('Error fetching businesses:', bizError)
      }

      // Fetch plan details
      const { data: plansData, error: plansError } = await supabase
        .from('listing_plans')
        .select('plan_key, plan_name, monthly_price')

      if (plansError) {
        console.error('Error fetching plans:', plansError)
      }

      // Create lookup maps
      const businessMap = new Map()
      businessesData?.forEach((biz: any) => {
        businessMap.set(biz.id, biz)
      })

      const planMap = new Map()
      plansData?.forEach((plan: any) => {
        planMap.set(plan.plan_key, plan)
      })

      const now = new Date()
      const transformed: PastDueSubscription[] = subsData.map((sub: any) => {
        const business = businessMap.get(sub.business_id)
        const plan = planMap.get(sub.plan_key) || { plan_name: sub.plan_key || 'Unknown', monthly_price: 0 }
        
        // Calculate days past due
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null
        const daysPastDue = periodEnd 
          ? Math.floor((now.getTime() - periodEnd.getTime()) / (1000 * 60 * 60 * 24))
          : 0

        return {
          id: sub.id,
          business_id: sub.business_id,
          business_name: business?.business_name || 'Unknown Business',
          email: business?.email || '',
          phone: business?.phone || null,
          plan_key: sub.plan_key || 'unknown',
          plan_name: plan.plan_name,
          status: sub.status,
          amount_due: plan.monthly_price || 0,
          current_period_end: sub.current_period_end,
          grace_period_ends_at: sub.grace_period_ends_at,
          days_past_due: daysPastDue,
          stripe_subscription_id: sub.stripe_subscription_id,
          created_at: sub.created_at,
        }
      })

      // Sort by days past due (most overdue first)
      transformed.sort((a, b) => b.days_past_due - a.days_past_due)

      // Identify accounts at risk of suspension (grace period ending within 3 days or already ended)
      const atRisk = transformed.filter(sub => {
        if (!sub.grace_period_ends_at) return false
        const graceEnd = new Date(sub.grace_period_ends_at)
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000))
        return graceEnd <= threeDaysFromNow
      })

      setSubscriptions(transformed)
      setSuspensionRisk(atRisk)
    } catch (err: any) {
      console.error('Exception:', err)
    } finally {
      setLoading(false)
    }
  }

  const getReminderTemplate = (subscription: PastDueSubscription, type: '0-7' | '7-14' | '21-cutoff') => {
    const baseMessage = `Dear ${subscription.business_name},`
    
    switch (type) {
      case '0-7':
        return `${baseMessage}

This is a friendly reminder that your ${subscription.plan_name} subscription payment of $${subscription.amount_due} is now ${subscription.days_past_due} days past due.

To avoid any interruption to your listing, please update your payment information as soon as possible.

If you have any questions, please don't hesitate to contact us.

Best regards,
STL Business Guide Team`
      
      case '7-14':
        return `${baseMessage}

Your ${subscription.plan_name} subscription payment of $${subscription.amount_due} is now ${subscription.days_past_due} days past due.

This is an important notice. Your account is at risk of suspension if payment is not received within the next few days.

Please update your payment information immediately to avoid service interruption.

Best regards,
STL Business Guide Team`
      
      case '21-cutoff':
        return `${baseMessage}

URGENT: Your ${subscription.plan_name} subscription payment of $${subscription.amount_due} is now ${subscription.days_past_due} days past due.

This is your FINAL NOTICE. Your account will be suspended within 24-48 hours if payment is not received immediately.

To restore service, you will need to:
1. Update your payment information
2. Pay all outstanding balances
3. Contact support to reactivate your account

Please act now to avoid service interruption.

Best regards,
STL Business Guide Team`
    }
  }

  const openReminderDialog = (subscription: PastDueSubscription) => {
    setSelectedSubscription(subscription)
    // Determine default reminder type based on days past due
    let defaultType: '0-7' | '7-14' | '21-cutoff' = '0-7'
    if (subscription.days_past_due >= 21) {
      defaultType = '21-cutoff'
    } else if (subscription.days_past_due >= 7) {
      defaultType = '7-14'
    }
    setReminderType(defaultType)
    setReminderMessage(getReminderTemplate(subscription, defaultType))
    setReminderDialogOpen(true)
  }

  const handleReminderTypeChange = (type: '0-7' | '7-14' | '21-cutoff') => {
    setReminderType(type)
    if (selectedSubscription) {
      setReminderMessage(getReminderTemplate(selectedSubscription, type))
    }
  }

  const handleSendReminder = async () => {
    if (!selectedSubscription) return

    setSendingReminder(selectedSubscription.id)
    try {
      const response = await fetch('/api/admin/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: selectedSubscription.id,
          businessId: selectedSubscription.business_id,
          email: selectedSubscription.email,
          businessName: selectedSubscription.business_name,
          message: reminderMessage,
          amountDue: selectedSubscription.amount_due,
          daysPastDue: selectedSubscription.days_past_due,
          reminderType: reminderType,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send reminder')
      }

      setReminderDialogOpen(false)
      alert('Reminder sent successfully!')
    } catch (err: any) {
      console.error('Error sending reminder:', err)
      alert('Error sending reminder: ' + err.message)
    } finally {
      setSendingReminder(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getRiskLevel = (subscription: PastDueSubscription) => {
    if (!subscription.grace_period_ends_at) return { level: 'unknown', color: 'bg-slate-100 text-slate-800' }
    
    const graceEnd = new Date(subscription.grace_period_ends_at)
    const now = new Date()
    const daysUntilSuspension = Math.floor((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilSuspension < 0) {
      return { level: 'suspended', color: 'bg-red-100 text-red-800', text: 'Suspended' }
    } else if (daysUntilSuspension <= 3) {
      return { level: 'critical', color: 'bg-red-100 text-red-800', text: `${daysUntilSuspension} days left` }
    } else if (daysUntilSuspension <= 7) {
      return { level: 'high', color: 'bg-orange-100 text-orange-800', text: `${daysUntilSuspension} days left` }
    } else {
      return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', text: `${daysUntilSuspension} days left` }
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
          <h1 className="text-2xl font-bold text-slate-900">Past Due Accounts</h1>
          <p className="text-slate-600">
            Manage subscriptions with failed payments
            {subscriptions.length > 0 && (
              <span className="ml-2 text-sm">({subscriptions.length} accounts)</span>
            )}
          </p>
        </div>
        <Link href="/admin" className="inline-flex">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Suspension Risk Alert */}
      {suspensionRisk.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Accounts at Risk of Suspension</p>
                <p className="text-sm text-red-700 mt-1">
                  {suspensionRisk.length} account{suspensionRisk.length !== 1 ? 's' : ''} with grace period ending within 3 days or already expired.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Past Due</p>
                <p className="text-2xl font-bold text-slate-900">{subscriptions.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Amount Due</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(subscriptions.reduce((sum, sub) => sum + sub.amount_due, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">At Risk</p>
                <p className="text-2xl font-bold text-orange-600">{suspensionRisk.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Days Past Due</p>
                <p className="text-2xl font-bold text-slate-900">
                  {subscriptions.length > 0 
                    ? Math.round(subscriptions.reduce((sum, sub) => sum + sub.days_past_due, 0) / subscriptions.length)
                    : 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Past Due List */}
      {subscriptions.length > 0 ? (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const risk = getRiskLevel(subscription)
            return (
              <Card key={subscription.id} className={risk.level === 'critical' || risk.level === 'suspended' ? 'border-red-300' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Business Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <h3 className="font-medium text-slate-900">{subscription.business_name}</h3>
                        <Badge className={risk.color}>{risk.text}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{subscription.email}</p>
                      {subscription.phone && (
                        <p className="text-sm text-slate-500">{subscription.phone}</p>
                      )}
                    </div>

                    {/* Plan & Amount */}
                    <div className="flex items-center gap-6 lg:justify-end">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase">Plan</p>
                        <Badge variant="outline">{subscription.plan_name}</Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase">Amount Due</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(subscription.amount_due)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase">Days Past Due</p>
                        <p className={`font-semibold ${subscription.days_past_due > 30 ? 'text-red-600' : 'text-slate-900'}`}>
                          {subscription.days_past_due}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase">Period Ended</p>
                        <p className="text-sm text-slate-600">{formatDate(subscription.current_period_end)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase">Grace Ends</p>
                        <p className="text-sm text-slate-600">{formatDate(subscription.grace_period_ends_at)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReminderDialog(subscription)}
                        disabled={sendingReminder === subscription.id}
                      >
                        {sendingReminder === subscription.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        Send Reminder
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Past Due Accounts</h3>
            <p className="text-slate-600 mt-1">All subscriptions are current. Great job!</p>
          </CardContent>
        </Card>
      )}

      {/* Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Payment Reminder
            </DialogTitle>
            <DialogDescription>
              Send a reminder email to {selectedSubscription?.business_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-3 rounded-lg text-sm">
              <p><strong>To:</strong> {selectedSubscription?.email}</p>
              <p><strong>Amount Due:</strong> {selectedSubscription && formatCurrency(selectedSubscription.amount_due)}</p>
              <p><strong>Days Past Due:</strong> {selectedSubscription?.days_past_due}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-2">
                Reminder Type
              </label>
              <Select value={reminderType} onValueChange={(value) => value && handleReminderTypeChange(value as '0-7' | '7-14' | '21-cutoff')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reminder type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-7">Friendly Reminder (0-7 days)</SelectItem>
                  <SelectItem value="7-14">Urgent Notice (7-14 days)</SelectItem>
                  <SelectItem value="21-cutoff">Final Notice - Cutoff (21+ days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="reminderMessage" className="text-sm font-medium block mb-2">
                Message
              </label>
              <Textarea
                id="reminderMessage"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                rows={8}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendReminder}
              disabled={!reminderMessage.trim() || sendingReminder !== null}
              className="bg-gradient-to-r from-[#ffc107] to-[#f68712]"
            >
              {sendingReminder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}