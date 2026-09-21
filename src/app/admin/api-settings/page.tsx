'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Cable, Key, CheckCircle2, ShieldLock, Edit2, Plus, RefreshCw, X, Trash2, AlertCircle } from 'lucide-react';

interface PlatformIntegrationResponse {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
}

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI API', description: 'Primary language model provider' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Secondary language model router' },
  { id: 'stripe', name: 'Stripe', description: 'Payment and subscription billing' }
];

export default function ApiSettingsPage() {
  const [integrations, setIntegrations] = useState<PlatformIntegrationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [editCredentials, setEditCredentials] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      const res = await fetch('/api/v1/admin/integrations', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        cache: 'no-store'
      });

      if (res.status === 401 || res.status === 403) {
        setAuthError(true);
        setError(res.status === 403
          ? 'Access denied. System Owner privileges are required.'
          : 'Authentication required. Please sign in to an authorized account.'
        );
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Failed to load integrations (HTTP ${res.status})`);
      }
      
      const responseData: PlatformIntegrationResponse[] = await res.json();
      setIntegrations(responseData);
    } catch (err: any) {
      setError(err?.message || 'Network connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleSave = async (providerId: string) => {
    if (!editCredentials.trim()) return;
    setEditSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      const res = await fetch(`/api/v1/admin/integrations/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: PROVIDERS.find(p => p.id === providerId)?.name || providerId,
          provider: providerId,
          is_active: true,
          credentials: editCredentials
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to save integration (HTTP ${res.status})`);
      }
      
      await fetchIntegrations();
      setEditingProvider(null);
      setEditCredentials('');
    } catch (err: any) {
      alert(err?.message || 'Failed to save integration');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to remove this integration?')) return;
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      const res = await fetch(`/api/v1/admin/integrations/${providerId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to delete integration (HTTP ${res.status})`);
      }
      
      await fetchIntegrations();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete integration');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">API Integrations</h2>
          <p className="text-slate-500 text-sm mt-1">Manage external services connected to the platform.</p>
        </div>
        <button
          onClick={fetchIntegrations}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {authError ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-start gap-3">
          <ShieldLock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-950">Admin Authorization Required</h4>
            <p className="text-rose-800 text-sm mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchIntegrations}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : error && integrations.length === 0 ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-950">Integrations Unavailable</h4>
            <p className="text-amber-800 text-sm mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchIntegrations}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {PROVIDERS.map((providerDef) => {
            const config = integrations.find(i => i.provider === providerDef.id);
            const isConfigured = !!(config && config.is_active);
            const isEditing = editingProvider === providerDef.id;

            return (
              <div key={providerDef.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isConfigured ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Cable className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{providerDef.name}</h3>
                      {isConfigured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                          Not Configured
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mt-1">{providerDef.description}</p>
                    {isConfigured && !isEditing && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 inline-flex">
                        <Key className="w-3.5 h-3.5" />
                        Credentials Secured
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="w-full md:w-[400px] shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-900">Configure Credentials</h4>
                      <button 
                        onClick={() => { setEditingProvider(null); setEditCredentials(''); }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="Paste secret key here..."
                      value={editCredentials}
                      onChange={(e) => setEditCredentials(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleSave(providerDef.id)}
                        disabled={!editCredentials.trim() || editSaving}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        {editSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Key'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => { setEditingProvider(providerDef.id); setEditCredentials(''); }}
                      className="w-full md:w-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      {isConfigured ? 'Update Key' : 'Configure'}
                    </button>
                    {isConfigured && (
                      <button
                        onClick={() => handleDelete(providerDef.id)}
                        className="w-full md:w-auto px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
