'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Search, 
  Bell, 
  Calendar, 
  Plus, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Bot
} from 'lucide-react';

export default function TopBar() {
  const { 
    currentScreen, 
    setCurrentScreen, 
    dateFilter, 
    setDateFilter, 
    globalSearchQuery, 
    setGlobalSearchQuery,
    isWidgetOpen,
    setIsWidgetOpen,
    isEmptyStateDemo,
    setIsEmptyStateDemo,
    setShowNewChatbotModal,
    addToast
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (currentScreen) {
      case 'home': return 'Home / Analytics Command Center';
      case 'chatbots': return 'Chatbots / Management';
      case 'knowledge': return 'Knowledge Base / Ingestion & FAQs';
      case 'appearance': return 'Chatbot Studio / Appearance Customizer';
      case 'conversations': return 'Conversations / Inbox & Live Takeover';
      case 'leads': return 'Leads CRM / Pipeline';
      case 'appointments': return 'Appointments / Calendar';
      case 'analytics': return 'Analytics / Performance & ROI';
      case 'ai-models': return 'AI Engine / Model Routing & Costs';
      case 'developer': return 'Developer / Embed Snippet & Webhooks';
      case 'billing': return 'Billing / Subscription & Invoices';
      case 'settings': return 'Settings / Organization & Team';
      case 'onboarding': return 'Onboarding / 5-Step Chatbot Setup';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Breadcrumb / Section Name */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-800 tracking-tight flex items-center gap-2">
          <span className="text-slate-400 font-normal">Helio</span>
          <span className="text-slate-300">/</span>
          <span className="capitalize text-slate-900 font-bold">{getBreadcrumbTitle().split(' / ')[1]}</span>
        </h1>

        {/* Demo State Switcher */}
        {currentScreen === 'home' && (
          <button
            onClick={() => {
              setIsEmptyStateDemo(!isEmptyStateDemo);
              addToast({
                type: 'info',
                title: !isEmptyStateDemo ? 'Empty State Active' : 'Populated State Active',
                description: !isEmptyStateDemo 
                  ? 'Showing brand-new account experience with zero data.' 
                  : 'Restored full 7-day analytics and lead pipeline.'
              });
            }}
            className={`ml-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isEmptyStateDemo 
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm' 
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle between populated data and empty state"
          >
            {isEmptyStateDemo ? <ToggleRight className="w-4 h-4 text-amber-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
            <span>{isEmptyStateDemo ? 'Viewing Empty State' : 'Simulate Empty State'}</span>
          </button>
        )}
      </div>

      {/* Center Global Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations, leads, knowledge docs... (Press /)"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {globalSearchQuery && (
            <button 
              onClick={() => setGlobalSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-3">
        {/* Date range filter when on analytics/home */}
        {(currentScreen === 'home' || currentScreen === 'analytics' || currentScreen === 'leads') && (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Year to Date">Year to Date</option>
            </select>
          </div>
        )}

        {/* Notifications Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative border border-transparent hover:border-slate-200"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Recent Notifications</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                  3 New
                </span>
              </div>
              <div className="space-y-2.5 py-2">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-900">New Hot Lead Captured</p>
                  <p className="text-[11px] text-slate-500">Sarah Miller from Apex Logistics (Score: 96)</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">12 mins ago</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-900">Meeting Scheduled</p>
                  <p className="text-[11px] text-slate-500">David Vance booked for Thursday at 10:30 AM</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">45 mins ago</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-900">Document Processed</p>
                  <p className="text-[11px] text-slate-500">Indexed 84 chunks from Retainer Guide.pdf</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">3 hours ago</span>
                </div>
              </div>
              <button 
                onClick={() => setShowNotifications(false)}
                className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1 block"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Live Chat Widget Trigger Button */}
        <button
          onClick={() => setIsWidgetOpen(!isWidgetOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
          title="Open the live customer chat widget preview"
        >
          <Bot className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Test Widget</span>
        </button>

        {/* Primary CTA */}
        <button
          onClick={() => setShowNewChatbotModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm shadow-blue-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Chatbot</span>
        </button>
      </div>
    </header>
  );
}
