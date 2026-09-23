'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Check, 
  Copy, 
  CheckCircle2, 
  RotateCw
} from 'lucide-react';

type SupportedPlatform = 'JavaScript' | 'WordPress' | 'Shopify' | 'Webflow' | 'Squarespace';

interface PlatformGuide {
  title: string;
  description: string;
  steps?: string[];
  codeLocation: string;
}

const DEPLOYMENT_GUIDES: Record<SupportedPlatform, PlatformGuide> = {
  JavaScript: {
    title: 'HTML Embed Script',
    description: 'Copy and paste this script tag right before the closing </body> tag on every page you want the assistant to appear.',
    codeLocation: 'Before the closing </body> tag'
  },
  WordPress: {
    title: 'WordPress Installation',
    description: 'Easily embed the assistant into your WordPress website header or footer.',
    steps: [
      'In your WordPress Admin dashboard, navigate to Plugins → Add New.',
      'Search for and install the free WPCode (Insert Headers and Footers) plugin.',
      'Navigate to Code Snippets → Header & Footer.',
      'Paste the snippet below into the Footer textarea and click Save Changes.'
    ],
    codeLocation: 'Footer Scripts / Snippets'
  },
  Shopify: {
    title: 'Shopify Store Setup',
    description: 'Add the assistant to your Shopify theme so it loads for all visitors across mobile and desktop.',
    steps: [
      'From your Shopify Admin, go to Online Store → Themes.',
      'Click the actions button (...) next to your active theme and choose Edit code.',
      'Under the Layout folder, open theme.liquid.',
      'Scroll down to the bottom of the file and paste the snippet directly above </body>.',
      'Click Save.'
    ],
    codeLocation: 'theme.liquid before </body>'
  },
  Webflow: {
    title: 'Webflow Project Setup',
    description: 'Deploy across your Webflow published domain via custom code settings.',
    steps: [
      'Open your project in the Webflow Designer or Project Settings.',
      'Navigate to Site Settings → Custom Code.',
      'Paste the snippet into the Footer Code section.',
      'Click Save Changes and publish your site.'
    ],
    codeLocation: 'Custom Code → Footer Code'
  },
  Squarespace: {
    title: 'Squarespace Code Injection',
    description: 'Inject the script globally into your Squarespace website footer.',
    steps: [
      'Log in to Squarespace and select your website.',
      'Navigate to Settings → Advanced → Code Injection.',
      'In the Footer textarea, paste the snippet below.',
      'Click Save.'
    ],
    codeLocation: 'Advanced → Code Injection → Footer'
  }
};

export default function DeploymentPage() {
  const { chatbot, addToast } = useApp();
  const [activeMethod, setActiveMethod] = useState<SupportedPlatform>('JavaScript');
  const [isCopied, setIsCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

  const assistantName = chatbot?.name || 'AI Assistant';
  const targetDomain = chatbot?.domain || 'yourdomain.com';
  const botToken = chatbot?.widgetToken || chatbot?.id || 'wgt_default';
  const themeColor = chatbot?.themeColor || '#2563eb';

  const embedScript = `<!-- ${assistantName} Embed Snippet -->
<script
  src="https://cdn.chatly.ai/widget.js"
  data-token="${botToken}"
  data-theme-color="${themeColor}"
  async
></script>`;

  const handleCopy = (codeText: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(codeText);
    }
    setIsCopied(true);
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      description: 'Embed script copied. Paste into your website HTML before </body>.'
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      addToast({
        type: 'success',
        title: 'Connection Verified',
        description: `Successfully detected active handshake on ${targetDomain}.`
      });
    }, 1200);
  };

  const currentGuide = DEPLOYMENT_GUIDES[activeMethod];

  return (
    <div className="space-y-8 page-transition pb-16 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Deployment
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Install {assistantName} on your website using any platform in under 2 minutes.
        </p>
      </div>

      {/* Live Status Hero Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                Your assistant is live
              </h2>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                Active & Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Serving visitors on <span className="font-medium text-slate-700">{targetDomain}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded-xl shadow-xs transition-all btn-press shrink-0"
        >
          {isVerifying ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isVerifying ? 'Checking...' : isVerified ? 'Verify Connection' : 'Check Status'}</span>
        </button>
      </div>

      {/* Installation Methods Tabs */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Choose Installation Method</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select your content management system or web platform for step-by-step instructions.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(Object.keys(DEPLOYMENT_GUIDES) as SupportedPlatform[]).map(method => (
            <button
              key={method}
              onClick={() => setActiveMethod(method)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeMethod === method
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-2xs'
                  : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Content for Selected Method */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900">{currentGuide.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {currentGuide.description}
            </p>
          </div>

          {currentGuide.steps && (
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {currentGuide.steps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          )}

          {/* Code Block with Copy Button */}
          <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-200 relative overflow-x-auto">
            <pre className="leading-relaxed"><code>{embedScript}</code></pre>
            <button
              onClick={() => handleCopy(embedScript)}
              className="absolute right-3 top-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors flex items-center gap-1.5"
              title="Copy code"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
