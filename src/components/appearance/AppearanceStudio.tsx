'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Palette, 
  Send, 
  RotateCcw, 
  Bot, 
  Check, 
  Sparkles, 
  Smile, 
  Sliders 
} from 'lucide-react';

export default function AppearanceStudio() {
  const { chatbot, updateChatbot, addToast } = useApp();

  const [appearanceTab, setAppearanceTab] = useState<'Style' | 'Colors' | 'Position' | 'Messages'>('Style');
  const [bubbleStyle, setBubbleStyle] = useState<'Modern' | 'Minimal' | 'Rounded' | 'Classic'>('Modern');
  const [primaryColor, setPrimaryColor] = useState(chatbot.themeColor || '#6366f1');
  const [welcomeMsg, setWelcomeMsg] = useState(
    chatbot.welcomeMessage || 'Hi! 👋 How can I help you today?'
  );
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>(
    chatbot.position || 'bottom-right'
  );

  // Preview interactive messages
  const [previewMsg, setPreviewMsg] = useState('');
  const [interactiveMessages, setInteractiveMessages] = useState<Array<{ sender: 'bot' | 'visitor'; text: string }>>([
    {
      sender: 'bot',
      text: welcomeMsg
    }
  ]);

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

  const handlePreviewSend = async (customText?: string) => {
    const text = customText || previewMsg;
    if (!text.trim()) return;

    setInteractiveMessages(prev => [...prev, { sender: 'visitor', text }]);
    setPreviewMsg('');

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
          history: interactiveMessages,
          apiKey: llmKey,
          provider: llmProvider || 'OpenAI',
          botConfig: {
            name: chatbot.name,
            tone: chatbot.tone,
            businessDescription: chatbot.description || 'Our business provides exceptional customer service and support.',
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setInteractiveMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching chat in AppearanceStudio:', err);
    }

    setTimeout(() => {
      setInteractiveMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Thanks for reaching out! A specialist will answer shortly.' }
      ]);
    }, 600);
  };

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

      {/* Sub-tabs (Style, Colors, Position, Messages) */}
      <div className="flex items-center gap-1 border-b border-slate-200/80 pb-px">
        {(['Style', 'Colors', 'Position', 'Messages'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setAppearanceTab(tab)}
            className={`px-4 py-2 text-xs font-medium transition-all relative ${
              appearanceTab === tab
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 -mb-px'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2-Column Split: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          
          {/* Section: Chat Bubble Style */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-900 block">
              Chat Bubble Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['Modern', 'Minimal', 'Rounded', 'Classic'] as const).map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setBubbleStyle(style)}
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
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-900 block">
              Primary Color
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
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900">
                Welcome Message
              </label>
              <span className="text-[11px] text-slate-400">
                {welcomeMsg.length}/100
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={100}
              value={welcomeMsg}
              onChange={e => handleWelcomeMsgChange(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Section: Widget Position */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-900 block">
              Widget Screen Position
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

        {/* Right Live Preview Frame (5 cols) (Matching Panel 8) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2">
            <span className="text-xs font-medium text-slate-400">Live Preview</span>
            <span className="text-[11px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
              Updates in Real Time
            </span>
          </div>

          {/* Chat Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col transition-all">
            
            {/* Header with Dynamic Primary Color */}
            <div 
              style={{ backgroundColor: primaryColor }}
              className="px-4 py-3 text-white flex items-center justify-between transition-colors duration-200"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-medium shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Your Assistant</h3>
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

              {/* Sample Suggested Quick-Replies (Only on first message) */}
              {interactiveMessages.length <= 1 && (
                <div className="pt-2 flex flex-col gap-1.5">
                  {[
                    'Tell me about your services',
                    'I want a free quote',
                    'Talk to a human'
                  ].map((chip, idx) => (
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
                  placeholder="Type a message..."
                  value={previewMsg}
                  onChange={e => setPreviewMsg(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!previewMsg.trim()}
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
