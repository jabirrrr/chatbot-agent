'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  UploadCloud, 
  FileText, 
  Globe, 
  HelpCircle, 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RotateCw, 
  X,
  Check,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface SourceItem {
  id: string;
  name: string;
  type: 'pdf' | 'website' | 'docx' | 'txt' | 'faq';
  url?: string;
  timeAgo: string;
  status: 'Ready' | 'Processing' | 'Uploading' | 'Failed';
}

export default function KnowledgeBasePage() {
  const { addToast, knowledgeSources, addKnowledgeSource, removeKnowledgeSource, activeChatbotId } = useApp();
  const [activeTab, setActiveTab] = useState<'Documents' | 'Websites' | 'FAQs' | 'Text' | 'Notion'>('Documents');
  
  const sources = knowledgeSources.filter(s => s.chatbotId === activeChatbotId);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');

  const handleSimulateUpload = (fileName: string) => {
    setIsUploading(true);
    setUploadProgress(15);

    const newId = `src_${Date.now()}`;
    addKnowledgeSource({
      chatbotId: activeChatbotId,
      name: fileName,
      type: fileName.endsWith('.pdf') ? 'document' : fileName.startsWith('http') ? 'website' : 'document',
      status: 'ready',
      chunksIndexed: Math.floor(Math.random() * 50) + 10,
      fileSize: '1.2 MB',
      lastUpdated: new Date().toISOString()
    });

    setTimeout(() => {
      setUploadProgress(100);
      setIsUploading(false);
      addToast({
        type: 'success',
        title: 'Knowledge Indexed',
        description: `Successfully indexed content from ${fileName}.`
      });
    }, 1500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleSimulateUpload(file.name);
    }
  };

  const handleDeleteSource = (id: string, name: string) => {
    removeKnowledgeSource(id);
    addToast({
      type: 'info',
      title: 'Source Removed',
      description: `Removed "${name}" from chatbot training data.`
    });
  };

  return (
    <>
      <div className="space-y-6 page-transition pb-12">
      {/* Header (Matches Panel 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Add and manage your business knowledge so your chatbot can give accurate answers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-xs transition-all btn-press w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Source</span>
        </button>
      </div>

      {/* Tabs Row (Documents, Websites, FAQs, Text, Notion) */}
      <div className="flex items-center gap-1 border-b border-slate-200/80 pb-px">
        {(['Documents', 'Websites', 'FAQs', 'Text', 'Notion'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium transition-all relative ${
              activeTab === tab
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 -mb-px'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Upload Drag-Drop + Right Recent Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): Large Drag & Drop Upload Zone */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/30 group"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.docx,.txt';
              input.onchange = (e: any) => {
                if (e.target.files && e.target.files[0]) {
                  handleSimulateUpload(e.target.files[0].name);
                }
              };
              input.click();
            }}
          >
            {/* Cloud upload icon */}
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-semibold text-slate-900">Upload documents</h3>
            <p className="text-xs text-slate-500 mt-1">
              Drag and drop files here, or click to upload
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Supports PDF, DOCX, TXT (Max 10MB)
            </p>
          </div>

          {/* Upload Progress Bar if active */}
          {isUploading && (
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Processing documents into vector chunks...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-indigo-200/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Quick FAQ / Text Add Options */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Need to crawl your live website?</span>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-indigo-600 font-medium hover:text-indigo-700"
            >
              Add Website URL →
            </button>
          </div>

        </div>

        {/* Right Column (5 cols): Recent Sources Table / List */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <h2 className="text-sm font-semibold text-slate-900">Recent Sources</h2>
            <span className="text-[11px] text-slate-400 font-medium">{sources.length} total</span>
          </div>

          <div className="divide-y divide-slate-100">
            {sources.map(src => {
              const isPdf = src.type === 'document';
              const isWeb = src.type === 'website';

              return (
                <div key={src.id} className="py-3 flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon matching panel 4 */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isPdf ? 'bg-red-50 text-red-600' : isWeb ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isWeb ? <Globe className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {src.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {new Date(src.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Pill */}
                    {src.status === 'ready' && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Ready
                      </span>
                    )}
                    {src.status === 'processing' && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <RotateCw className="w-2.5 h-2.5 animate-spin" />
                        Processing
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteSource(src.id, src.name)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded-md transition-colors"
                      title="Delete source"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
    
      {/* Modal: Add Source */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
               <h3 className="text-sm font-semibold text-slate-900">Add Knowledge Source</h3>
               <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Source Name / URL</label>
                <input
                  type="text"
                  placeholder="e.g. Refund_Policy_2025.pdf or https://mysite.com/faq"
                  value={newSourceTitle}
                  onChange={e => setNewSourceTitle(e.target.value)}
                  className="mt-1 w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newSourceTitle.trim()) {
                    handleSimulateUpload(newSourceTitle.trim());
                    setShowAddModal(false);
                    setNewSourceTitle('');
                  }
                }}
                disabled={!newSourceTitle.trim()}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-xs transition-all"
              >
                Upload & Train
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
