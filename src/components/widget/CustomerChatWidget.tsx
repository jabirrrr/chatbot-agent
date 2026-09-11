'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  MessageSquare, 
  X, 
  Minus, 
  Send, 
  Sparkles, 
  Calendar, 
  UserPlus, 
  Headphones, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function CustomerChatWidget({ 
  embedded = false, 
  standalone = false 
}: { 
  embedded?: boolean;
  standalone?: boolean;
}) {
  const { 
    chatbot, 
    isWidgetOpen, 
    setIsWidgetOpen, 
    isWidgetOffline, 
    setIsWidgetOffline,
    isWidgetError, 
    setIsWidgetError,
    widgetMessages, 
    addVisitorMessage,
    addToast,
    addLead,
    addAppointment
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showCalendarBooking, setShowCalendarBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [handoffRequested, setHandoffRequested] = useState(false);

  // Lead Form State
  const [leadFormData, setLeadFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  const [leadCaptured, setLeadCaptured] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [widgetMessages, isTyping, showLeadForm, showCalendarBooking]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    const text = inputVal.trim();
    setInputVal('');
    setIsTyping(true);
    addVisitorMessage(text);
    setTimeout(() => {
      setIsTyping(false);
    }, 1100);
  };

  const handleQuestionClick = (q: string) => {
    setIsTyping(true);
    addVisitorMessage(q);
    setTimeout(() => {
      setIsTyping(false);
    }, 1100);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadFormData.name || !leadFormData.email) return;
    
    addLead({
      name: leadFormData.name,
      email: leadFormData.email,
      phone: leadFormData.phone,
      company: leadFormData.company || 'Website Visitor',
      score: 88,
      status: 'new',
      assignedAgent: 'Sarah Jenkins',
      chatbotSource: chatbot.name,
      requirements: 'Inquired about digital marketing / web design via website chat widget'
    });

    setLeadCaptured(true);
    setShowLeadForm(false);
    addToast({
      type: 'success',
      title: 'Lead Information Saved',
      description: `Thank you, ${leadFormData.name}. Your details have been delivered to Northstar Studio.`
    });
  };

  const handleSlotSelect = (timeStr: string) => {
    addAppointment({
      visitorName: leadFormData.name || 'Website Prospect',
      visitorEmail: leadFormData.email || 'visitor@example.com',
      company: leadFormData.company || 'Direct Inquiry',
      dateTime: timeStr,
      durationMinutes: 30,
      assignedCalendar: 'Google Calendar (Primary)',
      assignedAgent: 'Sarah Jenkins',
      bookingSource: 'Helio Website Widget',
      notes: `Discovery Call booked autonomously via chatbot for ${timeStr}`
    });

    setBookingConfirmed(true);
    setShowCalendarBooking(false);
    addToast({
      type: 'success',
      title: 'Appointment Confirmed',
      description: `Reserved discovery call for ${timeStr} with Sarah Jenkins.`
    });
  };

  // If embedded in Appearance Studio preview:
  const isPositionLeft = chatbot.position === 'bottom-left';

  // Inner widget content
  const WidgetContent = (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/15">
      {/* Widget Header */}
      <div 
        className="p-4 text-white flex items-center justify-between shadow-sm shrink-0"
        style={{ backgroundColor: chatbot.themeColor }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={chatbot.avatarUrl}
              alt={chatbot.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-white/40 shadow-sm"
            />
            {!isWidgetOffline && !isWidgetError && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 ring-2 ring-white animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold truncate leading-snug">{chatbot.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-white/80">
              {isWidgetOffline ? (
                <span className="flex items-center gap-1 text-white/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Offline Mode
                </span>
              ) : isWidgetError ? (
                <span className="flex items-center gap-1 text-rose-200">
                  <AlertCircle className="w-3 h-3" /> Connection Issue
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Online · Active
                </span>
              )}
            </div>
          </div>
        </div>

        {!embedded && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsWidgetOpen(false)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/90 transition-colors"
              title="Minimize widget"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsWidgetOpen(false)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/90 transition-colors"
              title="Close widget"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Widget Simulation Control Bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-600">
        <span className="font-semibold text-slate-700">Simulator Controls:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWidgetOffline(!isWidgetOffline)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isWidgetOffline ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {isWidgetOffline ? 'Offline' : 'Simulate Offline'}
          </button>
          <button
            onClick={() => setIsWidgetError(!isWidgetError)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isWidgetError ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {isWidgetError ? 'Error Active' : 'Simulate Error'}
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {/* Error Notification banner if error mode */}
        {isWidgetError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Unable to reach conversational server</p>
              <p className="text-[11px] text-rose-600 mt-0.5">Please check your network connection or try refreshing.</p>
              <button 
                onClick={() => setIsWidgetError(false)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 underline"
              >
                <RotateCcw className="w-3 h-3" /> Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Offline Notification banner if offline mode */}
        {isWidgetOffline && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Helio is currently offline</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Our team is away from keyboard. Please leave your email and message below.</p>
            </div>
          </div>
        )}

        {/* Conversation Stream */}
        {widgetMessages.map(msg => {
          const isUser = msg.sender === 'visitor';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <img
                  src={chatbot.avatarUrl}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-1 border border-slate-200"
                />
              )}

              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {msg.referencedSource && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">Grounded in: {msg.referencedSource}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing State */}
        {isTyping && (
          <div className="flex gap-2.5 items-center">
            <img
              src={chatbot.avatarUrl}
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
            />
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* In-Chat Lead Capture Form */}
        {showLeadForm && !leadCaptured && (
          <form onSubmit={handleLeadSubmit} className="p-3.5 rounded-2xl bg-white border border-blue-200 shadow-md space-y-2.5 text-xs animate-slide-up">
            <div className="flex items-center gap-2 text-blue-700 font-bold">
              <UserPlus className="w-4 h-4" />
              <span>Provide your details for faster response:</span>
            </div>
            <input
              type="text"
              required
              placeholder="Your Full Name *"
              value={leadFormData.name}
              onChange={e => setLeadFormData({ ...leadFormData, name: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
            <input
              type="email"
              required
              placeholder="Work Email Address *"
              value={leadFormData.email}
              onChange={e => setLeadFormData({ ...leadFormData, email: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Company Name (Optional)"
              value={leadFormData.company}
              onChange={e => setLeadFormData({ ...leadFormData, company: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-xs"
            >
              Submit Details
            </button>
          </form>
        )}

        {leadCaptured && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Details recorded! Our team will reach out soon.</span>
          </div>
        )}

        {/* In-Chat Calendar Slot Booking */}
        {showCalendarBooking && !bookingConfirmed && (
          <div className="p-3.5 rounded-2xl bg-white border border-blue-200 shadow-md space-y-2 text-xs animate-slide-up">
            <div className="flex items-center gap-2 text-blue-700 font-bold">
              <Calendar className="w-4 h-4" />
              <span>Select an available 30-min discovery slot:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {['Tomorrow, 2:00 PM', 'Tomorrow, 3:30 PM', 'Thursday, 10:30 AM', 'Friday, 1:00 PM'].map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleSlotSelect(time)}
                  className="p-2 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors text-[11px] font-medium text-slate-800"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {bookingConfirmed && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Discovery meeting confirmed on Google Calendar!</span>
          </div>
        )}

        {/* Human Takeover Notice */}
        {handoffRequested && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
            <Headphones className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Human operator alerted. Sarah Jenkins will connect shortly.</span>
          </div>
        )}

        {/* Suggested Question Chips (Only show if few messages) */}
        {widgetMessages.length < 4 && (
          <div className="space-y-1.5 pt-2">
            <p className="text-[11px] font-semibold text-slate-400">Suggested questions:</p>
            <div className="flex flex-wrap gap-1.5">
              {chatbot.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuestionClick(q)}
                  className="text-left text-xs px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-slate-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick In-Widget Actions */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => setShowLeadForm(!showLeadForm)}
          className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1 shrink-0 shadow-2xs"
        >
          <UserPlus className="w-3 h-3 text-indigo-600" />
          <span>Leave Contact</span>
        </button>
        <button
          onClick={() => setShowCalendarBooking(!showCalendarBooking)}
          className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1 shrink-0 shadow-2xs"
        >
          <Calendar className="w-3 h-3 text-emerald-600" />
          <span>Book Call</span>
        </button>
        <button
          onClick={() => {
            setHandoffRequested(true);
            addToast({
              type: 'info',
              title: 'Handoff Requested',
              description: 'Visitor requested human support. Notification sent to inbox.'
            });
          }}
          className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-1 shrink-0 shadow-2xs"
        >
          <Headphones className="w-3 h-3 text-purple-600" />
          <span>Talk to Human</span>
        </button>
      </div>

      {/* Input Composer */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
        <input
          type="text"
          disabled={isWidgetOffline || isWidgetError}
          placeholder={isWidgetOffline ? 'Chatbot is currently offline...' : 'Ask a question...'}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!inputVal.trim() || isWidgetOffline || isWidgetError}
          style={{ backgroundColor: chatbot.themeColor || '#4f46e5' }}
          className="p-2 rounded-xl hover:opacity-90 disabled:opacity-40 text-white transition-opacity shrink-0 shadow-2xs"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Footer Branding */}
      <div className="px-3 py-1 bg-slate-50 text-center text-[10px] text-slate-400 border-t border-slate-100 font-medium">
        Powered by <span className="font-semibold text-slate-600">Chatly</span>
      </div>
    </div>
  );

  // If embedded in Appearance Studio (e.g. static preview frame)
  if (embedded) {
    return (
      <div className="w-full max-w-[380px] h-[580px] mx-auto">
        {WidgetContent}
      </div>
    );
  }

  // Floating Widget Mode on the main dashboard
  return (
    <div 
      className={`fixed z-50 transition-all ${
        isPositionLeft ? 'left-6 bottom-6' : 'right-6 bottom-6'
      }`}
    >
      {isWidgetOpen ? (
        <div className="w-[360px] h-[540px] max-w-[calc(100vw-2rem)] animate-slide-up-fade">
          {WidgetContent}
        </div>
      ) : (
        <button
          onClick={() => setIsWidgetOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 btn-press"
          style={{ backgroundColor: chatbot.themeColor || '#4f46e5' }}
          aria-label="Open Chat Widget"
        >
          <MessageSquare className="w-4 h-4 text-white shrink-0" />
          <span className="text-xs font-semibold tracking-tight pr-1">Chat with us</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
        </button>
      )}
    </div>
  );
}
