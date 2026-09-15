'use client';

import React from 'react';
import { Download, Calendar, BarChart2 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Deep dive into platform usage, revenue, and growth.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border border-transparent rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Conversations</h3>
          <p className="text-3xl font-bold text-slate-900">1.2M</p>
          <p className="text-sm text-emerald-600 font-bold mt-2 flex items-center gap-1">
            +24% <span className="font-medium text-slate-500">from last month</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tokens Processed</h3>
          <p className="text-3xl font-bold text-slate-900">450B</p>
          <p className="text-sm text-emerald-600 font-bold mt-2 flex items-center gap-1">
            +45% <span className="font-medium text-slate-500">from last month</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Avg. Resolution Time</h3>
          <p className="text-3xl font-bold text-slate-900">2.4m</p>
          <p className="text-sm text-emerald-600 font-bold mt-2 flex items-center gap-1">
            -12% <span className="font-medium text-slate-500">from last month</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Message Volume Over Time</h3>
            <BarChart2 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-72 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
            [Chart: Area Chart showing daily volume]
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Revenue by Plan Tier</h3>
            <BarChart2 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-72 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
            [Chart: Donut Chart showing revenue distribution]
          </div>
        </div>
      </div>
    </div>
  );
}
