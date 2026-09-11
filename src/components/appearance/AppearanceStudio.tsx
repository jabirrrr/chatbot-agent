'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import CustomerChatWidget from '@/components/widget/CustomerChatWidget';
import { 
  Palette, 
  RotateCcw, 
  Check, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Plus, 
  Trash2, 
  Layers,
  Bot
} from 'lucide-react';

export default function AppearanceStudio() {
  const { chatbot, updateChatbot, addToast } = useApp();

  const [newQuestion, setNewQuestion] = useState('');
  const [devicePreview, setDevicePreview] = useState<'mobile' | 'desktop'>('mobile');

  const themePresets = [
    { name: 'Cobalt Standard', color: '#2563eb' },
    { name: 'Emerald Growth', color: '#10b981' },
    { name: 'Obsidian Modern', color: '#0f172a' },
    { name: 'Royal Indigo', color: '#4f46e5' },
    { name: 'Amber Glow', color: '#d97706' },
  ];

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    updateChatbot({
      suggestedQuestions: [...chatbot.suggestedQuestions, newQuestion.trim()]
    });
    setNewQuestion('');
  };

  const handleRemoveQuestion = (idx: number) => {
    updateChatbot({
      suggestedQuestions: chatbot.suggestedQuestions.filter((_, i) => i !== idx)
    });
  };

  const handleResetDefaults = () => {
    updateChatbot({
      name: 'Helio LeadBot',
      themeColor: '#2563eb',
      welcomeMessage: "👋 Hi there! I'm Helio, the AI assistant for Northstar Studio. How can we help grow your brand or project today?",
      position: 'bottom-right',
      launcherStyle: 'pill',
      tone: 'Friendly'
    });
    addToast({
      type: 'info',
      title: 'Defaults Restored',
      description: 'Reset chatbot theme and appearance settings to default values.'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Chatbot Appearance Studio</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visually customize widget branding, colors, position, and starter prompts. Changes preview live in real time.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors w-fit"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      {/* 2-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
          {/* Section 1: Presets */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">Curated Theme Presets</label>
            <div className="flex flex-wrap gap-2">
              {themePresets.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => updateChatbot({ themeColor: preset.color })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                    chatbot.themeColor === preset.color
                      ? 'border-slate-900 bg-slate-50 font-bold text-slate-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.color }} />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: General Branding */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Identity & Tone</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chatbot Display Name</label>
                <input
                  type="text"
                  value={chatbot.name}
                  onChange={e => updateChatbot({ name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Brand Color (HEX)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={chatbot.themeColor}
                    onChange={e => updateChatbot({ themeColor: e.target.value })}
                    className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={chatbot.themeColor}
                    onChange={e => updateChatbot({ themeColor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs uppercase font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Welcome Message</label>
              <textarea
                rows={2}
                value={chatbot.welcomeMessage}
                onChange={e => updateChatbot({ welcomeMessage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
              />
            </div>
          </div>

          {/* Section 3: Widget Placement & Style */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Placement & Launcher</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Position on Host Page</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateChatbot({ position: 'bottom-right' })}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                      chatbot.position === 'bottom-right' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    Bottom Right
                  </button>
                  <button
                    type="button"
                    onClick={() => updateChatbot({ position: 'bottom-left' })}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                      chatbot.position === 'bottom-left' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    Bottom Left
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Launcher Button Appearance</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['pill', 'text-icon', 'icon'] as const).map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => updateChatbot({ launcherStyle: style })}
                      className={`py-2 px-1 rounded-xl border text-[11px] font-semibold text-center capitalize transition-all ${
                        chatbot.launcherStyle === style ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {style === 'pill' ? 'Pill' : style === 'text-icon' ? 'Text' : 'Icon'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Suggested Prompts */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Suggested Question Chips</h3>
            <p className="text-slate-500 text-[11px]">These tappable chips appear in the widget to initiate high-converting conversations.</p>

            <div className="space-y-2">
              {chatbot.suggestedQuestions.map((q, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-800 font-medium">"{q}"</span>
                  <button
                    onClick={() => handleRemoveQuestion(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remove question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom starter prompt..."
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddQuestion()}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                Add Chip
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Live Mobile Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Live Interactive Preview
            </span>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setDevicePreview('mobile')}
                className={`p-1 rounded ${devicePreview === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                title="Mobile preview"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevicePreview('desktop')}
                className={`p-1 rounded ${devicePreview === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                title="Desktop preview"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200/80 shadow-inner flex justify-center">
            <CustomerChatWidget embedded={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
