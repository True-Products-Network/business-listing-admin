'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Globe,
  CreditCard,
  Database,
  Link as LinkIcon,
  Mail,
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Copy,
  ExternalLink,
  Server,
  Variable,
  GitBranch,
  Plus,
  X
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface IntegrationConfig {
  id: string;
  config_key: string;
  config_value: string;
  config_type: string;
  category: string;
  description: string;
  is_sensitive: boolean;
  is_active: boolean;
  is_required?: boolean;
  updated_at: string;
}

const categoryIcons: Record<string, any> = {
  stripe: CreditCard,
  vercel_admin: Server,
  vercel_production: Server,
  domain: Globe,
  supabase: Database,
  ghl: LinkIcon,
  email: Mail,
  general: Settings,
  api_keys: Key,
  env_vars: Variable,
  github: GitBranch,
  branding: Settings,
};

const categoryLabels: Record<string, string> = {
  stripe: 'Stripe Payments',
  vercel_admin: 'Vercel - Admin',
  vercel_production: 'Vercel - Production',
  domain: 'Domain & URLs',
  supabase: 'Supabase Database',
  ghl: 'GoHighLevel (GHL) CRM',
  email: 'Email Configuration',
  api_keys: 'API Keys',
  env_vars: 'Environment Variables',
  github: 'GitHub Code Storage',
  branding: 'Branding & Favicon',
};

const categoryColors: Record<string, string> = {
  stripe: 'bg-purple-100 text-purple-700',
  vercel_admin: 'bg-black text-white',
  vercel_production: 'bg-gray-800 text-white',
  domain: 'bg-blue-100 text-blue-700',
  supabase: 'bg-green-100 text-green-700',
  ghl: 'bg-orange-100 text-orange-700',
  email: 'bg-yellow-100 text-yellow-700',
  api_keys: 'bg-red-100 text-red-700',
  env_vars: 'bg-teal-100 text-teal-700',
  github: 'bg-gray-900 text-white',
  branding: 'bg-pink-100 text-pink-700',
};

export default function IntegrationConfigsPage() {
  const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
  const [groupedConfigs, setGroupedConfigs] = useState<Record<string, IntegrationConfig[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('stripe');
  const [editedConfigs, setEditedConfigs] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAddWebhookDialog, setShowAddWebhookDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    config_key: '',
    config_value: '',
    description: ''
  });
  const [addingWebhook, setAddingWebhook] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      // Get current user and profile
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Try to get profile by auth_user_id first
        let { data: profile } = await supabase
          .from('profiles')
          .select('id, role, auth_user_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        // Fallback: try by email if auth_user_id not linked
        if (!profile && user.email) {
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('id, role, auth_user_id')
            .eq('email', user.email)
            .maybeSingle();
          profile = profileByEmail;

          // Link the profile for future logins
          if (profile && !profile.auth_user_id) {
            await supabase
              .from('profiles')
              .update({ auth_user_id: user.id })
              .eq('id', profile.id);
          }
        }

        if (profile) {
          setIsSuperAdmin(profile.role === 'super_admin');
          setProfileId(profile.id);
        }
      }

      const response = await fetch('/api/admin/integration-configs');

      const data = await response.json();
      if (data.success) {
        setConfigs(data.configs);
        setGroupedConfigs(data.grouped);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch configs' });
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      setMessage({ type: 'error', text: 'Error loading integration configs' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setEditedConfigs(prev => ({ ...prev, [key]: value }));
  };

  const togglePasswordVisibility = (key: string) => {
    setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const saveConfigs = async () => {
    if (Object.keys(editedConfigs).length === 0) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'Session expired. Please sign in again.' });
        setSaving(false);
        return;
      }

      const updates = Object.entries(editedConfigs).map(([key, value]) => ({
        config_key: key,
        config_value: value,
      }));

      const response = await fetch('/api/admin/integration-configs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ configs: updates, updated_by: profileId }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Updated ${data.updated} config(s) successfully` });
        setEditedConfigs({});
        fetchConfigs();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update configs' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving configs' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleAddWebhook = async () => {
    if (!newWebhook.config_key || !newWebhook.config_value) {
      setMessage({ type: 'error', text: 'Webhook name and URL are required' });
      return;
    }

    setAddingWebhook(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'Session expired. Please sign in again.' });
        setAddingWebhook(false);
        return;
      }

      const response = await fetch('/api/admin/integration-configs', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: {
            config_key: newWebhook.config_key,
            config_value: newWebhook.config_value,
            config_type: 'url',
            category: 'ghl',
            description: newWebhook.description || 'GHL Webhook URL',
            is_sensitive: true,
            is_active: true,
            is_required: false
          },
          created_by: profileId
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Created webhook '${newWebhook.config_key}' successfully` });
        setShowAddWebhookDialog(false);
        setNewWebhook({ config_key: '', config_value: '', description: '' });
        fetchConfigs();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create webhook' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating webhook' });
    } finally {
      setAddingWebhook(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const renderConfigInput = (config: IntegrationConfig) => {
    const value = editedConfigs[config.config_key] ?? config.config_value;
    const isEdited = config.config_key in editedConfigs;
    const isVisible = visiblePasswords[config.config_key] || false;
    // Treat sensitive fields as passwords for UI masking
    const isPassword = config.config_type === 'password' || config.is_sensitive;

    const baseClassName = `w-full p-2.5 border rounded-lg transition-colors ${
      isEdited ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
    }`;

    // Handle password/sensitive fields
    if (isPassword) {
      return (
        <div className="relative">
          <input
            type={isVisible ? 'text' : 'password'}
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            className={`${baseClassName} pr-20`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility(config.config_key)}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(value, config.config_key)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            {copiedKey === config.config_key ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      );
    }

    switch (config.config_type) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            className={baseClassName}
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
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            className={baseClassName}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            className={baseClassName}
          />
        );
      case 'url':
        return (
          <div className="relative">
            <input
              type="url"
              value={value}
              onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
              className={`${baseClassName} pr-10`}
            />
            {value && (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        );
      case 'json':
        return (
          <textarea
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            className={`${baseClassName} font-mono text-sm`}
            rows={4}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            className={baseClassName}
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Integration Configurations</h1>
                {!isSuperAdmin && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <Shield className="w-3 h-3 mr-1" />
                    View Only
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-1">
                Manage API keys, credentials, and integration settings for all connected services
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin" className="inline-flex">
                <button className="flex items-center px-4 py-2 bg-gradient-to-r from-[#ffc107] to-[#f68712] text-white rounded-lg hover:opacity-90">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </button>
              </Link>
              {isSuperAdmin && (
                <button
                  onClick={saveConfigs}
                  disabled={saving || Object.keys(editedConfigs).length === 0}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                  {Object.keys(editedConfigs).length > 0 && (
                    <span className="ml-2 bg-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {Object.keys(editedConfigs).length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-amber-900">Security Notice</h3>
            <p className="text-sm text-amber-700 mt-1">
              These configurations contain sensitive credentials. Only Super Admins can modify them.
              Sensitive values are masked by default. All changes are logged for security auditing.
            </p>
          </div>
        </div>
      </div>

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
          <div className="lg:w-64">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {Object.keys(groupedConfigs).map((category) => {
                const Icon = categoryIcons[category] || Settings;
                const colorClass = categoryColors[category] || 'bg-gray-100 text-gray-700';
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      activeCategory === category ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={activeCategory === category ? 'font-medium text-gray-900' : 'text-gray-600'}>
                      {categoryLabels[category] || category}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Configuration Summary</h3>
              <div className="space-y-2">
                {Object.entries(groupedConfigs).map(([category, items]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-gray-600">{categoryLabels[category] || category}</span>
                    <span className="font-medium text-gray-900">{items.length}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-900">Total Configs</span>
                  <span className="text-blue-600">{configs.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configs Panel */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = categoryIcons[activeCategory] || Settings;
                    const colorClass = categoryColors[activeCategory] || 'bg-gray-100 text-gray-700';
                    return (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {categoryLabels[activeCategory] || activeCategory}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {groupedConfigs[activeCategory]?.length || 0} configuration(s)
                    </p>
                  </div>
                </div>
                {activeCategory === 'ghl' && isSuperAdmin && (
                  <button
                    onClick={() => setShowAddWebhookDialog(true)}
                    className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Webhook
                  </button>
                )}
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {groupedConfigs[activeCategory]?.map((config) => (
                    <div key={config.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="md:col-span-1">
                        <div className="flex items-center gap-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {config.config_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                          {config.is_sensitive && (
                            <span title="Sensitive value">
                              <Shield className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {config.config_type}
                          </span>
                          {config.is_required && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded font-medium">
                              Required
                            </span>
                          )}
                          {!config.is_active && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                              inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        {renderConfigInput(config)}
                        {config.updated_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last updated: {new Date(config.updated_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Environment Variables Export - Only show on env_vars tab */}
            {activeCategory === 'env_vars' && (
              <div className="mt-6 bg-gray-900 rounded-xl shadow-sm border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Vercel Environment Variables Export
                  </h3>
                  <button
                    onClick={() => {
                      const envVars = configs
                        .filter(c => c.is_active && c.category === 'env_vars')
                        .map(c => `${c.config_key.toUpperCase()}=${c.config_value || ''}`)
                        .join('\n');
                      copyToClipboard(envVars, 'all-env-vars');
                    }}
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedKey === 'all-env-vars' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy All
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Required Vercel environment variables for deployment:
                </p>
                <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm font-mono text-green-400">
                  {configs
                    .filter(c => c.is_active && c.category === 'env_vars')
                    .map(c => `# ${c.description}${c.is_required ? ' (Required)' : ''}\n${c.config_key.toUpperCase()}=${c.is_sensitive && c.config_value ? '***' : (c.config_value || '')}`)
                    .join('\n\n')}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Webhook Dialog */}
      {showAddWebhookDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add GHL Webhook</h3>
              <button
                onClick={() => setShowAddWebhookDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook Name (Config Key)
                </label>
                <input
                  type="text"
                  value={newWebhook.config_key}
                  onChange={(e) => setNewWebhook({ ...newWebhook, config_key: e.target.value })}
                  placeholder="e.g., ghl_new_webhook_url"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use lowercase with underscores, e.g., &quot;ghl_payment_webhook_url&quot;
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={newWebhook.config_value}
                  onChange={(e) => setNewWebhook({ ...newWebhook, config_value: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newWebhook.description}
                  onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                  placeholder="What this webhook is used for..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAddWebhookDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWebhook}
                disabled={addingWebhook || !newWebhook.config_key || !newWebhook.config_value}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
              >
                {addingWebhook ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}