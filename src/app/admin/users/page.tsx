'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertCircle, ShieldLock, UserX, UserCheck, CheckCircle2, ShieldAlert, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface AdminUserItem {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  platform_role: string;
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
  
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal State
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<AdminUserItem | null>(null);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({ full_name: '', platform_role: '', is_active: true });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [deactivateSaving, setDeactivateSaving] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('helio_auth_token') : null;
      
      // Fetch current user if not fetched
      if (!currentUserRole && token) {
        const meRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUserRole(meData.platform_role || 'normal_user');
        }
      }

      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const res = await fetch(`${API_BASE}/api/v1/admin/users?${params.toString()}`, {
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
  }, [page, size, debouncedSearch, currentUserRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => (!data || p >= data.pages ? p : p + 1));

  // --- Handlers ---
  const handleEditClick = (user: AdminUserItem) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || '',
      platform_role: user.platform_role,
      is_active: user.is_active
    });
    setEditError('');
    setOpenDropdownId(null);
  };

  const handleDeleteClick = (user: AdminUserItem) => {
    setDeactivatingUser(user);
    setDeactivateError('');
    setOpenDropdownId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setEditSaving(true);
    setEditError('');
    try {
      const token = localStorage.getItem('helio_auth_token');
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: editForm.full_name,
          platform_role: editForm.platform_role,
          is_active: editForm.is_active
        })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to update user.');
      }
      const updatedUser = await res.json();
      
      // Update local state
      if (data) {
        setData({
          ...data,
          items: data.items.map(u => u.id === editingUser.id ? updatedUser : u)
        });
      }
      setEditingUser(null);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingUser) return;
    setDeactivateSaving(true);
    setDeactivateError('');
    try {
      const token = localStorage.getItem('helio_auth_token');
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${deactivatingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to deactivate user.');
      }
      const updatedUser = await res.json();
      
      if (data) {
        setData({
          ...data,
          items: data.items.map(u => u.id === deactivatingUser.id ? updatedUser : u)
        });
      }
      setDeactivatingUser(null);
    } catch (err: any) {
      setDeactivateError(err.message);
    } finally {
      setDeactivateSaving(false);
    }
  };

  // Close dropdown when clicking outside (simple hack)
  useEffect(() => {
    const handleClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

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
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap relative">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role & Status</th>
                  <th className="px-6 py-4 font-semibold">Organizations</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  {currentUserRole === 'super_user' && (
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  )}
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
                      {currentUserRole === 'super_user' && <td className="px-6 py-4"></td>}
                    </tr>
                  ))
                ) : data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={currentUserRole === 'super_user' ? 5 : 4} className="px-6 py-12 text-center text-slate-500">
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
                          {user.platform_role === 'super_user' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider border border-purple-200">
                              <ShieldLock className="w-3 h-3" /> Super User
                            </span>
                          )}
                          {user.platform_role === 'admin_user' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider border border-blue-200">
                              <ShieldLock className="w-3 h-3" /> Admin User
                            </span>
                          )}
                          {user.platform_role === 'normal_user' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider border border-slate-200">
                              <UserCheck className="w-3 h-3" /> Normal User
                            </span>
                          )}

                          {!user.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider border border-rose-200">
                              <UserX className="w-3 h-3" /> Inactive
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Active
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
                      {currentUserRole === 'super_user' && (
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === user.id ? null : user.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {openDropdownId === user.id && (
                              <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleEditClick(user)}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <Edit2 className="w-4 h-4" /> Edit User
                                  </button>
                                  {user.is_active ? (
                                    <button
                                      onClick={() => handleDeleteClick(user)}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="w-4 h-4" /> Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditingUser(user);
                                        setEditForm({ full_name: user.full_name || '', platform_role: user.platform_role, is_active: true });
                                        setEditError('');
                                        setOpenDropdownId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                                    >
                                      <CheckCircle2 className="w-4 h-4" /> Activate
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
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

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit User</h3>
            </div>
            <div className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {editError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email (Read Only)</label>
                <input 
                  type="text" 
                  value={editingUser.email} 
                  disabled 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.full_name} 
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Platform Role</label>
                <select
                  value={editForm.platform_role}
                  onChange={(e) => setEditForm({...editForm, platform_role: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="normal_user">Normal User</option>
                  <option value="admin_user">Admin User</option>
                  <option value="super_user">Super User</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editForm.is_active ? 'true' : 'false'}
                  onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'true'})}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                disabled={editSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Deactivate Confirmation Modal */}
      {deactivatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Deactivate User?</h3>
              <p className="text-slate-500 mb-4">
                Are you sure you want to deactivate <span className="font-bold">{deactivatingUser.email}</span>? This will temporarily disable the account and block login. Existing workspace data, chatbots, and conversations will be preserved.
              </p>
              
              {deactivateError && (
                <div className="p-3 mb-4 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {deactivateError}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setDeactivatingUser(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                  disabled={deactivateSaving}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDeactivate}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  disabled={deactivateSaving}
                >
                  {deactivateSaving ? 'Deactivating...' : 'Deactivate User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
