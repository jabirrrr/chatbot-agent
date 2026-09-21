'use client';

import React, { useState } from 'react';
import { Save, Shield, Settings2, Users2, Bell } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Platform Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Configure global application behaviors and system preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'general' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <Settings2 className={`w-4 h-4 ${activeTab === 'general' ? 'text-blue-500' : 'text-slate-400'}`} />
              General
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'security' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <Shield className={`w-4 h-4 ${activeTab === 'security' ? 'text-blue-500' : 'text-slate-400'}`} />
              Security
            </button>
            <button 
              onClick={() => setActiveTab('teams')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'teams' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <Users2 className={`w-4 h-4 ${activeTab === 'teams' ? 'text-blue-500' : 'text-slate-400'}`} />
              Team Access
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === 'notifications' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-blue-500' : 'text-slate-400'}`} />
              Notifications
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-8">
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Settings Configuration</h3>
            <p className="text-slate-500 font-semibold uppercase tracking-widest text-sm">BACKEND NOT IMPLEMENTED</p>
            <p className="text-slate-400 text-sm mt-4 max-w-sm mx-auto">
              Global platform settings management is not yet available in the backend API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
