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
  Calendar, 
  TrendingUp, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  Zap, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';

const trendData = [
  { date: 'Sep 1', conversations: 40 },
  { date: 'Sep 2', conversations: 76 },
  { date: 'Sep 3', conversations: 62 },
  { date: 'Sep 4', conversations: 108 },
  { date: 'Sep 5', conversations: 148 },
  { date: 'Sep 6', conversations: 122 },
  { date: 'Sep 7', conversations: 142 },
];

const topQuestions = [
  { id: 1, question: 'What are your prices?', count: 142 },
  { id: 2, question: 'Do you offer support?', count: 98 },
  { id: 3, question: 'How can I book a demo?', count: 76 },
  { id: 4, question: 'What services do you provide?', count: 64 },
  { id: 5, question: 'Where are you located?', count: 51 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('Sep 1, 2025 - Sep 8, 2025');

  return (
    <div className="space-y-8 page-transition pb-12">
      {/* Header (Matches Panel 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track performance and understand your customers better.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3.5 py-1.5 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-700">{dateRange}</span>
        </div>
      </div>

      {/* 4 KPI Cards (Total Conversations, Unique Visitors, Leads Captured, Appointments) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
          <p className="text-xs font-medium text-slate-500">Conversations</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">1,248</span>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span>↑ 12%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
          <p className="text-xs font-medium text-slate-500">Unique Visitors</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">320</span>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span>↑ 18%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
          <p className="text-xs font-medium text-slate-500">Leads Captured</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">76</span>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span>↑ 29%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all">
          <p className="text-xs font-medium text-slate-500">Appointments</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">48</span>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span>↑ 33%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Row: Conversation Trends Chart + Top Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Conversation Trends Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Conversation Trends</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>Daily Volume</span>
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
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
                  fill="url(#analyticsGrad)" 
                  activeDot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (4 cols): Top Questions (Matching Panel 6) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Top Questions</h2>
            <span className="text-xs text-slate-400 font-medium">Frequency</span>
          </div>

          <div className="divide-y divide-slate-100 py-1 flex-1">
            {topQuestions.map(q => (
              <div key={q.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 w-3">
                    {q.id}
                  </span>
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {q.question}
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 shrink-0">
                  {q.count}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 text-center">
              Based on 1,248 resolved visitor queries
            </p>
          </div>
        </div>

      </div>

      {/* Extra Row: AI Resolution, Latency & Cost */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <p className="text-xs text-slate-500 font-medium">AI Resolution Rate</p>
          <p className="text-xl font-bold text-slate-900">92.4%</p>
          <p className="text-[11px] text-emerald-600 font-medium">↑ 3.2% vs previous week</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <p className="text-xs text-slate-500 font-medium">Avg Response Latency</p>
          <p className="text-xl font-bold text-slate-900">420ms</p>
          <p className="text-[11px] text-slate-500">Live streaming token generation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <p className="text-xs text-slate-500 font-medium">Estimated AI Model Cost</p>
          <p className="text-xl font-bold text-slate-900">$2.40 /mo</p>
          <p className="text-[11px] text-indigo-600 font-medium">85% below allocated monthly budget</p>
        </div>
      </div>
    </div>
  );
}
