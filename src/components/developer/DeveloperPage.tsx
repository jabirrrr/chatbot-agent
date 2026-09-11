'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { mockApiKeys, initialWebhookConfig } from '@/data/mockData';
import { 
  Code2, 
  Copy, 
  Check, 
  Key, 
  Webhook, 
  Globe, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function DeveloperPage() {
  const { addToast } = useApp();

  const [isCopied, setIsCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'html' | 'react' | 'wordpress' | 'shopify' | 'webflow'>('html');
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookConfig.url);
  const [domains, setDomains] = useState(['northstarstudio.io', 'portal.northstarstudio.io']);
  const [newDomain, setNewDomain] = useState('');

  const snippet = `<script
  src="https://cdn.helio.ai/v1/widget.js"
  data-token="wgt_live_9a8b7c6d5e4f3a2b1c"
  async
></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setIsCopied(true);
    addToast({
      type: 'success',
      title: 'Snippet Copied',
      description: 'Ready to paste into your website template.'
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    setDomains([...domains, newDomain.trim()]);
    setNewDomain('');
    addToast({
      type: 'success',
      title: 'Domain Whitelisted',
      description: `Allowed widget execution on "${newDomain.trim()}".`
    });
  };

  const handleRemoveDomain = (d: string) => {
    setDomains(domains.filter(x => x !== d));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Developer & Integrations Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Embed snippets, API keys, HMAC-signed outbound webhooks, and domain security allowlists.
          </p>
        </div>

        <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 w-fit">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>API v1.0 Operational</span>
        </span>
      </div>

      {/* Widget Snippet Block */}
      <div className="bg-slate-950 text-slate-200 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">JavaScript Embed Code</h3>
            <p className="text-xs text-slate-400 mt-0.5">Embeds the isolated &lt;40KB Shadow DOM widget on any website.</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-blue-300 overflow-x-auto leading-relaxed border border-slate-800">
          {snippet}
        </pre>
      </div>

      {/* Platform Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900">CMS & Framework Installation Guides</h3>
        
        <div className="flex gap-2 border-b border-slate-100 pb-2">
          {(['html', 'react', 'wordpress', 'shopify', 'webflow'] as const).map(p => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-colors ${
                activePlatform === p ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
          {activePlatform === 'html' && (
            <p>Paste the snippet before the closing &lt;/body&gt; tag in your HTML template.</p>
          )}
          {activePlatform === 'react' && (
            <p>Load the script dynamically inside a `useEffect` hook or using Next.js `&lt;Script strategy="afterInteractive" /&gt;`.</p>
          )}
          {activePlatform === 'wordpress' && (
            <p>Install via the "Insert Headers and Footers" plugin, or paste directly into your active theme's footer.php.</p>
          )}
          {activePlatform === 'shopify' && (
            <p>Navigate to Online Store $\rightarrow$ Themes $\rightarrow$ Edit Code $\rightarrow$ `theme.liquid` and paste before &lt;/body&gt;.</p>
          )}
          {activePlatform === 'webflow' && (
            <p>Go to Project Settings $\rightarrow$ Custom Code $\rightarrow$ Footer Code and paste the script snippet.</p>
          )}
        </div>
      </div>

      {/* Domain Allowlist & API Keys Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Allowlist */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Authorized Domain Whitelist</h3>
            <p className="text-slate-500 mt-0.5">Prevents unauthorized embedding on third-party origins.</p>
          </div>

          <div className="space-y-2">
            {domains.map(d => (
              <div key={d} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono">
                <span className="text-slate-800">{d}</span>
                <button onClick={() => handleRemoveDomain(d)} className="text-slate-400 hover:text-rose-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. app.mybusiness.com"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs"
            />
            <button
              onClick={handleAddDomain}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
            >
              Add Domain
            </button>
          </div>
        </div>

        {/* Webhook Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Outbound Webhooks (HMAC-SHA256)</h3>
            <p className="text-slate-500 mt-0.5">Real-time JSON event dispatch to your CRM or internal backend.</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Webhook Target URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-slate-700 block">Subscribed Events</span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>lead.created</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>appointment.booked</span>
              </label>
            </div>
          </div>

          <button
            onClick={() => {
              addToast({
                type: 'success',
                title: 'Test Webhook Dispatched',
                description: 'Sent test ping payload with valid X-Signature-SHA256 header (HTTP 200 OK).'
              });
            }}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
          >
            Test Webhook Ping
          </button>
        </div>
      </div>
    </div>
  );
}
