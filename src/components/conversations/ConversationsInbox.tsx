'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Search, 
  Send, 
  CheckCircle2, 
  Bot, 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Clock, 
  Paperclip, 
  Sparkles, 
  MoreVertical, 
  ShieldCheck, 
  UserCheck, 
  Check, 
  ArrowRight,
  Headphones
} from 'lucide-react';

interface ConvThreadItem {
  id: string;
  name: string;
  avatar: string;
  query: string;
  timeAgo: string;
  status: 'open' | 'waiting' | 'resolved';
  isOnline: boolean;
  leadScore: number;
  email: string;
  location: string;
  device: string;
  summary: string;
  messages: Array<{
    id: string;
    sender: 'visitor' | 'ai' | 'human';
    text: string;
    timestamp: string;
  }>;
}

const mockThreads: ConvThreadItem[] = [
  {
    id: 'conv_1',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    query: 'I have a question about...',
    timeAgo: '2m',
    status: 'open',
    isOnline: true,
    leadScore: 92,
    email: 'priya.sharma@example.com',
    location: 'Mumbai, India',
    device: 'Chrome on macOS',
    summary: 'Visitor is looking for tier pricing comparisons and requested to speak with a human support agent.',
    messages: [
      {
        id: 'm1',
        sender: 'visitor',
        text: "Hi! I'd like to know more about your pricing plans.",
        timestamp: '10:14 AM'
      },
      {
        id: 'm2',
        sender: 'ai',
        text: 'Sure! We have three plans: Starter, Growth, and Business. Which one would you like to know about?',
        timestamp: '10:14 AM'
      },
      {
        id: 'm3',
        sender: 'visitor',
        text: 'Can I talk to a human agent?',
        timestamp: '10:15 AM'
      }
    ]
  },
  {
    id: 'conv_2',
    name: 'Rahul Mehta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    query: 'Can you help me with...',
    timeAgo: '5m',
    status: 'waiting',
    isOnline: true,
    leadScore: 84,
    email: 'rahul.mehta@techcorp.in',
    location: 'Bengaluru, India',
    device: 'Safari on iOS',
    summary: 'Customer inquiring about bulk deployment API keys and webhook capabilities.',
    messages: [
      {
        id: 'rm1',
        sender: 'visitor',
        text: 'Can you help me integrate the chatbot with HubSpot CRM?',
        timestamp: '10:08 AM'
      },
      {
        id: 'rm2',
        sender: 'ai',
        text: 'Yes! Chatly integrates directly with HubSpot. You can connect it with 1-click in the Integrations tab.',
        timestamp: '10:09 AM'
      }
    ]
  },
  {
    id: 'conv_3',
    name: 'Ananya Iyer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    query: 'I want to schedule...',
    timeAgo: '12m',
    status: 'open',
    isOnline: false,
    leadScore: 88,
    email: 'ananya@growthlabs.io',
    location: 'Delhi, India',
    device: 'Edge on Windows',
    summary: 'Requested a private 30-minute demo for a team of 15 marketing agents.',
    messages: [
      {
        id: 'ai1',
        sender: 'visitor',
        text: 'I want to schedule a product demo for our marketing team.',
        timestamp: '9:58 AM'
      },
      {
        id: 'ai2',
        sender: 'ai',
        text: 'Wonderful! We have slots open tomorrow at 2:00 PM and 4:30 PM. Would either of those work for you?',
        timestamp: '9:59 AM'
      }
    ]
  },
  {
    id: 'conv_4',
    name: 'Vikram Singh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    query: 'Do you offer custom...',
    timeAgo: '18m',
    status: 'open',
    isOnline: false,
    leadScore: 76,
    email: 'vikram.singh@retailhub.com',
    location: 'Hyderabad, India',
    device: 'Chrome on Android',
    summary: 'Inquiring about multilingual Hindi and English language support.',
    messages: [
      {
        id: 'vs1',
        sender: 'visitor',
        text: 'Do you offer custom language prompts in Hindi?',
        timestamp: '9:45 AM'
      },
      {
        id: 'vs2',
        sender: 'ai',
        text: 'Yes! Chatly supports over 95 languages including Hindi with automatic language detection.',
        timestamp: '9:46 AM'
      }
    ]
  },
  {
    id: 'conv_5',
    name: 'Neha Reddy',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
    query: 'What is your refund policy?',
    timeAgo: '24m',
    status: 'resolved',
    isOnline: false,
    leadScore: 65,
    email: 'neha.r@designstudio.co',
    location: 'Pune, India',
    device: 'Chrome on macOS',
    summary: 'Inquiry regarding 14-day money-back guarantee resolved automatically.',
    messages: [
      {
        id: 'nr1',
        sender: 'visitor',
        text: 'What is your refund policy?',
        timestamp: '9:30 AM'
      },
      {
        id: 'nr2',
        sender: 'ai',
        text: 'We offer a 14-day no-questions-asked money-back guarantee on all paid plans.',
        timestamp: '9:30 AM'
      }
    ]
  }
];

export default function ConversationsInbox() {
  const { addToast } = useApp();
  const [filterTab, setFilterTab] = useState<'open' | 'waiting' | 'resolved'>('open');
  const [activeConvId, setActiveConvId] = useState<string>('conv_1');
  const [threads, setThreads] = useState<ConvThreadItem[]>(mockThreads);
  const [replyInput, setReplyInput] = useState('');
  const [isTakenOver, setIsTakenOver] = useState(false);
  const [internalNotes, setInternalNotes] = useState('High intent lead interested in Growth plan with annual discount.');

  const activeThread = threads.find(t => t.id === activeConvId) || threads[0];

  const filteredThreads = threads.filter(t => {
    if (filterTab === 'open') return t.status === 'open';
    if (filterTab === 'waiting') return t.status === 'waiting';
    if (filterTab === 'resolved') return t.status === 'resolved';
    return true;
  });

  const handleSendReply = () => {
    if (!replyInput.trim() || !activeThread) return;

    const newMsg = {
      id: `m_${Date.now()}`,
      sender: 'human' as const,
      text: replyInput.trim(),
      timestamp: 'Just now'
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));

    setReplyInput('');
    setIsTakenOver(true);
    addToast({
      type: 'success',
      title: 'Reply Sent',
      description: `Sent message to ${activeThread.name} as human agent.`
    });
  };

  const handleTakeOver = () => {
    setIsTakenOver(true);
    addToast({
      type: 'info',
      title: 'Conversation Assigned',
      description: `You have taken over this thread from AI.`
    });
  };

  const handleResolve = () => {
    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return { ...t, status: 'resolved' };
      }
      return t;
    }));
    addToast({
      type: 'success',
      title: 'Resolved',
      description: `Marked conversation with ${activeThread.name} as resolved.`
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col page-transition">
      
      {/* 3-Column Layout Matching Reference Panel 5 */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUMN 1: Conversation List (approx 280-320px) */}
        <div className="w-72 lg:w-80 border-r border-slate-100 flex flex-col bg-white shrink-0">
          
          {/* Status Tabs (Open (3), Waiting (1), Resolved) */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center gap-1">
            <button
              onClick={() => setFilterTab('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterTab === 'open'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Open ({threads.filter(t => t.status === 'open').length})
            </button>
            <button
              onClick={() => setFilterTab('waiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterTab === 'waiting'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Waiting ({threads.filter(t => t.status === 'waiting').length})
            </button>
            <button
              onClick={() => setFilterTab('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterTab === 'resolved'
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Resolved
            </button>
          </div>

          {/* List of Conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredThreads.map(thread => {
              const isActive = thread.id === activeConvId;

              return (
                <div
                  key={thread.id}
                  onClick={() => {
                    setActiveConvId(thread.id);
                    setIsTakenOver(false);
                  }}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-indigo-50/70 border-l-2 border-indigo-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={thread.avatar}
                        alt={thread.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-100"
                      />
                      {thread.isOnline && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0"></span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className={`text-xs truncate ${isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                        {thread.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {thread.query}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                    {thread.timeAgo}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: Active Chat Pane (flex-1) */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40 border-r border-slate-100">
          
          {/* Thread Header */}
          <div className="h-14 px-5 bg-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeThread.avatar}
                alt={activeThread.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-100"
              />
              <div>
                <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                  {activeThread.name}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-400 font-normal">Online</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResolve}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5 text-slate-500" />
                <span>Resolve</span>
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeThread.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'visitor' ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'visitor'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : msg.sender === 'human'
                      ? 'bg-slate-900 text-white rounded-bl-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 shadow-2xs rounded-bl-xs'
                  }`}
                >
                  {msg.sender === 'human' && (
                    <span className="text-[10px] text-indigo-300 font-medium block mb-1">Human Agent</span>
                  )}
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Human Handoff Banner (Matching Panel 5) */}
            {!isTakenOver && activeThread.status !== 'resolved' && (
              <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 shadow-2xs flex items-center justify-between gap-4 my-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-slate-600">
                    You can take over this conversation or assign it to a team member.
                  </p>
                </div>
                <button
                  onClick={handleTakeOver}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shrink-0 transition-colors shadow-2xs"
                >
                  Take Over
                </button>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendReply();
              }}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
            >
              <input
                type="text"
                placeholder={isTakenOver ? "Reply as Human Agent..." : "Type a message..."}
                value={replyInput}
                onChange={e => setReplyInput(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!replyInput.trim()}
                className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

        {/* COLUMN 3: Visitor / Lead Information (approx 260-300px) */}
        <div className="w-68 lg:w-76 bg-white p-5 overflow-y-auto space-y-5 shrink-0 hidden md:block">
          
          {/* User Profile Header */}
          <div className="text-center pb-4 border-b border-slate-100 space-y-2">
            <img
              src={activeThread.avatar}
              alt={activeThread.name}
              className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-slate-100 shadow-2xs"
            />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{activeThread.name}</h4>
              <p className="text-xs text-slate-400">{activeThread.email}</p>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
              <span>Lead Score: {activeThread.leadScore}</span>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3 text-xs">
            <h5 className="font-semibold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400">
              Visitor Details
            </h5>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                Location
              </span>
              <span className="font-medium text-slate-800">{activeThread.location}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Globe className="w-3.5 h-3.5" />
                Device
              </span>
              <span className="font-medium text-slate-800">{activeThread.device}</span>
            </div>
          </div>

          {/* AI Summary */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <h5 className="font-semibold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              AI Summary
            </h5>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {activeThread.summary}
            </p>
          </div>

          {/* Internal Notes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <h5 className="font-semibold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400">
              Internal Notes
            </h5>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

        </div>

      </div>

    </div>
  );
}
