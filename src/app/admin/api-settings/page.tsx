'use client';

import React, { useState } from 'react';
import { Cable, Key, CheckCircle2, Shield, Edit2, Plus, RefreshCw, EyeOff, Eye, X, Trash2 } from 'lucide-react';

export default function ApiSettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">API Integrations</h2>
          <p className="text-slate-500 text-sm mt-1">Manage external services connected to the platform.</p>
        </div>
        <button 
          disabled
          className="bg-blue-600 opacity-50 cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New API
        </button>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden py-16 text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Integrations Config</h3>
        <p className="text-slate-500 font-semibold uppercase tracking-widest text-sm">BACKEND NOT IMPLEMENTED</p>
        <p className="text-slate-400 text-sm mt-4 max-w-md mx-auto">
          The platform-wide integrations manager is not yet available in the backend API.
        </p>
      </div>
    </div>
  );
}
