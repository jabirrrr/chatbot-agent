'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  EyeOff,
  CheckCircle2, 
  HelpCircle,
  RotateCcw,
  Key,
  X,
  Zap,
  AlertCircle
} from 'lucide-react';

export default function ChatbotsPage() {
  const { 
    chatbot, 
    updateChatbot,
    saveDraft,
    discardDraft,
    isDirty,
    addToast, 
    setCurrentScreen,
    activeChatbotId,
    setActiveChatbotId,
    chatbotsList,
    createNewChatbot,
    knowledgeSources,
    setPendingNavigation
  } = useApp();

  const [activeTab, setActiveTab] = useState<'behavior' | 'knowledge' | 'appearance' | 'deployment'>('behavior');
  
  const assistantName = chatbot.name || '';
  const tone = chatbot.tone || 'Friendly';
  const businessDescription = chatbot.description || '';
  const goals = chatbot.primaryGoals || {
    answerQuestions: true,
    captureLeads: true,
    scheduleAppointments: true,
    transferToHuman: true
  };



  // Preview interactive state
  const [previewMessages, setPreviewMessages] = useState<Array<{ sender: 'bot' | 'visitor'; text: string }>>([
    {
      sender: 'bot',
      text: 'Hi! 👋 How can I help you today?'
    }
  ]);
  const [previewInput, setPreviewInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connected LLM state
  const [connectedKey, setConnectedKey] = useState<string | null>(null);
  const [connectedProvider, setConnectedProvider] = useState<string>('OpenAI');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [tempProvider, setTempProvider] = useState('OpenAI');
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestFeedback, setKeyTestFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [previewMessages, isTyping]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('helio_llm_key');
      const storedProvider = localStorage.getItem('helio_llm_provider');
      if (storedKey) {
        setConnectedKey(storedKey);
        setTempKeyInput(storedKey);
      }
      if (storedProvider) {
        setConnectedProvider(storedProvider);
        setTempProvider(storedProvider);
      }
    }
  }, []);

  const handleTestAndSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempKeyInput.trim()) return;

    setIsTestingKey(true);
    setKeyTestFeedback(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello! Please confirm connection in 5 words.',
          apiKey: tempKeyInput.trim(),
          provider: tempProvider,
          botConfig: {
            name: assistantName,
            tone: tone,
            businessDescription: businessDescription
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.live) {
        localStorage.setItem('helio_llm_key', tempKeyInput.trim());
        localStorage.setItem('helio_llm_provider', tempProvider);
        setConnectedKey(tempKeyInput.trim());
        setConnectedProvider(tempProvider);
        setKeyTestFeedback({ success: true, message: `Connected to ${tempProvider}! Live replies active.` });
        setTimeout(() => {
          setShowKeyModal(false);
          setKeyTestFeedback(null);
        }, 1200);
      } else {
        setKeyTestFeedback({ 
          success: false, 
          message: data.error || data.reply || `Could not verify ${tempProvider} key. Check if the key is valid and has active quota.` 
        });
      }
    } catch (err: any) {
      setKeyTestFeedback({ success: false, message: 'Network error verifying key.' });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleDisconnectKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('helio_llm_key');
      localStorage.removeItem('helio_llm_provider');
    }
    setConnectedKey(null);
    setTempKeyInput('');
    setShowKeyModal(false);
    setKeyTestFeedback(null);
    addToast({
      type: 'info',
      title: 'API Disconnected',
      description: 'Assistant switched back to simulated local AI.'
    });
  };

  const resetPreviewChat = () => {
    setPreviewMessages([
      {
        sender: 'bot',
        text: 'Hi! 👋 How can I help you today?'
      }
    ]);
    setPreviewInput('');
    setIsTyping(false);
  };

  const handlePreviewSend = async (msgText?: string) => {
    const text = msgText || previewInput;
    if (!text.trim() || isTyping) return;

    const userMessage = { sender: 'visitor' as const, text };
    const currentHistory = [...previewMessages, userMessage];
    setPreviewMessages(currentHistory);
    setPreviewInput('');
    setIsTyping(true);

    let llmKey: string | null = null;
    let llmProvider: string | null = null;
    if (typeof window !== 'undefined') {
      llmKey = localStorage.getItem('helio_llm_key');
      llmProvider = localStorage.getItem('helio_llm_provider');
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: previewMessages,
          apiKey: llmKey,
          provider: llmProvider || 'OpenAI',
          botConfig: {
            name: assistantName,
            tone: tone,
            businessDescription: businessDescription,
            primaryGoals: goals
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setPreviewMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
          setIsTyping(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching live LLM response in preview:', err);
    }

    // Dynamic smart fallback if API call cannot reach upstream
    setTimeout(() => {
      let reply = `Thank you for contacting ${assistantName}! We specialize in ${businessDescription.slice(0, 70)}... How can I assist you with your inquiry?`;
      const lower = text.toLowerCase();
      if (lower.includes('product') || lower.includes('item')) {
        reply = "We offer a wide collection of verified products and artisanal crafts with express shipping across India! Would you like details on a specific category?";
      } else if (lower.includes('price') || lower.includes('cost') || lower.includes('discount')) {
        reply = "Our products start from ₹499 with free shipping on all orders above ₹999. Would you like a special discount code?";
      } else if (lower.includes('appointment') || lower.includes('schedule') || lower.includes('book')) {
        reply = "You can book a personal consultation with our team right here. What day and time works best for you?";
      } else if (lower.includes('human') || lower.includes('agent') || lower.includes('person')) {
        reply = "Transferring to a specialist now. One moment while I alert our team!";
      }
      setPreviewMessages(prev => [...prev, { sender: 'bot', text: reply }]);
      setIsTyping(false);
    }, 600);
  };

  const handleSaveDraft = () => {
    saveDraft();
  };

  const handlePublish = () => {
    updateChatbot({ status: 'active' });
    saveDraft();
    addToast({
      type: 'success',
      title: 'Assistant Published',
      description: `"${assistantName}" is now active and ready to handle visitors.`
    });
  };

  return (
    <>
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
          {isDirty && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Unsaved Changes
            </span>
          )}
          <button
            onClick={handleSaveDraft}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition-all shadow-2xs btn-press ${
              isDirty 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'text-slate-700 bg-white hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Save Changes
          </button>
          <button
            onClick={handlePublish}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-black rounded-xl transition-all shadow-xs btn-press"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Chatbot Selector Cards */}
      <div className="flex flex-wrap items-center gap-3">
        {chatbotsList.map(bot => (
          <button
            key={bot.id}
            onClick={() => setActiveChatbotId(bot.id)}
            className={`flex items-center gap-3 p-2.5 pr-4 rounded-xl border transition-all text-left group ${
              activeChatbotId === bot.id 
                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600' 
                : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 hover:shadow-sm'
            }`}
          >
            {bot.avatarUrl ? (
              <img src={bot.avatarUrl} alt={bot.name} className="w-8 h-8 rounded-full object-cover shrink-0 shadow-xs border border-white" />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                activeChatbotId === bot.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
              }`}>
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className={`text-xs font-bold leading-tight ${
                activeChatbotId === bot.id ? 'text-indigo-900' : 'text-slate-700'
              }`}>
                {bot.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                {bot.status === 'active' ? 'Online' : 'Draft'}
              </div>
            </div>
          </button>
        ))}

        <button
          onClick={createNewChatbot}
          className="flex items-center justify-center gap-2 p-2.5 pr-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all text-slate-500 group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 group-hover:bg-indigo-200 flex items-center justify-center shrink-0 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700 transition-colors">New Chatbot</span>
        </button>
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
            onClick={() => {
              if (isDirty) {
                setPendingNavigation({ type: 'custom', target: tab.id, onConfirm: () => setActiveTab(tab.id as any) });
              } else {
                setActiveTab(tab.id as any);
              }
            }}
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
                    onChange={e => updateChatbot({ name: e.target.value })}
                    placeholder="Your Assistant"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Tone Select */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-medium text-slate-700">Tone</label>
                  <select
                    value={tone}
                    onChange={e => updateChatbot({ tone: e.target.value as any })}
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
                    onChange={e => updateChatbot({ description: e.target.value })}
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
                        onChange={e => updateChatbot({ primaryGoals: { ...goals, [item.key]: e.target.checked } })}
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
                <p className="text-xs font-medium text-slate-800">
                  {knowledgeSources.filter(s => s.chatbotId === activeChatbotId).length} sources currently indexed
                </p>
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
                <code>{`<script src="https://cdn.chatly.ai/widget.js" data-chatly-id="${chatbot.id}" async></script>`}</code>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`<script src="https://cdn.chatly.ai/widget.js" data-chatly-id="${chatbot.id}" async></script>`);
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="text-xs font-semibold text-slate-900 block">Authorized Domain</label>
                <input
                  type="text"
                  value={chatbot.domain || ''}
                  onChange={(e) => updateChatbot({ domain: e.target.value })}
                  placeholder="e.g. yourwebsite.com"
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <p className="text-[10px] text-slate-500">Only load the widget on this domain to prevent unauthorized usage.</p>
              </div>
            </div>
          )}

        </div>

        {/* Right Frame: Live Chatbot Preview (5 cols) (Matching Panel 3) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2">
            <span className="text-xs font-medium text-slate-400">Preview</span>
            
            {connectedKey ? (
              <button 
                type="button"
                onClick={() => { setKeyTestFeedback(null); setShowKeyModal(true); }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full transition-colors"
                title="Click to manage or change LLM API key"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live AI: {connectedProvider}</span>
                <span className="text-[10px] text-emerald-600 underline ml-0.5">Edit</span>
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => { setKeyTestFeedback(null); setShowKeyModal(true); }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 rounded-full transition-all shadow-2xs group"
                title="Connect your API key to get real-time LLM replies"
              >
                <Zap className="w-3 h-3 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span>Connect API Key (Live AI)</span>
              </button>
            )}
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
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400">Online</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={resetPreviewChat}
                title="Reset conversation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
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

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white border border-slate-200/90 text-slate-500 shadow-2xs rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              {/* Quick Reply Chips - only show on first message */}
              {previewMessages.length <= 1 && (
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
              )}

              <div ref={messagesEndRef} />
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
                  disabled={isTyping}
                  onChange={e => setPreviewInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!previewInput.trim() || isTyping}
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

      {/* Connect API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Connect Live AI Model</h3>
                  <p className="text-[11px] text-slate-400">Power this assistant with real-time LLM replies</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTestAndSaveKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">AI Provider</label>
                <select
                  value={tempProvider}
                  onChange={e => setTempProvider(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="OpenAI">OpenAI (GPT-4o Mini / GPT-4o)</option>
                  <option value="Google Gemini">Google Gemini (Gemini 1.5 Flash)</option>
                  <option value="Groq">Groq (Llama 3.3 70B - Ultra Fast)</option>
                  <option value="OpenRouter">OpenRouter (Multi-Model Gateway)</option>
                  <option value="Anthropic">Anthropic (Claude 3.5 Haiku / Sonnet)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">API Key</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {tempProvider === 'OpenAI' && 'Starts with sk-...'}
                    {tempProvider === 'Google Gemini' && 'Starts with AIzaSy...'}
                    {tempProvider === 'Groq' && 'Starts with gsk_...'}
                    {tempProvider === 'OpenRouter' && 'Starts with sk-or-...'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showKeySecret ? 'text' : 'password'}
                    required
                    value={tempKeyInput}
                    onChange={e => setTempKeyInput(e.target.value)}
                    placeholder={
                      tempProvider === 'Google Gemini' ? 'AIzaSy...' :
                      tempProvider === 'Groq' ? 'gsk_...' : 'sk-...'
                    }
                    className="w-full text-xs pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKeySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {keyTestFeedback && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  keyTestFeedback.success 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                  {keyTestFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-tight">{keyTestFeedback.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-2">
                {connectedKey ? (
                  <button
                    type="button"
                    onClick={handleDisconnectKey}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-medium"
                  >
                    Disconnect Key
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isTestingKey || !tempKeyInput.trim()}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    {isTestingKey ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Test & Save Key</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
