'use client';

import React, { useState } from 'react';
import { Search, MoreVertical, Filter, Download, UserX, UserCheck, Eye } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-500 text-sm mt-1">Monitor and manage all platform users across workspaces.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative opacity-50 cursor-not-allowed">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              disabled
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm w-full md:w-64 cursor-not-allowed"
            />
          </div>
          <button disabled className="p-2 bg-white border border-slate-300 rounded-xl text-slate-400 opacity-50 cursor-not-allowed">
            <Filter className="w-4 h-4" />
          </button>
          <button disabled className="p-2 bg-white border border-slate-300 rounded-xl text-slate-400 opacity-50 cursor-not-allowed">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden py-16 text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">User List</h3>
        <p className="text-slate-500 font-semibold uppercase tracking-widest text-sm">BACKEND NOT IMPLEMENTED</p>
        <p className="text-slate-400 text-sm mt-4 max-w-md mx-auto">
          The system owner endpoint for listing and managing users across all organizations is not yet available in the backend API.
        </p>
      </div>
    </div>
  );
}
