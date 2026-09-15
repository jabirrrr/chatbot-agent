'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { NavigationScreen } from '@/types';
import { 
  Home, 
  MessageSquare, 
  Users, 
  Calendar, 
  BookOpen, 
  BarChart2, 
  Layers, 
  Palette, 
  Settings, 
  Bot,
  CreditCard,
  Sparkles,
  Globe,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface NavItem {
  id: NavigationScreen;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export default function Sidebar() {
  const { 
    currentScreen, setCurrentScreen, 
    isSidebarCollapsed, toggleSidebar, 
    conversations, leads, 
    isDirty, discardDraft
  } = useApp();

  const unreadCount = conversations.filter(c => c.isUnread).length;
  const newLeadsCount = leads.filter(l => l.status === 'new').length;

  const primaryNavItems: NavItem[] = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare, badge: unreadCount > 0 ? `${unreadCount}` : undefined },
    { id: 'leads', label: 'Leads', icon: Users, badge: newLeadsCount > 0 ? `${newLeadsCount}` : undefined },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'integrations', label: 'Integrations', icon: Layers },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'deployment', label: 'Deployment', icon: Globe },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const secondaryNavItems: NavItem[] = [
    { id: 'chatbots', label: 'Chatbot Builder', icon: Bot },
    { id: 'onboarding', label: 'Onboarding Flow', icon: Sparkles },
    { id: 'landing', label: 'Live Landing Page', icon: ExternalLink },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col bg-white border-r border-slate-200/80 z-40 transition-all duration-200 select-none ${
        isSidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
        <div 
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden group"
        >
          {/* Chatly Logo Icon */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" fill="currentColor" fillOpacity="0.2"/>
              <path d="M8 12h.01M12 12h.01M16 12h.01"/>
            </svg>
          </div>

          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <span className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                Chatly
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <div className="space-y-0.5">
          {primaryNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-indigo-50/90 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`} />

                {!isSidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isSidebarCollapsed && item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Collapsed tooltip */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                    {item.badge && <span className="ml-1 text-indigo-300">({item.badge})</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary Divider / Quick Access */}
        <div className="pt-4 mt-3 border-t border-slate-100">
          {!isSidebarCollapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Studio & Modules
            </p>
          )}
          <div className="space-y-0.5">
            {secondaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
                    isActive
                      ? 'bg-indigo-50/90 text-indigo-600 font-semibold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`} />

                  {!isSidebarCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Profile Account Info (Matches Reference: Acme Store Free Plan) */}
      <div className="p-3 border-t border-slate-100">
        <div 
          onClick={() => setCurrentScreen('billing')}
          className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer ${
            isSidebarCollapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-medium text-xs shrink-0 shadow-xs">
            A
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">Acme Store</p>
              <p className="text-[11px] text-slate-400">Free Plan</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
