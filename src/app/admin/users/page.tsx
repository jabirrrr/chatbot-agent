'use client';

import React, { useState } from 'react';
import { Search, MoreVertical, Filter, Download, UserX, UserCheck, Eye } from 'lucide-react';

export default function UsersPage() {
  const [users] = useState([
    { id: 'usr_001', name: 'John Doe', company: 'Acme Corp', email: 'john@acme.com', plan: 'Enterprise', status: 'active', joined: 'Oct 12, 2025' },
    { id: 'usr_002', name: 'Jane Smith', company: 'Stark Ind.', email: 'jane@stark.com', plan: 'Pro', status: 'active', joined: 'Nov 04, 2025' },
    { id: 'usr_003', name: 'Bob Johnson', company: 'Wayne Ent.', email: 'bob@wayne.com', plan: 'Starter', status: 'suspended', joined: 'Jan 15, 2026' },
    { id: 'usr_004', name: 'Alice Williams', company: 'Globex', email: 'alice@globex.com', plan: 'Enterprise', status: 'active', joined: 'Feb 22, 2026' },
    { id: 'usr_005', name: 'Charlie Brown', company: 'Initech', email: 'charlie@initech.com', plan: 'Pro', status: 'active', joined: 'Mar 10, 2026' },
    { id: 'usr_006', name: 'Diana Prince', company: 'Themis', email: 'diana@themis.com', plan: 'Starter', status: 'active', joined: 'Apr 01, 2026' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-500 text-sm mt-1">Monitor and manage all platform users across workspaces.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm w-full md:w-64"
            />
          </div>
          <button className="p-2 bg-white border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 bg-white border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{user.company}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      user.plan === 'Enterprise' ? 'bg-violet-100 text-violet-700' :
                      user.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      user.status === 'active' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-medium">{user.joined}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.status === 'active' ? (
                        <button className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" title="Suspend User">
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors" title="Reactivate User">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <p>Showing 1 to 6 of 24,592 entries</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-md">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50">2</button>
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50">3</button>
            <span className="px-3 py-1">...</span>
            <button className="px-3 py-1 border border-slate-200 rounded-md hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
