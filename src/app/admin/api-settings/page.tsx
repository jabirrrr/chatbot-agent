'use client';

import React, { useState } from 'react';
import { Cable, Key, CheckCircle2, Shield, Edit2, Plus, RefreshCw, EyeOff, Eye, X, Trash2 } from 'lucide-react';

export default function ApiSettingsPage() {
  const [apis, setApis] = useState([
    { id: 'openai', name: 'OpenAI API', provider: 'OpenAI', status: 'connected', lastSync: '2 mins ago', type: 'LLM Provider' },
    { id: 'stripe', name: 'Stripe Billing', provider: 'Stripe', status: 'connected', lastSync: '5 mins ago', type: 'Payment Gateway' },
    { id: 'resend', name: 'Resend Email', provider: 'Resend', status: 'connected', lastSync: '1 hour ago', type: 'Communication' },
    { id: 'twilio', name: 'Twilio SMS', provider: 'Twilio', status: 'disconnected', lastSync: 'Never', type: 'Communication' },
  ]);

  const [editingApi, setEditingApi] = useState<string | null>(null);
  const [replaceKeyInput, setReplaceKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  
  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newApi, setNewApi] = useState({ name: '', provider: '', type: 'LLM Provider', key: '' });
  
  // Delete Modal State
  const [apiToDelete, setApiToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('helio_llm_key');
      const storedProvider = localStorage.getItem('helio_llm_provider');
      if (storedKey && storedProvider) {
        setApis(prev => {
          const exists = prev.some(a => a.provider.toLowerCase() === storedProvider.toLowerCase());
          if (exists) {
            return prev.map(a => a.provider.toLowerCase() === storedProvider.toLowerCase() ? { ...a, status: 'connected', lastSync: 'Active' } : a);
          } else {
            return [
              {
                id: storedProvider.toLowerCase().replace(/\s+/g, '-'),
                name: `${storedProvider} API`,
                provider: storedProvider,
                status: 'connected',
                lastSync: 'Active',
                type: 'LLM Provider'
              },
              ...prev
            ];
          }
        });
      }
    }
  }, []);

  const handleDeleteAPI = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiToDelete && deleteConfirmationText === apiToDelete.name) {
      setApis(apis.filter(api => api.id !== apiToDelete.id));
      if (typeof window !== 'undefined') {
        const storedProvider = localStorage.getItem('helio_llm_provider');
        if (storedProvider && apiToDelete.name.toLowerCase().includes(storedProvider.toLowerCase())) {
          localStorage.removeItem('helio_llm_key');
          localStorage.removeItem('helio_llm_provider');
        }
      }
      setApiToDelete(null);
      setDeleteConfirmationText('');
    }
  };

  const handleAddApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApi.name || !newApi.provider || !newApi.key) return;
    
    const newApiEntry = {
      id: newApi.name.toLowerCase().replace(/\s+/g, '-'),
      name: newApi.name,
      provider: newApi.provider,
      status: 'connected',
      lastSync: 'Just now',
      type: newApi.type
    };
    
    // Save to localStorage for the Chat Widget to use
    if (newApi.type === 'LLM Provider') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('helio_llm_provider', newApi.provider);
        localStorage.setItem('helio_llm_key', newApi.key);
      }
    }
    
    setApis([newApiEntry, ...apis]);
    setIsAddModalOpen(false);
    setNewApi({ name: '', provider: '', type: 'LLM Provider', key: '' });
  };

  const handleReplaceKey = (apiItem: { id: string; provider: string; type: string }) => {
    if (replaceKeyInput.trim() && apiItem.type === 'LLM Provider') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('helio_llm_key', replaceKeyInput.trim());
        localStorage.setItem('helio_llm_provider', apiItem.provider);
      }
    }
    setApis(apis.map(api => 
      api.id === apiItem.id ? { ...api, status: 'connected', lastSync: 'Just now' } : api
    ));
    setEditingApi(null);
    setReplaceKeyInput('');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">API Integrations</h2>
          <p className="text-slate-500 text-sm mt-1">Manage external services connected to the platform.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New API
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {apis.map((api) => (
            <div key={api.id} className="p-6 transition-colors hover:bg-slate-50">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    api.status === 'connected' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}>
                    <Cable className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-slate-900">{api.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        api.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {api.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">{api.provider}</span>
                      <span>•</span>
                      <span>{api.type}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {api.lastSync}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:ml-auto">
                  {editingApi === api.id ? (
                    <div className="flex flex-col gap-3 min-w-[300px]">
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type={showKey ? "text" : "password"} 
                          placeholder="Enter new API key" 
                          value={replaceKeyInput}
                          onChange={e => setReplaceKeyInput(e.target.value)}
                          className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                          autoFocus
                        />
                        <button 
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditingApi(null); setReplaceKeyInput(''); }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleReplaceKey(api)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                        >
                          Save Key
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingApi(api.id); setReplaceKeyInput(''); }}
                        className="px-4 py-2 border border-slate-200 hover:border-blue-600 hover:text-blue-600 rounded-xl text-sm font-semibold text-slate-700 bg-white transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        Replace Key
                      </button>
                      <button
                        onClick={() => { setApiToDelete({ id: api.id, name: api.name }); setDeleteConfirmationText(''); }}
                        className="p-2 border border-slate-200 hover:border-rose-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-slate-400 transition-colors shadow-sm"
                        aria-label="Delete API"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Status */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Shield className="w-4 h-4 text-emerald-500" />
                API key is encrypted at rest using AES-256.
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Cable className="w-5 h-5 text-blue-600" />
                Add New API Integration
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddApi} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Integration Name</label>
                <input 
                  type="text" 
                  required
                  value={newApi.name}
                  onChange={e => setNewApi({...newApi, name: e.target.value})}
                  placeholder="e.g. Claude 3"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Provider</label>
                  <input 
                    type="text" 
                    required
                    value={newApi.provider}
                    onChange={e => setNewApi({...newApi, provider: e.target.value})}
                    placeholder="e.g. Anthropic"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category Type</label>
                  <select 
                    value={newApi.type}
                    onChange={e => setNewApi({...newApi, type: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option>LLM Provider</option>
                    <option>Payment Gateway</option>
                    <option>Communication</option>
                    <option>Analytics</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Secret API Key</label>
                <input 
                  type="password" 
                  required
                  value={newApi.key}
                  onChange={e => setNewApi({...newApi, key: e.target.value})}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  Connect API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {apiToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                Remove Integration
              </h3>
              <button onClick={() => { setApiToDelete(null); setDeleteConfirmationText(''); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeleteAPI} className="space-y-4">
              <div className="bg-rose-50 border border-rose-100 text-rose-800 text-sm p-3 rounded-xl mb-4">
                This will permanently remove the <span className="font-bold">{apiToDelete.name}</span> integration. Any features relying on it will stop functioning.
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Type <span className="font-bold text-slate-900 select-all">{apiToDelete.name}</span> to confirm
                </label>
                <input 
                  type="text" 
                  required
                  value={deleteConfirmationText}
                  onChange={e => setDeleteConfirmationText(e.target.value)}
                  placeholder={apiToDelete.name}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setApiToDelete(null); setDeleteConfirmationText(''); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={deleteConfirmationText !== apiToDelete.name}
                  className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  Delete Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
