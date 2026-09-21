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
          <button disabled className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 opacity-50 cursor-not-allowed shadow-sm transition-colors">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button disabled className="flex items-center gap-2 bg-blue-600 opacity-50 cursor-not-allowed text-white border border-transparent rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden py-16 text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Analytics Data</h3>
        <p className="text-slate-500 font-semibold uppercase tracking-widest text-sm">BACKEND NOT IMPLEMENTED</p>
        <p className="text-slate-400 text-sm mt-4 max-w-md mx-auto">
          The platform-wide analytics aggregation endpoint is not yet available in the backend API.
        </p>
      </div>
    </div>
  );
}
