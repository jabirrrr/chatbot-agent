'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Check, 
  Copy, 
  CheckCircle2, 
  Globe, 
  ExternalLink, 
  Sparkles, 
  RotateCw, 
  Code, 
  Layers, 
  ShieldCheck, 
  Monitor 
} from 'lucide-react';

export default function DeploymentPage() {
  const { chatbot, addToast } = useApp();
  const [activeMethod, setActiveMethod] = useState<'JavaScript' | 'WordPress' | 'Shopify' | 'Webflow' | 'Squarespace'>('JavaScript');
  const [isCopied, setIsCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

  const embedScript = `<!-- Chatly AI Live Widget Snippet -->
<script
  src="https://cdn.chatly.ai/widget.js"
  data-chatly-id="${chatbot.id || 'bot_01'}"
  data-theme-color="${chatbot.themeColor || '#4f46e5'}"
  async
></script>`;

  const handleCopy = (codeText: string) => {
    navigator.clipboard?.writeText(codeText);
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
        description: `Successfully detected active Chatly handshake on ${chatbot.domain || 'your domain'}.`
      });
    }, 1200);
  };

  return (
    <div className="space-y-8 page-transition pb-16 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Deployment
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Install Chatly on your website using any platform in under 2 minutes.
        </p>
      </div>

      {/* Live Status Hero Banner (Prompt: "Show: Your assistant is live") */}
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
              Serving visitors on <span className="font-medium text-slate-700">{chatbot.domain || 'northstarstudio.io'}</span>
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
          {(['JavaScript', 'WordPress', 'Shopify', 'Webflow', 'Squarespace'] as const).map(m => (
            <button
              key={m}
              onClick={() => setActiveMethod(m)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeMethod === m
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-2xs'
                  : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Content for Selected Method */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
        
        {activeMethod === 'JavaScript' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900">HTML Embed Script</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Copy and paste this script tag right before the closing <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">&lt;/body&gt;</code> tag on every page you want the chatbot to appear.
              </p>
            </div>

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
        )}

        {activeMethod === 'WordPress' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900">WordPress Installation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                You can insert Chatly into your WordPress theme without editing PHP templates.
              </p>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
              <li>In your WordPress Admin dashboard, navigate to <strong className="text-slate-800">Plugins → Add New</strong>.</li>
              <li>Search for and install the free <strong className="text-slate-800">Insert Headers and Footers</strong> (WPCode) plugin.</li>
              <li>Go to <strong className="text-slate-800">Code Snippets → Header & Footer</strong>.</li>
              <li>Paste the script below into the <strong className="text-slate-800">Footer</strong> textarea and click <strong className="text-slate-800">Save Changes</strong>.</li>
            </ol>

            <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-200 relative overflow-x-auto">
              <pre className="leading-relaxed"><code>{embedScript}</code></pre>
              <button
                onClick={() => handleCopy(embedScript)}
                className="absolute right-3 top-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors flex items-center gap-1.5"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {activeMethod === 'Shopify' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900">Shopify Store Setup</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add Chatly to your Shopify theme so it loads for all store shoppers across mobile and desktop.
              </p>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
              <li>From your Shopify Admin, go to <strong className="text-slate-800">Online Store → Themes</strong>.</li>
              <li>Click the three dots next to your active theme and choose <strong className="text-slate-800">Edit code</strong>.</li>
              <li>Under the <strong className="text-slate-800">Layout</strong> folder, click <strong className="text-slate-800">theme.liquid</strong>.</li>
              <li>Scroll down to the bottom of the file and paste the snippet directly above <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">&lt;/body&gt;</code>.</li>
              <li>Click <strong className="text-slate-800">Save</strong>.</li>
            </ol>

            <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-200 relative overflow-x-auto">
              <pre className="leading-relaxed"><code>{embedScript}</code></pre>
              <button
                onClick={() => handleCopy(embedScript)}
                className="absolute right-3 top-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors flex items-center gap-1.5"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {activeMethod === 'Webflow' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900">Webflow Project Setup</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Deploy across your Webflow published domain via custom code settings.
              </p>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
              <li>Open your project in the <strong className="text-slate-800">Webflow Designer</strong> or Dashboard.</li>
              <li>Navigate to <strong className="text-slate-800">Site Settings → Custom Code</strong>.</li>
              <li>Paste the snippet into the <strong className="text-slate-800">Footer Code</strong> box.</li>
              <li>Click <strong className="text-slate-800">Save Changes</strong> and publish your site.</li>
            </ol>

            <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-200 relative overflow-x-auto">
              <pre className="leading-relaxed"><code>{embedScript}</code></pre>
              <button
                onClick={() => handleCopy(embedScript)}
                className="absolute right-3 top-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors flex items-center gap-1.5"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {activeMethod === 'Squarespace' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900">Squarespace Code Injection</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inject the script globally into your Squarespace website footer.
              </p>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
              <li>Log in to Squarespace and select your website.</li>
              <li>Go to <strong className="text-slate-800">Settings → Advanced → Code Injection</strong>.</li>
              <li>In the <strong className="text-slate-800">Footer</strong> field, paste the code snippet.</li>
              <li>Click <strong className="text-slate-800">Save</strong>.</li>
            </ol>

            <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-200 relative overflow-x-auto">
              <pre className="leading-relaxed"><code>{embedScript}</code></pre>
              <button
                onClick={() => handleCopy(embedScript)}
                className="absolute right-3 top-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors flex items-center gap-1.5"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
