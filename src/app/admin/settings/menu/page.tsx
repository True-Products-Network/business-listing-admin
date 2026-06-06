'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Settings,
  AlertCircle,
  CheckCircle,
  X,
  Search
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Available Lucide icons (common ones)
const availableIcons = [
  'Home', 'LayoutDashboard', 'Building2', 'Clock', 'XCircle', 'CheckCircle',
  'Tag', 'FileText', 'Crown', 'Upload', 'Ticket', 'Image', 'Newspaper',
  'Quote', 'HelpCircle', 'Users', 'DollarSign', 'AlertCircle', 'BarChart3',
  'Settings', 'Key', 'List', 'FileText', 'Star', 'Zap', 'Mail', 'Phone',
  'MapPin', 'Globe', 'Calendar', 'ChartPie', 'Filter', 'Search', 'Edit',
  'Trash2', 'Plus', 'Minus', 'ChevronRight', 'ChevronLeft', 'ChevronDown',
  'ChevronUp', 'Menu', 'X', 'Check', 'Info', 'Warning', 'AlertTriangle'
]

interface NavigationConfig {
  id: string
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
  badge_source: string | null
  highlight_color: string | null
  description: string | null
  badge_count?: number
}

export default function MenuManagementPage() {
  const [configs, setConfigs] = useState<NavigationConfig[]>([])
  const [groupedConfigs, setGroupedConfigs] = useState<Record<string, NavigationConfig[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<NavigationConfig | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // New config form
  const [newConfig, setNewConfig] = useState({
    menu_key: '',
    label: '',
    href: '',
    icon_name: 'Settings',
    category: 'main',
    category_label: '',
    category_order: 0,
    item_order: 0,
    is_visible: true,
    required_role: '',
    show_badge: false,
    badge_source: '',
    description: ''
  })

  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchConfigs()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single()
      
      if (profile) {
        setIsSuperAdmin(profile.role === 'super_admin')
        setProfileId(profile.id)
      }
    }
  }

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/navigation-configs')
      const data = await response.json()
      
      if (data.success) {
        setConfigs(data.configs)
        setGroupedConfigs(data.grouped)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch configs' })
      }
    } catch (err) {
      console.error('Error fetching configs:', err)
      setMessage({ type: 'error', text: 'Error loading menu configuration' })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!profileId) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/admin/navigation-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs: configs.map(c => ({
            menu_key: c.menu_key,
            label: c.label,
            href: c.href,
            icon_name: c.icon_name,
            category: c.category,
            category_label: c.category_label,
            category_order: c.category_order,
            item_order: c.item_order,
            is_visible: c.is_visible,
            required_role: c.required_role,
            show_badge: c.show_badge,
            badge_source: c.badge_source,
            description: c.description
          })),
          updated_by: profileId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Updated ${data.updated} menu item(s)` })
        fetchConfigs()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error saving menu configuration' })
    }
    setSaving(false)
    setTimeout(() => setMessage(null), 5000)
  }

  const handleAdd = async () => {
    if (!profileId || !newConfig.menu_key || !newConfig.label || !newConfig.href) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    try {
      const response = await fetch('/api/admin/navigation-configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...newConfig,
            required_role: newConfig.required_role || null,
            badge_source: newConfig.badge_source || null
          },
          created_by: profileId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Menu item created successfully' })
        setAddDialogOpen(false)
        setNewConfig({
          menu_key: '',
          label: '',
          href: '',
          icon_name: 'Settings',
          category: 'main',
          category_label: '',
          category_order: 0,
          item_order: 0,
          is_visible: true,
          required_role: '',
          show_badge: false,
          badge_source: '',
          description: ''
        })
        fetchConfigs()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error creating menu item' })
    }
  }

  const handleDelete = async (menu_key: string) => {
    if (!profileId) return
    if (!confirm('Are you sure you want to delete this menu item?')) return

    try {
      const response = await fetch(`/api/admin/navigation-configs?menu_key=${menu_key}&deleted_by=${profileId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Menu item deleted' })
        fetchConfigs()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error deleting menu item' })
    }
  }

  const updateConfig = (menu_key: string, updates: Partial<NavigationConfig>) => {
    setConfigs(prev => prev.map(c => 
      c.menu_key === menu_key ? { ...c, ...updates } : c
    ))
  }

  const filteredConfigs = configs.filter(c => 
    c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.menu_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-slate-900">Menu Navigation</h1>
          <p className="text-slate-600">Manage sidebar menu items, order, and visibility</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/settings">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          {isSuperAdmin && (
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Menu Items by Category */}
      <div className="space-y-6">
        {Object.entries(groupedConfigs).map(([category, items]) => {
          const filteredItems = filteredConfigs.filter(c => c.category === category)
          if (filteredItems.length === 0) return null
          
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-slate-400" />
                  {items[0]?.category_label || category}
                  <Badge variant="outline" className="ml-2">
                    {filteredItems.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredItems
                    .sort((a, b) => a.item_order - b.item_order)
                    .map((config) => (
                    <div 
                      key={config.menu_key}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        config.is_visible ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      <div className="text-slate-400 cursor-move">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{config.label}</span>
                          {config.show_badge && config.badge_count && config.badge_count > 0 && (
                            <Badge className="bg-blue-100 text-blue-700">
                              {config.badge_count}
                            </Badge>
                          )}
                          {!config.is_visible && (
                            <Badge variant="secondary">Hidden</Badge>
                          )}
                          {config.required_role && (
                            <Badge variant="outline" className="text-amber-600">
                              {config.required_role}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          {config.href} • Icon: {config.icon_name}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingConfig(config)}
                          title="Edit menu item"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateConfig(config.menu_key, { is_visible: !config.is_visible })}
                          title={config.is_visible ? 'Hide menu item' : 'Show menu item'}
                        >
                          {config.is_visible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(config.menu_key)}
                            title="Delete menu item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Save Button */}
      {isSuperAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      )}

      {/* Add Menu Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>
              Create a new menu item for the sidebar navigation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Menu Key *</label>
                <Input
                  value={newConfig.menu_key}
                  onChange={(e) => setNewConfig({ ...newConfig, menu_key: e.target.value })}
                  placeholder="e.g., my_new_page"
                />
                <p className="text-xs text-slate-500">Unique identifier</p>
              </div>
              <div>
                <label className="text-sm font-medium">Label *</label>
                <Input
                  value={newConfig.label}
                  onChange={(e) => setNewConfig({ ...newConfig, label: e.target.value })}
                  placeholder="Display name"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">URL Path *</label>
              <Input
                value={newConfig.href}
                onChange={(e) => setNewConfig({ ...newConfig, href: e.target.value })}
                placeholder="/admin/my-page"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Icon</label>
                <Select 
                  value={newConfig.icon_name || 'Settings'} 
                  onValueChange={(v) => v && setNewConfig({ ...newConfig, icon_name: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableIcons.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newConfig.category}
                  onChange={(e) => setNewConfig({ ...newConfig, category: e.target.value })}
                  placeholder="main, listings, etc"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Category Label</label>
              <Input
                value={newConfig.category_label}
                onChange={(e) => setNewConfig({ ...newConfig, category_label: e.target.value })}
                placeholder="Display name for category"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Required Role</label>
              <Select 
                value={newConfig.required_role || ''} 
                onValueChange={(v) => v && setNewConfig({ ...newConfig, required_role: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  <SelectItem value="admin">Admin only</SelectItem>
                  <SelectItem value="super_admin">Super Admin only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newConfig.description ?? ''}
                onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                placeholder="What this menu item does"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Menu Item Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Modify existing menu item: {editingConfig?.label}
            </DialogDescription>
          </DialogHeader>
          
          {editingConfig && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Menu Key</label>
                  <Input value={editingConfig.menu_key} disabled className="bg-slate-100" />
                  <p className="text-xs text-slate-500">Cannot be changed</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Label *</label>
                  <Input
                    value={editingConfig.label}
                    onChange={(e) => setEditingConfig({ ...editingConfig, label: e.target.value })}
                    placeholder="Display name"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">URL Path *</label>
                <Input
                  value={editingConfig.href}
                  onChange={(e) => setEditingConfig({ ...editingConfig, href: e.target.value })}
                  placeholder="/admin/my-page"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Icon</label>
                  <Select 
                    value={editingConfig.icon_name || 'Settings'} 
                    onValueChange={(v) => v && setEditingConfig({ ...editingConfig, icon_name: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableIcons.map(icon => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={editingConfig.category}
                    onChange={(e) => setEditingConfig({ ...editingConfig, category: e.target.value })}
                    placeholder="main, listings, etc"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Category Label</label>
                <Input
                  value={editingConfig.category_label || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, category_label: e.target.value })}
                  placeholder="Display name for category"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category Order</label>
                  <Input
                    type="number"
                    value={editingConfig.category_order}
                    onChange={(e) => setEditingConfig({ ...editingConfig, category_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Item Order</label>
                  <Input
                    type="number"
                    value={editingConfig.item_order}
                    onChange={(e) => setEditingConfig({ ...editingConfig, item_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Required Role</label>
                <Select 
                  value={editingConfig.required_role ?? ''} 
                  onValueChange={(v) => setEditingConfig({ ...editingConfig, required_role: v || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All roles</SelectItem>
                    <SelectItem value="admin">Admin only</SelectItem>
                    <SelectItem value="super_admin">Super Admin only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_badge"
                    checked={editingConfig.show_badge}
                    onChange={(e) => setEditingConfig({ ...editingConfig, show_badge: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="show_badge" className="text-sm font-medium">Show Badge</label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_visible"
                    checked={editingConfig.is_visible}
                    onChange={(e) => setEditingConfig({ ...editingConfig, is_visible: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_visible" className="text-sm font-medium">Visible</label>
                </div>
              </div>
              
              {editingConfig.show_badge && (
                <div>
                  <label className="text-sm font-medium">Badge Source</label>
                  <Input
                    value={editingConfig.badge_source || ''}
                    onChange={(e) => setEditingConfig({ ...editingConfig, badge_source: e.target.value })}
                    placeholder="e.g., listings.pending"
                  />
                  <p className="text-xs text-slate-500">Format: table.column</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editingConfig.description || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                  placeholder="What this menu item does"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingConfig(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingConfig) {
                  updateConfig(editingConfig.menu_key, {
                    label: editingConfig.label,
                    href: editingConfig.href,
                    icon_name: editingConfig.icon_name,
                    category: editingConfig.category,
                    category_label: editingConfig.category_label,
                    category_order: editingConfig.category_order,
                    item_order: editingConfig.item_order,
                    is_visible: editingConfig.is_visible,
                    required_role: editingConfig.required_role,
                    show_badge: editingConfig.show_badge,
                    badge_source: editingConfig.badge_source,
                    description: editingConfig.description
                  })
                  setEditingConfig(null)
                  setMessage({ type: 'success', text: 'Menu item updated. Click Save Changes to persist.' })
                }
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
