'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { NavigationScreen } from '@/types';
import { 
  LayoutDashboard, 
  Bot, 
  BookOpen, 
  Palette,
  MessageSquare, 
  Users, 
  Calendar, 
  BarChart3, 
  Cpu, 
  Code2, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Building2,
  ChevronDown
} from 'lucide-react';

interface NavItem {
  id: NavigationScreen;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export default function Sidebar() {
  const { currentScreen, setCurrentScreen, isSidebarCollapsed, toggleSidebar, leads, conversations } = useApp();

  const unreadConvs = conversations.filter(c => c.isUnread).length;
  const newLeads = leads.filter(l => l.status === 'new').length;

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'chatbots', label: 'Chatbots', icon: Bot },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'appearance', label: 'Appearance Studio', icon: Palette },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare, badge: unreadConvs > 0 ? `${unreadConvs}` : undefined },
    { id: 'leads', label: 'Leads', icon: Users, badge: newLeads > 0 ? `${newLeads}` : undefined },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ai-models', label: 'AI & Routing', icon: Cpu },
    { id: 'developer', label: 'Developer', icon: Code2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 z-40 transition-all duration-200 select-none ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/30 shrink-0">
            H
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                Helio
                <span className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-400/30">
                  AI SaaS
                </span>
              </span>
              <p className="text-xs text-slate-400 truncate">Autonomous Website Agent</p>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Organization Switcher */}
      <div className="px-3 py-2 border-b border-slate-800/80">
        <button
          onClick={() => setCurrentScreen('settings')}
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left bg-slate-800/50 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors ${
            isSidebarCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Northstar Studio</p>
                <p className="text-[10px] text-slate-400">Pro Plan · Chicago</p>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative group ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              
              {!isSidebarCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!isSidebarCollapsed && item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                }`}>
                  {item.badge}
                </span>
              )}

              {/* Tooltip for collapsed mode */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md border border-slate-700 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                  {item.badge && <span className="ml-1.5 text-blue-400">({item.badge})</span>}
                </div>
              )}
            </button>
          );
        })}

        {/* Quick link to Onboarding Wizard */}
        <div className="pt-2">
          <button
            onClick={() => setCurrentScreen('onboarding')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors ${
              isSidebarCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            {!isSidebarCollapsed && (
              <span className="truncate flex-1 text-left">Setup Wizard</span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom User / Help Footer */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/40">
        <button
          onClick={() => setCurrentScreen('developer')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            isSidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!isSidebarCollapsed && <span>Help & Documentation</span>}
        </button>

        <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 border border-slate-800 ${
          isSidebarCollapsed ? 'justify-center p-1.5' : ''
        }`}>
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
            alt="Sarah Jenkins"
            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
          />
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">Sarah Jenkins</p>
              <p className="text-[10px] text-slate-400">Account Owner</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
