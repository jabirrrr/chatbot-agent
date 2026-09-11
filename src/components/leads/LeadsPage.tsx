'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Lead } from '@/types';
import { 
  Users, 
  Search, 
  Download, 
  Plus, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles
} from 'lucide-react';

interface CrmLead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Disqualified';
  source: string;
  created: string;
  phone?: string;
  notes?: string;
  score: number;
}

const initialCrmLeads: CrmLead[] = [
  {
    id: 'lead_1',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    company: 'Apex Retailers',
    status: 'Qualified',
    source: 'Website Chatbot',
    created: 'Today at 10:14 AM',
    phone: '+91 98765 43210',
    notes: 'Inquired about Growth plan with 5,000 monthly conversations.',
    score: 92
  },
  {
    id: 'lead_2',
    name: 'Arjun Kumar',
    email: 'arjun.kumar@fintech.io',
    company: 'Nova Pay',
    status: 'New',
    source: 'Landing Demo',
    created: 'Today at 9:45 AM',
    phone: '+91 98220 11223',
    notes: 'Scheduled live product walkthrough with sales team.',
    score: 88
  },
  {
    id: 'lead_3',
    name: 'Sneha Patel',
    email: 'sneha@cloudscale.com',
    company: 'CloudScale Tech',
    status: 'Contacted',
    source: 'Website Chatbot',
    created: 'Yesterday',
    phone: '+91 97110 55443',
    notes: 'Requested integration specifications for HubSpot and Slack.',
    score: 84
  },
  {
    id: 'lead_4',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@techcorp.in',
    company: 'TechCorp India',
    status: 'Converted',
    source: 'Website Chatbot',
    created: 'Sep 5, 2025',
    phone: '+91 98450 77889',
    notes: 'Subscribed to Growth Annual plan.',
    score: 96
  },
  {
    id: 'lead_5',
    name: 'Vikram Singh',
    email: 'vikram.singh@retailhub.com',
    company: 'RetailHub',
    status: 'Contacted',
    source: 'Product Page',
    created: 'Sep 4, 2025',
    phone: '+91 99230 44556',
    notes: 'Exploring custom language model routing in Hindi and English.',
    score: 75
  },
  {
    id: 'lead_6',
    name: 'Ananya Iyer',
    email: 'ananya@growthlabs.io',
    company: 'GrowthLabs Agency',
    status: 'Disqualified',
    source: 'Website Chatbot',
    created: 'Sep 2, 2025',
    phone: '+91 98880 12345',
    notes: 'Looking for free open-source self-hosted code.',
    score: 40
  }
];

export default function LeadsPage() {
  const { addToast } = useApp();
  const [leadsList, setLeadsList] = useState<CrmLead[]>(initialCrmLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);

  const filteredLeads = leadsList.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleExportCsv = () => {
    const headers = 'Name,Email,Company,Status,Source,Created,Phone,Score\n';
    const rows = filteredLeads.map(l => 
      `"${l.name}","${l.email}","${l.company}","${l.status}","${l.source}","${l.created}","${l.phone || ''}",${l.score}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatly-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    addToast({
      type: 'success',
      title: 'CSV Exported',
      description: `Exported ${filteredLeads.length} leads to CSV.`
    });
  };

  const getStatusBadge = (status: CrmLead['status']) => {
    switch (status) {
      case 'New':
        return <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">New</span>;
      case 'Contacted':
        return <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">Contacted</span>;
      case 'Qualified':
        return <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Qualified</span>;
      case 'Converted':
        return <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Converted</span>;
      case 'Disqualified':
        return <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">Disqualified</span>;
    }
  };

  return (
    <div className="space-y-6 page-transition pb-12">
      {/* Header (Matches Prompt Requirements) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Leads
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and qualify prospective customers captured by your assistant.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all shadow-2xs btn-press"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, email, or company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-white border border-slate-200/90 p-1 rounded-xl text-xs font-medium text-slate-600 shadow-2xs overflow-x-auto">
          {(['all', 'New', 'Contacted', 'Qualified', 'Converted', 'Disqualified'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                statusFilter.toLowerCase() === s.toLowerCase()
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* CRM Table (Name, Email, Company, Status, Source, Created) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLeads.map(lead => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-medium text-xs">
                      {lead.name.charAt(0)}
                    </div>
                    <span>{lead.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{lead.email}</td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium">{lead.company}</td>
                  <td className="py-3.5 px-4">{getStatusBadge(lead.status)}</td>
                  <td className="py-3.5 px-4 text-slate-500">{lead.source}</td>
                  <td className="py-3.5 px-4 text-slate-400">{lead.created}</td>
                </tr>
              ))}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No leads found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Polished Detail Drawer (Opens on clicking lead) */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-2xs animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto page-transition border-l border-slate-200">
            
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Lead Details</h3>
                    <p className="text-[11px] text-slate-400">Captured via {selectedLead.source}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lead Profile */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">{selectedLead.name}</span>
                  {getStatusBadge(selectedLead.status)}
                </div>
                <div className="text-xs space-y-1.5 text-slate-600">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedLead.email}</span>
                  </p>
                  {selectedLead.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedLead.phone}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedLead.company}</span>
                  </p>
                </div>
              </div>

              {/* Lead Score & Qualification */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider text-[10px] text-slate-400">
                  Intent & AI Notes
                </h4>
                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedLead.notes || 'No extra notes recorded.'}
                </p>
              </div>

              {/* Update Status Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900">Update Lead Status</label>
                <select
                  value={selectedLead.status}
                  onChange={e => {
                    const newSt = e.target.value as any;
                    setSelectedLead({ ...selectedLead, status: newSt });
                    setLeadsList(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: newSt } : l));
                    addToast({
                      type: 'success',
                      title: 'Status Updated',
                      description: `Updated status for ${selectedLead.name} to ${newSt}.`
                    });
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Disqualified">Disqualified</option>
                </select>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.open(`mailto:${selectedLead.email}?subject=Follow up from Chatly`);
                }}
                className="px-4 py-2 text-xs font-medium bg-slate-900 hover:bg-black text-white rounded-xl shadow-xs transition-all btn-press"
              >
                Send Email →
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
