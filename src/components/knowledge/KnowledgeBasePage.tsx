'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Badge from '@/components/common/Badge';
import { KnowledgeSource } from '@/types';
import { 
  BookOpen, 
  UploadCloud, 
  FileText, 
  Globe, 
  HelpCircle, 
  Building, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  Sparkles,
  Search,
  Check,
  ChevronRight
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const { 
    knowledgeSources, 
    addKnowledgeSource, 
    removeKnowledgeSource, 
    faqs, 
    addFaq, 
    deleteFaq, 
    businessInfo, 
    updateBusinessInfo,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'documents' | 'website' | 'faqs' | 'business_info'>('documents');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState('General');
  const [showAddFaqModal, setShowAddFaqModal] = useState(false);

  // New source form state
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState<'document' | 'website' | 'faq'>('document');

  const filteredSources = knowledgeSources.filter(s => {
    if (activeTab === 'documents') return s.type === 'document';
    if (activeTab === 'website') return s.type === 'website';
    if (activeTab === 'faqs') return s.type === 'faq';
    return true;
  });

  const totalChunks = knowledgeSources.reduce((acc, curr) => acc + curr.chunksIndexed, 0);

  const handleCreateSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;

    addKnowledgeSource({
      name: newSourceName.trim(),
      type: newSourceType,
      status: 'ready',
      chunksIndexed: 32,
      fileSize: newSourceType === 'website' ? 'Web Page' : '1.4 MB',
      lastUpdated: 'Just now',
      contentSnippet: 'Newly indexed knowledge source for business inquiry grounding.'
    });

    setNewSourceName('');
    setShowUploadModal(false);
  };

  const handleCreateFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;

    addFaq({
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim(),
      category: newFaqCategory
    });

    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setShowAddFaqModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Knowledge Base & Training Data</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparently monitor what Helio knows. All sources are vectorized and stored in PostgreSQL pgvector.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddFaqModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Add FAQ</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-blue-600/20 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Add Knowledge Source</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">Total Sources</span>
          <p className="text-xl font-black text-slate-900 mt-1">{knowledgeSources.length + faqs.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">Indexed Chunks</span>
          <p className="text-xl font-black text-slate-900 mt-1">{totalChunks} chunks</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">Quality Score</span>
          <p className="text-xl font-black text-emerald-600 mt-1">94 / 100</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">Last Indexed</span>
          <p className="text-xs font-bold text-slate-800 mt-2">Today at 9:00 AM</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 rounded-xl shadow-xs">
        <div className="flex gap-6 text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Documents ({knowledgeSources.filter(s => s.type === 'document').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('website')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'website' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Website Pages ({knowledgeSources.filter(s => s.type === 'website').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'faqs' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQs ({faqs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('business_info')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'business_info' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Business Information</span>
          </button>
        </div>
      </div>

      {/* Tab: Documents or Website Pages */}
      {(activeTab === 'documents' || activeTab === 'website') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Source Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSources.map(source => (
                  <tr key={source.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          {source.type === 'website' ? <Globe className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{source.name}</p>
                          <p className="text-[10px] text-slate-400">{source.fileSize}</p>
                        </div>
                      </div>

                      {/* Error Banner for failed source */}
                      {source.status === 'failed' && (
                        <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{source.errorReason}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{source.category || 'General'}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={source.status === 'ready' ? 'emerald' : source.status === 'processing' ? 'amber' : 'rose'}>
                        {source.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{source.chunksIndexed}</td>
                    <td className="py-3.5 px-4 text-slate-500">{source.lastUpdated}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            addToast({
                              type: 'info',
                              title: 'Re-indexing Started',
                              description: `Re-generating embeddings for "${source.name}".`
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Re-index source"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeKnowledgeSource(source.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: FAQs */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map(faq => (
              <div key={faq.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {faq.category}
                    </span>
                    <button
                      onClick={() => deleteFaq(faq.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2">Q: {faq.question}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">A: {faq.answer}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>Referenced {faq.timesReferenced} times by Helio</span>
                  <span>Updated {faq.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Business Info */}
      {activeTab === 'business_info' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-3xl space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Structured Business Information</h3>
            <p className="text-slate-500 mt-0.5">
              Standard company operating facts used for instant fallback grounding.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={businessInfo.companyName}
                onChange={e => updateBusinessInfo({ companyName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operating Hours</label>
              <input
                type="text"
                value={businessInfo.hours}
                onChange={e => updateBusinessInfo({ hours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Office Address</label>
              <input
                type="text"
                value={businessInfo.address}
                onChange={e => updateBusinessInfo({ address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                value={businessInfo.email}
                onChange={e => updateBusinessInfo({ email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pricing Guidance</label>
            <input
              type="text"
              value={businessInfo.pricingGuidance}
              onChange={e => updateBusinessInfo({ pricingGuidance: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
            />
          </div>

          <div className="pt-3">
            <button
              onClick={() => {
                addToast({
                  type: 'success',
                  title: 'Saved',
                  description: 'Business information successfully updated in vector memory.'
                });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Save Business Details
            </button>
          </div>
        </div>
      )}

      {/* Insights Panel */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-950">AI Knowledge Coverage Insight</h4>
            <p className="text-xs text-blue-800/80 mt-0.5 leading-relaxed">
              Your AI answers <strong>Next.js development</strong> and <strong>retainer pricing</strong> with 98% grounding accuracy. Consider adding a dedicated FAQ covering <strong>emergency support SLAs</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddFaqModal(true)}
          className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs rounded-xl transition-colors shrink-0 shadow-xs"
        >
          Add Suggested FAQ
        </button>
      </div>

      {/* Modal: Add Knowledge Source */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add New Knowledge Source</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['document', 'website', 'faq'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewSourceType(t)}
                      className={`py-2 rounded-xl border text-center capitalize transition-colors ${
                        newSourceType === t ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {newSourceType === 'website' ? 'Web Page URL *' : 'Document Name / Filename *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newSourceType === 'website' ? 'https://example.com/about' : 'e.g. 2026 Price Sheet.pdf'}
                  value={newSourceName}
                  onChange={e => setNewSourceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Upload & Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add FAQ Item */}
      {showAddFaqModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add New FAQ Pair</h3>
              <button onClick={() => setShowAddFaqModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateFaq} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What is your refund or cancellation policy?"
                  value={newFaqQuestion}
                  onChange={e => setNewFaqQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Answer *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide a clear, direct answer that Helio will use to answer visitors."
                  value={newFaqAnswer}
                  onChange={e => setNewFaqAnswer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newFaqCategory}
                  onChange={e => setNewFaqCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFaqModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Save & Index FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
