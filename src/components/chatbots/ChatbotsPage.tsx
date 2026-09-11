'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Badge from '@/components/common/Badge';
import { ChatbotConfig } from '@/types';
import { 
  Bot, 
  Plus, 
  Search, 
  Globe, 
  MessageSquare, 
  ExternalLink, 
  Copy, 
  Power, 
  Settings, 
  Check, 
  Eye, 
  MoreVertical,
  X,
  Sparkles
} from 'lucide-react';

export default function ChatbotsPage() {
  const { 
    chatbotsList, 
    chatbot, 
    updateChatbot, 
    setCurrentScreen, 
    setIsWidgetOpen, 
    addToast 
  } = useApp();

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'disabled'>('all');
  const [selectedBotForDetail, setSelectedBotForDetail] = useState<ChatbotConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'appearance' | 'behavior' | 'installation' | 'advanced'>('overview');

  const filteredBots = chatbotsList.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          bot.domain.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDuplicate = (bot: ChatbotConfig) => {
    addToast({
      type: 'success',
      title: 'Chatbot Duplicated',
      description: `Created copy of "${bot.name}" with matching configuration.`
    });
  };

  const handleToggleStatus = (botId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    updateChatbot({ status: nextStatus });
    addToast({
      type: 'info',
      title: 'Status Updated',
      description: `Chatbot switched to ${nextStatus}.`
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Chatbot Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, customize, and govern autonomous conversational agents across your domains.
          </p>
        </div>

        <button
          onClick={() => {
            setCurrentScreen('onboarding');
            addToast({
              type: 'info',
              title: 'Create Chatbot',
              description: 'Opened guided onboarding setup wizard.'
            });
          }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-blue-600/20 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create Chatbot</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or domain..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {(['all', 'active', 'draft', 'disabled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                statusFilter === s ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Chatbots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBots.map(bot => (
          <div
            key={bot.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Header with Avatar & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: bot.themeColor }}
                  >
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{bot.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Globe className="w-3 h-3 shrink-0" />
                      <span className="truncate">{bot.domain}</span>
                    </div>
                  </div>
                </div>

                <Badge variant={bot.status === 'active' ? 'emerald' : bot.status === 'draft' ? 'amber' : 'gray'}>
                  {bot.status.toUpperCase()}
                </Badge>
              </div>

              {/* Bot Key Stats */}
              <div className="grid grid-cols-2 gap-2 mt-5 py-3 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Monthly Chats</span>
                  <p className="font-bold text-slate-800 text-sm">{bot.conversationsCount}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Tone Profile</span>
                  <p className="font-bold text-slate-800 text-sm">{bot.tone}</p>
                </div>
              </div>

              {/* Welcome Message Preview */}
              <p className="text-xs text-slate-500 line-clamp-2 mt-3 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                "{bot.welcomeMessage}"
              </p>
            </div>

            {/* Actions Strip */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    updateChatbot(bot);
                    setCurrentScreen('appearance');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Customize</span>
                </button>
                <button
                  onClick={() => {
                    updateChatbot(bot);
                    setIsWidgetOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedBotForDetail(bot)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Inspect Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State if filter yields 0 */}
      {filteredBots.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center max-w-md mx-auto my-8">
          <Bot className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No chatbots found</p>
          <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search terms or status filter.</p>
        </div>
      )}

      {/* Chatbot Detail Drawer Modal */}
      {selectedBotForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col justify-between animate-slide-up">
            <div>
              {/* Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedBotForDetail.themeColor }}
                  >
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedBotForDetail.name}</h3>
                    <p className="text-xs text-slate-400">{selectedBotForDetail.domain}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBotForDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-5 border-b border-slate-200 flex gap-4 text-xs font-semibold text-slate-500">
                {(['overview', 'appearance', 'behavior', 'installation', 'advanced'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`py-3 border-b-2 capitalize transition-colors ${
                      activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Widget Token:</span>
                        <span className="font-mono text-slate-800 font-bold">wgt_live_9a8b7c6d...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Monthly Conversations:</span>
                        <span className="font-bold text-slate-900">{selectedBotForDetail.conversationsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Monthly Budget:</span>
                        <span className="font-bold text-slate-900">${selectedBotForDetail.monthlyBudgetUsd}.00</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'behavior' && (
                  <div className="space-y-3">
                    <p className="font-bold text-slate-800">Tone: {selectedBotForDetail.tone}</p>
                    <p className="font-bold text-slate-800">Lead Fields: {selectedBotForDetail.leadFields.join(', ')}</p>
                    <p className="font-bold text-slate-800">Fallback Strategy: {selectedBotForDetail.fallbackBehavior}</p>
                  </div>
                )}

                {activeTab === 'installation' && (
                  <div className="p-4 bg-slate-950 text-blue-300 rounded-xl font-mono text-[11px] whitespace-pre-wrap">
                    {`<script src="https://cdn.helio.ai/v1/widget.js" data-token="wgt_live_..." async></script>`}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedBotForDetail(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-xs text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedBotForDetail(null);
                  setCurrentScreen('appearance');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-sm"
              >
                Open in Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
