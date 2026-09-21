'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertCircle, ShieldLock, UserX, UserCheck, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AdminUserItem {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  created_at: string;
  organization_count: number;
}

interface AdminUsersResponse {
  items: AdminUserItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function UsersPage() {
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        cache: 'no-store'
      });

      if (res.status === 401 || res.status === 403) {
        setAuthError(true);
        setError(res.status === 403
          ? 'Access denied. System Owner privileges are required.'
          : 'Authentication required. Please sign in to an authorized account.'
        );
        return;
      }
      
      if (!res.ok) {
        throw new Error(`Failed to load users (HTTP ${res.status})`);
      }
      
      const responseData: AdminUsersResponse = await res.json();
      setData(responseData);
    } catch (err: any) {
      setError(err?.message || 'Network connection failed');
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => (!data || p >= data.pages ? p : p + 1));

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {authError ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-start gap-3">
          <ShieldLock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-950">Admin Authorization Required</h4>
            <p className="text-rose-800 text-sm mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : error && !data ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-950">Users Unavailable</h4>
            <p className="text-amber-800 text-sm mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role & Status</th>
                  <th className="px-6 py-4 font-semibold">Organizations</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && !data ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48 mb-2" /><div className="h-3 bg-slate-100 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    </tr>
                  ))
                ) : data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{user.full_name || 'No Name'}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.is_superuser && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
                              <ShieldLock className="w-3 h-3" /> System Owner
                            </span>
                          )}
                          {!user.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider">
                              <UserX className="w-3 h-3" /> Inactive
                            </span>
                          ) : user.is_verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3" /> Unverified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">{user.organization_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">{new Date(user.created_at).toLocaleDateString()}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {data && data.pages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-900">{((data.page - 1) * data.size) + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(data.page * data.size, data.total)}</span> of <span className="font-semibold text-slate-900">{data.total}</span> users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={data.page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={data.page >= data.pages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
