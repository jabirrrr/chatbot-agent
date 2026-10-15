'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Pause, 
  Play, 
  Trash2, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2,
  ShieldLock, 
  Layers, 
  ArrowDownCircle, 
  ChevronRight, 
  ChevronDown, 
  Database, 
  Lock, 
  Cpu, 
  Globe,
  Server,
  Activity,
  Radio,
  Clock,
  Copy,
  Check,
  X,
  FileText
} from 'lucide-react';
import { API_BASE, SystemLogEntry, SystemLogHistoryResponse } from '@/lib/api';

const MAX_UI_LOGS = 300;

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Streaming status: 'connecting' | 'connected' | 'reconnecting' | 'paused' | 'disconnected'
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'paused' | 'disconnected'>('connecting');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [redisConnected, setRedisConnected] = useState<boolean>(false);
  const [storageNotice, setStorageNotice] = useState<string>('');
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const [totalBuffered, setTotalBuffered] = useState<number>(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef<boolean>(false);

  // Keep isPausedRef synchronized with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Auto-scroll to bottom of log list if enabled
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Load initial history via REST
  const loadInitialHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      if (!token) {
        setAuthError(true);
        setError('Authentication required. Please sign in as a Platform System Owner (super_user).');
        setLoading(false);
        setStreamStatus('disconnected');
        return;
      }

      const res = await fetch(`${API_BASE}/api/v1/admin/logs/history?limit=100`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });

      if (res.status === 401 || res.status === 403) {
        setAuthError(true);
        setError(res.status === 403 
          ? 'Access denied. Platform System Owner (super_user) privileges are strictly required.' 
          : 'Authentication session expired. Please sign in again.'
        );
        setStreamStatus('disconnected');
        return;
      }

      if (res.ok) {
        const data: SystemLogHistoryResponse = await res.json();
        // data.logs is returned reverse-chronological from backend; reverse for timeline display (oldest at top, newest at bottom)
        const timelineLogs = [...data.logs].reverse();
        setLogs(timelineLogs);
        setRedisConnected(data.redis_connected);
        setStorageNotice(data.storage_notice);
        setTotalBuffered(data.total_available);
        if (timelineLogs.length > 0) {
          const newest = timelineLogs[timelineLogs.length - 1];
          setLastEventTime(new Date(newest.timestamp));
        }
      } else {
        setError(`Failed to retrieve initial log history (HTTP ${res.status}).`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleReconnectRef = useRef<() => void>(() => {});
  const connectSSERef = useRef<() => void>(() => {});

  // Exponential backoff reconnect
  const scheduleReconnect = useCallback(() => {
    if (isPausedRef.current || authError) return;

    setStreamStatus('reconnecting');
    const attempt = reconnectAttemptRef.current;
    // 1s -> 2s -> 4s -> 8s -> 16s -> 30s max
    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
    reconnectAttemptRef.current += 1;

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = setTimeout(() => {
      connectSSERef.current();
    }, backoffMs);
  }, [authError]);

  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect;
  }, [scheduleReconnect]);

  // Connect to fetch-based SSE stream
  const connectSSE = useCallback(() => {
    // If paused or auth error, do not connect
    if (isPausedRef.current) {
      setStreamStatus('paused');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
    if (!token) {
      setAuthError(true);
      setError('Authentication token missing. Please sign in as a Platform System Owner.');
      setStreamStatus('disconnected');
      return;
    }

    // Cancel existing controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStreamStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');

    const streamUrl = `${API_BASE}/api/v1/admin/logs/stream`;

    fetch(streamUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          setAuthError(true);
          setError(response.status === 403 
            ? 'Access denied: Platform System Owner (super_user) privileges required.' 
            : 'Session expired. Please sign in again.'
          );
          setStreamStatus('disconnected');
          return;
        }

        if (response.status === 429) {
          setError('Live stream limit reached (max 10 concurrent super_user connections). Retrying later...');
          scheduleReconnectRef.current();
          return;
        }

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status} from live log stream`);
        }

        // Successfully connected!
        setStreamStatus('connected');
        reconnectAttemptRef.current = 0;
        setError(null);

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        // Reset watchdog timer
        const resetWatchdog = () => {
          if (heartbeatWatchdogRef.current) clearTimeout(heartbeatWatchdogRef.current);
          // If no message or heartbeat received in 45 seconds, trigger reconnect
          heartbeatWatchdogRef.current = setTimeout(() => {
            console.warn('[SSE] Heartbeat watchdog timeout. Reconnecting...');
            controller.abort();
          }, 45000);
        };
        resetWatchdog();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          resetWatchdog();

          // SSE messages are delimited by double newlines \n\n
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const chunk of parts) {
            const trimmed = chunk.trim();
            if (!trimmed) continue;

            // Heartbeat comment format: ": heartbeat <timestamp>"
            if (trimmed.startsWith(': heartbeat') || trimmed.startsWith(':')) {
              setLastHeartbeat(new Date());
              continue;
            }

            // Parse event type & data
            let eventType = 'message';
            let eventData = '';

            const lines = trimmed.split('\n');
            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.replace('event:', '').trim();
              } else if (line.startsWith('data:')) {
                eventData = line.replace('data:', '').trim();
              }
            }

            if (eventType === 'connected') {
              try {
                const connData = JSON.parse(eventData);
                setRedisConnected(Boolean(connData.redis_connected));
                setLastHeartbeat(new Date());
              } catch {
                // Ignore parse errors on handshake
              }
            } else if (eventType === 'log' && eventData) {
              try {
                const entry: SystemLogEntry = JSON.parse(eventData);
                const eventDate = new Date(entry.timestamp);
                setLastHeartbeat(new Date());
                setLastEventTime(eventDate);
                
                if (!isPausedRef.current) {
                  setLogs((prev) => {
                    const next = [...prev, entry];
                    return next.length > MAX_UI_LOGS ? next.slice(-MAX_UI_LOGS) : next;
                  });
                  setTotalBuffered((prev) => prev + 1);
                }
              } catch (e) {
                console.error('[SSE] Failed to parse log JSON:', e);
              }
            }
          }
        }

        // Stream completed cleanly
        scheduleReconnectRef.current();
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          // Intentional abort (paused or unmounted)
          return;
        }
        console.warn('[SSE] Stream disconnected:', err.message);
        scheduleReconnectRef.current();
      });
  }, []);

  useEffect(() => {
    connectSSERef.current = connectSSE;
  }, [connectSSE]);

  // Initial mount
  useEffect(() => {
    loadInitialHistory().then(() => {
      connectSSE();
    });

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (heartbeatWatchdogRef.current) clearTimeout(heartbeatWatchdogRef.current);
    };
  }, [loadInitialHistory, connectSSE]);

  // Handle Pause/Resume
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      isPausedRef.current = false;
      connectSSE();
    } else {
      setIsPaused(true);
      isPausedRef.current = true;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setStreamStatus('paused');
    }
  };

  // Clear frontend display only - does not delete backend logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Filter logs locally based on search, level, and source
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedLevel !== 'ALL' && log.level !== selectedLevel) return false;
      if (selectedSource !== 'ALL' && log.source !== selectedSource) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inMsg = log.message.toLowerCase().includes(q);
        const inPath = log.request_path ? log.request_path.toLowerCase().includes(q) : false;
        const inUser = log.user_id ? log.user_id.toLowerCase().includes(q) : false;
        if (!inMsg && !inPath && !inUser) return false;
      }
      return true;
    });
  }, [logs, selectedLevel, selectedSource, searchQuery]);

  // Derived real-data metrics for summary cards
  const errorCount = useMemo(() => {
    return logs.filter((l) => l.level === 'ERROR' || l.level === 'CRITICAL').length;
  }, [logs]);

  const warningCount = useMemo(() => {
    return logs.filter((l) => l.level === 'WARNING').length;
  }, [logs]);

  // Handle Copy JSON
  const handleCopyJson = (logId: string, metadata: any) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
      setCopiedLogId(logId);
      setTimeout(() => {
        setCopiedLogId(null);
      }, 2000);
    }
  };

  // Style helpers for severity badges
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            CRITICAL
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            ERROR
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            WARNING
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            INFO
          </span>
        );
    }
  };

  // Style helpers for sources
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'API':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/70">
            <Globe className="w-3 h-3 text-purple-600" />
            API
          </span>
        );
      case 'AUTH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <Lock className="w-3 h-3 text-emerald-600" />
            AUTH
          </span>
        );
      case 'DATABASE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200/70">
            <Database className="w-3 h-3 text-cyan-600" />
            DATABASE
          </span>
        );
      case 'WORKER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200/70">
            <Cpu className="w-3 h-3 text-orange-600" />
            WORKER
          </span>
        );
      case 'SYSTEM':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
            <Server className="w-3 h-3 text-slate-500" />
            SYSTEM
          </span>
        );
    }
  };

  // Stream status badge
  const renderStreamStatusBadge = () => {
    switch (streamStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Stream</span>
          </div>
        );
      case 'reconnecting':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>Reconnecting...</span>
          </div>
        );
      case 'paused':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Stream Paused</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
            <span>Connecting...</span>
          </div>
        );
      case 'disconnected':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Disconnected</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Live Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Logs</h1>
            {renderStreamStatusBadge()}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitor platform activity, errors, and system events in real time.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Last event:</span>
              <span className="font-mono text-slate-700">
                {lastEventTime ? lastEventTime.toLocaleTimeString() : 'None received'}
              </span>
            </div>
            {lastHeartbeat && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300">•</span>
                <span>Heartbeat:</span>
                <span className="font-mono text-slate-700">
                  {lastHeartbeat.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          <button
            type="button"
            onClick={togglePause}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
              isPaused 
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause'}</span>
          </button>

          <button
            type="button"
            onClick={clearLogs}
            title="Clear logs from the browser display only. Backend history and streaming are not affected."
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear View</span>
          </button>

          <button
            type="button"
            onClick={() => { loadInitialHistory(); connectSSE(); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Buffered Events */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Buffered Events
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {logs.length}
              </span>
              <span className="text-xs text-slate-400">
                / {MAX_UI_LOGS} max
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {totalBuffered > logs.length ? `${totalBuffered} available on server` : 'In-memory ring buffer'}
            </p>
          </div>
        </div>

        {/* Card 2: Errors & Critical */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            errorCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'
          }`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Errors & Critical
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${
                errorCount > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}>
                {errorCount}
              </span>
              {logs.length > 0 && (
                <span className="text-xs text-slate-400">
                  ({Math.round((errorCount / logs.length) * 100)}%)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {errorCount > 0 ? 'Requires administrative attention' : 'No recent errors in buffer'}
            </p>
          </div>
        </div>

        {/* Card 3: Warnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            warningCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Warnings
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${
                warningCount > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}>
                {warningCount}
              </span>
              {logs.length > 0 && (
                <span className="text-xs text-slate-400">
                  ({Math.round((warningCount / logs.length) * 100)}%)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {warningCount > 0 ? 'Non-critical system warnings' : 'Zero warnings in buffer'}
            </p>
          </div>
        </div>

        {/* Card 4: Redis Availability (Separated from SSE Stream Status) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            redisConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {redisConnected ? <Layers className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Redis Availability
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-base font-bold ${
                redisConnected ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {redisConnected ? 'Pub/Sub Active' : 'Local Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {redisConnected ? 'Multi-instance synchronized' : 'Process-local buffer only'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. System Availability Banner */}
      {!redisConnected ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-bold text-amber-950">
              Local logging mode — events may be limited to this backend instance.
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              {storageNotice || 'Redis Pub/Sub is unavailable. Live events and history reflect only this backend process and are not shared across serverless/scaled replicas.'}
            </p>
          </div>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-200/60 text-amber-900">
            Degraded Mode
          </span>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Distributed logging active — events synchronized across backend replicas via Redis Pub/Sub.
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Multi-Instance Replication</span>
          </div>
        </div>
      )}

      {/* 4. Auth & Error Alerts */}
      {authError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-900 text-sm">
          <ShieldLock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-rose-950">Super User Authorization Required</p>
            <p className="text-xs text-rose-800 mt-0.5">
              {error || 'You do not have permission to view real-time administrative logs.'}
            </p>
          </div>
        </div>
      )}

      {error && !authError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-950">Connection Notice</p>
            <p className="text-xs text-amber-800 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 5. Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages, request paths, user IDs..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Level Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Severity:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                aria-label="Filter by severity level"
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="ALL">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Source:</span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                aria-label="Filter by source component"
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="ALL">All Sources</option>
                <option value="API">API</option>
                <option value="AUTH">AUTH</option>
                <option value="DATABASE">DATABASE</option>
                <option value="WORKER">WORKER</option>
                <option value="SYSTEM">SYSTEM</option>
              </select>
            </div>

            {/* Auto-Scroll Toggle */}
            <button
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                autoScroll 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowDownCircle className={`w-3.5 h-3.5 ${autoScroll ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Auto-Scroll</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Log Activity Feed (Responsive: Desktop Table + Mobile Cards) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px]">
        {/* Feed Header */}
        <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Activity Stream
            </h2>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Showing <span className="font-mono font-bold text-slate-800">{filteredLogs.length}</span> of {logs.length} buffered
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            {autoScroll ? (
              <span className="inline-flex items-center gap-1 text-blue-600 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Live scroll active
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">Scroll paused</span>
            )}
          </div>
        </div>

        {/* Scrollable Feed Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          {loading && logs.length === 0 ? (
            /* Loading Skeleton */
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-16 h-4 bg-slate-200 rounded" />
                  <div className="w-14 h-5 bg-slate-200 rounded-full" />
                  <div className="w-16 h-5 bg-slate-200 rounded" />
                  <div className="flex-1 h-4 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No log events found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {logs.length === 0
                  ? 'Waiting for system events to stream from backend services...'
                  : 'No logs match your current search query or severity filters.'}
              </p>
              {(selectedLevel !== 'ALL' || selectedSource !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLevel('ALL');
                    setSelectedSource('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            /* Log Rows */
            filteredLogs.map((entry) => {
              const isExpanded = expandedLogId === entry.id;
              const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;
              const timeString = new Date(entry.timestamp).toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <div 
                  key={entry.id} 
                  className={`transition-colors ${
                    isExpanded ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* --- Desktop View (Table-like row) --- */}
                  <div 
                    onClick={() => hasMetadata && setExpandedLogId(isExpanded ? null : entry.id)}
                    className={`hidden md:flex items-start gap-3 px-5 py-3 ${hasMetadata ? 'cursor-pointer' : ''}`}
                  >
                    {/* Timestamp */}
                    <span className="font-mono text-xs text-slate-500 w-16 shrink-0 pt-0.5">
                      {timeString}
                    </span>

                    {/* Severity Badge */}
                    <div className="w-24 shrink-0">
                      {getLevelBadge(entry.level)}
                    </div>

                    {/* Source Badge */}
                    <div className="w-24 shrink-0">
                      {getSourceBadge(entry.source)}
                    </div>

                    {/* Status Code (if present) */}
                    {entry.status_code && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 border ${
                        entry.status_code >= 500 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        entry.status_code >= 400 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        HTTP {entry.status_code}
                      </span>
                    )}

                    {/* Context Chips (Path / User) */}
                    {entry.request_path && (
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shrink-0 max-w-[200px] truncate" title={entry.request_path}>
                        {entry.request_path}
                      </span>
                    )}

                    {entry.user_id && (
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shrink-0 max-w-[130px] truncate" title={entry.user_id}>
                        usr:{entry.user_id}
                      </span>
                    )}

                    {/* Message */}
                    <span className="text-sm text-slate-800 flex-1 leading-relaxed break-words font-sans">
                      {entry.message}
                    </span>

                    {/* Metadata expand button */}
                    {hasMetadata && (
                      <div className="shrink-0 pt-0.5 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs">
                        <span>{isExpanded ? 'Less' : 'Details'}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </div>

                  {/* --- Mobile View (Stacked card row) --- */}
                  <div 
                    onClick={() => hasMetadata && setExpandedLogId(isExpanded ? null : entry.id)}
                    className={`md:hidden p-4 space-y-2 ${hasMetadata ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getLevelBadge(entry.level)}
                        {getSourceBadge(entry.source)}
                      </div>
                      <span className="font-mono text-xs text-slate-500">
                        {timeString}
                      </span>
                    </div>

                    <p className="text-sm text-slate-900 leading-snug break-words">
                      {entry.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {entry.status_code && (
                        <span className={`px-1.5 py-0.5 rounded font-mono font-bold border text-[11px] ${
                          entry.status_code >= 500 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          entry.status_code >= 400 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          HTTP {entry.status_code}
                        </span>
                      )}

                      {entry.request_path && (
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded truncate max-w-[200px]">
                          {entry.request_path}
                        </span>
                      )}

                      {entry.user_id && (
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded truncate max-w-[130px]">
                          usr:{entry.user_id}
                        </span>
                      )}

                      {hasMetadata && (
                        <span className="text-blue-600 font-semibold text-[11px] ml-auto flex items-center gap-0.5">
                          {isExpanded ? 'Hide' : 'Details'}
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Metadata Panel */}
                  {isExpanded && hasMetadata && (
                    <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 text-xs space-y-2.5">
                      <div className="flex items-center justify-between text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-700">Sanitized Event Metadata</span>
                          <span className="font-mono text-[11px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded">
                            Instance: {entry.instance_id || 'local'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyJson(entry.id, entry.metadata);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-medium transition-colors"
                        >
                          {copiedLogId === entry.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed select-all">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
