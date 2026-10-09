'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { fetchChatPreview } from '@/lib/api';
import { 
  Palette, 
  Send, 
  RotateCcw, 
  Bot, 
  Check, 
  Sparkles, 
  Smile, 
  Sliders,
  AlertCircle
} from 'lucide-react';

export default function AppearanceStudio() {
  const { chatbot, updateChatbot, addToast, isDirty, saveDraft } = useApp();

  const [bubbleStyle, setBubbleStyle] = useState<'Modern' | 'Minimal' | 'Rounded' | 'Classic'>(
    chatbot.bubbleStyle || 'Modern'
  );
  const [primaryColor, setPrimaryColor] = useState(chatbot.themeColor || '#6366f1');
  const [welcomeMsg, setWelcomeMsg] = useState(
    chatbot.welcomeMessage || 'Hi! 👋 How can I help you today?'
  );
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>(
    chatbot.position || 'bottom-right'
  );
  const [botName, setBotName] = useState(chatbot.name || 'Your Assistant');
  const [avatarUrl, setAvatarUrl] = useState(chatbot.avatarUrl || '');
  const [newQuestionInput, setNewQuestionInput] = useState('');
  const [isSendingPreview, setIsSendingPreview] = useState(false);

  // Preview interactive messages
  const [previewMsg, setPreviewMsg] = useState('');
  const [interactiveMessages, setInteractiveMessages] = useState<Array<{ sender: 'bot' | 'visitor'; text: string }>>([
    {
      sender: 'bot',
      text: chatbot.welcomeMessage || 'Hi! 👋 How can I help you today?'
    }
  ]);

  // Synchronize when active chatbot changes
  useEffect(() => {
    const welcome = chatbot.welcomeMessage || 'Hi! 👋 How can I help you today?';
    setBubbleStyle(chatbot.bubbleStyle || 'Modern');
    setPrimaryColor(chatbot.themeColor || '#6366f1');
    setWelcomeMsg(welcome);
    setWidgetPosition(chatbot.position || 'bottom-right');
    setBotName(chatbot.name || 'Your Assistant');
    setAvatarUrl(chatbot.avatarUrl || '');
    setInteractiveMessages([
      {
        sender: 'bot',
        text: welcome
      }
    ]);
    setPreviewMsg('');
  }, [chatbot.id]);

  const handleBubbleStyleChange = (style: 'Modern' | 'Minimal' | 'Rounded' | 'Classic') => {
    setBubbleStyle(style);
    updateChatbot({ bubbleStyle: style });
  };

  const handleNameChange = (name: string) => {
    setBotName(name);
    updateChatbot({ name });
  };

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
    updateChatbot({ avatarUrl: url });
  };

  const handleColorChange = (newColor: string) => {
    setPrimaryColor(newColor);
    updateChatbot({ themeColor: newColor });
  };

  const handleWelcomeMsgChange = (text: string) => {
    setWelcomeMsg(text);
    updateChatbot({ welcomeMessage: text });
    setInteractiveMessages(prev => [
      { sender: 'bot', text },
      ...prev.slice(1)
    ]);
  };

  const handleAddQuestion = () => {
    const trimmed = newQuestionInput.trim();
    if (!trimmed) return;
    const current = chatbot.suggestedQuestions || [];
    if (current.includes(trimmed)) return;
    const updated = [...current, trimmed];
    updateChatbot({ suggestedQuestions: updated });
    setNewQuestionInput('');
  };

  const handleRemoveQuestion = (qToRemove: string) => {
    const current = chatbot.suggestedQuestions || [];
    const updated = current.filter(q => q !== qToRemove);
    updateChatbot({ suggestedQuestions: updated });
  };

  const handlePreviewSend = async (customText?: string) => {
    const text = customText || previewMsg;
    if (!text.trim() || isSendingPreview) return;

    setInteractiveMessages(prev => [...prev, { sender: 'visitor', text }]);
    setPreviewMsg('');
    setIsSendingPreview(true);

    try {
      const data = await fetchChatPreview(
        text,
        interactiveMessages,
        {
          name: botName,
          tone: chatbot.tone,
          businessDescription: chatbot.description || 'Our business provides exceptional customer service and support.',
        },
        chatbot.id
      );
      
      if (data.reply) {
        setInteractiveMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setInteractiveMessages(prev => [...prev, { sender: 'bot', text: "Sorry, no response from the server." }]);
      }
    } catch (err: any) {
      console.error('Error fetching chat in AppearanceStudio:', err);
      setInteractiveMessages(prev => [...prev, { sender: 'bot', text: `Error: ${err.message}` }]);
    } finally {
      setIsSendingPreview(false);
    }
  };

  const avatarPresets = [
    { label: 'Friendly', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face' },
    { label: 'Professional', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face' },
    { label: 'Modern Tech', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
    { label: 'Support Agent', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face' }
  ];

  const paletteSwatches = [
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Royal Blue', hex: '#2563eb' },
    { name: 'Slate Charcoal', hex: '#0f172a' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Rose', hex: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 page-transition pb-12">
      {/* Header (Matches Panel 8: Customize Your Widget) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customize Your Widget
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Make the chatbot match your brand's look and feel.
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
            onClick={() => saveDraft()}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition-all shadow-2xs btn-press ${
              isDirty 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'text-slate-700 bg-white hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {isDirty ? 'Save Changes' : 'Saved'}
          </button>
          
          <button
            onClick={() => {
              handleColorChange('#6366f1');
              setBubbleStyle('Modern');
              handleWelcomeMsgChange('Hi! 👋 How can I help you today?');
              setWidgetPosition('bottom-right');
              addToast({
                type: 'info',
                title: 'Reset to Defaults',
                description: 'Restored default Chatly appearance settings.'
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors w-fit shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* 2-Column Split: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          
          {/* Section: Assistant Identity */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-900 block">
              Assistant Identity
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Chatbot Name</label>
                <input
                  type="text"
                  value={botName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Acme Support Bot"
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Avatar URL & Presets</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={e => handleAvatarChange(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => handleAvatarChange('')}
                      className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Presets:</span>
                  {avatarPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAvatarChange(preset.url)}
                      className={`w-7 h-7 rounded-full border-2 overflow-hidden transition-transform hover:scale-110 ${
                        avatarUrl === preset.url ? 'ring-2 ring-indigo-600 border-white' : 'border-slate-200'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Chat Bubble Style */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-sm font-semibold text-slate-900 block">
              Widget Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['Modern', 'Minimal', 'Rounded', 'Classic'] as const).map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleBubbleStyleChange(style)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                    bubbleStyle === style
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 font-semibold ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Primary Color */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-sm font-semibold text-slate-900 block">
              Colors & Branding
            </label>
            
            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => handleColorChange(e.target.value)}
                  className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                />
              </div>
              <input
                type="text"
                value={primaryColor}
                onChange={e => handleColorChange(e.target.value)}
                className="w-32 text-xs font-mono uppercase bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Quick Palette Swatches */}
            <div className="flex items-center gap-2 pt-1">
              {paletteSwatches.map(swatch => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => handleColorChange(swatch.hex)}
                  style={{ backgroundColor: swatch.hex }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    primaryColor.toLowerCase() === swatch.hex.toLowerCase()
                      ? 'border-white ring-2 ring-slate-900 scale-105'
                      : 'border-transparent'
                  }`}
                  title={swatch.name}
                />
              ))}
            </div>
          </div>

          {/* Section: Welcome Message */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-900">
                Messages & Greeting
              </label>
              <span className="text-[11px] text-slate-400">
                {welcomeMsg.length}/200
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={200}
              value={welcomeMsg}
              onChange={e => handleWelcomeMsgChange(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Section: Quick Replies / Suggested Questions */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-sm font-semibold text-slate-900 block">
              Quick Replies (Suggested Questions)
            </label>
            <p className="text-xs text-slate-500">
              Chips shown to users beneath the greeting to encourage engagement.
            </p>
            
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {(chatbot.suggestedQuestions || []).map((q, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200"
                >
                  <span>{q}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(q)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                    aria-label={`Remove question ${q}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newQuestionInput}
                onChange={e => setNewQuestionInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddQuestion())}
                placeholder="e.g. What are your pricing plans?"
                className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                disabled={!newQuestionInput.trim()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Section: Widget Position */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-sm font-semibold text-slate-900 block">
              Widget Position
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setWidgetPosition('bottom-right');
                  updateChatbot({ position: 'bottom-right' });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                  widgetPosition === 'bottom-right'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 font-semibold ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                Bottom Right
              </button>
              <button
                type="button"
                onClick={() => {
                  setWidgetPosition('bottom-left');
                  updateChatbot({ position: 'bottom-left' });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                  widgetPosition === 'bottom-left'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 font-semibold ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                Bottom Left
              </button>
            </div>
          </div>

        </div>

        {/* Right Live Preview Frame (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2">
            <span className="text-xs font-medium text-slate-400">Live Preview</span>
            <span className="text-[11px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
              Updates in Real Time
            </span>
          </div>

          {/* Chat Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col transition-all">
            
            {/* Header with Dynamic Primary Color, Avatar and Name */}
            <div 
              style={{ backgroundColor: primaryColor }}
              className="px-4 py-3 text-white flex items-center justify-between transition-colors duration-200"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden flex items-center justify-center text-xs font-medium shrink-0 border border-white/30">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={botName} className="w-full h-full object-cover" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white leading-tight">{botName}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    <span className="text-[10px] text-white/80">Online</span>
                  </div>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-white/40"></div>
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-3 min-h-[300px] max-h-[360px] overflow-y-auto bg-slate-50/50">
              {interactiveMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    style={
                      m.sender === 'visitor' 
                        ? { backgroundColor: primaryColor, color: '#ffffff' } 
                        : undefined
                    }
                    className={`max-w-[85%] px-3.5 py-2.5 text-xs leading-relaxed transition-all ${
                      bubbleStyle === 'Modern'
                        ? 'rounded-2xl'
                        : bubbleStyle === 'Minimal'
                        ? 'rounded-md'
                        : bubbleStyle === 'Rounded'
                        ? 'rounded-3xl'
                        : 'rounded-xl'
                    } ${
                      m.sender === 'visitor'
                        ? 'rounded-br-xs'
                        : 'bg-white border border-slate-200/90 text-slate-800 shadow-2xs rounded-bl-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isSendingPreview && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white border border-slate-200/90 text-slate-500 shadow-2xs rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                  </div>
                </div>
              )}

              {/* Suggested Quick-Replies Chips */}
              {interactiveMessages.length <= 1 && (
                <div className="pt-2 flex flex-col gap-1.5">
                  {(chatbot.suggestedQuestions && chatbot.suggestedQuestions.length > 0
                    ? chatbot.suggestedQuestions
                    : ['Tell me about your services', 'I want a free quote', 'Talk to a human']
                  ).map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePreviewSend(chip)}
                      style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
                      className="text-left text-[11px] font-medium bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full shadow-2xs transition-colors w-fit border"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Footer */}
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
                  placeholder={isSendingPreview ? 'Generating response...' : 'Type a message...'}
                  value={previewMsg}
                  disabled={isSendingPreview}
                  onChange={e => setPreviewMsg(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!previewMsg.trim() || isSendingPreview}
                  style={{ backgroundColor: primaryColor }}
                  className="w-6 h-6 rounded-lg text-white flex items-center justify-center transition-opacity disabled:opacity-40 shrink-0"
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
