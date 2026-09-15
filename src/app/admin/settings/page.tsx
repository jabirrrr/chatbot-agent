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
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold text-slate-900 mb-4">General Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Platform Name</label>
                  <input type="text" defaultValue="Chatly Platform" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Support Email</label>
                  <input type="email" defaultValue="support@chatly.ai" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="maintenance" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-blue-600 appearance-none cursor-pointer translate-x-5 transition-transform" defaultChecked />
                      <label htmlFor="maintenance" className="toggle-label block overflow-hidden h-5 rounded-full bg-blue-600 cursor-pointer"></label>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Enable User Registration</p>
                      <p className="text-xs text-slate-500">Allow new users to sign up from the landing page.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Security Policies</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600" defaultChecked />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Enforce 2FA for all Super Admins</p>
                      <p className="text-xs text-slate-500">Require two-factor authentication for accessing this console.</p>
                    </div>
                  </label>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">IP Whitelisting</p>
                      <p className="text-xs text-slate-500">Only allow admin access from specified IP addresses.</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="pt-6 flex justify-end">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors">
                  <Save className="w-4 h-4" />
                  Save Policies
                </button>
              </div>
            </div>
          )}

          {/* Placeholders for other tabs */}
          {activeTab === 'teams' && (
             <div className="flex flex-col items-center justify-center h-48 text-slate-400">
               <Users2 className="w-8 h-8 mb-2 opacity-50" />
               <p className="text-sm">Team access management coming soon.</p>
             </div>
          )}
          {activeTab === 'notifications' && (
             <div className="flex flex-col items-center justify-center h-48 text-slate-400">
               <Bell className="w-8 h-8 mb-2 opacity-50" />
               <p className="text-sm">Notification preferences coming soon.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
