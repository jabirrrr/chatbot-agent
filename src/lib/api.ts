/**
 * Chatly API Client
 * Connects Next.js frontend with FastAPI backend
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NODE_ENV === 'production'
    ? ''
    : 'http://localhost:8000';

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

/**
 * Fetch all integration statuses for the tenant organization
 */
export async function fetchIntegrationsStatus(token: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/integrations/status`, {
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
    return null;
  } catch (err) {
    console.warn('Failed to fetch integrations status:', err);
    return null;
  }
}

/**
 * Fetch Google Calendar OAuth Authorization URL
 */
export async function getGoogleCalendarAuthUrl(token: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/integrations/google-calendar/auth-url`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return data;
    }
    return { error: data.detail || `Failed to initiate authorization (HTTP ${res.status})` };
  } catch (err: any) {
    console.error('Failed to get Google Calendar auth URL:', err);
    return { error: err?.message || 'Network connection failed' };
  }
}

/**
 * Disconnect Google Calendar integration
 */
export async function disconnectGoogleCalendar(token: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/integrations/google-calendar/disconnect`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return data;
    }
    return { success: false, error: data.detail || 'Failed to disconnect integration' };
  } catch (err: any) {
    console.error('Failed to disconnect Google Calendar:', err);
    return { success: false, error: err?.message || 'Network connection failed' };
  }
}

/**
 * Fetch all organizations the user belongs to
 */
export async function fetchUserOrganizations(token: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/organizations/`, {
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
    return [];
  } catch (err) {
    console.warn('Failed to fetch user organizations:', err);
    return [];
  }
}

/**
 * Fetch a specific organization by ID
 */
export async function fetchOrganization(token: string, orgId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/organizations/${orgId}`, {
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
    return null;
  } catch (err) {
    console.warn('Failed to fetch organization:', err);
    return null;
  }
}

/**
 * Update an organization's settings (name, website, industry, timezone)
 */
export async function updateOrganization(
  token: string,
  orgId: string,
  data: { name?: string; website?: string; industry?: string; timezone?: string }
) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/organizations/${orgId}`, {
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
    const errData = await res.json().catch(() => ({}));
    return { error: errData.detail || `Failed to update organization (${res.status})` };
  } catch (err: any) {
    console.error('Failed to update organization:', err);
    return { error: err?.message || 'Network error updating organization' };
  }
}

export interface AdminComponentData {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'not_configured' | 'unknown';
  latency_ms?: number | null;
  uptime: string;
  details?: string | null;
  checked_at: string;
}

export interface AdminErrorLogData {
  id: string;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  time: string;
  timestamp: string;
}

export interface AdminHealthData {
  overall_status: 'healthy' | 'degraded' | 'down' | 'unknown';
  checked_at: string;
  components: Record<string, AdminComponentData>;
  recent_errors: AdminErrorLogData[];
  has_persistent_error_telemetry?: boolean;
  environment: string;
}

/**
 * Fetch real administrative infrastructure health telemetry
 */
export async function fetchAdminHealth(token?: string | null): Promise<AdminHealthData | null> {
  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/api/v1/admin/health`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn('Failed to fetch admin health telemetry:', err);
    return null;
  }
}

