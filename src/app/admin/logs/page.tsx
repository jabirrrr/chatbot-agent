'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Pause, 
  Play, 
  Trash2, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  AlertCircle, 
  ShieldLock, 
  Layers, 
  ArrowDownCircle, 
  ChevronRight, 
  ChevronDown, 
  Terminal, 
  Database, 
  Lock, 
  Cpu, 
  Globe 
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
  const [totalBuffered, setTotalBuffered] = useState<number>(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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

  // Auto-scroll to bottom if enabled
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
                setLastHeartbeat(new Date());
                
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

  const clearLogs = () => {
    setLogs([]);
  };

  // Filter logs locally
  const filteredLogs = logs.filter((log) => {
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

  // Helpers for badge styles
  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border border-red-500/30';
      case 'ERROR':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'INFO':
      default:
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'API':
        return <Globe className="w-3.5 h-3.5 text-purple-400" />;
      case 'AUTH':
        return <Lock className="w-3.5 h-3.5 text-emerald-400" />;
      case 'DATABASE':
        return <Database className="w-3.5 h-3.5 text-cyan-400" />;
      case 'WORKER':
        return <Cpu className="w-3.5 h-3.5 text-orange-400" />;
      case 'SYSTEM':
      default:
        return <Terminal className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Live System Logs</h1>
            
            {/* Live stream status pill */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
              streamStatus === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : streamStatus === 'reconnecting'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : streamStatus === 'paused'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                streamStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
                streamStatus === 'reconnecting' ? 'bg-amber-400 animate-ping' :
                streamStatus === 'paused' ? 'bg-blue-400' : 'bg-rose-400'
              }`} />
              {streamStatus === 'connected' ? 'Live Stream' :
               streamStatus === 'reconnecting' ? 'Reconnecting...' :
               streamStatus === 'paused' ? 'Paused' : 'Disconnected'}
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time event stream from backend services with strict data sanitization and Super User RBAC.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePause}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              isPaused 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume Stream' : 'Pause'}
          </button>

          <button
            onClick={clearLogs}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Clear current log view"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>

          <button
            onClick={() => { loadInitialHistory(); connectSSE(); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Architecture & Degraded State Banner */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
        redisConnected 
          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
          : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
      }`}>
        <div className="flex items-start md:items-center gap-3">
          {redisConnected ? (
            <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 md:mt-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 md:mt-0" />
          )}
          <div>
            <div className="font-semibold flex items-center gap-2">
              {redisConnected ? 'Multi-Instance Streaming Active' : 'Degraded Mode: Process-Local Logs Only'}
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                redisConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {redisConnected ? 'Redis Pub/Sub Sync' : 'Single Worker Scope'}
              </span>
            </div>
            <p className="mt-0.5 text-slate-400">
              {storageNotice || (redisConnected 
                ? 'Logs are synchronized across backend replicas via Redis Pub/Sub. Recent 500 events kept in-memory.'
                : 'Redis Pub/Sub is unavailable. Live events and history reflect only this backend process and are not shared across serverless/scaled replicas.')
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400 shrink-0">
          <div>
            Events: <span className="text-white font-mono font-medium">{filteredLogs.length}</span> / {totalBuffered}
          </div>
          {lastHeartbeat && (
            <div>
              Heartbeat: <span className="text-slate-300 font-mono">{lastHeartbeat.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Authentication & Error Banners */}
      {authError && (
        <div className="p-4 bg-rose-950/30 border border-rose-800/50 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
          <ShieldLock className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <span className="font-bold">Super User Authorization Required: </span>
            {error || 'You do not have permission to view real-time administrative logs.'}
          </div>
        </div>
      )}

      {error && !authError && (
        <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-2xl flex items-center gap-3 text-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages, paths, users..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Level and Source Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Level:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Source:</span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Sources</option>
              <option value="API">API</option>
              <option value="AUTH">AUTH</option>
              <option value="DATABASE">DATABASE</option>
              <option value="WORKER">WORKER</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>

          {/* Auto Scroll Checkbox */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              autoScroll 
                ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' 
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            Auto-Scroll
          </button>
        </div>
      </div>

      {/* 5. Live Log Feed Terminal */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
        {/* Terminal Header */}
        <div className="h-10 bg-slate-900/80 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="text-xs text-slate-400 ml-2 font-mono flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              system-activity-stream.log
            </span>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            Buffered: {filteredLogs.length} events
          </span>
        </div>

        {/* Scrollable Event Log Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs custom-scrollbar">
          {loading && logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <p>Initializing authenticated live log stream...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <Terminal className="w-8 h-8 text-slate-600" />
              <p className="text-slate-400 font-medium">No log events matching filters</p>
              <p className="text-[11px] text-slate-600">Events from API, Auth, Database, and Worker activity will stream here in real-time.</p>
            </div>
          ) : (
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
                  className={`group rounded-lg transition-colors border ${
                    isExpanded ? 'bg-slate-900 border-slate-700' : 'hover:bg-slate-900/60 border-transparent'
                  }`}
                >
                  <div 
                    onClick={() => hasMetadata && setExpandedLogId(isExpanded ? null : entry.id)}
                    className="flex items-start gap-2.5 px-2.5 py-1.5 cursor-pointer select-text"
                  >
                    {/* Timestamp */}
                    <span className="text-slate-500 shrink-0 text-[11px] pt-0.5">
                      {timeString}
                    </span>

                    {/* Level Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${getLevelBadgeClass(entry.level)}`}>
                      {entry.level}
                    </span>

                    {/* Source Tag */}
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      {getSourceIcon(entry.source)}
                      {entry.source}
                    </span>

                    {/* Status Code (if present) */}
                    {entry.status_code && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        entry.status_code >= 500 ? 'bg-rose-500/20 text-rose-300' :
                        entry.status_code >= 400 ? 'bg-amber-500/20 text-amber-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {entry.status_code}
                      </span>
                    )}

                    {/* Message */}
                    <span className="text-slate-200 flex-1 break-all">
                      {entry.message}
                    </span>

                    {/* Expand icon for metadata */}
                    {hasMetadata && (
                      <span className="text-slate-500 group-hover:text-slate-300 shrink-0">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>

                  {/* Expanded Metadata Viewer */}
                  {isExpanded && hasMetadata && (
                    <div className="px-4 pb-3 pt-1 border-t border-slate-800/60 bg-slate-950/60 rounded-b-lg text-[11px]">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="font-semibold text-slate-300">Sanitized Metadata</span>
                        <span className="text-[10px] text-slate-500">Instance ID: {entry.instance_id || 'local'}</span>
                      </div>
                      <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
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
