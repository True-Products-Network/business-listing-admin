import { createClient as createClientFn } from '@supabase/supabase-js'

// Supabase configuration - fetched from environment variables or integration configs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase client
export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build/prerender, return a dummy client that will fail gracefully
    if (typeof window === 'undefined') {
      return createClientFn('https://placeholder.supabase.co', 'placeholder-key')
    }
    throw new Error('Supabase URL and Anon Key must be configured in environment variables')
  }
  return createClientFn(supabaseUrl, supabaseAnonKey)
}

// Function to fetch Supabase credentials from integration configs
export async function getSupabaseConfigFromIntegration() {
  // This is used as a fallback when env vars are not available
  // It fetches from the integration_configs table
  const response = await fetch('/api/integration-configs/supabase')
  if (!response.ok) {
    return null
  }
  return response.json()
}

// Server-side Supabase client with service role (for admin operations)
// Service key should only be used server-side, never expose to client!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceKey 
  ? createClientFn(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// ============================================================
// NEW SCHEMA TYPES
// ============================================================

// Profiles table (user management)
export interface Profile {
  id: string
  auth_user_id: string | null
  full_name: string | null
  email: string
  phone: string | null
  role: 'visitor' | 'business_owner' | 'premium_owner' | 'vip_owner' | 'admin' | 'super_admin'
  created_at: string
  updated_at: string
}

// Businesses table (core business data)
export interface Business {
  id: string
  owner_profile_id: string | null
  business_name: string
  slug: string
  description_short: string | null
  description_long: string | null
  phone: string | null
  email: string | null
  website_url: string | null
  logo_url: string | null
  status: 'draft' | 'pending' | 'active' | 'paused' | 'archived'
  created_at: string
  updated_at: string
}

// Business Locations table
export interface BusinessLocation {
  id: string
  business_id: string
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  county: string | null
  service_area: string | null
  latitude: number | null
  longitude: number | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

// Categories table
export interface Category {
  id: string
  name: string
  slug: string
  parent_category_id: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// Business Categories join table
export interface BusinessCategory {
  business_id: string
  category_id: string
  is_primary: boolean
  created_at: string
}

// Listing Plans table (Free/Premium/VIP)
export interface ListingPlan {
  id: string
  plan_key: string
  plan_name: string
  monthly_price: number
  yearly_price: number
  max_images: number
  allows_coupon: boolean
  allows_video: boolean
  allows_banner_ads: boolean
  allows_social_links: boolean
  allows_priority_placement: boolean
  featured_priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Business Listings table (plan/status) - Extended for admin use
export interface BusinessListing {
  id: string
  business_id: string
  plan_id: string | null
  listing_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'paused' | 'expired' | 'archived'
  start_date: string | null
  end_date: string | null
  is_featured: boolean
  sort_priority: number
  cta_button_text: string | null
  cta_button_url: string | null
  video_url: string | null
  facebook_url: string | null
  linkedin_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  created_at: string
  updated_at: string
  // Join fields (from views)
  business_name?: string
  slug?: string
  description_short?: string | null
  description_long?: string | null
  description?: string | null  // Alias for backwards compatibility
  phone?: string | null
  email?: string | null
  website_url?: string | null
  website?: string | null  // Alias for backwards compatibility
  logo_url?: string | null
  plan_key?: string
  plan_name?: string
  city?: string | null
  state?: string | null
  zip_code?: string | null
  zip?: string | null  // Alias for backwards compatibility
  primary_category?: string | null
  category?: string | null  // Alias for backwards compatibility
  // Admin fields
  contact_name?: string | null
  address?: string | null
  address_line_1?: string | null
  tier?: string | null
  status?: string | null  // Alias for listing_status
  submitted_at?: string | null
  reviewed_at?: string | null
  notes?: string | null
  ghl_contact_id?: string | null
  ghl_opportunity_id?: string | null
}

// Listing Submissions table (approval workflow)
export interface ListingSubmission {
  id: string
  business_id: string
  submitted_by_profile_id: string | null
  requested_plan_key: string | null
  submission_status: 'started' | 'submitted' | 'under_review' | 'needs_edits' | 'approved' | 'rejected' | 'abandoned'
  admin_notes: string | null
  submitted_at: string
  reviewed_at: string | null
  reviewed_by_profile_id: string | null
  created_at: string
  updated_at: string
  // Join fields (from views)
  business_name?: string
  slug?: string
  submitted_by_name?: string | null
  submitted_by_email?: string | null
  requested_plan?: string | null
}

// Business Images table
export interface BusinessImage {
  id: string
  business_id: string
  image_url: string
  image_type: 'logo' | 'gallery' | 'banner' | 'coupon'
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

// Coupons table
export interface Coupon {
  id: string
  business_id: string
  coupon_title: string
  coupon_description: string | null
  coupon_code: string | null
  destination_url: string | null
  start_date: string | null
  expiration_date: string | null
  status: 'draft' | 'pending' | 'active' | 'expired' | 'paused' | 'rejected'
  created_at: string
  updated_at: string
}

// Banner Ads table
export interface BannerAd {
  id: string
  business_id: string
  ad_title: string | null
  image_url: string
  destination_url: string | null
  placement_area: string | null
  start_date: string | null
  end_date: string | null
  status: 'draft' | 'pending' | 'active' | 'paused' | 'expired' | 'rejected'
  created_at: string
  updated_at: string
}

// Admin Activity Log table
export interface AdminActivityLog {
  id: string
  admin_profile_id: string | null
  action_type: string
  entity_type: string
  entity_id: string | null
  notes: string | null
  created_at: string
}

// Integration Configs table
export interface IntegrationConfig {
  id: string
  category: string
  config_key: string
  config_value: string | null
  description: string | null
  is_sensitive: boolean
  is_required: boolean
  last_updated_by: string | null
  created_at: string
  updated_at: string
}

// Public Approved Listings View
export interface PublicApprovedListing {
  id: string
  business_name: string
  slug: string
  description_short: string | null
  description_long: string | null
  phone: string | null
  email: string | null
  website_url: string | null
  logo_url: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  service_area: string | null
  primary_category: string | null
  plan_key: string
  plan_name: string
  listing_status: string
  is_featured: boolean
  sort_priority: number
  video_url: string | null
  facebook_url: string | null
  linkedin_url: string | null
  instagram_url: string | null
  youtube_url: string | null
}

// Admin Pending Submissions View
export interface AdminPendingSubmission {
  submission_id: string
  submission_status: string
  submitted_at: string
  admin_notes: string | null
  business_id: string
  business_name: string
  slug: string
  phone: string | null
  email: string | null
  website_url: string | null
  submitted_by_name: string | null
  submitted_by_email: string | null
  requested_plan: string | null
}

// ============================================================
// LEGACY TYPES (for backward compatibility during migration)
// ============================================================

export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'premium' | 'vip'
export type ListingTier = 'free' | 'premium' | 'vip'

// Legacy BusinessListing interface (for compatibility)
export interface LegacyBusinessListing {
  id: string
  business_name: string
  contact_name?: string
  email: string
  phone: string
  website?: string | null
  website_url?: string | null
  description?: string
  description_long?: string | null
  category?: string
  primary_category?: string | null
  address?: string
  city?: string | null
  state?: string | null
  zip?: string
  zip_code?: string | null
  status?: string
  listing_status?: string
  tier?: string
  plan_key?: string
  plan_name?: string
  logo_url?: string | null
  submitted_at?: string
  reviewed_at?: string | null
  notes?: string | null
  is_featured?: boolean
  sort_priority?: number
  ghl_contact_id?: string | null
  ghl_opportunity_id?: string | null
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'super_admin'
  created_at: string
  last_login: string | null
}

export interface AuditLog {
  id: string
  listing_id: string
  action: 'submitted' | 'approved' | 'rejected' | 'edited' | 'upgraded' | 'deleted'
  performed_by: string | null
  performed_by_email: string | null
  details: Record<string, any>
  created_at: string
}
