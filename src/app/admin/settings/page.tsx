'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Settings, 
  ToggleRight, 
  FileText, 
  Link as LinkIcon,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  Clock,
  TrendingUp,
  ArrowLeft,
  Globe,
  Menu
} from 'lucide-react';
import Link from 'next/link';

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
  category: string;
  is_editable: boolean;
  updated_at: string;
}

interface Stats {
  foundingMembers: {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  gracePeriods: {
    expiringToday: number;
    expiringThisWeek: number;
    inGracePeriod: number;
  };
  subscriptions: {
    total: number;
    active: number;
    pastDue: number;
    canceled: number;
    premium: number;
    vip: number;
  };
  revenue: {
    monthly: number;
    foundingMemberLocked: number;
  };
}

const categoryIcons: Record<string, any> = {
  pricing: DollarSign,
  system: Settings,
  features: ToggleRight,
  content: FileText,
  contact: Users,
};

const categoryLabels: Record<string, string> = {
  pricing: 'Pricing & Promotions',
  system: 'System Settings',
  features: 'Feature Toggles',
  content: 'Content & Messaging',
  contact: 'Support Contact',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [groupedSettings, setGroupedSettings] = useState<Record<string, Setting[]>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('pricing');
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
        setGroupedSettings(data.grouped);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    if (Object.keys(editedSettings).length === 0) return;

    setSaving(true);
    try {
      const updates = Object.entries(editedSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Updated ${data.updated} settings successfully` });
        setEditedSettings({});
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const renderSettingInput = (setting: Setting) => {
    const value = editedSettings[setting.setting_key] ?? setting.setting_value;
    const isEdited = setting.setting_key in editedSettings;

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className={`w-full p-2 border rounded-lg ${isEdited ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className={`w-full p-2 border rounded-lg ${isEdited ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
          />
        );
      case 'date':
        return (
          <input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className={`w-full p-2 border rounded-lg ${isEdited ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className={`w-full p-2 border rounded-lg ${isEdited ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-500 mt-1">Manage pricing, features, and system configuration</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin" className="inline-flex">
                <button className="flex items-center px-4 py-2 bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white rounded-lg hover:opacity-90">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </button>
              </Link>
              <button
                onClick={saveSettings}
                disabled={saving || Object.keys(editedSettings).length === 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
                {Object.keys(editedSettings).length > 0 && (
                  <span className="ml-2 bg-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {Object.keys(editedSettings).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Founding Members */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Founding Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.foundingMembers.current} / {stats.foundingMembers.limit}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.foundingMembers.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.foundingMembers.remaining} spots remaining
                </p>
              </div>
            </div>

            {/* Grace Periods */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">In Grace Period</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.gracePeriods.inGracePeriod}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-sm text-orange-600 mt-2">
                {stats.gracePeriods.expiringToday} expiring today
              </p>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.subscriptions.active}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {stats.subscriptions.premium} Premium • {stats.subscriptions.vip} VIP
              </p>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.revenue.monthly.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-sm text-green-600 mt-2">
                ${stats.revenue.foundingMemberLocked.toLocaleString()} locked in
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div
            className={`p-4 rounded-lg flex items-center ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {Object.keys(groupedSettings).map((category) => {
                const Icon = categoryIcons[category] || Settings;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      activeCategory === category ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${activeCategory === category ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={activeCategory === category ? 'font-medium text-gray-900' : 'text-gray-600'}>
                      {categoryLabels[category] || category}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Menu Navigation Link */}
            <Link href="/admin/settings/menu">
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-4 hover:bg-gray-50 transition-colors cursor-pointer mb-3">
                <div className="flex items-center">
                  <Menu className="w-5 h-5 mr-3 text-[#f68712]" />
                  <div>
                    <span className="font-medium text-gray-900">Menu Navigation</span>
                    <p className="text-xs text-gray-500">Manage sidebar menu items</p>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* System Settings Link */}
            <Link href="/admin/settings/system">
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center">
                  <Globe className="w-5 h-5 mr-3 text-[#54afe6]" />
                  <div>
                    <span className="font-medium text-gray-900">System Settings</span>
                    <p className="text-xs text-gray-500">Contact info, branding</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Settings Panel */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  {categoryLabels[activeCategory] || activeCategory}
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {groupedSettings[activeCategory]?.map((setting) => (
                    <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                      </div>
                      <div className="md:col-span-2">
                        {renderSettingInput(setting)}
                        {setting.updated_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last updated: {new Date(setting.updated_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
