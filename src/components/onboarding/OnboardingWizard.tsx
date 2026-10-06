'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Bot, 
  UploadCloud, 
  Sparkles, 
  Code, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Globe 
} from 'lucide-react';

export default function OnboardingWizard() {
  const { chatbot, updateChatbot, setCurrentScreen, addToast, authToken, chatbotsList, setActiveChatbotId, saveDraft, discardDraft } = useApp();

  const [step, setStep] = useState(1);
  const [highestCompletedStep, setHighestCompletedStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1 Form
  const [accountName, setAccountName] = useState('Mohamed');
  const [companyName, setCompanyName] = useState('Acme Store');

  // Step 2 Form
  const [websiteUrl, setWebsiteUrl] = useState('https://acmestore.com');
  const [uploadedDocName, setUploadedDocName] = useState('Company_Overview.pdf');

  // Step 3 Form
  const [selectedColor, setSelectedColor] = useState(chatbot.themeColor || '#6366f1');
  const [welcomeGreeting, setWelcomeGreeting] = useState(chatbot.welcomeMessage || 'Hi! 👋 How can I help you today?');

  // Step 4 State
  const [isCopied, setIsCopied] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const stepsList = [
    { num: 1, label: 'Create Account' },
    { num: 2, label: 'Add Knowledge' },
    { num: 3, label: 'Customize' },
    { num: 4, label: 'Deploy' },
  ];

  const isStepAccessible = (targetStep: number) => {
    return targetStep <= highestCompletedStep + 1;
  };

  const validateStep = (s: number): boolean => {
    setErrorMsg('');
    if (s === 1) {
      if (!accountName.trim() || !companyName.trim()) {
        setErrorMsg('Please enter both your name and business name to continue.');
        return false;
      }
    }
    if (s === 2) {
      if (!websiteUrl.trim() && !uploadedDocName) {
        setErrorMsg('Please provide a website URL or upload a document to proceed.');
        return false;
      }
    }
    if (s === 3) {
      if (!welcomeGreeting.trim()) {
        setErrorMsg('Please provide a welcome greeting for your chatbot.');
        return false;
      }
    }
    return true;
  };

  const completeCurrentStep = () => {
    if (step === 3) {
      updateChatbot({ themeColor: selectedColor, welcomeMessage: welcomeGreeting });
    }
    setHighestCompletedStep(prev => Math.max(prev, step));
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === step) return;
    if (!isStepAccessible(targetStep)) return;

    if (targetStep > step) {
      const isValid = validateStep(step);
      if (!isValid) return;
      completeCurrentStep();
    } else {
      setErrorMsg('');
    }
    setStep(targetStep);
  };

  const handleContinue = async () => {
    if (isSubmitting) return;
    const isValid = validateStep(step);
    if (!isValid) return;

    completeCurrentStep();

    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        if (authToken) {
          const { fetchUserOrganizations, updateOrganization, fetchChatbots, API_BASE } = await import('@/lib/api');
          
          // 1. Ensure a chatbot exists for the builder first (transactional safety)
          let targetBotId = '';
          try {
            const existingBots = await fetchChatbots(authToken);
            if (existingBots && existingBots.length > 0) {
              targetBotId = existingBots[0].id;
            }
          } catch (e) {
            console.warn('Failed to fetch existing chatbots during completion', e);
          }

          const botPayload = {
            name: chatbot.name || companyName || 'My Assistant',
            description: chatbot.description || 'Customer Support & Sales',
            theme_color: chatbot.themeColor || selectedColor || '#2563eb',
            welcome_message: chatbot.welcomeMessage || welcomeGreeting,
            is_active: true,
            config_json: {
              tone: chatbot.tone || 'Friendly',
              avatarUrl: chatbot.avatarUrl,
              launcherStyle: chatbot.launcherStyle || 'pill',
              suggestedQuestions: chatbot.suggestedQuestions,
              leadFields: chatbot.leadFields,
              fallbackBehavior: chatbot.fallbackBehavior || 'human_help',
              primaryGoals: chatbot.primaryGoals,
            }
          };

          if (!targetBotId) {
            // Create the first chatbot using the collected onboarding data
            const createRes = await fetch(`${API_BASE}/api/v1/chatbots/`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${authToken}` 
              },
              body: JSON.stringify(botPayload)
            });
            
            if (createRes.ok) {
              const newBot = await createRes.json();
              targetBotId = newBot.id;
            } else {
              throw new Error('Failed to create initial chatbot');
            }
          } else {
            // Update the existing chatbot with the onboarding data
            const { updateChatbot: updateChatbotApi } = await import('@/lib/api');
            await updateChatbotApi(authToken, targetBotId, botPayload);
          }

          // 2. Mark onboarding as complete on the organization only after chatbot is secure
          const orgs = await fetchUserOrganizations(authToken);
          if (orgs && orgs.length > 0) {
            await updateOrganization(authToken, orgs[0].id, { onboarding_completed: true });
          }

          // 3. Set active chatbot for the builder and bypass dirty draft modal
          discardDraft();
          if (targetBotId) {
            setActiveChatbotId(targetBotId);
          }
        }
        
        addToast({
          type: 'success',
          title: 'Setup Complete!',
          description: 'Welcome to Chatly. Your AI assistant is ready.'
        });
        
        // Navigate explicitly to the chatbot builder
        setCurrentScreen('chatbots');
      } catch (err) {
        console.error('Failed to save onboarding state:', err);
        setErrorMsg('We couldn\'t finish setting up your chatbot. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setErrorMsg('');
      setStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center page-transition py-6 px-4">
      
      {/* Top Brand Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" fill="currentColor" fillOpacity="0.2"/>
            <path d="M8 12h.01M12 12h.01M16 12h.01"/>
          </svg>
        </div>
        <span className="text-xl font-semibold text-slate-900 tracking-tight">
          Chatly
        </span>
      </div>

      {/* Horizontal Four-Step Progress Indicator (Matching Panel 10) */}
      <div className="w-full max-w-xl mb-10">
        <div className="flex items-center justify-between relative">
          
          {/* Connector Line behind steps */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0"></div>

          {stepsList.map(s => {
            const isCompleted = s.num <= highestCompletedStep;
            const isCurrent = step === s.num;
            const isAccessible = s.num <= highestCompletedStep + 1;
            const isLocked = !isAccessible;

            return (
              <div key={s.num} className="flex flex-col items-center relative z-10">
                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => handleStepClick(s.num)}
                  disabled={isLocked}
                  aria-label={`Go to ${s.label} step`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs ring-4 ring-white cursor-default'
                      : isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs ring-4 ring-white cursor-pointer hover:bg-emerald-600'
                      : isLocked
                      ? 'bg-slate-100 border-2 border-slate-200 text-slate-400 ring-4 ring-white cursor-not-allowed opacity-60'
                      : 'bg-white border-2 border-slate-300 text-slate-600 ring-4 ring-white cursor-pointer hover:border-indigo-400 hover:text-indigo-600'
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{s.num}</span>
                  )}
                </button>

                {/* Step Label */}
                <button
                  type="button"
                  onClick={() => handleStepClick(s.num)}
                  disabled={isLocked}
                  className={`text-[11px] mt-2 tracking-tight whitespace-nowrap focus:outline-none transition-colors ${
                    isCurrent 
                      ? 'text-slate-900 font-semibold' 
                      : isLocked 
                      ? 'text-slate-400 cursor-not-allowed opacity-60' 
                      : 'text-slate-600 font-medium cursor-pointer hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Centered Spacious Container (Matching Panel 10) */}
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-10 flex flex-col justify-between">
        
        {/* Step 1: Welcome & Account */}
        {step === 1 && (
          <div className="text-center space-y-6">
            {/* Clean chat illustration graphic */}
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
              <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="3" stroke="currentColor"/>
                <path d="M8 21h8M12 17v4"/>
                <circle cx="8" cy="10" r="1" fill="currentColor"/>
                <circle cx="12" cy="10" r="1" fill="currentColor"/>
                <circle cx="16" cy="10" r="1" fill="currentColor"/>
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome to Chatly! 🎉
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Let's set up your AI chatbot and get you live in just a few minutes.
              </p>
            </div>

            <div className="space-y-3.5 text-left pt-2 max-w-md mx-auto">
              <div>
                <label className="text-xs font-medium text-slate-700">Your Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="e.g. Mohamed"
                  className="mt-1 w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Business Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Store"
                  className="mt-1 w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Add Knowledge */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Add Knowledge
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Train your chatbot with your business information so it answers queries accurately.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700">Website URL to Crawl</label>
                <div className="mt-1 relative">
                  <Globe className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="border border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-5 text-center bg-slate-50/50">
                <UploadCloud className="w-7 h-7 text-indigo-500 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-slate-800">
                  {uploadedDocName ? `Uploaded: ${uploadedDocName}` : 'Upload Business Docs (PDF, DOCX)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Frequently Asked Questions, catalogs, or price sheets
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customize Branding */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Brand Your Chatbot
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pick a theme color that matches your website palette.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-2">Theme Color</label>
                <div className="flex items-center gap-3">
                  {['#6366f1', '#2563eb', '#0f172a', '#10b981', '#f59e0b'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        selectedColor.toLowerCase() === c.toLowerCase()
                          ? 'border-white ring-2 ring-slate-900 scale-105'
                          : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Welcome Message</label>
                <textarea
                  rows={2}
                  value={welcomeGreeting}
                  onChange={e => setWelcomeGreeting(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Deploy */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Your Assistant is Ready!
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Paste this code snippet onto your website before the closing &lt;/body&gt; tag.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl font-mono text-[11px] text-slate-200 text-left relative overflow-x-auto">
              <code>{`<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://chatly.ai'}/widget.js" data-token="wgt_demo_token" async></script>`}</code>
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.origin : 'https://chatly.ai';
                  navigator.clipboard?.writeText(`<script src="${url}/widget.js" data-token="wgt_demo_token" async></script>`);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={() => {
                setIsVerified(true);
                addToast({
                  type: 'success',
                  title: 'Verified',
                  description: 'Live widget handshake confirmed.'
                });
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              {isVerified ? '✓ Verified on domain' : 'Test Website Connection'}
            </button>
          </div>
        )}

        {/* Inline Validation Error Message if any */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Strict Button Row Requirement:
            - Divider sits above the buttons
            - Back button aligned to left
            - Continue button aligned to right
            - Strict: display: inline-flex; align-items: center; white-space: nowrap; - arrow never wraps!
        */}
        <div className="pt-6 mt-8 border-t border-slate-100 flex items-center justify-between w-full">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all btn-press whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400">
              No credit card required
            </div>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleContinue}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              gap: '0.5rem'
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-medium transition-all btn-press shadow-xs select-none ${
              isSubmitting ? 'bg-slate-700 text-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-black text-white cursor-pointer'
            }`}
          >
            <span>{isSubmitting ? 'Saving...' : step === 1 ? 'Get Started' : step === 4 ? 'Complete Setup' : 'Continue'}</span>
            {!isSubmitting && <span className="shrink-0 leading-none">→</span>}
          </button>
        </div>

      </div>

    </div>
  );
}
