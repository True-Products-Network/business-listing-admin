'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Phone, Mail, Clock, Globe, Building2, Loader2, MapPin, Share2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface SystemSetting {
  id: string
  setting_key: string
  setting_value: string
  setting_type: string
  description: string
  category: string
  is_public: boolean
}

export default function SystemSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({})
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const client = createClient()
      const { data, error } = await client
        .from('system_settings')
        .select('*')
        .order('category')
        .order('setting_key')

      if (error) {
        console.error('Error fetching settings:', error)
        return
      }

      setSettings(data || [])
      
      // Initialize edited settings
      const initial: Record<string, string> = {}
      data?.forEach((s: SystemSetting) => {
        initial[s.setting_key] = s.setting_value
      })
      setEditedSettings(initial)
    } catch (err) {
      console.error('Exception fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage('')

    try {
      // Update each changed setting
      const client = createClient()
      const updates = Object.entries(editedSettings).map(([key, value]) => {
        const setting = settings.find(s => s.setting_key === key)
        if (setting && setting.setting_value !== value) {
          return client
            .from('system_settings')
            .update({ setting_value: value, updated_at: new Date().toISOString() })
            .eq('setting_key', key)
        }
        return null
      }).filter(Boolean)

      await Promise.all(updates)
      
      setSaveMessage('Settings saved successfully!')
      
      // Refresh settings
      fetchSettings()
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setSaveMessage('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'contact': return <Phone className="w-5 h-5" />
      case 'branding': return <Building2 className="w-5 h-5" />
      case 'address': return <MapPin className="w-5 h-5" />
      case 'social': return <Share2 className="w-5 h-5" />
      case 'general': return <Globe className="w-5 h-5" />
      default: return <Globe className="w-5 h-5" />
    }
  }

  const getSettingIcon = (key: string) => {
    if (key.includes('phone')) return <Phone className="w-4 h-4 text-gray-400" />
    if (key.includes('email')) return <Mail className="w-4 h-4 text-gray-400" />
    if (key.includes('hours')) return <Clock className="w-4 h-4 text-gray-400" />
    if (key.includes('url')) return <Globe className="w-4 h-4 text-gray-400" />
    return null
  }

  // Group settings by category (handle null/undefined categories)
  const groupedSettings = settings.reduce((acc, setting) => {
    const category = setting.category || 'general'
    if (!acc[category]) acc[category] = []
    acc[category].push(setting)
    return acc
  }, {} as Record<string, SystemSetting[]>)

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
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/settings">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#371a5b]">System Settings</h1>
              <p className="text-gray-600">Manage contact information and global settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-xl ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {saveMessage}
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <div key={category} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-[#371a5b] to-[#bb7ce4] px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  {getCategoryIcon(category)}
                  <h2 className="text-lg font-semibold">{category.charAt(0).toUpperCase() + category.slice(1)} Settings</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {categorySettings.map((setting) => (
                  <div key={setting.setting_key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {setting.description}
                      {setting.is_public && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Public
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      {getSettingIcon(setting.setting_key) && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          {getSettingIcon(setting.setting_key)}
                        </div>
                      )}
                      <input
                        type="text"
                        value={editedSettings[setting.setting_key] || ''}
                        onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                        className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#54afe6] focus:border-transparent outline-none ${
                          getSettingIcon(setting.setting_key) ? 'pl-10' : ''
                        }`}
                        placeholder={`Enter ${setting.description.toLowerCase()}`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Key: {setting.setting_key}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#371a5b] to-[#bb7ce4] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">About These Settings</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Public</strong> settings are visible on the public website (Help Center, Contact pages)</li>
            <li>• Changes take effect immediately on the website</li>
            <li>• These settings are used across both the public site and admin panel</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
