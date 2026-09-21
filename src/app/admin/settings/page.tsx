'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, ShieldLock, Settings2, ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface PlatformSettingResponse {
  allow_signups: boolean;
  max_tenants_allowed: number | null;
  maintenance_mode: boolean;
  maintenance_message: string | null;
}

export default function SettingsPage() {
  const [data, setData] = useState<PlatformSettingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  // Form state
  const [allowSignups, setAllowSignups] = useState(false);
  const [maxTenants, setMaxTenants] = useState<number | ''>('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      const res = await fetch(`${API_BASE}/api/v1/admin/settings`, {
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
        throw new Error(`Failed to load settings (HTTP ${res.status})`);
      }
      
      const responseData: PlatformSettingResponse = await res.json();
      setData(responseData);
      setAllowSignups(responseData.allow_signups);
      setMaxTenants(responseData.max_tenants_allowed === null ? '' : responseData.max_tenants_allowed);
      setMaintenanceMode(responseData.maintenance_mode);
      setMaintenanceMessage(responseData.maintenance_message || '');
    } catch (err: any) {
      setError(err?.message || 'Network connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      const res = await fetch(`${API_BASE}/api/v1/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          allow_signups: allowSignups,
          max_tenants_allowed: maxTenants === '' ? null : Number(maxTenants),
          maintenance_mode: maintenanceMode,
          maintenance_message: maintenanceMessage || null
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to save settings (HTTP ${res.status})`);
      }
      
      await fetchSettings();
      alert('Settings saved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Settings</h2>
          <p className="text-slate-500 text-sm mt-1">Configure global application behaviors and system preferences.</p>
        </div>
        <button
          onClick={fetchSettings}
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
            onClick={fetchSettings}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : error && !data ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-950">Settings Unavailable</h4>
            <p className="text-amber-800 text-sm mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchSettings}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden">
          {/* Settings Sidebar */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0 hidden md:block">
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-white text-blue-600 shadow-sm border border-slate-200/50">
                <Settings2 className="w-4 h-4 text-blue-500" />
                General & Access
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-8">
            {loading && !data ? (
              <div className="space-y-6">
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-8">
                
                {error && data && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex gap-2 items-center">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    {error}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Registration & Capacity</h3>
                  
                  <div className="space-y-5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={allowSignups}
                        onChange={(e) => setAllowSignups(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      <div>
                        <span className="block text-sm font-semibold text-slate-900">Allow New Signups</span>
                        <span className="block text-sm text-slate-500 mt-0.5">If disabled, new users cannot create accounts or organizations.</span>
                      </div>
                    </label>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1">Max Tenants Allowed</label>
                      <p className="text-sm text-slate-500 mb-2">Limit the total number of organizations on the platform. Leave empty for unlimited.</p>
                      <input 
                        type="number"
                        min="1"
                        value={maxTenants}
                        onChange={(e) => setMaxTenants(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="w-full md:w-64 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="e.g. 100"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Platform Maintenance</h3>
                  
                  <div className="space-y-5">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={maintenanceMode}
                          onChange={(e) => setMaintenanceMode(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-600"
                        />
                        <div>
                          <span className="block text-sm font-bold text-amber-900">Enable Maintenance Mode</span>
                          <span className="block text-sm text-amber-800 mt-0.5">Blocks all non-owner API requests and displays the maintenance screen to users.</span>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-1">Maintenance Message</label>
                      <p className="text-sm text-slate-500 mb-2">Message displayed to users when maintenance mode is active.</p>
                      <textarea 
                        value={maintenanceMessage}
                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="e.g. We are currently performing scheduled maintenance. Please check back soon."
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
