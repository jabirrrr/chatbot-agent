'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Bot, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Calendar, 
  MessageSquare, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Star, 
  Building2, 
  Layers, 
  Check, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Code2
} from 'lucide-react';

export default function MarketingLandingPage() {
  const { setCurrentScreen, addToast } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [demoQuestion, setDemoQuestion] = useState('');
  const [demoChat, setDemoChat] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hello! I am Helio, the autonomous website agent for Northstar Studio. How can I assist your business today?',
      time: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const samplePrompts = [
    'What services do you offer?',
    'Can I schedule a consultation?',
    'What are your pricing packages?',
    'Where are you located?'
  ];

  const handleSendPrompt = (promptText: string) => {
    if (isTyping) return;
    const userMsg = { sender: 'user' as const, text: promptText, time: 'Just now' };
    setDemoChat(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let botReply = "Northstar Studio provides full-service digital strategy, brand identity, and custom web development for growing businesses.";
      if (promptText.toLowerCase().includes('schedule') || promptText.toLowerCase().includes('consultation')) {
        botReply = "I would be happy to book that! We have open consultation slots tomorrow at 10:00 AM and 2:30 PM EST. Would you like me to reserve one for you?";
      } else if (promptText.toLowerCase().includes('pricing')) {
        botReply = "Our client engagements start at $2,500 for brand design and $4,500 for end-to-end web platforms. We also offer custom monthly retainer packages.";
      } else if (promptText.toLowerCase().includes('located')) {
        botReply = "Our headquarters is located at 100 Innovation Way, Suite 400, Boston, MA. We also collaborate remotely with clients worldwide.";
      }

      setDemoChat(prev => [
        ...prev,
        { sender: 'bot', text: botReply, time: 'Just now' }
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white -m-6 md:-m-8">
      {/* Top Marketing Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentScreen('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/25">
              H
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Helio AI
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  GA v1.0
                </span>
              </span>
              <p className="text-[11px] text-slate-400">Autonomous Website Agent for SMBs</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Pilot Case Studies</a>
            <button 
              onClick={() => setCurrentScreen('status')} 
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              99.98% SLA Status
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentScreen('home')}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Operator Sign In
            </button>
            <button
              onClick={() => setCurrentScreen('onboarding')}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center gap-1.5"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/10 blur-[130px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-blue-500/30 rounded-full px-4 py-1.5 text-xs font-semibold text-blue-300 mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Commercial General Availability (GA) is Live</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Turn Website Visitors into <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Paying Clients
            </span> While You Sleep.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Helio is the autonomous AI agent built for SMB marketing agencies, professional services, and real estate. Grounded in your business documents with zero hallucinations.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setCurrentScreen('onboarding')}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-600/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Deploy Your AI Agent Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#preview"
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-blue-400" />
              <span>Test Interactive Demo</span>
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1-line script embed
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Widget Preview Section */}
      <section id="preview" className="py-20 bg-slate-900/60 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              Live Interactive Sandbox
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              Experience the Helio Widget in Real Time
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base">
              Test how Helio qualifies visitor intent, extracts requirements, and delivers grounded knowledge responses in milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            {/* Left Column: Sample questions & instructions */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Click a prompt to test:</span>
              </h3>
              <div className="space-y-2.5">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(prompt)}
                    disabled={isTyping}
                    className="w-full text-left p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 text-sm font-medium text-slate-200 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span>&ldquo;{prompt}&rdquo;</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 space-y-1.5">
                <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>RAG Guardrail Active</span>
                </div>
                <p className="text-blue-200/80">
                  Every response is grounded in vectorized PDFs and business FAQs with zero hallucination.
                </p>
              </div>
            </div>

            {/* Right Column: Live Chat Widget Mock Container */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[460px]">
                {/* Chat Header */}
                <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                        <Bot className="w-5 h-5" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Northstar Discovery Bot</h4>
                      <p className="text-[11px] text-emerald-400 font-medium">Online • Typically replies instantly</p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-slate-700/70 text-slate-300 px-2 py-0.5 rounded font-mono">
                    OpenRouter SSE
                  </span>
                </div>

                {/* Message Scroll Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {demoChat.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 border border-slate-700/70 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-800 border border-slate-700/70 w-20">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>

                {/* Chat Input Dock */}
                <div className="p-3 bg-slate-800/80 border-t border-slate-700 flex items-center gap-2">
                  <input
                    type="text"
                    value={demoQuestion}
                    onChange={e => setDemoQuestion(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && demoQuestion.trim()) {
                        handleSendPrompt(demoQuestion.trim());
                        setDemoQuestion('');
                      }
                    }}
                    placeholder="Ask a custom question..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (demoQuestion.trim()) {
                        handleSendPrompt(demoQuestion.trim());
                        setDemoQuestion('');
                      }
                    }}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            Commercial Platform Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            Engineered for Revenue, Grounded in Security
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base">
            Everything your agency or firm needs to automate client intake without hiring additional staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Layers,
              color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              title: 'Zero-Hallucination RAG',
              desc: 'Upload PDFs, Word docs, and pricing sheets. Recursive 512-token chunking with pgvector HNSW search ensures strictly grounded answers.'
            },
            {
              icon: Bot,
              color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
              title: 'OpenRouter Multi-Model',
              desc: 'Leverage Claude 3.5 Sonnet, GPT-4o, and Gemini Flash seamlessly through our resilient LLM provider abstraction layer.'
            },
            {
              icon: Calendar,
              color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              title: 'Google Calendar Sync',
              desc: 'Visitors browse open consultation slots in-chat and book meetings directly into your Google Calendar via secure OAuth 2.0.'
            },
            {
              icon: Users,
              color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
              title: 'Real-Time Human Takeover',
              desc: 'Live WebSocket operator alerts trigger when high-intent leads request human interaction, enabling immediate operator handoff.'
            },
            {
              icon: ShieldCheck,
              color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              title: 'Enterprise Multi-Tenancy',
              desc: 'Strict PostgreSQL Row-Level Security (RLS), AES-256 encrypted credential vaults, and sliding window rate limiting protect your data.'
            },
            {
              icon: Zap,
              color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
              title: 'Stripe Billing & Webhooks',
              desc: 'Tiered subscriptions, automated webhook synchronization, HMAC-SHA256 event dispatch, and scoped developer REST API keys.'
            },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-5 ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                  {feat.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transparent Pricing Table */}
      <section id="pricing" className="py-24 bg-slate-900/40 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              Transparent Commercial Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              Simple, Predictable Plans for Every SMB
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base">
              Start with our 14-day free trial. Scale as your visitor conversation volume grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Free Tier</span>
                <h3 className="text-2xl font-bold text-white mt-1">Starter Discovery</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Ideal for testing widget embedding and exploring RAG functionality.
                </p>

                <div className="mt-6 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> 1 AI Chatbot
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> 50 Conversations / mo
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Standard Widget Theme
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Community Forum Support
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentScreen('onboarding')}
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Starter Plan (Highlighted) */}
            <div className="relative p-8 rounded-2xl bg-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/10 flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full shadow-md">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Growth</span>
                <h3 className="text-2xl font-bold text-white mt-1">Starter Tier</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$49</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Perfect for boutique agencies, law firms, and real estate brokerages.
                </p>

                <div className="mt-6 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> 3 AI Chatbots
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> 1,000 Conversations / mo
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Full Knowledge Base RAG
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Lead CRM & CSV Exports
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Google Calendar Integration
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Custom Branding & Color Hexes
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentScreen('billing')}
                className="mt-8 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
              >
                Upgrade to Starter
              </button>
            </div>

            {/* Professional Plan */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Enterprise</span>
                <h3 className="text-2xl font-bold text-white mt-1">Professional Tier</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$149</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  For high-traffic operations requiring real-time human handoff and REST APIs.
                </p>

                <div className="mt-6 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" /> Unlimited Chatbots
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" /> 10,000 Conversations / mo
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" /> Real-Time Human Operator Takeover
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" /> Outbound HMAC Webhooks
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" /> Public REST API with Scoped Keys
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" /> 99.98% Priority Uptime SLA
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentScreen('billing')}
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Verified SMB Pilot Testimonials */}
      <section id="testimonials" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Beta Pilot Proof
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            Validated by 15 SMB Organizations
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base">
            Measured 80.0% active widget deployment rate and an average 9.2/10 Net Promoter Score across marketing, legal, and real estate verticals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "Helio captured 42 qualified client leads for our creative agency in month one. The calendar booking tool completely eliminated back-and-forth emails.",
              author: "Elena Rostova",
              role: "Founder & Creative Director",
              company: "Apex Media Labs",
              vertical: "Marketing Agency",
              score: "10/10 NPS"
            },
            {
              quote: "The zero-hallucination guarantee was non-negotiable for our law firm. Helio answers estate planning inquiries accurately and routes urgent cases to our on-call attorneys.",
              author: "Marcus Vance",
              role: "Managing Partner",
              company: "Meridian Wealth & Legal",
              vertical: "Professional Services",
              score: "9/10 NPS"
            },
            {
              quote: "Prospective home buyers get instant answers about property zoning and open house hours at 11 PM. Our conversion rate increased by 31% within 3 weeks.",
              author: "Chloe Bennett",
              role: "Broker & Principal",
              company: "Vanguard Real Estate Group",
              vertical: "Real Estate Brokerage",
              score: "10/10 NPS"
            }
          ].map((testi, i) => (
            <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, starIdx) => (
                      <Star key={starIdx} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {testi.score}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  &ldquo;{testi.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <h4 className="text-xs font-bold text-white">{testi.author}</h4>
                <p className="text-[11px] text-slate-400">{testi.role}, {testi.company}</p>
                <span className="text-[10px] font-medium text-blue-400">{testi.vertical}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              H
            </div>
            <span className="text-sm font-bold text-white">Helio AI Chatbot SaaS</span>
            <span>• © 2026 All Rights Reserved</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentScreen('status')} className="hover:text-white transition-colors">
              System Status
            </button>
            <button onClick={() => setCurrentScreen('developer')} className="hover:text-white transition-colors">
              REST API Docs
            </button>
            <button onClick={() => setCurrentScreen('settings')} className="hover:text-white transition-colors">
              Security & Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
