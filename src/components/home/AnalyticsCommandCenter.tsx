'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  ArrowUpRight, 
  Calendar, 
  MessageSquare, 
  Users, 
  Star, 
  Bot, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Settings, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  Activity,
  Zap
} from 'lucide-react';

// Dynamic data will be fetched in the component

function CountUpNumber({ end, decimals = 0, suffix = '', prefix = '', duration = 800 }: { end: number; decimals?: number; suffix?: string; prefix?: string; duration?: number }) {
  const [val, setVal] = useState(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    let animFrame: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setVal(easeProgress * end);
      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [end, duration]);

  const formatted = decimals > 0 
    ? val.toFixed(decimals) 
    : Math.round(val).toLocaleString();

  return <span>{prefix}{formatted}{suffix}</span>;
}

import { apiFetch } from '@/lib/api';

export default function AnalyticsCommandCenter() {
  const { setCurrentScreen, setIsWidgetOpen, isEmptyStateDemo, setIsEmptyStateDemo, authToken } = useApp();
  const [selectedDateRange, setSelectedDateRange] = useState('Last 7 Days');

  const [metrics, setMetrics] = useState({
    conversations: 0,
    leads: 0,
    appointments: 0,
    resolutionRate: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentConvs, setRecentConvs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function loadDashboardData() {
      if (!authToken) return;
      try {
        const [overviewRes, usageRes, convsRes, apptsRes] = await Promise.all([
          apiFetch('/api/v1/analytics/overview', { token: authToken }),
          apiFetch('/api/v1/analytics/usage', { token: authToken }),
          apiFetch('/api/v1/conversations/', { token: authToken }),
          apiFetch('/api/v1/appointments/', { token: authToken })
        ]);

        const totalConvs = overviewRes?.total_conversations || 0;
        const handedOff = overviewRes?.handed_off_conversations || 0;
        const resolution = totalConvs > 0 ? ((totalConvs - handedOff) / totalConvs) * 100 : 100;

        setMetrics({
          conversations: totalConvs,
          leads: overviewRes?.total_leads || 0,
          appointments: apptsRes?.items?.length || 0,
          resolutionRate: resolution,
        });

        if (usageRes?.daily_trend) {
          setChartData(usageRes.daily_trend.map((d: any) => ({
            date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            conversations: d.total_conversations
          })));
        }

        if (convsRes?.items) {
          setRecentConvs(convsRes.items.slice(0, 4).map((c: any) => ({
            name: c.visitor_name || 'Anonymous User',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
            query: c.last_message || 'Started a conversation',
            time: new Date(c.updated_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
          })));
        }

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [authToken]);

  if (isEmptyStateDemo) {
    return (
      <div className="space-y-6 page-transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Good evening, Mohamed!</h1>
            <p className="text-sm text-slate-500 mt-0.5">Here's what's happening with your chatbot today.</p>
          </div>
          <button
            onClick={() => setIsEmptyStateDemo(false)}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors w-fit"
          >
            Switch to Populated View
          </button>
        </div>

        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center max-w-xl mx-auto my-12 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No Conversations Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            Your chatbot is ready for customers. Embed it on your website or share the link to start answering customer inquiries automatically.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setCurrentScreen('chatbots')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-xs transition-all btn-press"
            >
              Configure Assistant
            </button>
            <button
              onClick={() => setIsWidgetOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all btn-press"
            >
              Test Widget
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition pb-12">
      {/* Header (Matches Reference Panel 2: Good evening, Mohamed!) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good evening, Mohamed!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening with your chatbot today.
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3.5 py-1.5 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-700">{selectedDateRange}</span>
        </div>
      </div>

      {/* 4 KPI Cards (Total Conversations, Leads Captured, Appointments, AI Resolution Rate) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Conversations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
          <p className="text-xs font-medium text-slate-500">Total Conversations</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              <CountUpNumber end={metrics.conversations} />
            </span>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span>↑ 12%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Leads Captured */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
          <p className="text-xs font-medium text-slate-500">Leads Captured</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              <CountUpNumber end={metrics.leads} />
            </span>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span>↑ 28%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
          <p className="text-xs font-medium text-slate-500">Appointments</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              <CountUpNumber end={metrics.appointments} />
            </span>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span>↑ 33%</span>
            </div>
          </div>
        </div>

        {/* Card 4: AI Resolution Rate / User Rating */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">AI Resolution Rate</p>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">4.8/5 Rating</span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              <CountUpNumber end={metrics.resolutionRate} decimals={1} suffix="%" />
            </span>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span>↑ 6%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Left Chart + Right Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Conversations Over Time */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Conversations Over Time</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>Daily Volume</span>
            </div>
          </div>

          {/* Area Chart with Soft Gradient */}
          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConvs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-indigo-300 font-semibold">{payload[0].value} conversations</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="conversations" 
                  stroke="#4f46e5" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorConvs)" 
                  activeDot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 4 Cols: Recent Conversations (Matching Panel 2) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Recent Conversations</h2>
            <button
              onClick={() => setCurrentScreen('conversations')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100 py-1 flex-1 min-h-[220px] overflow-y-auto pr-1">
            {recentConvs.length > 0 ? recentConvs.map((conv, idx) => (
              <div 
                key={idx} 
                onClick={() => setCurrentScreen('conversations')}
                style={{ animationDelay: `${idx * 75}ms` }}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-3 px-3 rounded-xl transition-all cursor-pointer animate-fade-in"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-100"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{conv.name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.query}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium shrink-0 ml-2">
                  {conv.time}
                </span>
              </div>
            )) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-slate-400">No conversations yet.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setCurrentScreen('conversations')}
              className="w-full py-2 text-center text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Open Inbox →
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Section: Quick Actions & Chatbot Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentScreen('knowledge')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-left transition-all btn-press"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">Add Knowledge</p>
                <p className="text-[11px] text-slate-500">Upload PDF or URL</p>
              </div>
            </button>

            <button
              onClick={() => setCurrentScreen('appearance')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-left transition-all btn-press"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">Customize Widget</p>
                <p className="text-[11px] text-slate-500">Colors & tone</p>
              </div>
            </button>

            <button
              onClick={() => setCurrentScreen('chatbots')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-left transition-all btn-press"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">AI Builder</p>
                <p className="text-[11px] text-slate-500">Configure prompt</p>
              </div>
            </button>

            <button
              onClick={() => setCurrentScreen('integrations')}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-left transition-all btn-press"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">Integrations</p>
                <p className="text-[11px] text-slate-500">HubSpot & Slack</p>
              </div>
            </button>
          </div>
        </div>

        {/* Chatbot Health Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Chatbot Health</h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Operational
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">AI Response Latency</span>
              <span className="font-semibold text-slate-900">420ms avg</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Knowledge Ingestion</span>
              <span className="font-semibold text-emerald-600">5 sources active</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">AI Resolution Rate</span>
              <span className="font-semibold text-indigo-600">92.4% autonomous</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Uptime SLA</span>
              <span className="font-semibold text-slate-900">99.98%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
