'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, ShieldCheck } from 'lucide-react';

export default function AdminTopBar() {
  const pathname = usePathname();
  
  // Create breadcrumbs based on pathname
  const pathParts = pathname.split('/').filter(p => p);
  const title = pathParts.length > 1 
    ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1).replace('-', ' ')
    : 'Overview';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
          <ShieldCheck className="w-3.5 h-3.5" />
          System Normal
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search (Mocked) */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search users, APIs..." 
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all w-64"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
            SA
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-tight">Super Admin</p>
            <p className="text-[11px] text-slate-500 font-medium">System Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
}
