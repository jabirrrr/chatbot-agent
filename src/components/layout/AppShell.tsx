'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import ToastContainer from '@/components/common/ToastContainer';
import CustomerChatWidget from '@/components/widget/CustomerChatWidget';

// Screen Views
import AnalyticsCommandCenter from '@/components/home/AnalyticsCommandCenter';
import ChatbotsPage from '@/components/chatbots/ChatbotsPage';
import KnowledgeBasePage from '@/components/knowledge/KnowledgeBasePage';
import AppearanceStudio from '@/components/appearance/AppearanceStudio';
import ConversationsInbox from '@/components/conversations/ConversationsInbox';
import LeadsPage from '@/components/leads/LeadsPage';
import AppointmentsPage from '@/components/appointments/AppointmentsPage';
import AnalyticsPage from '@/components/analytics/AnalyticsPage';
import AiModelsPage from '@/components/ai-models/AiModelsPage';
import DeveloperPage from '@/components/developer/DeveloperPage';
import IntegrationsPage from '@/components/integrations/IntegrationsPage';
import DeploymentPage from '@/components/deployment/DeploymentPage';
import BillingPage from '@/components/billing/BillingPage';
import SettingsPage from '@/components/settings/SettingsPage';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import MarketingLandingPage from '@/components/landing/MarketingLandingPage';
import SystemStatusPage from '@/components/status/SystemStatusPage';
import OnboardingChecklistWidget from '@/components/onboarding/OnboardingChecklistWidget';

import { X, Sparkles, Bot, Zap, Calendar, MessageSquare, CheckCircle2 } from 'lucide-react';


export default function AppShell() {
  const { 
    currentScreen, 
    setCurrentScreen,
    showNewChatbotModal, 
    setShowNewChatbotModal,
    showAvailabilityModal,
    setShowAvailabilityModal,
    addToast
  } = useApp();

  const [newBotName, setNewBotName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('lead_gen');

  const handleCreateBotFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    setShowNewChatbotModal(false);
    addToast({
      type: 'success',
      title: 'Chatbot Initialized',
      description: `"${newBotName || 'New Agency Bot'}" ready for configuration.`
    });
    setCurrentScreen('onboarding');
  };

  // Full-bleed standalone mode for Landing Page (Panel 1)
  if (currentScreen === 'landing') {
    return (
      <div className="min-h-screen bg-[#fafbfc] font-sans antialiased text-slate-900">
        <MarketingLandingPage />
        <ToastContainer />
      </div>
    );
  }

  // Centered standalone mode for Onboarding Flow (Panel 10)
  if (currentScreen === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#fafbfc] font-sans antialiased text-slate-900 flex flex-col justify-center relative">
        <button
          onClick={() => setCurrentScreen('home')}
          className="absolute top-6 right-6 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors shadow-2xs"
        >
          Exit to Dashboard
        </button>
        <OnboardingWizard />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans antialiased text-slate-900">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Bar with Search, Notifications, Date Filters, and Primary CTAs */}
        <TopBar />

        {/* Dynamic Screen Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentScreen === 'home' && (
            <AnalyticsCommandCenter />
          )}
          {currentScreen === 'chatbots' && <ChatbotsPage />}
          {currentScreen === 'knowledge' && <KnowledgeBasePage />}
          {currentScreen === 'appearance' && <AppearanceStudio />}
          {currentScreen === 'conversations' && <ConversationsInbox />}
          {currentScreen === 'leads' && <LeadsPage />}
          {currentScreen === 'appointments' && <AppointmentsPage />}
          {currentScreen === 'analytics' && <AnalyticsPage />}
          {currentScreen === 'integrations' && <IntegrationsPage />}
          {currentScreen === 'deployment' && <DeploymentPage />}
          {currentScreen === 'ai-models' && <AiModelsPage />}
          {currentScreen === 'developer' && <DeveloperPage />}
          {currentScreen === 'billing' && <BillingPage />}
          {currentScreen === 'settings' && <SettingsPage />}
          {currentScreen === 'status' && <SystemStatusPage />}
        </main>
      </div>

      {/* Floating Interactive Customer Chat Widget (hidden on appearance/status) */}
      {currentScreen !== 'appearance' && currentScreen !== 'status' && (
        <CustomerChatWidget />
      )}


      {/* Global Toast System */}
      <ToastContainer />

      {/* Global "Create New Chatbot" Modal */}
      {showNewChatbotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <span>Create New Chatbot</span>
              </div>
              <button
                onClick={() => setShowNewChatbotModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBotFromModal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chatbot Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Northstar Discovery Bot"
                  value={newBotName}
                  onChange={e => setNewBotName(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Starter Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'lead_gen', name: 'Lead Capture', desc: 'Qualify & capture B2B inquiries', icon: Zap },
                    { id: 'booking', name: 'Appointment', desc: 'Sync calendar & book demos', icon: Calendar },
                    { id: 'support', name: 'Knowledge Bot', desc: 'Answer FAQs & resolve tickets', icon: MessageSquare },
                  ].map(tpl => {
                    const Icon = tpl.icon;
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                        <p className="text-xs font-bold text-slate-900">{tpl.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{tpl.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Creating this chatbot will launch our 5-step guided setup wizard. You will be able to ingest documents, customize branding, and install the snippet.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewChatbotModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Continue to Setup</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
