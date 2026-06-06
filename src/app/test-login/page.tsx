'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestLoginPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Login Test</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <div className="bg-emerald-100 p-4 rounded-lg">
                <p className="font-medium text-emerald-800">Logged in!</p>
                <p className="text-sm text-emerald-700">Email: {user.email}</p>
                <p className="text-sm text-emerald-700">Is Admin: {user.user_metadata?.is_admin ? 'Yes' : 'No'}</p>
                <p className="text-sm text-emerald-700">Role: {user.user_metadata?.role || 'None'}</p>
              </div>
              <div className="space-y-2">
                <a href="/admin" className="block">
                  <Button className="w-full">Go to Admin</Button>
                </a>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-100 p-4 rounded-lg">
                <p className="text-amber-800">Not logged in</p>
              </div>
              <a href="/login">
                <Button className="w-full">Go to Login</Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
