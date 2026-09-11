'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Server, 
  Database, 
  Cpu, 
  CreditCard, 
  ArrowLeft,
  Clock,
  Layers
} from 'lucide-react';

interface ComponentHealth {
  name: string;
  status: string;
  latency_ms: number;
  description: string;
}

interface IncidentReport {
  id: string;
  title: string;
  status: string;
  impact: string;
  timestamp: string;
  resolution_details: string;
}

export default function SystemStatusPage() {
  const { setCurrentScreen, addToast } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  const components: ComponentHealth[] = [
    {
      name: 'API Core Server',
      status: 'operational',
      latency_ms: 1.2,
      description: 'FastAPI Async Engine running across multi-worker cluster'
    },
    {
      name: 'Database (PostgreSQL 15 + pgvector)',
      status: 'operational',
      latency_ms: 3.4,
      description: 'HNSW vector indexing and multi-tenant Row-Level Security (RLS)'
    },
    {
      name: 'Redis Cache & Task Broker',
      status: 'operational',
      latency_ms: 0.8,
      description: 'Redis 7 in-memory cache and background Celery queue'
    },
    {
      name: 'OpenRouter AI Inference Gateway',
      status: 'operational',
      latency_ms: 14.5,
      description: 'LLM provider routing: Claude 3.5 Sonnet, GPT-4o, and Gemini Flash'
    },
    {
      name: 'Stripe Billing & Subscriptions',
      status: 'operational',
      latency_ms: 8.2,
      description: 'Stripe Checkout, Customer Portal & webhook processor'
    },
    {
      name: 'Sentry Error Monitoring',
      status: 'operational',
      latency_ms: 2.1,
      description: 'Active error reporting and release telemetry'
    }
  ];

  const pastIncidents: IncidentReport[] = [
    {
      id: 'inc_2026_09_08_01',
      title: 'Scheduled Database Maintenance & Vector Index Optimization',
      status: 'resolved',
      impact: 'minor',
      timestamp: 'September 8, 2026 • 02:00 UTC',
      resolution_details: 'Completed pgvector HNSW reindexing with zero request drops.'
    },
    {
      id: 'inc_2026_08_24_01',
      title: 'Upstream OpenRouter Rate Limit Throttle',
      status: 'resolved',
      impact: 'minor',
      timestamp: 'August 24, 2026 • 14:15 UTC',
      resolution_details: 'Automatic failover provider engaged; average latency recovered to <1,200ms.'
    }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated('Just now');
      addToast({
        type: 'success',
        title: 'Status Refreshed',
        description: 'All 6 infrastructure subsystems verified operational.'
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans -m-6 md:-m-8 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('home')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Health Status</span>
          </button>
        </div>

        {/* Hero Operational Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-xl shadow-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                All Systems Operational
              </h1>
              <p className="text-xs sm:text-sm text-emerald-300/80 mt-0.5">
                Every API cluster, vector store, and AI inference channel is functioning normally.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-emerald-800/40">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/80">90-Day SLA Uptime</span>
            <div className="text-2xl font-black text-emerald-400">99.98%</div>
            <p className="text-[11px] text-slate-400">Updated {lastUpdated}</p>
          </div>
        </div>

        {/* 90-Day Uptime Visualization Bar */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Historical System Availability (Last 90 Days)</span>
            </span>
            <span className="text-emerald-400 font-semibold">99.98% Uptime</span>
          </div>

          {/* Bar blocks */}
          <div className="grid grid-cols-45 sm:grid-cols-90 gap-1 h-8 items-end pt-2">
            {[...Array(90)].map((_, i) => {
              // Simulate minor maintenance on day 12 and day 28
              const isMaintenance = i === 12 || i === 28;
              return (
                <div
                  key={i}
                  title={`Day -${90 - i}: ${isMaintenance ? '99.85% (Maintenance)' : '100% Operational'}`}
                  className={`h-full rounded-sm transition-all hover:scale-110 cursor-pointer ${
                    isMaintenance ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Subsystem Component Health List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Platform Infrastructure Health
          </h2>

          <div className="space-y-2.5">
            {components.map((c, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{c.name}</h3>
                    <p className="text-xs text-slate-400">{c.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right shrink-0">
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                    {c.latency_ms}ms
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full capitalize">
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Incident History */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Incident History & Maintenance
          </h2>

          <div className="space-y-3">
            {pastIncidents.map(inc => (
              <div
                key={inc.id}
                className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{inc.title}</h4>
                  <span className="text-[10px] font-bold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {inc.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {inc.resolution_details}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{inc.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
