'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, AlertCircle, ShieldLock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_BASE } from '@/lib/api';

interface AnalyticsTimeseriesPoint {
  date: string;
  new_users: number;
  new_organizations: number;
  new_conversations: number;
  ai_cost_usd: string | number;
}

interface AdminAnalyticsResponse {
  interval: string;
  data: AnalyticsTimeseriesPoint[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      const res = await fetch(`${API_BASE}/api/v1/admin/analytics/timeseries?interval=${interval}`, {
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
        throw new Error(`Failed to load analytics (HTTP ${res.status})`);
      }
      
      const responseData: AdminAnalyticsResponse = await res.json();
      // Ensure AI Cost is formatted as number for charts
      const formattedData = {
        ...responseData,
        data: responseData.data.map(d => ({
          ...d,
          ai_cost_usd: Number(d.ai_cost_usd || 0)
        }))
      };
      setData(formattedData);
    } catch (err: any) {
      setError(err?.message || 'Network connection failed');
    } finally {
      setLoading(false);
    }
  }, [interval]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Deep dive into platform usage, revenue, and growth.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={interval}
            onChange={(e) => setInterval(e.target.value as 'day' | 'week' | 'month')}
            className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {authError ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-start gap-3">
          <ShieldLock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-950">Admin Authorization Required</h4>
            <p className="text-rose-800 text-sm mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : error && (!data || data.data.length === 0) ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-950">Analytics Unavailable</h4>
            <p className="text-amber-800 text-sm mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Growth Metrics</h3>
            <div className="h-72">
              {loading && !data ? (
                <div className="w-full h-full bg-slate-100 rounded-xl animate-pulse" />
              ) : data && data.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Line type="monotone" name="New Users" dataKey="new_users" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="New Orgs" dataKey="new_organizations" stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">No data available for this period.</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Activity & Costs</h3>
            <div className="h-72">
              {loading && !data ? (
                <div className="w-full h-full bg-slate-100 rounded-xl animate-pulse" />
              ) : data && data.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" name="Conversations" dataKey="new_conversations" stroke="#10b981" strokeWidth={3} />
                    <Line yAxisId="right" type="monotone" name="AI Cost ($)" dataKey="ai_cost_usd" stroke="#f59e0b" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">No data available for this period.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
