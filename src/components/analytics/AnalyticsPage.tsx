'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  mock7DayVolumeData, 
  mockLeadFunnelData, 
  mockAIModelLogs 
} from '@/data/mockData';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  UserCheck, 
  DollarSign, 
  Cpu, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function AnalyticsPage() {
  const { dateFilter, setDateFilter } = useApp();
  const [activeTab, setActiveTab] = useState<'conversations' | 'leads' | 'knowledge' | 'ai_cost'>('conversations');

  const intentData = [
    { intent: 'Pricing & Retainer Inquiry', percentage: 42, count: 524 },
    { intent: 'Service Scope & Tech Stack', percentage: 28, count: 350 },
    { intent: 'Discovery Call Scheduling', percentage: 18, count: 224 },
    { intent: 'Support / Portfolio Work', percentage: 12, count: 150 },
  ];

  const modelCostData = [
    { name: 'gpt-4o-mini', cost: 14.80, tokens: '98.5M' },
    { name: 'claude-3.5-sonnet', cost: 24.20, tokens: '8.1M' },
    { name: 'llama-3.1-8b', cost: 3.18, tokens: '21.2M' },
  ];

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Analytics & ROI</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate conversion rates, AI resolution efficiency, knowledge coverage, and token expenses.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Date Filter: {dateFilter}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-4 rounded-xl shadow-xs flex gap-6 text-xs font-bold text-slate-500">
        {(['conversations', 'leads', 'knowledge', 'ai_cost'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3.5 border-b-2 capitalize transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            {tab === 'ai_cost' ? 'AI Usage & Token Costs' : `${tab} Performance`}
          </button>
        ))}
      </div>

      {/* TAB 1: CONVERSATIONS */}
      {activeTab === 'conversations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Total Conversations</span>
              <p className="text-2xl font-black text-slate-900 mt-1">1,248</p>
              <span className="text-[10px] text-emerald-600 font-bold">+18.4% this week</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Autonomous Resolution</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">74.0%</p>
              <span className="text-[10px] text-slate-400">Zero human intervention</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Avg First Response</span>
              <p className="text-2xl font-black text-blue-600 mt-1">780ms</p>
              <span className="text-[10px] text-slate-400">SSE token stream latency</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400">Human Handoff Rate</span>
              <p className="text-2xl font-black text-purple-600 mt-1">4.2%</p>
              <span className="text-[10px] text-slate-400">52 operator takeovers</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 mb-1">Volume & Resolution Trend</h3>
              <p className="text-[11px] text-slate-400 mb-4">Past 7 days volume</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mock7DayVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="conversations" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900">Top Visitor Intent Breakdown</h3>
              <div className="space-y-3">
                {intentData.map((item, i) => (
                  <div key={i} className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">{item.intent}</span>
                      <span className="font-bold text-slate-900">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEADS */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900">Conversion Funnel Stages</h3>
              <div className="space-y-4">
                {mockLeadFunnelData.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>{item.stage}</span>
                      <span className="text-blue-600">{item.count}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.dropPct}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900">Lead Score Distribution</h3>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <p className="font-bold text-sm">44% of leads score &gt; 80</p>
                <p className="text-[11px] text-emerald-700 mt-1">
                  High-intent signals: mention of immediate timeline, budget stated above $15k, and explicit request for proposal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE */}
      {activeTab === 'knowledge' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Most Referenced Knowledge Documents</h3>
          <div className="divide-y divide-slate-100">
            <div className="py-3 flex justify-between">
              <div>
                <p className="font-bold text-slate-800">2026 Agency Services & Retainer Guide.pdf</p>
                <p className="text-[10px] text-slate-400">Referenced in 512 conversations (Grounding Score: 99%)</p>
              </div>
              <span className="font-mono font-bold text-blue-600">84 chunks</span>
            </div>
            <div className="py-3 flex justify-between">
              <div>
                <p className="font-bold text-slate-800">Web Design Process & Tech Stack Overview.docx</p>
                <p className="text-[10px] text-slate-400">Referenced in 314 conversations (Grounding Score: 96%)</p>
              </div>
              <span className="font-mono font-bold text-blue-600">56 chunks</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI USAGE & COST */}
      {activeTab === 'ai_cost' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Budget Allocation</span>
              <p className="text-2xl font-black text-slate-900">$42.18</p>
              <p className="text-slate-500">of $150.00 organization quota (28.1% used)</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '28.1%' }} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tokens Processed</span>
              <p className="text-2xl font-black text-slate-900">127.8M</p>
              <p className="text-slate-500">Across OpenRouter multi-model gateway</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Gross AI Margin</span>
              <p className="text-2xl font-black text-emerald-600">92.4%</p>
              <p className="text-slate-500">Well above the 65% target floor</p>
            </div>
          </div>

          {/* Model Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900">Cost & Token Breakdown by Model</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Tokens</th>
                    <th className="py-2.5 px-3 text-right">Cost (MTD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {modelCostData.map((m, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{m.name}</td>
                      <td className="py-3 px-3">{idx === 0 ? 'Standard FAQs' : idx === 1 ? 'Complex Discovery' : 'Fast Fallback'}</td>
                      <td className="py-3 px-3 font-mono">{m.tokens}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">${m.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
