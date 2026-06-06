'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Users,
  User,
  Mail,
  Shield,
  Crown,
  Building2,
  Search,
  Edit,
  Eye,
  X,
  Check,
  Trash2
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

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'super_admin' | 'visitor' | 'business_owner' | 'premium_owner' | 'vip_owner'
  created_at: string
  last_sign_in_at: string
  business_count: number
  businesses: {
    id: string
    business_name: string
    status: string
  }[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'business_owner' | 'visitor'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [viewingBusinesses, setViewingBusinesses] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [roleFilter, searchQuery, users])

  async function loadUsers() {
    try {
      // Get profiles with business count and businesses
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Get all businesses with owner info
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, owner_profile_id, business_name, status')

      // Group businesses by user
      const userBusinesses: Record<string, { id: string; business_name: string; status: string }[]> = {}
      businesses?.forEach((b: any) => {
        if (!userBusinesses[b.owner_profile_id]) {
          userBusinesses[b.owner_profile_id] = []
        }
        userBusinesses[b.owner_profile_id].push({
          id: b.id,
          business_name: b.business_name,
          status: b.status
        })
      })

      const transformed = profiles?.map((profile: any) => ({
        ...profile,
        business_count: userBusinesses[profile.id]?.length || 0,
        businesses: userBusinesses[profile.id] || [],
      })) || []

      setUsers(transformed)
    } catch (err: any) {
      console.error('Error loading users:', err)
      setError('Failed to load users')
    }
    setLoading(false)
  }

  function filterUsers() {
    let filtered = users

    if (roleFilter !== 'all') {
      if (roleFilter === 'admin') {
        filtered = filtered.filter((u) => u.role === 'admin' || u.role === 'super_admin')
      } else if (roleFilter === 'business_owner') {
        filtered = filtered.filter((u) => u.role === 'business_owner' || u.role === 'premium_owner' || u.role === 'vip_owner')
      } else if (roleFilter === 'visitor') {
        filtered = filtered.filter((u) => u.role === 'visitor')
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.email?.toLowerCase().includes(query) ||
          u.full_name?.toLowerCase().includes(query)
      )
    }

    setFilteredUsers(filtered)
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (err: any) {
      alert('Error updating role: ' + err.message)
    }
  }

  async function updateUserName(userId: string, newName: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', userId)

      if (error) throw error
      setEditingUser(null)
      await loadUsers()
    } catch (err: any) {
      alert('Error updating name: ' + err.message)
    }
  }

  async function deleteUser(user: UserProfile) {
    setDeleting(true)
    try {
      // Delete from profiles (this will cascade to auth.users via trigger or you may need to delete from auth separately)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (error) throw error

      // Also delete from auth.users using admin API
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        console.warn('Auth user may not have been deleted, but profile was removed')
      }

      setDeleteDialogOpen(false)
      setUserToDelete(null)
      await loadUsers()
    } catch (err: any) {
      console.error('Error deleting user:', err)
      alert('Error deleting user: ' + err.message)
    }
    setDeleting(false)
  }

  const openDeleteDialog = (user: UserProfile) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
    businessOwners: users.filter((u) => u.role === 'business_owner' || u.role === 'premium_owner' || u.role === 'vip_owner').length,
    visitors: users.filter((u) => u.role === 'visitor').length,
  }

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800',
    admin: 'bg-red-100 text-red-800',
    vip_owner: 'bg-indigo-100 text-indigo-800',
    premium_owner: 'bg-blue-100 text-blue-800',
    business_owner: 'bg-blue-100 text-blue-800',
    visitor: 'bg-slate-100 text-slate-800',
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'admin':
        return 'Admin'
      case 'vip_owner':
        return 'VIP Owner'
      case 'premium_owner':
        return 'Premium Owner'
      case 'business_owner':
        return 'Business Owner'
      case 'visitor':
        return 'Visitor'
      default:
        return role
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
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-600">Manage user accounts and roles</p>
        </div>
        <Link href="/admin" className="inline-flex">
          <Button className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white hover:opacity-90 border-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Stats - 4 cards including Visitors */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Business Owners</p>
                <p className="text-2xl font-bold text-blue-600">{stats.businessOwners}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Visitors</p>
                <p className="text-2xl font-bold text-slate-600">{stats.visitors}</p>
              </div>
              <User className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Added Visitor filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'admin', 'business_owner', 'visitor'] as const).map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                >
                  {role === 'all' ? 'All' : role === 'admin' ? 'Admin' : role === 'business_owner' ? 'Business Owner' : 'Visitors'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">User</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Businesses</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            {editingUser === user.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="border rounded px-2 py-1 text-sm"
                                  placeholder="Full name"
                                />
                                <Button
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => updateUserName(user.id, editName)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditingUser(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-slate-900">{user.full_name || 'No Name'}</p>
                                  <button
                                    onClick={() => {
                                      setEditingUser(user.id)
                                      setEditName(user.full_name || '')
                                    }}
                                    className="text-slate-400 hover:text-slate-600"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="text-sm text-slate-500">{user.email}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={roleColors[user.role] || 'bg-slate-100 text-slate-800'}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900">{user.business_count}</span>
                          {user.business_count > 0 && (
                            <button
                              onClick={() => setViewingBusinesses(viewingBusinesses === user.id ? null : user.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              {viewingBusinesses === user.id ? 'Hide' : 'View'}
                            </button>
                          )}
                        </div>
                        {/* Business Listings Dropdown */}
                        {viewingBusinesses === user.id && user.businesses.length > 0 && (
                          <div className="mt-2 p-2 bg-slate-50 rounded border">
                            <p className="text-xs font-medium text-slate-500 mb-1">Business Listings:</p>
                            {user.businesses.map((biz) => (
                              <div key={biz.id} className="flex items-center justify-between py-1">
                                <span className="text-sm text-slate-700">{biz.business_name}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    biz.status === 'active' ? 'border-green-200 text-green-700' : 
                                    biz.status === 'pending' ? 'border-amber-200 text-amber-700' : 
                                    'border-slate-200 text-slate-600'
                                  }`}
                                >
                                  {biz.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role || 'visitor'}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="visitor">Visitor</option>
                            <option value="business_owner">Business Owner</option>
                            <option value="premium_owner">Premium Owner</option>
                            <option value="vip_owner">VIP Owner</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          {/* Delete button for visitors only */}
                          {user.role === 'visitor' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => openDeleteDialog(user)}
                              title="Delete visitor"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900">No users found</h3>
                      <p className="text-slate-600 mt-1">
                        {searchQuery ? 'No users match your search' : 'No users in the system'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Visitor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.full_name || userToDelete?.email}</strong>?
              <br /><br />
              This will permanently remove this visitor account. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => userToDelete && deleteUser(userToDelete)}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Visitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
