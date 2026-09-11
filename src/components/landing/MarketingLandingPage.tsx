'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Sparkles, 
  Play, 
  Check, 
  Send, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Bot,
  MessageSquare,
  Users,
  Calendar,
  Layers,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

export default function MarketingLandingPage() {
  const { setCurrentScreen } = useApp();
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'visitor'; text: string; time?: string }>>([
    {
      sender: 'bot',
      text: 'Hi! 👋 How can I help you today?'
    },
    {
      sender: 'visitor',
      text: 'Do you offer home delivery?'
    },
    {
      sender: 'bot',
      text: 'Yes! We offer free delivery on orders above ₹999. Would you like to see our products?'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || isTyping) return;

    setMessages(prev => [...prev, { sender: 'visitor', text }]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = "I can certainly help you with that! Feel free to ask about our pricing, product catalog, or booking a team consultation.";
      const lower = text.toLowerCase();
      if (lower.includes('show') || lower.includes('product')) {
        botResponse = "Here are our most popular categories: 1. Organic Pantry Essentials, 2. Premium Botanicals, 3. Eco Home Goods. Let me know which one you'd like to explore!";
      } else if (lower.includes('human') || lower.includes('talk')) {
        botResponse = "Connecting you with our support lead Priya right now! Please leave your email or wait 30 seconds for an agent.";
      } else if (lower.includes('price') || lower.includes('cost')) {
        botResponse = "Our plans start at ₹999/month for small businesses with up to 1,000 conversations. Would you like to start a 14-day free trial?";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white -m-6 md:-m-8">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 sm:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div 
            onClick={() => setCurrentScreen('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" fill="currentColor" fillOpacity="0.2"/>
                <path d="M8 12h.01M12 12h.01M16 12h.01"/>
              </svg>
            </div>
            <span className="text-lg font-semibold text-slate-900 tracking-tight">
              Chatly
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button onClick={() => setCurrentScreen('chatbots')} className="hover:text-slate-900 transition-colors">Product</button>
            <button onClick={() => setCurrentScreen('billing')} className="hover:text-slate-900 transition-colors">Pricing</button>
            <button onClick={() => setCurrentScreen('knowledge')} className="hover:text-slate-900 transition-colors">Resources</button>
            <button onClick={() => setCurrentScreen('integrations')} className="hover:text-slate-900 transition-colors">Integrations</button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentScreen('home')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentScreen('onboarding')}
            className="text-sm font-medium bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl shadow-xs transition-all btn-press"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 pt-16 pb-20 lg:pt-20 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Value Prop */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/80 border border-indigo-100 text-indigo-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>#1 AI Chatbot for Small Businesses</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
              Turn website visitors into customers
            </h1>

            {/* Subheading */}
            <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
              Deploy an intelligent AI chatbot on your website in minutes. Answer questions, capture leads, schedule appointments and grow your business — 24/7.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setCurrentScreen('onboarding')}
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-medium text-sm shadow-xs transition-all btn-press whitespace-nowrap"
              >
                <span>Get Started Free</span>
              </button>

              <button
                onClick={() => setCurrentScreen('home')}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-3 rounded-xl font-medium text-sm transition-all btn-press whitespace-nowrap shadow-xs"
              >
                <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Trust checkmarks */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500 pt-3">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Chatbot Live Preview Frame (Matching Panel 1) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[360px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col transition-all duration-200">
              
              {/* Widget Header */}
              <div className="px-4 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-medium shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">Your Business</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[11px] text-slate-400">Online</span>
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              </div>

              {/* Chat Messages Body */}
              <div className="p-4 space-y-3 min-h-[290px] max-h-[340px] overflow-y-auto bg-slate-50/50">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        m.sender === 'visitor'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 shadow-xs rounded-bl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200/90 px-3.5 py-2.5 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot-1"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot-2"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 typing-dot-3"></span>
                    </div>
                  </div>
                )}

                {/* Suggested Quick-Replies Chips */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSend('Yes, show me')}
                    className="text-[11px] font-medium bg-white hover:bg-indigo-50/60 text-indigo-600 border border-indigo-200/80 px-2.5 py-1 rounded-full shadow-xs transition-colors"
                  >
                    Yes, show me
                  </button>
                  <button
                    onClick={() => handleSend('Talk to a human')}
                    className="text-[11px] font-medium bg-white hover:bg-indigo-50/60 text-indigo-600 border border-indigo-200/80 px-2.5 py-1 rounded-full shadow-xs transition-colors"
                  >
                    Talk to a human
                  </button>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-slate-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
                >
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputVal.trim() || isTyping}
                    className="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Trusted By Bar (Stripe, Shopify, Cal.com, Google, HubSpot, Slack) */}
      <section className="border-y border-slate-100 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            Trusted by growing businesses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-60 grayscale hover:grayscale-0 transition-all">
            <span className="font-bold tracking-tighter text-lg text-slate-800">stripe</span>
            <span className="font-bold tracking-tight text-lg text-slate-800">shopify</span>
            <span className="font-semibold text-lg text-slate-800">cal.com</span>
            <span className="font-medium text-lg text-slate-800">Google</span>
            <span className="font-bold text-lg text-slate-800">HubSpot</span>
            <span className="font-bold tracking-tight text-lg text-slate-800">slack</span>
          </div>
        </div>
      </section>

      {/* Feature Highlight Cards (Apple-like spacious 3-col) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Engineered for conversion and simplicity
          </h2>
          <p className="text-slate-600 text-sm">
            Everything your small business needs to automate customer support, lead capture, and appointment scheduling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Instant AI Resolution</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Trains on your PDFs, website URLs, and FAQs in seconds. Provides accurate answers with zero hallucination.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Seamless Lead Capture</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gathers visitor email, name, and intent naturally in conversation and syncs directly into your CRM.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Automated Appointments</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Allows visitors to book demos and consultations straight in the chat window with Google Calendar & Cal.com.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-slate-900 text-white py-16 px-6 sm:px-10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to convert more website visitors?
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Join thousands of modern businesses using Chatly to drive leads and delight customers around the clock.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setCurrentScreen('onboarding')}
              className="bg-white hover:bg-slate-100 text-slate-900 px-7 py-3 rounded-xl font-medium text-sm transition-all btn-press shadow-sm"
            >
              Get Started for Free →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
