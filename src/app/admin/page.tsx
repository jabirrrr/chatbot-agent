'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Activity, MessageSquare, DollarSign, RefreshCw, AlertCircle, ShieldLock } from 'lucide-react';

interface OverviewMetrics {
  total_organizations: number;
  total_users: number;
  total_conversations: number;
  total_ai_cost_usd: string | number; // backend returns Decimal, JSON parses as string or number
}

export default function AdminDashboard() {
  const [data, setData] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      const res = await fetch('/api/v1/admin/overview', {
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
        throw new Error(`Failed to load metrics (HTTP ${res.status})`);
      }
      
      const metrics: OverviewMetrics = await res.json();
      setData(metrics);
    } catch (err: any) {
      setError(err?.message || 'Network connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (authError) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-start gap-3">
        <ShieldLock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-rose-950">Admin Authorization Required</h4>
          <p className="text-rose-800 text-sm mt-0.5">{error}</p>
        </div>
        <button
          onClick={fetchOverview}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-950">Overview Unavailable</h4>
          <p className="text-amber-800 text-sm mt-0.5">{error}</p>
        </div>
        <button
          onClick={fetchOverview}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Organizations', value: data?.total_organizations ?? 0, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Users', value: data?.total_users ?? 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Conversations', value: data?.total_conversations ?? 0, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total AI Cost (USD)', value: `$${Number(data?.total_ai_cost_usd || 0).toFixed(4)}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time aggregation across all tenants.</p>
        </div>
        <button
          onClick={fetchOverview}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.bg} ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">{card.label}</p>
              {loading && !data ? (
                <div className="h-8 bg-slate-100 rounded w-24 animate-pulse mt-1" />
              ) : (
                <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
