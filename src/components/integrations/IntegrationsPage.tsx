'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  fetchIntegrationsStatus, 
  disconnectCalcom 
} from '@/lib/api';
import { RotateCw, Mail } from 'lucide-react';

interface IntegrationCard {
  id: string;
  name: string;
  desc: string;
  category: string;
  iconBg: string;
  status: 'connected' | 'disconnected' | 'connecting';
  accountEmail?: string;
  logoSvg: React.ReactNode;
}

export default function IntegrationsPage() {
  const { addToast, authToken } = useApp();

  const [integrations, setIntegrations] = useState<IntegrationCard[]>([
    {
      id: 'calcom',
      name: 'Cal.com',
      desc: 'Schedule appointments automatically',
      category: 'Scheduling',
      iconBg: 'bg-zinc-900 text-white',
      status: 'disconnected', // dynamically fetched from backend
      logoSvg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h16v16H4V4z" fill="currentColor"/>
          <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      desc: 'Sync leads and contacts',
      category: 'CRM',
      iconBg: 'bg-orange-50 text-orange-600',
      status: 'disconnected',
      logoSvg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#ea580c" strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" fill="#ea580c"/>
          <path d="M12 3v6M12 15v6" stroke="#ea580c" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'zoho',
      name: 'Zoho CRM',
      desc: 'Manage your customer data',
      category: 'CRM',
      iconBg: 'bg-emerald-50 text-emerald-600',
      status: 'disconnected',
      logoSvg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="8" height="6" rx="1.5" stroke="#059669" strokeWidth="2"/>
          <rect x="13" y="5" width="8" height="6" rx="1.5" stroke="#059669" strokeWidth="2"/>
          <rect x="8" y="13" width="8" height="6" rx="1.5" stroke="#059669" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'slack',
      name: 'Slack',
      desc: 'Get notified in your workspace',
      category: 'Notifications',
      iconBg: 'bg-emerald-50 text-emerald-600',
      status: 'connected',
      logoSvg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M6 10a2 2 0 1 1-2-2h2v2zm1 0a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-5z" fill="#059669"/>
          <path d="M14 6a2 2 0 1 1 2-2v2h-2zm0 1a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2 2 2 0 0 1 2-2h5z" fill="#059669"/>
        </svg>
      )
    },
    {
      id: 'notion',
      name: 'Notion',
      desc: 'Use your docs as knowledge',
      category: 'Knowledge',
      iconBg: 'bg-slate-100 text-slate-900',
      status: 'disconnected',
      logoSvg: (
        <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
          N
        </div>
      )
    },
    {
      id: 'zapier',
      name: 'Zapier',
      desc: 'Automate workflows',
      category: 'Automation',
      iconBg: 'bg-orange-50 text-orange-600',
      status: 'disconnected',
      logoSvg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      desc: 'Connect AI models and providers',
      category: 'AI Gateway',
      iconBg: 'bg-indigo-50 text-indigo-600',
      status: 'connected',
      logoSvg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      desc: 'Real-time HTTP events dispatch',
      category: 'Developer',
      iconBg: 'bg-slate-100 text-slate-800',
      status: 'connected',
      logoSvg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1M6 8H5a4 4 0 0 0 0 8h1M8 12h8" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
  ]);

  // Load real integration status from backend
  const loadStatus = async (tokenOverride?: string) => {
    const token = tokenOverride || authToken || (typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null);
    if (!token) return;

    try {
      const data = await fetchIntegrationsStatus(token);
      if (data?.integrations?.calcom) {
        const cal = data.integrations.calcom;
        const isConnected = cal.connected && cal.status === 'connected';

        setIntegrations(prev => prev.map(i => {
          if (i.id === 'calcom') {
            return {
              ...i,
              status: isConnected ? 'connected' : 'disconnected',
              desc: isConnected ? `Connected` : 'Schedule appointments automatically'
            };
          }
          return i;
        }));
      }
    } catch (e) {
      console.warn('Could not load integrations status:', e);
    }
  };

  useEffect(() => {
    loadStatus();

    // No OAuth redirect needed for Cal.com
  }, [authToken]);

  const handleToggleConnect = async (id: string, name: string, currentStatus: string) => {
    // 1. Special flow for Cal.com
    if (id === 'calcom') {
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null);
      if (!token) {
        addToast({
          type: 'error',
          title: 'Authentication Required',
          description: 'Please log in or refresh your session to manage integrations.'
        });
        return;
      }

      if (currentStatus === 'connected') {
        setIntegrations(prev => prev.map(i => i.id === 'calcom' ? { ...i, status: 'connecting' } : i));
        try {
          const res = await disconnectCalcom(token);
          if (res?.success) {
            setIntegrations(prev => prev.map(i => i.id === 'calcom' ? { ...i, status: 'disconnected', desc: 'Schedule appointments automatically', accountEmail: undefined } : i));
            addToast({
              type: 'info',
              title: 'Disconnected',
              description: 'Disconnected Cal.com integration and revoked API keys.'
            });
          } else {
            setIntegrations(prev => prev.map(i => i.id === 'calcom' ? { ...i, status: 'connected' } : i));
            addToast({
              type: 'error',
              title: 'Disconnect Failed',
              description: 'Could not disconnect Cal.com. Please try again.'
            });
          }
        } catch {
          setIntegrations(prev => prev.map(i => i.id === 'calcom' ? { ...i, status: 'connected' } : i));
          addToast({
            type: 'error',
            title: 'Error',
            description: 'Network failure when disconnecting Cal.com.'
          });
        }
        return;
      }

      // Redirect or show toast to go to appointments settings for connecting
      addToast({
        type: 'info',
        title: 'Cal.com Setup',
        description: 'Please head over to the Appointments page and click "Availability Settings" to connect your Cal.com account.'
      });
      return;
    }

    // 2. Keep other mock integrations untouched as specified
    if (currentStatus === 'connected') {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: 'disconnected' } : i));
      addToast({
        type: 'info',
        title: 'Disconnected',
        description: `Disconnected ${name} integration.`
      });
      return;
    }

    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: 'connecting' } : i));

    setTimeout(() => {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: 'connected' } : i));
      addToast({
        type: 'success',
        title: 'Connected',
        description: `Successfully authenticated ${name} integration.`
      });
    }, 900);
  };

  return (
    <div className="space-y-8 page-transition pb-12">
      {/* Header (Matches Panel 7: Integrations) */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Integrations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Connect your favorite tools to automate your workflow.
        </p>
      </div>

      {/* Grid of Integration Cards (3 cols on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map(tool => {
          const isConnected = tool.status === 'connected';
          const isConnecting = tool.status === 'connecting';

          return (
            <div
              key={tool.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Logo and Status */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-2xs">
                    {tool.logoSvg}
                  </div>
                  {isConnected && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Connected
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{tool.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tool.desc}</p>
                  {tool.id === 'calcom' && isConnected && tool.accountEmail && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl w-fit">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{tool.accountEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  onClick={() => handleToggleConnect(tool.id, tool.name, tool.status)}
                  disabled={isConnecting}
                  className={`w-full py-2 px-4 rounded-xl text-xs font-medium transition-all shadow-2xs btn-press flex items-center justify-center gap-1.5 ${
                    isConnected
                      ? 'bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200'
                      : isConnecting
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'bg-white hover:bg-slate-50 text-indigo-600 hover:text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {isConnecting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isConnected 
                      ? 'Disconnect' 
                      : isConnecting 
                      ? 'Connecting...' 
                      : tool.id === 'calcom' 
                      ? 'Setup Cal.com' 
                      : 'Connect'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Webhooks & Custom API Keys Notice */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Custom Webhooks & REST API</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrate Chatly directly with your internal backend, Zapier webhooks, or Make.com scenarios.
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText('https://api.chatly.ai/v1/webhooks/bot_01');
            addToast({
              type: 'success',
              title: 'Webhook URL Copied',
              description: 'Copied webhook receiver endpoint to clipboard.'
            });
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded-xl shadow-xs transition-all btn-press shrink-0"
        >
          Copy Webhook URL
        </button>
      </div>
    </div>
  );
}
