'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  LucideIcon,
  Home,
  LayoutDashboard,
  Building2,
  Clock,
  XCircle,
  CheckCircle,
  Crown,
  Users,
  Settings,
  Ticket,
  Image,
  BarChart3,
  FileText,
  Newspaper,
  DollarSign,
  Key,
  Upload,
  Quote,
  HelpCircle,
  AlertCircle,
  Tag,
  List,
  Star,
  Zap,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  ChartPie,
  Filter,
  Search,
  Edit,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Icon mapping for dynamic icons
const iconMap: Record<string, LucideIcon> = {
  Home, LayoutDashboard, Building2, Clock, XCircle, CheckCircle,
  Tag, FileText, Crown, Upload, Ticket, Image, Newspaper,
  Quote, HelpCircle, Users, DollarSign, AlertCircle, BarChart3,
  Settings, Key, List, Star, Zap, Mail, Phone,
  MapPin, Globe, Calendar, ChartPie, Filter, Search, Edit,
  Trash2, Plus, Minus, ChevronRight, ChevronLeft, ChevronDown,
  ChevronUp, Menu, X, Check, Info, AlertTriangle,
  Eye, EyeOff
}

interface NavigationConfig {
  menu_key: string
  label: string
  href: string
  icon_name: string
  category: string
  category_label: string
  category_order: number
  item_order: number
  is_visible: boolean
  required_role: string | null
  show_badge: boolean
  badge_count?: number
}

interface NavCategory {
  label: string
  order: number
  items: NavigationConfig[]
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [navCategories, setNavCategories] = useState<NavCategory[]>([])
  const [navLoading, setNavLoading] = useState(true)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchNavigation()
  }, [])

  const checkAuth = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      const admin = data.user.user_metadata?.is_admin === true || 
                    data.user.user_metadata?.role === 'admin' || 
                    data.user.user_metadata?.role === 'super_admin'
      setIsAdmin(admin)
      setUser(data.user)
      
      // Get user role from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_user_id', data.user.id)
        .single()
      
      if (profile) {
        setUserRole(profile.role)
      }
    }
    setLoading(false)
  }

  const fetchNavigation = async () => {
    try {
      const response = await fetch('/api/admin/navigation-configs')
      const data = await response.json()
      
      if (data.success) {
        // Group by category
        const grouped: Record<string, NavCategory> = data.configs.reduce((acc: Record<string, NavCategory>, config: NavigationConfig) => {
          if (!acc[config.category]) {
            acc[config.category] = {
              label: config.category_label || config.category,
              order: config.category_order,
              items: []
            }
          }
          acc[config.category].items.push(config)
          return acc
        }, {})

        // Convert to array and sort
        const categories: NavCategory[] = Object.values(grouped)
          .sort((a, b) => a.order - b.order)
          .map((cat) => ({
            ...cat,
            items: cat.items
              .filter((item) => item.is_visible)
              .sort((a, b) => a.item_order - b.item_order)
          }))

        setNavCategories(categories)
      }
    } catch (err) {
      console.error('Error fetching navigation:', err)
    }
    setNavLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Check if user can see menu item based on role
  const canSeeItem = (item: NavigationConfig): boolean => {
    if (!item.required_role) return true
    if (item.required_role === 'super_admin') return userRole === 'super_admin'
    if (item.required_role === 'admin') return userRole === 'admin' || userRole === 'super_admin'
    return true
  }

  // Get current page label from navigation
  const getCurrentPageLabel = (): string => {
    for (const category of navCategories) {
      const item = category.items.find(item => 
        pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
      if (item) return item.label
    }
    return 'Admin'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-4">You must be logged in as an admin to view this page.</p>
          <a href="/login">
            <Button>Go to Login</Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/admin" className="font-bold text-xl flex items-center gap-2">
            <img src="/images/logo.svg" alt="Business Directory" className="h-8 w-auto brightness-0 invert" />
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            navCategories.map((category) => (
              <div key={category.label}>
                <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {category.label}
                </h3>
                <div className="space-y-1">
                  {category.items
                    .filter(canSeeItem)
                    .map((item) => {
                      const Icon = iconMap[item.icon_name] || Settings
                      const isParentRoute = item.href === '/admin/listings'
                      const isActive = isParentRoute 
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(`${item.href}/`)
                      
                      return (
                        <Link
                          key={item.menu_key}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive 
                              ? 'bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white' 
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          )}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate flex-1">{item.label}</span>
                          {item.show_badge && item.badge_count !== undefined && item.badge_count > 0 && (
                            <Badge className="bg-white text-slate-900 text-xs px-1.5 py-0 min-w-[1.25rem] flex items-center justify-center">
                              {item.badge_count}
                            </Badge>
                          )}
                          {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                        </Link>
                      )
                    })}
                </div>
              </div>
            ))
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium">{user.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-slate-500 capitalize">{userRole || 'Administrator'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
              {getCurrentPageLabel()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
