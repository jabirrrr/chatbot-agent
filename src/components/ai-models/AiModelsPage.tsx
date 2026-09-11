'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Badge from '@/components/common/Badge';
import { mockAIModelLogs } from '@/data/mockData';
import { 
  Cpu, 
  Layers, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function AiModelsPage() {
  const { chatbot, updateChatbot, addToast } = useApp();

  const [defaultModel, setDefaultModel] = useState('openai/gpt-4o-mini');
  const [complexModel, setComplexModel] = useState('anthropic/claude-3.5-sonnet');
  const [fallbackModel, setFallbackModel] = useState('meta-llama/llama-3.1-8b-instruct');
  const [monthlyBudget, setMonthlyBudget] = useState(150);
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [hardLimitBehavior, setHardLimitBehavior] = useState<'lead_capture_only' | 'pause_bot'>('lead_capture_only');

  const providers = [
    {
      name: 'OpenRouter',
      role: 'Primary Multi-Model Gateway',
      status: 'connected',
      models: ['gpt-4o-mini', 'claude-3.5-sonnet', 'llama-3.1-8b'],
      ping: '142ms'
    },
    {
      name: 'Direct OpenAI SDK',
      role: 'Embeddings & Direct Fallback',
      status: 'connected',
      models: ['text-embedding-3-small', 'gpt-4o'],
      ping: '185ms'
    },
    {
      name: 'Direct Anthropic SDK',
      role: 'Secondary Failover Route',
      status: 'connected',
      models: ['claude-3.5-haiku'],
      ping: '210ms'
    }
  ];

  const handleSaveRouting = () => {
    addToast({
      type: 'success',
      title: 'Routing Rules Applied',
      description: `Default routing set to ${defaultModel} with automated failover.`
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">AI Model Routing & Cost Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage provider gateways, define intelligent multi-tier routing rules, and enforce monthly token budget caps.
          </p>
        </div>

        <button
          onClick={handleSaveRouting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors w-fit"
        >
          Save Routing Rules
        </button>
      </div>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map(p => (
          <div key={p.name} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                  <p className="text-[10px] text-slate-400">{p.role}</p>
                </div>
              </div>
              <Badge variant="emerald">ACTIVE</Badge>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Gateway Latency:</span>
              <span className="font-mono font-bold text-slate-700">{p.ping}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Model Tiering & Cost Guardrails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tiering Rules */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Dynamic Tiering Rules</h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Standard Inquiries & FAQs (Fast & Low Cost)</label>
            <select
              value={defaultModel}
              onChange={e => setDefaultModel(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs cursor-pointer"
            >
              <option value="openai/gpt-4o-mini">openai/gpt-4o-mini ($0.15 / 1M tokens)</option>
              <option value="meta-llama/llama-3.1-8b-instruct">meta-llama/llama-3.1-8b-instruct ($0.05 / 1M tokens)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Complex Discovery & Calendar Negotiation (High Fidelity)</label>
            <select
              value={complexModel}
              onChange={e => setComplexModel(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs cursor-pointer"
            >
              <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet ($3.00 / 1M tokens)</option>
              <option value="openai/gpt-4o">openai/gpt-4o ($2.50 / 1M tokens)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Automated Fallback Model (If Gateway Degrades)</label>
            <select
              value={fallbackModel}
              onChange={e => setFallbackModel(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs cursor-pointer"
            >
              <option value="meta-llama/llama-3.1-8b-instruct">meta-llama/llama-3.1-8b-instruct</option>
              <option value="openai/gpt-4o-mini">openai/gpt-4o-mini</option>
            </select>
          </div>
        </div>

        {/* Cost Guardrails */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Budget Quotas & Hard Cutoffs</h3>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Monthly Organization Budget</span>
              <span className="font-bold text-slate-900">${monthlyBudget}.00 USD</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={monthlyBudget}
              onChange={e => setMonthlyBudget(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Early Warning Email Threshold</span>
              <span className="font-bold text-amber-700">{warningThreshold}% of budget</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={warningThreshold}
              onChange={e => setWarningThreshold(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Behavior when 100% of budget is reached</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="hardlimit"
                  checked={hardLimitBehavior === 'lead_capture_only'}
                  onChange={() => setHardLimitBehavior('lead_capture_only')}
                />
                <div>
                  <p className="font-bold text-slate-800">Graceful Lead Capture Fallback (Recommended)</p>
                  <p className="text-[11px] text-slate-500">Widget pauses AI generation and prompts visitor to leave contact details.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Usage Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Real-Time LLM Transaction Logs</h3>
            <p className="text-[11px] text-slate-400">Tokens, latency, and cost per conversational turn</p>
          </div>
          <span className="text-[10px] text-slate-400">Auto-refreshing stream</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Chatbot</th>
                <th className="py-3 px-4">Model Used</th>
                <th className="py-3 px-4">Tokens</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 text-right">Turn Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {mockAIModelLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{log.chatbot}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{log.model}</td>
                  <td className="py-3 px-4 font-mono">{log.tokens}</td>
                  <td className="py-3 px-4 font-mono text-emerald-700">{log.latencyMs}ms</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${log.cost.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
