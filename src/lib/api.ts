/**
 * Chatly API Client
 * Connects Next.js frontend with FastAPI backend
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface BackendHealthResponse {
  status: string;
  service?: string;
  environment?: string;
  version?: string;
  api_prefix?: string;
}

export interface ComponentHealth {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  latency_ms: number;
  description: string;
}

export interface SystemStatusData {
  overall_status: string;
  uptime_percentage_90d: number;
  components: ComponentHealth[];
  active_incidents: Array<{ id: string; title: string; status: string; impact: string }>;
  sentry_monitoring_active: boolean;
  last_checked: string;
}

/**
 * Check backend liveness probe
 */
export async function checkBackendHealth(): Promise<{ isOnline: boolean; data?: BackendHealthResponse; latencyMs?: number }> {
  const start = performance.now();
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    const latency = Math.round(performance.now() - start);
    if (res.ok) {
      const data: BackendHealthResponse = await res.json();
      return { isOnline: true, data, latencyMs: latency };
    }
    return { isOnline: false, latencyMs: latency };
  } catch (err) {
    return { isOnline: false, latencyMs: Math.round(performance.now() - start) };
  }
}

/**
 * Check API v1 health
 */
export async function checkApiV1Health(): Promise<{ isOnline: boolean; data?: BackendHealthResponse }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data: BackendHealthResponse = await res.json();
      return { isOnline: true, data };
    }
    return { isOnline: false };
  } catch (err) {
    return { isOnline: false };
  }
}

/**
 * Fetch platform system status & SLA metrics
 */
export async function fetchSystemStatus(): Promise<SystemStatusData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/status`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Authenticate or get demo token
 */
export async function authenticateDemoUser(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch chatbots for active organization
 */
export async function fetchChatbots(token: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/chatbots/`, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Failed to fetch chatbots: ' + res.status);
  } catch (e) {
    throw e;
  }
}

/**
 * Update a chatbot
 */
export async function updateChatbot(token: string, chatbotId: string, data: any) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/chatbots/${chatbotId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}
