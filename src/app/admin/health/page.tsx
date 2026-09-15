import React from 'react';
import { Server, Database, Globe, Cpu, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function HealthPage() {
  const services = [
    { name: 'API Gateway', status: 'operational', uptime: '99.99%', latency: '45ms', icon: Globe },
    { name: 'Main Database (PostgreSQL)', status: 'operational', uptime: '99.95%', latency: '12ms', icon: Database },
    { name: 'Redis Cache', status: 'operational', uptime: '100%', latency: '2ms', icon: Cpu },
    { name: 'Background Workers', status: 'degraded', uptime: '98.50%', latency: '350ms', icon: Server },
  ];

  const recentErrors = [
    { id: 'ERR-092', service: 'Background Workers', message: 'Queue timeout on sync_job', time: '10 mins ago', severity: 'medium' },
    { id: 'ERR-091', service: 'API Gateway', message: 'Rate limit exceeded for IP 192.168.1.1', time: '1 hour ago', severity: 'low' },
    { id: 'ERR-090', service: 'Main Database', message: 'Deadlock detected', time: '5 hours ago', severity: 'high' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Status</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time overview of infrastructure health.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-emerald-700">All Systems Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const Icon = service.icon;
          const isOperational = service.status === 'operational';
          return (
            <div key={service.name} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isOperational ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-slate-900 truncate">{service.name}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${isOperational ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {service.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Uptime: <span className="font-medium text-slate-900">{service.uptime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ActivityIcon className="w-4 h-4 text-slate-400" />
                    Latency: <span className="font-medium text-slate-900">{service.latency}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Recent Error Logs</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {recentErrors.map((error) => (
            <div key={error.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className={`mt-0.5 shrink-0 ${
                error.severity === 'high' ? 'text-rose-500' : 
                error.severity === 'medium' ? 'text-amber-500' : 'text-slate-400'
              }`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{error.id}</span>
                  <span className="text-sm font-bold text-slate-900">{error.service}</span>
                  <span className="text-xs text-slate-400 ml-auto">{error.time}</span>
                </div>
                <p className="text-sm text-slate-600 font-mono text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 mt-2">
                  {error.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
