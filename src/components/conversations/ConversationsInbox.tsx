'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Badge from '@/components/common/Badge';
import { ConversationStatus, ChatMessage } from '@/types';
import { 
  Search, 
  Filter, 
  Send, 
  Sparkles, 
  Headphones, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Clock, 
  Paperclip, 
  UserCheck, 
  Calendar,
  AlertCircle,
  MoreVertical,
  ShieldCheck,
  Bot
} from 'lucide-react';

export default function ConversationsInbox() {
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversationId, 
    sendAgentReply, 
    takeOverConversation, 
    resolveConversation,
    addToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'ai-handled' | 'needs_handoff' | 'assigned_to_me' | 'resolved'>('all');
  const [replyText, setReplyText] = useState('');
  const [isReplyingAsHuman, setIsReplyingAsHuman] = useState(true);
  const [operatorNotes, setOperatorNotes] = useState('');

  const activeConv = conversations.find(c => c.id === activeConversationId) || conversations[0];

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.previewText.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'needs_handoff') return c.status === 'waiting_handoff';
    if (statusFilter === 'resolved') return c.status === 'resolved';
    if (statusFilter === 'ai-handled') return c.status === 'active' && !c.assignedAgent;
    if (statusFilter === 'assigned_to_me') return c.assignedAgent === 'Sarah Jenkins';
    if (statusFilter === 'open') return c.status === 'active' || c.status === 'waiting_handoff';
    return true;
  });

  const handleSendReply = () => {
    if (!replyText.trim() || !activeConv) return;
    sendAgentReply(activeConv.id, replyText.trim());
    setReplyText('');
  };

  const handleSuggestAiReply = () => {
    const suggestion = "Hi Sarah! I'm Sarah Jenkins, Owner at Northstar Studio. I reviewed your Next.js redesign requirements and confirmed our discovery meeting for tomorrow at 2:00 PM CST. Looking forward to our chat!";
    setReplyText(suggestion);
    addToast({
      type: 'info',
      title: 'AI Reply Drafted',
      description: 'Grounded reply generated based on visitor context.'
    });
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      {/* 3-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL 1: LEFT CONVERSATION LIST (30%) */}
        <div className="w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-semibold text-slate-500">
              {(['all', 'open', 'ai-handled', 'needs_handoff', 'assigned_to_me', 'resolved'] as const).map(f => {
                let label = f.replace(/_/g, ' ');
                if (f === 'ai-handled') label = 'AI Handled';
                if (f === 'needs_handoff') label = 'Needs Handoff';
                if (f === 'assigned_to_me') label = 'Assigned To Me';
                return (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-colors ${
                      statusFilter === f ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation Thread List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.map(conv => {
              const isSelected = conv.id === activeConv?.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                    isSelected ? 'bg-white border-l-4 border-l-blue-600 shadow-xs' : 'hover:bg-slate-100/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                      {conv.visitorName.charAt(0)}
                    </div>
                    {conv.isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">{conv.visitorName}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{conv.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5 leading-snug">{conv.previewText}</p>

                    <div className="flex items-center justify-between mt-2 pt-1">
                      <Badge
                        variant={
                          conv.status === 'waiting_handoff' ? 'rose' :
                          conv.status === 'active' ? 'emerald' : 'gray'
                        }
                      >
                        {conv.status === 'waiting_handoff' ? 'HANDOFF' : conv.status.toUpperCase()}
                      </Badge>

                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Score: {conv.leadScore}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredConversations.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching conversations found.
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: CENTER MESSAGE THREAD (45%) */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Thread Header */}
            <div className="p-3.5 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {activeConv.visitorName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{activeConv.visitorName}</h3>
                    <Badge variant={activeConv.status === 'waiting_handoff' ? 'rose' : 'emerald'}>
                      {activeConv.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Channel: Website Widget · Assigned: <span className="font-semibold text-slate-600">{activeConv.assignedAgent || 'Helio AI (Autonomous)'}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 text-xs">
                {activeConv.status === 'waiting_handoff' && (
                  <button
                    onClick={() => takeOverConversation(activeConv.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Take Over</span>
                  </button>
                )}

                <button
                  onClick={() => resolveConversation(activeConv.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resolve</span>
                </button>
              </div>
            </div>

            {/* Thread Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
              {activeConv.messages.map(msg => {
                const isVisitor = msg.sender === 'visitor';
                const isAgent = msg.sender === 'agent';
                const isSystem = msg.sender === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-3">
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isVisitor ? 'justify-start' : 'justify-end'}`}
                  >
                    {isVisitor && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0 mt-1">
                        {activeConv.visitorName.charAt(0)}
                      </div>
                    )}

                    <div className={`max-w-md rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                      isVisitor
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                        : isAgent
                        ? 'bg-slate-900 text-white rounded-br-xs'
                        : 'bg-blue-600 text-white rounded-br-xs'
                    }`}>
                      <div className="flex items-center justify-between gap-3 text-[10px] font-bold mb-1 opacity-80">
                        <span>{isVisitor ? activeConv.visitorName : isAgent ? 'Sarah Jenkins (Operator)' : 'Helio AI'}</span>
                        <span className="font-normal opacity-70">{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {msg.referencedSource && (
                        <div className="mt-2 pt-2 border-t border-white/20 text-[10px] flex items-center gap-1 text-blue-100">
                          <Sparkles className="w-3 h-3" />
                          <span>Grounded in: {msg.referencedSource}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <div className="p-4 border-t border-slate-200 bg-white space-y-2 shrink-0">
              {/* Controls bar */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isReplyingAsHuman}
                      onChange={e => setIsReplyingAsHuman(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Reply as Human Operator</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSuggestAiReply}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Draft AI Suggestion</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  placeholder={isReplyingAsHuman ? "Type human operator response to visitor..." : "Configure automated response..."}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="w-full p-3 pr-24 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-medium"
                />

                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" title="Attach file">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select a conversation thread to view
          </div>
        )}

        {/* PANEL 3: RIGHT VISITOR CONTEXT SIDEBAR (25%) */}
        {activeConv && (
          <div className="w-72 lg:w-80 border-l border-slate-200 bg-white p-5 overflow-y-auto space-y-5 text-xs shrink-0 hidden xl:block">
            {/* Profile Overview */}
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center mx-auto mb-2">
                {activeConv.visitorName.charAt(0)}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{activeConv.visitorName}</h4>
              <p className="text-[11px] text-slate-400">{activeConv.visitorEmail || 'Email uncaptured'}</p>

              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Lead Score: {activeConv.leadScore}
                </span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  AI Conf: {activeConv.aiConfidence}%
                </span>
              </div>
            </div>

            {/* AI Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                AI Executive Summary
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed">{activeConv.summary}</p>
            </div>

            {/* Visitor Metadata */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visitor Signals</span>
              <div className="space-y-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{activeConv.visitorLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{activeConv.visitorBrowser}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Source: {activeConv.visitorReferrer}</span>
                </div>
              </div>
            </div>

            {/* Operator Notes */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Internal Operator Notes</span>
              <textarea
                rows={3}
                placeholder="Add private note regarding this prospect..."
                defaultValue={activeConv.notes}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white text-slate-800"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
