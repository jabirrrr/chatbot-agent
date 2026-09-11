'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import CustomerChatWidget from '@/components/widget/CustomerChatWidget';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  UploadCloud, 
  FileText, 
  Globe, 
  HelpCircle, 
  Building, 
  Copy, 
  CheckCircle2, 
  Sparkles, 
  Shield, 
  AlertCircle,
  ExternalLink,
  Code2
} from 'lucide-react';

export default function OnboardingWizard() {
  const { chatbot, updateChatbot, businessInfo, updateBusinessInfo, setCurrentScreen, addToast } = useApp();

  const [step, setStep] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [isCheckingInstall, setIsCheckingInstall] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [simulatedUploadProgress, setSimulatedUploadProgress] = useState(0);

  // Snippet text
  const embedSnippet = `<script
  src="https://cdn.helio.ai/v1/widget.js"
  data-token="wgt_live_9a8b7c6d5e4f3a2b1c"
  data-domain="${businessInfo.website}"
  async
></script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedSnippet);
    setIsCopied(true);
    addToast({
      type: 'success',
      title: 'Code Snippet Copied',
      description: 'Embed script copied to clipboard. Paste before </body> tag.'
    });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleCheckInstall = () => {
    setIsCheckingInstall(true);
    setTimeout(() => {
      setIsCheckingInstall(false);
      setInstallSuccess(true);
      addToast({
        type: 'success',
        title: 'Installation Verified',
        description: 'Successfully detected Helio widget handshake on northstarstudio.io!'
      });
    }, 1800);
  };

  const simulateFileUpload = () => {
    setSimulatedUploadProgress(15);
    const interval = setInterval(() => {
      setSimulatedUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          addToast({
            type: 'success',
            title: 'Knowledge Uploaded',
            description: 'Document parsed and converted into 48 semantic vector chunks.'
          });
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const steps = [
    { num: 1, title: 'Business Profile', desc: 'Agency identity' },
    { num: 2, title: 'Add Knowledge', desc: 'Docs & URLs' },
    { num: 3, title: 'Configure AI', desc: 'Tone & behavior' },
    { num: 4, title: 'Customize Widget', desc: 'Theme & styling' },
    { num: 5, title: 'Install & Launch', desc: 'Deploy live' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Wizard Header */}
      <div className="text-center max-w-xl mx-auto pt-2">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Fast-Track Deployment
        </span>
        <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
          Deploy your AI Chatbot in under 30 minutes
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Follow our 5 guided steps to train, personalize, and embed Helio on your website.
        </p>
      </div>

      {/* 5-Step Horizontal Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-5 gap-2">
          {steps.map(s => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`text-left p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </span>
                  <div className="min-w-0 hidden md:block">
                    <p className={`text-xs font-bold truncate ${isCurrent ? 'text-blue-900' : 'text-slate-800'}`}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{s.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Content Frame */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        {/* STEP 1: BUSINESS PROFILE */}
        {step === 1 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 1: Tell Helio About Your Business</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Helio uses this core identity to ground its knowledge and answer introductory questions.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  value={businessInfo.companyName}
                  onChange={e => updateBusinessInfo({ companyName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Website URL *</label>
                <input
                  type="url"
                  value={businessInfo.website}
                  onChange={e => updateBusinessInfo({ website: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Industry Vertical</label>
                <select
                  value={businessInfo.industry}
                  onChange={e => updateBusinessInfo({ industry: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium cursor-pointer"
                >
                  <option value="Digital Marketing & Web Design Agency">Digital Marketing & Web Design Agency</option>
                  <option value="Professional Legal & Accounting Services">Professional Legal & Accounting Services</option>
                  <option value="SaaS & Cloud Software Platform">SaaS & Cloud Software Platform</option>
                  <option value="E-Commerce & Retail Brand">E-Commerce & Retail Brand</option>
                  <option value="Healthcare & Wellness Clinic">Healthcare & Wellness Clinic</option>
                  <option value="Real Estate & Property Management">Real Estate & Property Management</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Description & Value Proposition</label>
                <textarea
                  rows={3}
                  value={businessInfo.description}
                  onChange={e => updateBusinessInfo({ description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pricing Guidance (What should Helio quote?)</label>
                <input
                  type="text"
                  value={businessInfo.pricingGuidance}
                  onChange={e => updateBusinessInfo({ pricingGuidance: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ADD KNOWLEDGE */}
        {step === 2 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 2: Train Helio with Business Knowledge</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload PDFs, Word docs, FAQs, or web URLs to build your private vector index.
              </p>
            </div>

            {/* Upload Dropzone */}
            <div 
              onClick={simulateFileUpload}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 p-8 rounded-2xl bg-slate-50 hover:bg-blue-50/30 text-center cursor-pointer transition-all space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Drag and drop files here, or <span className="text-blue-600 underline">browse files</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports PDF, DOCX, TXT, Markdown (Max 25MB per document)
                </p>
              </div>

              {simulatedUploadProgress > 0 && (
                <div className="max-w-xs mx-auto space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-blue-700">
                    <span>Extracting & chunking...</span>
                    <span>{simulatedUploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${simulatedUploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Source Type Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <FileText className="w-5 h-5 text-blue-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Upload PDF</p>
                <p className="text-[10px] text-slate-400">Pricing guides, FAQs</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <Globe className="w-5 h-5 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Crawl URL</p>
                <p className="text-[10px] text-slate-400">Website pages</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <HelpCircle className="w-5 h-5 text-purple-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Direct FAQs</p>
                <p className="text-[10px] text-slate-400">Instant Q&A pairs</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <Building className="w-5 h-5 text-amber-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Hours & Contact</p>
                <p className="text-[10px] text-slate-400">Operations info</p>
              </div>
            </div>

            {/* Preloaded Knowledge Confirmation */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">4 Sources Pre-Indexed for Northstar Studio</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  We've automatically attached your 2026 Agency Services guide, Web design process doc, case studies, and standard client FAQ.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIGURE AI */}
        {step === 3 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 3: Define AI Personality & Conversational Goals</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set how Helio speaks to visitors, what lead fields to collect, and what to do when questions are out of scope.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chatbot Display Name</label>
                <input
                  type="text"
                  value={chatbot.name}
                  onChange={e => updateChatbot({ name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Conversational Tone</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Professional', 'Friendly', 'Concise', 'Warm'] as const).map(tone => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => updateChatbot({ tone })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        chatbot.tone === tone
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Welcome Message</label>
                <textarea
                  rows={2}
                  value={chatbot.welcomeMessage}
                  onChange={e => updateChatbot({ welcomeMessage: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Lead Fields to Capture via Function Calling</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Name', 'Email Address', 'Phone Number', 'Company Name', 'Budget Range'].map(field => (
                    <label key={field} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                      <span className="text-xs font-medium text-slate-700">{field}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Fallback Action (When out of knowledge)</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input 
                      type="radio" 
                      name="fallback" 
                      checked={chatbot.fallbackBehavior === 'human_help'}
                      onChange={() => updateChatbot({ fallbackBehavior: 'human_help' })}
                    />
                    <div>
                      <p className="font-bold text-slate-800">Offer Human Handoff (Recommended)</p>
                      <p className="text-[11px] text-slate-500">Alert on-call dashboard operators and pause AI generation.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input 
                      type="radio" 
                      name="fallback" 
                      checked={chatbot.fallbackBehavior === 'capture_lead'}
                      onChange={() => updateChatbot({ fallbackBehavior: 'capture_lead' })}
                    />
                    <div>
                      <p className="font-bold text-slate-800">Capture Lead Information</p>
                      <p className="text-[11px] text-slate-500">Ask visitor for their email and specific question for follow-up.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CUSTOMIZE WIDGET */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 4: Customize Widget Visuals</h3>
                <p className="text-slate-500 mt-0.5">
                  Ensure the widget matches Northstar Studio branding. Changes reflect live on the right.
                </p>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Primary Theme Color</label>
                <div className="flex items-center gap-2">
                  {['#2563eb', '#10b981', '#0f172a', '#6366f1', '#f59e0b', '#ec4899'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateChatbot({ themeColor: color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        chatbot.themeColor === color ? 'scale-110 border-slate-900 shadow-md' : 'border-white'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="text"
                    value={chatbot.themeColor}
                    onChange={e => updateChatbot({ themeColor: e.target.value })}
                    className="w-24 px-2 py-1.5 text-xs rounded-lg border border-slate-200 font-mono ml-2 uppercase"
                  />
                </div>
              </div>

              {/* Widget Position */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Widget Position on Client Website</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateChatbot({ position: 'bottom-right' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      chatbot.position === 'bottom-right'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    Bottom Right (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateChatbot({ position: 'bottom-left' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                      chatbot.position === 'bottom-left'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    Bottom Left
                  </button>
                </div>
              </div>

              {/* Launcher Style */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Launcher Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pill', 'text-icon', 'icon'] as const).map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => updateChatbot({ launcherStyle: style })}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center capitalize transition-all ${
                        chatbot.launcherStyle === style
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {style === 'pill' ? 'Pill Badge' : style === 'text-icon' ? 'Text + Icon' : 'Circular Icon'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Interactive Mobile Preview */}
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Live Interactive Widget Preview
              </p>
              <CustomerChatWidget embedded={true} />
            </div>
          </div>
        )}

        {/* STEP 5: INSTALL & LAUNCH */}
        {step === 5 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 5: Copy Embed Snippet & Validate Installation</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste this single asynchronous script tag into your website HTML before the closing &lt;/body&gt; tag.
              </p>
            </div>

            {/* Code Snippet Box */}
            <div className="relative bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-hidden shadow-inner border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Embed Snippet</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="text-[11px] text-blue-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {embedSnippet}
              </pre>
            </div>

            {/* Platform Guides */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {['Plain HTML', 'WordPress', 'Shopify', 'Webflow', 'React / Next'].map(p => (
                <div key={p} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700">
                  {p}
                </div>
              ))}
            </div>

            {/* Simulated Handshake Verification */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Verify Website Connection</h4>
                  <p className="text-[11px] text-slate-500">Checking for widget presence on northstarstudio.io</p>
                </div>
                <button
                  onClick={handleCheckInstall}
                  disabled={isCheckingInstall}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  {isCheckingInstall && <span className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
                  <span>{isCheckingInstall ? 'Checking...' : 'Check Installation'}</span>
                </button>
              </div>

              {installSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5 animate-slide-up">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">Your chatbot is live and operating!</p>
                    <p className="text-[11px] text-emerald-700">Visitors can now chat, receive grounded answers, and book appointments.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            {step < 5 ? (
              <>
                <button
                  type="button"
                  onClick={() => setStep(prev => prev + 1)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(prev => Math.min(5, prev + 1));
                    addToast({
                      type: 'info',
                      title: 'Progress Autosaved',
                      description: `Saved Step ${step} configuration.`
                    });
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-colors"
                >
                  <span>Save & Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('home');
                  addToast({
                    type: 'success',
                    title: 'Onboarding Complete! 🎉',
                    description: 'Welcome to your Helio Command Center.'
                  });
                }}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-colors"
              >
                <span>Go to Dashboard</span>
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
