'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Badge from '@/components/common/Badge';
import { Lead, LeadStatus } from '@/types';
import { 
  Users, 
  Kanban, 
  Table, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ExternalLink, 
  UserCheck, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X,
  MessageSquare
} from 'lucide-react';

export default function LeadsPage() {
  const { leads, updateLeadStatus, updateLeadNotes, assignLeadAgent, setCurrentScreen, addToast } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const pipelineStages: { id: LeadStatus; label: string; color: string }[] = [
    { id: 'new', label: 'New Inquiries', color: 'border-blue-400' },
    { id: 'qualified', label: 'Qualified', color: 'border-emerald-400' },
    { id: 'contacted', label: 'Contacted', color: 'border-purple-400' },
    { id: 'booked', label: 'Meeting Booked', color: 'border-amber-400' },
    { id: 'won', label: 'Closed Won', color: 'border-emerald-600' },
    { id: 'lost', label: 'Closed Lost', color: 'border-slate-400' },
  ];

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCsv = () => {
    const headers = 'ID,Name,Email,Phone,Company,Score,Status,AssignedAgent,Requirements\n';
    const rows = filteredLeads.map(l => 
      `"${l.id}","${l.name}","${l.email}","${l.phone || ''}","${l.company}","${l.score}","${l.status}","${l.assignedAgent}","${l.requirements || ''}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helio-leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    addToast({
      type: 'success',
      title: 'CSV Export Generated',
      description: `Downloaded ${filteredLeads.length} leads in standard RFC 4180 format.`
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leads & Conversational CRM</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Act on qualified prospective clients captured autonomously through Helio website conversations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">Total Leads (MTD)</span>
          <p className="text-xl font-black text-slate-900 mt-1">{leads.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">Hot Prospects (Score &gt; 85)</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {leads.filter(l => l.score >= 85).length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">Qualified Conversion</span>
          <p className="text-xl font-black text-blue-600 mt-1">62.5%</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">Average Response Time</span>
          <p className="text-xl font-black text-slate-800 mt-1">4 mins</p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, company, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {(['all', 'new', 'qualified', 'booked', 'won'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                statusFilter === s ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* KANBAN PIPELINE VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
          {pipelineStages.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.status === stage.id);

            return (
              <div 
                key={stage.id} 
                className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200 flex flex-col gap-3 min-w-[220px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full border-2 ${stage.color}`} />
                    {stage.label}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{lead.name}</h4>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                          {lead.score}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate font-medium">{lead.company}</p>

                      {lead.requirements && (
                        <p className="text-[10px] text-slate-400 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100 italic">
                          "{lead.requirements}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{lead.lastActivity}</span>
                        {lead.assignedAgent && (
                          <span className="font-semibold text-slate-600 truncate max-w-[90px]">{lead.assignedAgent.split(' ')[0]}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-xl">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-[11px] text-slate-400">{lead.email}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{lead.company}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {lead.score}
                      </span>
                    </td>
                    <td className="py-3 px-4">{lead.assignedAgent}</td>
                    <td className="py-3 px-4">
                      <Badge variant={lead.status === 'qualified' ? 'emerald' : lead.status === 'booked' ? 'blue' : 'gray'}>
                        {lead.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{lead.lastActivity}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Detail Slide-Over Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between animate-slide-up">
            <div className="overflow-y-auto p-6 space-y-6 text-xs">
              {/* Drawer Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedLead.name}</h3>
                    <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs">
                      Score: {selectedLead.score}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedLead.company}</p>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Update Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pipeline Status</label>
                <select
                  value={selectedLead.status}
                  onChange={e => {
                    const newStatus = e.target.value as LeadStatus;
                    updateLeadStatus(selectedLead.id, newStatus);
                    setSelectedLead({ ...selectedLead, status: newStatus });
                  }}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="new">New Inquiries</option>
                  <option value="qualified">Qualified Opportunity</option>
                  <option value="contacted">Contacted</option>
                  <option value="booked">Meeting Booked</option>
                  <option value="won">Closed Won</option>
                  <option value="lost">Closed Lost</option>
                </select>
              </div>

              {/* Contact Information */}
              <div className="space-y-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs">Direct Contact Details</h4>
                <div className="space-y-2 text-slate-700">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">{selectedLead.email}</span>
                  </div>
                  {selectedLead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{selectedLead.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">{selectedLead.company}</span>
                  </div>
                </div>
              </div>

              {/* Qualification Answers */}
              {selectedLead.qualificationAnswers && (
                <div className="space-y-2 p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-950 text-xs">AI Qualification Answers</h4>
                  <div className="space-y-1 text-blue-900 text-[11px]">
                    <p><strong>Service:</strong> {selectedLead.qualificationAnswers.serviceNeeded}</p>
                    <p><strong>Timeline:</strong> {selectedLead.qualificationAnswers.timeline}</p>
                    <p><strong>Decision Maker:</strong> {selectedLead.qualificationAnswers.decisionMaker ? 'Yes' : 'No'}</p>
                    {selectedLead.budget && <p><strong>Budget Range:</strong> {selectedLead.budget}</p>}
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operator Notes</label>
                <textarea
                  rows={3}
                  defaultValue={selectedLead.notes}
                  onBlur={e => updateLeadNotes(selectedLead.id, e.target.value)}
                  placeholder="Add private note regarding this lead..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white"
                />
              </div>

              {/* View Conversation Link */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedLead(null);
                    setCurrentScreen('conversations');
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open Full Conversation Thread</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-xs text-slate-700 hover:bg-slate-100"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
