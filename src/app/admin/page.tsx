import React from 'react';
import { Users, Activity, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AdminDashboard() {
  const metrics = [
    { 
      label: 'Total Users', 
      value: '24,592', 
      change: '+12%', 
      isPositive: true,
      icon: Users,
      color: 'bg-blue-500'
    },
    { 
      label: 'Active Subscriptions', 
      value: '8,234', 
      change: '+5%', 
      isPositive: true,
      icon: TrendingUp,
      color: 'bg-emerald-500'
    },
    { 
      label: 'Monthly Recurring Revenue', 
      value: '$245.9k', 
      change: '+18%', 
      isPositive: true,
      icon: DollarSign,
      color: 'bg-violet-500'
    },
    { 
      label: 'System Error Rate', 
      value: '0.12%', 
      change: '-0.05%', 
      isPositive: true, // A drop in error rate is positive
      icon: Activity,
      color: 'bg-rose-500'
    }
  ];

  const recentSignups = [
    { id: 1, name: 'Acme Corp', plan: 'Enterprise', date: '2 mins ago', status: 'Active' },
    { id: 2, name: 'Stark Industries', plan: 'Pro', date: '15 mins ago', status: 'Active' },
    { id: 3, name: 'Wayne Enterprises', plan: 'Enterprise', date: '1 hour ago', status: 'Pending' },
    { id: 4, name: 'Globex Corp', plan: 'Starter', date: '3 hours ago', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${metric.color} bg-opacity-10`}>
                  <Icon className={`w-5 h-5 text-${metric.color.split('-')[1]}-600`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${metric.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {metric.change}
                  {metric.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium">{metric.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Platform Usage (Last 30 Days)</h3>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2">
              <option>API Calls</option>
              <option>Messages Sent</option>
              <option>Active Bots</option>
            </select>
          </div>
          {/* Placeholder for a real chart */}
          <div className="h-64 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
            [Chart Visualization Area]
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Signups</h3>
          </div>
          <div className="space-y-4">
            {recentSignups.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.plan === 'Enterprise' ? 'bg-violet-100 text-violet-800' :
                    user.plan === 'Pro' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {user.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
