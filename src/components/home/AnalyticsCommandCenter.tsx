'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import Badge from '@/components/common/Badge';
import { 
  mock7DayVolumeData, 
  mockLeadFunnelData, 
  mockUnansweredQuestions, 
  mockRecentActivities 
} from '@/data/mockData';
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
  MessageSquare, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Plus, 
  FileText, 
  Headphones,
  ShieldCheck,
  Bot
} from 'lucide-react';

export default function AnalyticsCommandCenter() {
  const { 
    chatbot, 
    leads, 
    setCurrentScreen, 
    setIsWidgetOpen, 
    isEmptyStateDemo,
    setIsEmptyStateDemo,
    addToast
  } = useApp();

  // If viewing empty state
  if (isEmptyStateDemo) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Good morning, Sarah</h2>
            <p className="text-xs text-slate-500 mt-1">Here’s how your chatbot is helping Northstar Studio.</p>
          </div>
          <button
            onClick={() => setIsEmptyStateDemo(false)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors w-fit"
          >
            Switch to Populated Data Demo
          </button>
        </div>

        {/* Empty State Hero Card */}
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <Bot className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Chatbot Conversations Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            Your chatbot is ready, but website visitors haven't engaged yet. Complete the setup wizard or install the embed script on your website to start capturing leads automatically.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setCurrentScreen('onboarding')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Open Setup Wizard
            </button>
            <button
              onClick={() => setIsWidgetOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Test Chat Widget Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hotLeads = leads.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Status Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Good morning, Sarah</h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live & Healthy
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Here’s how your chatbot is helping Northstar Studio capture leads and answer client queries.
          </p>
        </div>

        {/* Status Card Strip */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Chatbot Status</p>
              <p className="font-bold text-slate-800">{chatbot.name}</p>
            </div>
          </div>
          <div className="pr-3 border-r border-slate-200">
            <p className="text-[10px] text-slate-400 font-medium">Uptime</p>
            <p className="font-bold text-slate-800">99.98%</p>
          </div>
          <div className="pr-3 border-r border-slate-200 hidden sm:block">
            <p className="text-[10px] text-slate-400 font-medium">Last Activity</p>
            <p className="font-bold text-slate-800">2 mins ago</p>
          </div>
          <button
            onClick={() => setIsWidgetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-sm transition-colors"
          >
            <span>View Widget</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Conversations */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Conversations</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">1,248</div>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4%</span>
              <span className="text-slate-400 font-normal">vs last week</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Leads Captured */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Leads Captured</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">86</div>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.1%</span>
              <span className="text-slate-400 font-normal">6.9% rate</span>
            </div>
          </div>
        </div>

        {/* KPI 3: AI Resolution Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">AI Resolution Rate</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">74%</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 font-medium">
              <span>923 chats resolved without human</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Appointments Booked */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Appointments Booked</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">23</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 font-medium">
              <span>Google Calendar synced</span>
            </div>
          </div>
        </div>

        {/* KPI 5: AI Cost */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">AI Cost (MTD)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">$42.18</div>
            <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(42.18 / 150) * 100}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">of $150 monthly budget</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Funnel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Conversation Volume Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Conversation Volume & Resolution</h3>
              <p className="text-xs text-slate-500">Daily visitor interactions over the past 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600">Total Chats</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Leads Captured</span>
              </div>
            </div>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mock7DayVolumeData}>
                <defs>
                  <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="conversations" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorConv)" />
                <Area type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorLead)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Conversion Funnel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Lead Conversion Funnel</h3>
            <p className="text-xs text-slate-500">Visitor progression from chat to booked appointment</p>

            <div className="mt-5 space-y-4">
              {mockLeadFunnelData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.stage}</span>
                    <span className="text-slate-900 font-bold">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-indigo-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${idx === 0 ? 100 : idx === 1 ? 55 : idx === 2 ? 35 : 22}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-right">{item.dropPct}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <span>Overall Chat-to-Booking:</span>
            <span className="font-bold text-blue-700 text-sm">1.84%</span>
          </div>
        </div>
      </div>

      {/* Hot Leads Table & Knowledge Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hot Leads Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hot Website Leads</h3>
              <p className="text-xs text-slate-500">Highest-intent prospects qualified by Helio AI</p>
            </div>
            <button
              onClick={() => setCurrentScreen('leads')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All Pipeline</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Assigned</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {hotLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-[11px] text-slate-400">{lead.email}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{lead.company}</td>
                    <td className="py-3 px-4">
                      <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                        {lead.score}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {lead.assignedAvatar && (
                          <img src={lead.assignedAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                        )}
                        <span className="truncate">{lead.assignedAgent}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={lead.status === 'qualified' ? 'emerald' : lead.status === 'booked' ? 'blue' : 'gray'}
                      >
                        {lead.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setCurrentScreen('leads')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Knowledge Base Health Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Knowledge Base Health</h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                94% Score
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Grounding coverage and accuracy metrics</p>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-500">Sources Indexed:</span>
                <span className="font-bold text-slate-800">5 Documents / 234 Chunks</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-500">Last Synced:</span>
                <span className="font-bold text-slate-800">Today at 9:00 AM</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                <span className="text-slate-500">Vector Search Model:</span>
                <span className="font-bold text-slate-800">text-embedding-3-small</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Suggested Action:
              </p>
              <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                Upload your 2026 pricing guidelines to resolve 8 unanswered visitor queries this week.
              </p>
            </div>
          </div>

          <button
            onClick={() => setCurrentScreen('knowledge')}
            className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Manage Knowledge Base</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Unanswered Questions & Activity Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unanswered Questions Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Unanswered Questions</h3>
              <p className="text-xs text-slate-500">Queries where AI could not find grounded context</p>
            </div>
            <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
              3 Questions
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {mockUnansweredQuestions.map(item => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800 leading-snug">"{item.question}"</p>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                    {item.occurrences}x
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-400">Asked {item.lastAsked}</span>
                  <button
                    onClick={() => {
                      setCurrentScreen('knowledge');
                      addToast({
                        type: 'info',
                        title: 'Add Knowledge',
                        description: `Opened knowledge editor to resolve: "${item.question}"`
                      });
                    }}
                    className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add to FAQ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Activity Feed</h3>
              <p className="text-xs text-slate-500">Real-time automation logs and handoff events</p>
            </div>
            <span className="text-xs text-slate-400">Auto-refreshing</span>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {mockRecentActivities.map(act => (
              <div key={act.id} className="py-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  act.type === 'lead' ? 'bg-emerald-50 text-emerald-600' :
                  act.type === 'appointment' ? 'bg-blue-50 text-blue-600' :
                  act.type === 'handoff' ? 'bg-purple-50 text-purple-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {act.type === 'lead' ? <UserCheck className="w-4 h-4" /> :
                   act.type === 'appointment' ? <Calendar className="w-4 h-4" /> :
                   act.type === 'handoff' ? <Headphones className="w-4 h-4" /> :
                   <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">{act.title}</p>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
