'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Badge from '@/components/common/Badge';
import { 
  CreditCard, 
  Check, 
  Download, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  Building2
} from 'lucide-react';

export default function BillingPage() {
  const { addToast } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'pro'>('pro');

  const plans = [
    {
      id: 'free',
      name: 'Free Forever',
      price: '$0',
      period: 'no credit card required',
      features: [
        '1 Chatbot instance',
        '100 conversations / month',
        '5 Document sources (max 10MB)',
        'Standard Email lead capture',
        'Helio brand badge on widget'
      ],
      current: false
    },
    {
      id: 'starter',
      name: 'Growth Starter',
      price: '$49',
      period: 'per month, billed annually',
      features: [
        '3 Chatbot instances',
        '1,500 conversations / month',
        '25 Document sources + Web crawler',
        'Google Calendar OAuth booking',
        'White-label widget (remove brand)',
        'Standard webhooks'
      ],
      current: false
    },
    {
      id: 'pro',
      name: 'Professional Agency',
      price: '$149',
      period: 'per month, billed annually',
      features: [
        'Unlimited Chatbot instances',
        '10,000 conversations / month',
        'Unlimited Knowledge sources',
        'Real-time human agent handoff',
        'OpenRouter multi-model tiering',
        'HMAC outbound webhooks & REST API',
        'Dedicated Slack support channel'
      ],
      current: true
    }
  ];

  const invoices = [
    { id: 'INV-2026-09', date: 'Sep 01, 2026', amount: '$149.00', status: 'Paid', plan: 'Professional Agency' },
    { id: 'INV-2026-08', date: 'Aug 01, 2026', amount: '$149.00', status: 'Paid', plan: 'Professional Agency' },
    { id: 'INV-2026-07', date: 'Jul 01, 2026', amount: '$149.00', status: 'Paid', plan: 'Professional Agency' },
  ];

  const handleUpgrade = (planName: string) => {
    addToast({
      type: 'success',
      title: 'Stripe Portal Connected',
      description: `Simulated subscription checkout for ${planName}. Plan updated.`
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Subscription & Billing Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization plan tiers, review Stripe usage meters, and download past invoices.
          </p>
        </div>

        <button
          onClick={() => {
            addToast({
              type: 'info',
              title: 'Stripe Customer Portal',
              description: 'Redirecting to secure Stripe billing management portal...'
            });
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors w-fit"
        >
          <span>Stripe Billing Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Usage Progress Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Conversations</span>
          <p className="text-2xl font-black text-slate-900">1,248 <span className="text-xs font-normal text-slate-400">/ 10,000</span></p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '12.48%' }} />
          </div>
          <p className="text-[10px] text-slate-400">Resets in 19 days</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">AI Token Budget</span>
          <p className="text-2xl font-black text-slate-900">$42.18 <span className="text-xs font-normal text-slate-400">/ $150.00</span></p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '28.1%' }} />
          </div>
          <p className="text-[10px] text-slate-400">28.1% of budget consumed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Chatbot Instances</span>
          <p className="text-2xl font-black text-slate-900">2 <span className="text-xs font-normal text-slate-400">/ Unlimited</span></p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: '10%' }} />
          </div>
          <p className="text-[10px] text-slate-400">Pro tier includes unlimited bots</p>
        </div>
      </div>

      {/* Subscription Plans Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
              plan.current
                ? 'bg-white border-blue-600 ring-2 ring-blue-600/10 shadow-lg'
                : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                {plan.current && (
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                    CURRENT PLAN
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                <span className="text-xs text-slate-400">/mo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{plan.period}</p>

              <div className="space-y-2.5 mt-6 pt-6 border-t border-slate-100 text-xs">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleUpgrade(plan.name)}
              className={`mt-8 w-full py-2.5 rounded-xl font-bold text-xs transition-colors ${
                plan.current
                  ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              {plan.current ? 'Manage Plan' : 'Upgrade to ' + plan.name}
            </button>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">Billing History & Invoices</h3>
          <span className="text-[11px] text-slate-400">Payment method: Visa ending in 4242</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.id}</td>
                  <td className="py-3 px-4">{inv.date}</td>
                  <td className="py-3 px-4">{inv.plan}</td>
                  <td className="py-3 px-4 font-mono font-bold">{inv.amount}</td>
                  <td className="py-3 px-4">
                    <Badge variant="emerald">PAID</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        addToast({
                          type: 'info',
                          title: 'Downloading Invoice',
                          description: `Saved ${inv.id}.pdf to downloads.`
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 ml-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
