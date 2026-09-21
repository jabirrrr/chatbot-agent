import React from 'react';
import { Users, Activity, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Platform Overview</h3>
        <p className="text-slate-500 font-semibold uppercase tracking-widest text-sm">BACKEND NOT IMPLEMENTED</p>
        <p className="text-slate-400 text-sm mt-4 max-w-md mx-auto">
          The dashboard overview requires real-time aggregation across all tenants which is not yet available in the backend API.
        </p>
      </div>
    </div>
  );
}
