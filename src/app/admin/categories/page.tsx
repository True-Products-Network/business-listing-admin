'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  ArrowLeft,
  Tag,
  AlertCircle,
  Search,
  Store,
  Wrench
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

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
  business_count?: number
  category_type?: 'local_business' | 'service_provider'
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true
  })

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      
      // Get categories with business count
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesError) throw categoriesError

      // Get business counts for each category
      const { data: countsData, error: countsError } = await supabase
        .from('business_categories')
        .select('category_id, count')
        .select('category_id')

      if (countsError) throw countsError

      // Count businesses per category
      const counts: Record<string, number> = {}
      countsData?.forEach((item: any) => {
        counts[item.category_id] = (counts[item.category_id] || 0) + 1
      })

      const categoriesWithCounts = (categoriesData || []).map((cat: Category) => ({
        ...cat,
        business_count: counts[cat.id] || 0,
        // Determine category type based on name keywords
        category_type: determineCategoryType(cat.name)
      }))

      setCategories(categoriesWithCounts)
      setFilteredCategories(categoriesWithCounts)
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  // Determine if category is for local businesses (places to visit/shop) or service providers
  const determineCategoryType = (name: string): 'local_business' | 'service_provider' => {
    const serviceKeywords = [
      'service', 'repair', 'contractor', 'plumber', 'electrician', 'hvac', 'roofing',
      'cleaning', 'landscaping', 'lawncare', 'attorney', 'lawyer', 'accountant',
      'insurance', 'real estate', 'agent', 'consultant', 'therapist', 'counselor',
      'trainer', 'coach', 'tutor', 'pet', 'grooming', 'veterinary', 'vet', 'salon',
      'spa', 'massage', 'chiropractor', 'dentist', 'doctor', 'medical', 'health',
      'financial', 'tax', 'bookkeeping', 'marketing', 'design', 'web', 'it', 'tech'
    ]
    
    const localBusinessKeywords = [
      'restaurant', 'cafe', 'coffee', 'bar', 'brewery', 'winery', 'shop', 'store',
      'boutique', 'retail', 'grocery', 'market', 'bakery', 'pizza', 'food', 'dining',
      'entertainment', 'theater', 'cinema', 'museum', 'gallery', 'park', 'gym',
      'fitness', 'yoga', 'studio', 'hotel', 'motel', 'lodging', 'tourism', 'attraction'
    ]
    
    const nameLower = name.toLowerCase()
    
    if (serviceKeywords.some(keyword => nameLower.includes(keyword))) {
      return 'service_provider'
    }
    if (localBusinessKeywords.some(keyword => nameLower.includes(keyword))) {
      return 'local_business'
    }
    
    // Default to local_business if unclear
    return 'local_business'
  }

  // Filter categories based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query)
    )
    setFilteredCategories(filtered)
  }, [searchQuery, categories])

  // Calculate totals
  const totalCategories = categories.length
  const localBusinessCount = categories.filter(c => c.category_type === 'local_business').length
  const serviceProviderCount = categories.filter(c => c.category_type === 'service_provider').length
  const totalBusinesses = categories.reduce((sum, c) => sum + (c.business_count || 0), 0)

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100)
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: formData.name.trim(),
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description.trim() || null,
          is_active: formData.is_active
        })

      if (error) {
        if (error.message.includes('duplicate')) {
          throw new Error('A category with this name or slug already exists')
        }
        throw error
      }

      setIsAddDialogOpen(false)
      setFormData({ name: '', slug: '', description: '', is_active: true })
      fetchCategories()
    } catch (err: any) {
      console.error('Error adding category:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedCategory) return
    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name.trim(),
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description.trim() || null,
          is_active: formData.is_active
        })
        .eq('id', selectedCategory.id)

      if (error) {
        if (error.message.includes('duplicate')) {
          throw new Error('A category with this name or slug already exists')
        }
        throw error
      }

      setIsEditDialogOpen(false)
      setSelectedCategory(null)
      setFormData({ name: '', slug: '', description: '', is_active: true })
      fetchCategories()
    } catch (err: any) {
      console.error('Error updating category:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return

    setSaving(true)
    try {
      // First remove all business associations
      const { error: assocError } = await supabase
        .from('business_categories')
        .delete()
        .eq('category_id', selectedCategory.id)

      if (assocError) throw assocError

      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id)

      if (error) throw error

      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (err: any) {
      console.error('Error deleting category:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      is_active: category.is_active
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#54afe6]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-500 mt-1">
                {totalCategories} total categories ({localBusinessCount} Local + {serviceProviderCount} Service)
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <Button 
                onClick={() => {
                  setFormData({ name: '', slug: '', description: '', is_active: true })
                  setIsAddDialogOpen(true)
                }}
                className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Store className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">{localBusinessCount}</p>
                  <p className="text-sm text-blue-700">Local Business Categories</p>
                  <p className="text-xs text-blue-600">Places to visit or shop</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Wrench className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-900">{serviceProviderCount}</p>
                  <p className="text-sm text-purple-700">Service Categories</p>
                  <p className="text-xs text-purple-600">Providers people hire</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Tag className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-900">{totalCategories}</p>
                  <p className="text-sm text-emerald-700">Total Categories</p>
                  <p className="text-xs text-emerald-600">{localBusinessCount} Local + {serviceProviderCount} Service</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search categories by name, description, or slug..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories List */}
        <div className="grid gap-4">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first category</p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => (
              <Card key={category.id} className={!category.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        {!category.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {category.category_type === 'local_business' ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Store className="h-3 w-3 mr-1" />
                            Local Business
                          </Badge>
                        ) : (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Wrench className="h-3 w-3 mr-1" />
                            Service Provider
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        Slug: <code className="bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
                      </p>
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                      )}
                      <p className="text-sm text-[#54afe6]">
                        {category.business_count} business{category.business_count !== 1 ? 'es' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(category)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for businesses to be listed under.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Restaurants, Home Services"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL-friendly)
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generated-from-name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from name. Edit if needed.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Active (visible to users)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={saving}
              className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Restaurants"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="edit_is_active" className="text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEdit}
              disabled={saving}
              className="bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedCategory?.name}&quot;?
              <br /><br />
              This will:
              <ul className="list-disc ml-5 mt-2 text-sm">
                <li>Remove the category from all businesses</li>
                <li>Permanently delete the category</li>
              </ul>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={saving}
              variant="destructive"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
