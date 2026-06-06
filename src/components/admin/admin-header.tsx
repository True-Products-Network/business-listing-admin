'use client'

import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, Shield } from 'lucide-react'

interface AdminHeaderProps {
  user: User
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-emerald-400" />
        <div>
          <h1 className="font-semibold">Admin Dashboard</h1>
          <p className="text-xs text-slate-400">Business Listing Manager</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</p>
          <p className="text-xs text-slate-400 capitalize">{user.user_metadata?.role || 'Admin'}</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  )
}