'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  Clock, 
  XCircle,
  Crown, 
  Users,
  Settings,
  Ticket,
  Image,
  BarChart3,
  FileText,
  Newspaper
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/listings', label: 'All Listings', icon: Building2 },
  { href: '/admin/listings/pending', label: 'Pending Review', icon: Clock },
  { href: '/admin/listings/rejected', label: 'Rejected', icon: XCircle },
  { href: '/admin/claims', label: 'Claim Requests', icon: FileText },
  { href: '/admin/upgrade-requests', label: 'Upgrade Requests', icon: Crown },
  { href: '/admin/coupons', label: 'Coupon Mania', icon: Ticket },
  { href: '/admin/banner-ads', label: 'Banner Ads', icon: Image },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)]">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}