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

export default function ConversationsInbox() {
  const { addToast, authToken } = useApp();
  const [filterTab, setFilterTab] = useState<'open' | 'waiting' | 'resolved'>('open');
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [threads, setThreads] = useState<ConvThreadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyInput, setReplyInput] = useState('');
  const [isTakenOver, setIsTakenOver] = useState(false);
  const [internalNotes, setInternalNotes] = useState('High intent lead interested in Growth plan with annual discount.');

  React.useEffect(() => {
    async function fetchConversations() {
      if (!authToken) return;
      try {
        setIsLoading(true);
        const { apiFetch } = await import('@/lib/api');
        const data = await apiFetch('/api/v1/conversations/', { token: authToken });
        const convs = Array.isArray(data) ? data : (data.items || []);
        
        const mapped = convs.map((c: any) => ({
          id: c.id,
          name: c.visitor_id || 'Visitor',
          avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&h=100&fit=crop&crop=face',
          query: c.summary ? c.summary.substring(0, 30) + '...' : 'Started a conversation',
          timeAgo: new Date(c.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: c.status === 'active' ? 'open' : c.status === 'handed_off' ? 'waiting' : 'resolved',
          isOnline: c.status === 'active',
          leadScore: c.metadata_json?.lead_score || 50,
          email: c.metadata_json?.email || 'visitor@example.com',
          location: c.metadata_json?.location || 'Unknown',
          device: c.metadata_json?.device || 'Web',
          summary: c.summary || 'No summary available.',
          messages: (c.messages || []).map((m: any) => ({
            id: m.id,
            sender: m.sender_type,
            text: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }))
        }));
        
        setThreads(mapped);
        if (mapped.length > 0) {
          setActiveConvId(mapped[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch conversations:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchConversations();
  }, [authToken]);

  const activeThread = threads.find(t => t.id === activeConvId) || threads[0] || null;

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
      
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUMN 1 */}
        <div className="w-72 lg:w-80 border-r border-slate-100 flex flex-col bg-white shrink-0">
          
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
            {filteredThreads.length === 0 && !isLoading && (
              <div className="p-6 text-center text-slate-500 text-sm">
                No conversations found.
              </div>
            )}
            {isLoading && (
              <div className="p-6 text-center text-slate-500 text-sm">
                Loading conversations...
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2 */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40 border-r border-slate-100">
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a conversation to view.
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="h-14 px-5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    src={activeThread.avatar}
                    alt={activeThread.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      {activeThread.name}
                      {activeThread.isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      {activeThread.isOnline && <span className="text-[10px] text-slate-400 font-normal">Online</span>}
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

                {/* Human Handoff Banner */}
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
              <div className="p-3 bg-white border-t border-slate-100 shrink-0">
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
            </>
          )}
        </div>

        {/* COLUMN 3 */}
        {activeThread && (
          <div className="w-68 lg:w-76 bg-white p-5 overflow-y-auto space-y-5 shrink-0 hidden md:block border-l border-slate-100">
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
        )}
      </div>
    </div>
  );
}
