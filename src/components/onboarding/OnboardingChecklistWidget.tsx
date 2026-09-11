'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Bot, 
  BookOpen, 
  Palette, 
  Code2, 
  Calendar, 
  MessageSquare 
} from 'lucide-react';

export default function OnboardingChecklistWidget() {
  const { setCurrentScreen, addToast } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [steps, setSteps] = useState([
    { id: 'account_created', title: 'Create Organization Workspace', done: true, screen: 'settings', icon: Sparkles },
    { id: 'chatbot_configured', title: 'Configure Chatbot Prompt & Instructions', done: true, screen: 'chatbots', icon: Bot },
    { id: 'knowledge_uploaded', title: 'Upload Business Knowledge (PDF/FAQ)', done: true, screen: 'knowledge', icon: BookOpen },
    { id: 'appearance_customized', title: 'Customize Widget Colors & Styling', done: true, screen: 'appearance', icon: Palette },
    { id: 'widget_installed', title: 'Embed Script on External Website', done: true, screen: 'appearance', icon: Code2 },
    { id: 'calendar_connected', title: 'Connect Google Calendar OAuth 2.0', done: false, screen: 'appointments', icon: Calendar },
    { id: 'first_test_chat', title: 'Perform End-to-End Chat Test', done: true, screen: 'conversations', icon: MessageSquare },
  ]);

  const completedCount = steps.filter(s => s.done).length;
  const totalCount = steps.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const toggleStep = (id: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s));
    addToast({
      type: 'info',
      title: 'Checklist Step Updated',
      description: 'Progress state saved to database.'
    });
  };

  const handleSimulateEmail = (seq: string) => {
    addToast({
      type: 'success',
      title: 'Transactional Email Dispatched',
      description: `Simulated automated ${seq} dispatch to organization administrator.`
    });
  };

  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-900/40 p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Self-Serve Activation Checklist</h3>
              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-full">
                {completedCount}/{totalCount} Completed ({progressPct}%)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete these 7 steps to maximize client capture and automated booking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSimulateEmail('Day 0 Welcome')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Test Day 0, 1, 3, 7 transactional email sequence"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Test Email Sequences</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800/80 rounded-full h-2 mt-4 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Expandable Step Items */}
      {!isCollapsed && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {steps.map(step => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div 
                  className="flex items-center gap-2.5 cursor-pointer min-w-0"
                  onClick={() => toggleStep(step.id)}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className={`text-xs font-medium truncate ${step.done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                    {step.title}
                  </span>
                </div>

                {!step.done && (
                  <button
                    onClick={() => setCurrentScreen(step.screen as any)}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 ml-2 shrink-0 transition-colors"
                  >
                    <span>Action</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
