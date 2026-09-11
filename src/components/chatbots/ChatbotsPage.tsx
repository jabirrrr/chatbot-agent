'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Check, 
  Save, 
  UploadCloud, 
  Palette, 
  Code, 
  Copy, 
  Eye, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';

export default function ChatbotsPage() {
  const { chatbot, updateChatbot, addToast, setCurrentScreen } = useApp();

  const [activeTab, setActiveTab] = useState<'behavior' | 'knowledge' | 'appearance' | 'deployment'>('behavior');
  
  // Assistant identity state
  const [assistantName, setAssistantName] = useState(chatbot.name || 'Your Assistant');
  const [tone, setTone] = useState(chatbot.tone || 'Friendly');
  const [businessDescription, setBusinessDescription] = useState(
    'We are an online store offering high-quality products with fast delivery across India.'
  );

  // Goals
  const [goals, setGoals] = useState({
    answerQuestions: true,
    captureLeads: true,
    scheduleAppointments: true,
    transferToHuman: true
  });

  // Preview interactive state
  const [previewMessages, setPreviewMessages] = useState<Array<{ sender: 'bot' | 'visitor'; text: string }>>([
    {
      sender: 'bot',
      text: 'Hi! 👋 How can I help you today?'
    }
  ]);
  const [previewInput, setPreviewInput] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handlePreviewSend = (msgText?: string) => {
    const text = msgText || previewInput;
    if (!text.trim()) return;

    setPreviewMessages(prev => [...prev, { sender: 'visitor', text }]);
    setPreviewInput('');

    setTimeout(() => {
      let reply = "I'd be happy to assist! Let me know if you need specific product details, shipping estimates, or pricing plans.";
      const lower = text.toLowerCase();
      if (lower.includes('product')) {
        reply = "We offer a wide collection of verified home goods and artisanal crafts with express shipping across India!";
      } else if (lower.includes('price')) {
        reply = "Our products start from ₹499 with free shipping on all orders above ₹999. Would you like a discount voucher?";
      } else if (lower.includes('appointment') || lower.includes('schedule')) {
        reply = "You can book a personal consultation with our styling team. What day works best for you?";
      } else if (lower.includes('human')) {
        reply = "Transferring to a specialist now. One moment while I alert the team!";
      }
      setPreviewMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 600);
  };

  const handleSaveDraft = () => {
    updateChatbot({ name: assistantName, tone: tone as any });
    addToast({
      type: 'info',
      title: 'Draft Saved',
      description: 'Your chatbot changes have been saved to local draft.'
    });
  };

  const handlePublish = () => {
    updateChatbot({ name: assistantName, tone: tone as any, status: 'active' });
    addToast({
      type: 'success',
      title: 'Assistant Published',
      description: `"${assistantName}" is now active and ready to handle visitors.`
    });
  };

  return (
    <div className="space-y-6 page-transition pb-12">
      {/* Top Header (Matches Panel 3: Build Your AI Assistant) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Build Your AI Assistant
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure your chatbot's behavior, knowledge and appearance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs btn-press"
          >
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-black rounded-xl transition-all shadow-xs btn-press"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Tabs Row (Behavior, Knowledge, Appearance, Deployment) */}
      <div className="flex items-center gap-1 border-b border-slate-200/80 pb-px">
        {[
          { id: 'behavior', label: 'Behavior' },
          { id: 'knowledge', label: 'Knowledge' },
          { id: 'appearance', label: 'Appearance' },
          { id: 'deployment', label: 'Deployment' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-medium transition-all relative ${
              activeTab === tab.id
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 -mb-px'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Split: Left Form + Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Configuration Area (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          
          {activeTab === 'behavior' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Assistant Identity</h2>
                
                {/* Assistant Name */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-medium text-slate-700">Name</label>
                  <input
                    type="text"
                    value={assistantName}
                    onChange={e => setAssistantName(e.target.value)}
                    placeholder="Your Assistant"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Tone Select */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-medium text-slate-700">Tone</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value as 'Professional' | 'Friendly' | 'Concise' | 'Warm')}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="Friendly">Friendly</option>
                    <option value="Professional">Professional</option>
                    <option value="Concise">Concise</option>
                    <option value="Warm">Warm</option>
                  </select>
                </div>

                {/* Business Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700">Business Description</label>
                    <span className="text-[11px] text-slate-400">{businessDescription.length}/500</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={businessDescription}
                    onChange={e => setBusinessDescription(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                  />
                </div>
              </div>

              {/* Primary Goals Checkboxes */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-900 mb-3">Primary Goals</h3>
                <div className="space-y-2.5">
                  {[
                    { key: 'answerQuestions', label: 'Answer customer questions' },
                    { key: 'captureLeads', label: 'Capture leads' },
                    { key: 'scheduleAppointments', label: 'Schedule appointments' },
                    { key: 'transferToHuman', label: 'Transfer to human' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={goals[item.key as keyof typeof goals]}
                        onChange={e => setGoals(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded-md"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-900">Knowledge Integration</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect documents, web URLs, and FAQs so your assistant has up-to-date answers.
              </p>
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto" />
                <p className="text-xs font-medium text-slate-800">5 sources currently indexed</p>
                <button
                  onClick={() => setCurrentScreen('knowledge')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Manage Knowledge Base →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-900">Widget Appearance</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Customize colors, bubble shapes, and welcome greetings.
              </p>
              <button
                onClick={() => setCurrentScreen('appearance')}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-medium hover:bg-indigo-100 transition-colors"
              >
                Open Full Appearance Studio →
              </button>
            </div>
          )}

          {activeTab === 'deployment' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-900">Deploy Snippet</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste this script inside the &lt;head&gt; tag of your website to activate Chatly.
              </p>
              <div className="bg-slate-950 p-3.5 rounded-xl font-mono text-[11px] text-slate-200 overflow-x-auto relative">
                <code>{`<script src="https://cdn.chatly.ai/widget.js" data-chatly-id="bot_01" async></script>`}</code>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`<script src="https://cdn.chatly.ai/widget.js" data-chatly-id="bot_01" async></script>`);
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Frame: Live Chatbot Preview (5 cols) (Matching Panel 3) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2">
            <span className="text-xs font-medium text-slate-400">Preview</span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Test</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col">
            
            {/* Chatbot Header */}
            <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-medium shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">{assistantName}</h3>
                  <span className="text-[10px] text-slate-400">Online</span>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            </div>

            {/* Chatbot Message Body */}
            <div className="p-4 space-y-3 min-h-[300px] max-h-[360px] overflow-y-auto bg-slate-50/50">
              {previewMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'visitor'
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200/90 text-slate-800 shadow-2xs rounded-bl-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Quick Reply Chips (Matching Panel 3) */}
              <div className="pt-2 flex flex-col gap-1.5">
                {[
                  'Tell me about your products',
                  'What are your prices?',
                  'I want to schedule an appointment',
                  'Talk to a human'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePreviewSend(chip)}
                    className="text-left text-[11px] font-medium bg-white hover:bg-indigo-50/60 text-indigo-600 border border-indigo-200/80 px-3 py-1.5 rounded-full shadow-2xs transition-colors w-fit"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Chatbot Input Bar */}
            <div className="p-3 bg-white border-t border-slate-100">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handlePreviewSend();
                }}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={previewInput}
                  onChange={e => setPreviewInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!previewInput.trim()}
                  className="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
