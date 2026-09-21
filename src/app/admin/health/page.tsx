'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, 
  Database, 
  Globe, 
  Cpu, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Activity, 
  AlertTriangle, 
  ShieldAlert,
  ShieldLock,
  Info
} from 'lucide-react';
import { API_BASE, fetchAdminHealth, AdminHealthData, AdminComponentData } from '@/lib/api';

export default function HealthPage() {
  const [data, setData] = useState<AdminHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('Just now');

  const loadHealthData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setAuthError(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      
      const res = await fetch(`${API_BASE}/api/v1/admin/health`, {
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
          ? 'Access denied. Platform Super Admin / System Owner privileges are required to view infrastructure diagnostics.' 
          : 'Authentication required. Please sign in to an authorized account to view system diagnostics.'
        );
        return;
      }

      if (res.ok) {
        const result: AdminHealthData = await res.json();
        setData(result);
        const timeStr = new Date(result.checked_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
        setLastUpdatedText(timeStr);
      } else {
        setError(`Failed to retrieve infrastructure telemetry (HTTP ${res.status}).`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to admin health endpoint.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  // Overall Status Configuration
  const getOverallStatusBadge = () => {
    if (loading && !data) {
      return (
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
          <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
          <span className="font-semibold text-slate-600 text-sm">Checking Infrastructure...</span>
        </div>
      );
    }

    if (authError) {
      return (
        <div className="flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
          <ShieldLock className="w-4 h-4 text-rose-600" />
          <span className="font-semibold text-rose-700 text-sm">Admin Access Required</span>
        </div>
      );
    }

    if (error || !data) {
      return (
        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-amber-700 text-sm">Telemetry Unavailable</span>
        </div>
      );
    }

    switch (data.overall_status) {
      case 'healthy':
        return (
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-emerald-700 text-sm">All Systems Operational</span>
          </div>
        );
      case 'degraded':
        return (
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-700 text-sm">Partially Degraded</span>
          </div>
        );
      case 'down':
        return (
          <div className="flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span className="font-bold text-rose-700 text-sm">Major Outage Detected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
            <Info className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-slate-700 text-sm">Status Unknown</span>
          </div>
        );
    }
  };

  // Component configuration
  const componentList: { key: string; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'api', name: 'API / Application', icon: Globe },
    { key: 'database', name: 'Main Database (PostgreSQL)', icon: Database },
    { key: 'redis', name: 'Redis Cache', icon: Cpu },
    { key: 'workers', name: 'Background Workers', icon: Server }
  ];

  const renderComponentCard = (key: string, defaultName: string, Icon: React.ComponentType<{ className?: string }>) => {
    const comp: AdminComponentData | undefined = data?.components?.[key];
    const status = comp?.status || 'unknown';
    const isHealthy = status === 'healthy';
    const isDegraded = status === 'degraded';
    const isDown = status === 'down';
    const isNotConfigured = status === 'not_configured';

    let badgeClass = 'bg-slate-100 text-slate-600';
    let iconBgClass = 'bg-slate-100 text-slate-500';
    let displayStatus = 'UNKNOWN';

    if (isHealthy) {
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
      iconBgClass = 'bg-emerald-50 text-emerald-600';
      displayStatus = 'OPERATIONAL';
    } else if (isDegraded) {
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
      iconBgClass = 'bg-amber-50 text-amber-600';
      displayStatus = 'DEGRADED';
    } else if (isDown) {
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
      iconBgClass = 'bg-rose-50 text-rose-600';
      displayStatus = 'DOWN';
    } else if (isNotConfigured) {
      badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
      iconBgClass = 'bg-slate-100 text-slate-400';
      displayStatus = 'NOT CONFIGURED';
    }

    return (
      <div key={key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-slate-900 truncate">{comp?.name || defaultName}</h3>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${badgeClass}`}>
              {displayStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Uptime:</span>
              <span className="font-medium text-slate-800">
                {comp?.uptime || 'No historical data'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Latency:</span>
              <span className="font-medium text-slate-800">
                {comp?.latency_ms !== null && comp?.latency_ms !== undefined 
                  ? `${comp.latency_ms}ms` 
                  : (isNotConfigured ? 'N/A' : 'Unavailable')}
              </span>
            </div>
          </div>

          {comp?.details && (
            <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
              {comp.details}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Status</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time infrastructure health and runtime diagnostics.
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Last checked: {lastUpdatedText}</span>
            <span>•</span>
            <span>Environment: {data?.environment || 'production'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {getOverallStatusBadge()}
          <button
            type="button"
            onClick={() => loadHealthData(true)}
            disabled={refreshing || loading}
            title="Refresh system health"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Auth Error alert if user lacks admin authorization */}
      {authError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-start gap-3 text-sm">
          <ShieldLock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-950">Admin Authorization Required</h4>
            <p className="text-rose-800 text-xs mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadHealthData(true)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* General Error alert if API cannot be contacted */}
      {error && !authError && !data && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-950">Live Telemetry Disconnected</h4>
            <p className="text-amber-800 text-xs mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadHealthData(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-pulse flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Real Monitored Components Grid */}
      {(!loading || data) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {componentList.map(comp => renderComponentCard(comp.key, comp.name, comp.icon))}
        </div>
      )}

      {/* Recent Error Logs Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Error Logs</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live exceptions captured from application runtime (passwords and credentials scrubbed).
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
            {data?.has_persistent_error_telemetry ? `${data?.recent_errors?.length || 0} Recorded` : 'Not Configured'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {data?.recent_errors && data.recent_errors.length > 0 ? (
            data.recent_errors.map((err) => (
              <div key={err.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className={`mt-0.5 shrink-0 ${
                  err.severity === 'critical' ? 'text-rose-600' :
                  err.severity === 'high' ? 'text-rose-500' : 
                  err.severity === 'medium' ? 'text-amber-500' : 'text-slate-400'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {err.id}
                    </span>
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {err.service}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto shrink-0">
                      {err.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 mt-2 break-all">
                    {err.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 mx-auto mb-3">
                <Info className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Persisted Error Telemetry Configured</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                No persistent error telemetry store (such as Sentry Issues API or a dedicated database error table) is configured for this serverless deployment. Error records are not fabricated.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
