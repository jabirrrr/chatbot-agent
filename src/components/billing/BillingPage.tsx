'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Check, 
  CreditCard, 
  Download, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  Building2
} from 'lucide-react';

export default function BillingPage() {
  const { addToast } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<'Starter' | 'Growth' | 'Business'>('Growth');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      target: 'For small businesses',
      monthlyPrice: '₹999',
      yearlyPrice: '₹799',
      features: [
        '1,000 conversations',
        'Basic features',
        'Email support'
      ],
      ctaText: 'Get Started',
      isPopular: false
    },
    {
      id: 'growth',
      name: 'Growth',
      target: 'For growing businesses',
      monthlyPrice: '₹2,499',
      yearlyPrice: '₹1,999',
      features: [
        '5,000 conversations',
        'Integrations (CRM, Calendar)',
        'Advanced analytics',
        'Priority support'
      ],
      ctaText: 'Start Free Trial',
      isPopular: true
    },
    {
      id: 'business',
      name: 'Business',
      target: 'For high volume',
      monthlyPrice: '₹4,999',
      yearlyPrice: '₹3,999',
      features: [
        '20,000 conversations',
        'Custom integrations',
        'Dedicated support',
        'SLA'
      ],
      ctaText: 'Contact Sales',
      isPopular: false
    }
  ];

  const invoices = [
    { id: 'INV-2025-001', date: 'Sep 01, 2025', amount: '₹2,499.00', status: 'Paid', plan: 'Growth' },
    { id: 'INV-2025-002', date: 'Aug 01, 2025', amount: '₹2,499.00', status: 'Paid', plan: 'Growth' },
    { id: 'INV-2025-003', date: 'Jul 01, 2025', amount: '₹2,499.00', status: 'Paid', plan: 'Growth' },
  ];

  const handleSelectPlan = (planName: 'Starter' | 'Growth' | 'Business') => {
    setCurrentPlan(planName);
    addToast({
      type: 'success',
      title: 'Plan Updated',
      description: `Your account has been switched to ${planName}.`
    });
  };

  return (
    <div className="space-y-10 page-transition pb-16 max-w-6xl mx-auto">
      
      {/* Header & Billing Toggle (Matches Panel 9) */}
      <div className="text-center space-y-4 pt-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Upgrade Your Plan
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Choose the plan that fits your business.
        </p>

        {/* Monthly / Yearly Toggle with Save 20% pill */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-full border border-slate-200/80">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>

          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Yearly</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* 3 Pricing Cards Grid (Matching Panel 9) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map(p => {
          const isSelected = currentPlan === p.name;
          const displayPrice = billingCycle === 'monthly' ? p.monthlyPrice : p.yearlyPrice;

          return (
            <div
              key={p.id}
              className={`bg-white p-7 rounded-2xl border transition-all flex flex-col justify-between relative ${
                p.isPopular
                  ? 'border-indigo-600 shadow-md ring-1 ring-indigo-600'
                  : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
              }`}
            >
              {/* Most Popular Badge */}
              {p.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-semibold px-3 py-0.5 rounded-full shadow-xs">
                  Most Popular
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{p.target}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">
                    {displayPrice}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/month</span>
                </div>

                {/* Features list with checkmarks */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <button
                  onClick={() => handleSelectPlan(p.name as any)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all btn-press shadow-2xs ${
                    p.isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                  }`}
                >
                  {isSelected ? 'Current Plan' : p.ctaText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Usage & Invoices Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Usage Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Current Usage ({currentPlan})</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Conversations This Month</span>
                <span className="font-semibold text-slate-900">1,248 / 5,000</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[25%] h-full bg-indigo-600 rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Knowledge Base Sources</span>
                <span className="font-semibold text-slate-900">5 / Unlimited</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[10%] h-full bg-emerald-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Next renewal date: <strong className="text-slate-700">October 1, 2025</strong>. Card ending in •••• 4242.
          </p>
        </div>

        {/* Invoice History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Invoice History</h3>
            <span className="text-xs text-slate-400">Past 3 months</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {invoices.map(inv => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{inv.id}</p>
                  <p className="text-[11px] text-slate-400">{inv.date} · {inv.plan}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900">{inv.amount}</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {inv.status}
                  </span>
                  <button 
                    onClick={() => addToast({ type: 'info', title: 'Downloading', description: `Downloading receipt for ${inv.id}` })}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    title="Download Receipt"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Links */}
      <div className="pt-8 border-t border-slate-100 flex items-center justify-center gap-6 text-sm text-slate-500">
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">Terms of Service</a>
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
      </div>
    </div>
  );
}
