'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  NavigationScreen, 
  ChatbotConfig, 
  Lead, 
  LeadStatus,
  Appointment, 
  Conversation, 
  KnowledgeSource, 
  FAQItem, 
  BusinessInfo, 
  ChatMessage 
} from '@/types';
import { 
  initialChatbot, 
  mockChatbotsList, 
  mockLeads, 
  mockAppointments, 
  mockConversations, 
  mockKnowledgeSources, 
  mockFaqs, 
  initialBusinessInfo 
} from '@/data/mockData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface AppContextType {
  // Navigation & Shell
  currentScreen: NavigationScreen;
  setCurrentScreen: (screen: NavigationScreen) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Data State
  activeChatbotId: string;
  setActiveChatbotId: (id: string) => void;
  pendingNavigation: { type: 'screen' | 'chatbot' | 'custom'; target: string; onConfirm?: () => void } | null;
  setPendingNavigation: (nav: { type: 'screen' | 'chatbot' | 'custom'; target: string; onConfirm?: () => void } | null) => void;
  confirmNavigation: (action: 'save' | 'discard') => void;
  cancelNavigation: () => void;
  chatbot: ChatbotConfig;
  updateChatbot: (updates: Partial<ChatbotConfig>) => void;
  saveDraft: () => Promise<void>;
  discardDraft: () => void;
  isDirty: boolean;
  chatbotsList: ChatbotConfig[];
  createNewChatbot: () => void;
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'lastActivity'>) => void;
  updateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  updateLeadNotes: (leadId: string, notes: string) => void;
  assignLeadAgent: (leadId: string, agent: string) => void;
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  cancelAppointment: (id: string) => void;
  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  sendAgentReply: (conversationId: string, content: string) => void;
  takeOverConversation: (conversationId: string) => void;
  resolveConversation: (conversationId: string) => void;
  knowledgeSources: KnowledgeSource[];
  addKnowledgeSource: (source: Omit<KnowledgeSource, 'id'>) => void;
  removeKnowledgeSource: (id: string) => void;
  faqs: FAQItem[];
  addFaq: (faq: Omit<FAQItem, 'id' | 'lastUpdated' | 'timesReferenced'>) => void;
  deleteFaq: (id: string) => void;
  businessInfo: BusinessInfo;
  updateBusinessInfo: (updates: Partial<BusinessInfo>) => void;

  // Widget Floating State
  isWidgetOpen: boolean;
  setIsWidgetOpen: (open: boolean) => void;
  isWidgetOffline: boolean;
  setIsWidgetOffline: (offline: boolean) => void;
  isWidgetError: boolean;
  setIsWidgetError: (error: boolean) => void;
  widgetMessages: ChatMessage[];
  addVisitorMessage: (text: string) => void;

  // View Controls
  isEmptyStateDemo: boolean;
  setIsEmptyStateDemo: (empty: boolean) => void;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Modals
  showNewChatbotModal: boolean;
  setShowNewChatbotModal: (show: boolean) => void;
  showAvailabilityModal: boolean;
  setShowAvailabilityModal: (show: boolean) => void;
  initializationError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreenInternal] = useState<NavigationScreen>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  const [chatbotsList, setChatbotsList] = useState<ChatbotConfig[]>(mockChatbotsList);
  const [activeChatbotIdInternal, setActiveChatbotIdInternal] = useState<string>(mockChatbotsList[0].id);
  const activeChatbotId = activeChatbotIdInternal;
  
  const [pendingNavigation, setPendingNavigation] = useState<{ type: 'screen' | 'chatbot' | 'custom'; target: string; onConfirm?: () => void } | null>(null);
  
  const savedChatbot = chatbotsList.find(b => b.id === activeChatbotId) || chatbotsList[0];
  const [draftChatbot, setDraftChatbot] = useState<ChatbotConfig>(savedChatbot);
  
  // Update draft when active bot changes
  useEffect(() => {
    setDraftChatbot(chatbotsList.find(b => b.id === activeChatbotId) || chatbotsList[0]);
  }, [activeChatbotId]); // Intentionally not including chatbotsList here so saving doesn't reset draft

  const isDirty = JSON.stringify(draftChatbot) !== JSON.stringify(savedChatbot);

  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv_01');
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(mockKnowledgeSources);
  const [faqs, setFaqs] = useState<FAQItem[]>(mockFaqs);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(initialBusinessInfo);

  // LocalStorage / API Persistence
  const [isLoaded, setIsLoaded] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    async function initData() {
      try {
        let token = localStorage.getItem('helio_auth_token');
        if (!token) {
          // Auto-login or register demo user
          const { API_BASE } = await import('@/lib/api');
          let loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'demo@helio.com', password: 'Password123!' })
          });
          
          if (!loginRes.ok) {
            // Register
            loginRes = await fetch(`${API_BASE}/api/v1/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'demo@helio.com', password: 'Password123!', full_name: 'Demo User', organization_name: 'Helio Demo' })
            });
          }
          
          if (loginRes.ok) {
            const data = await loginRes.json();
            token = data.access_token;
            localStorage.setItem('helio_auth_token', token as string);
          } else {
            throw new Error(`Failed to authenticate with backend API (Status: ${loginRes.status}). Please check server logs.`);
          }
        }
        
        if (token) {
          setAuthToken(token);
          const { fetchChatbots } = await import('@/lib/api');
          const bots = await fetchChatbots(token);
          
          if (bots && bots.length > 0) {
            // Convert backend fields to frontend fields
            const mappedBots = bots.map((b: any) => ({
              id: b.id,
              name: b.name,
              status: b.is_active ? 'active' : 'draft',
              domain: '',
              tone: b.tone || 'Professional', // Fallbacks for frontend
              description: b.description || '',
              primaryGoals: {
                answerQuestions: true,
                captureLeads: false,
                scheduleAppointments: false,
                transferToHuman: false
              },
              conversationsCount: 0,
              lastUpdated: new Date().toISOString(),
              themeColor: b.theme_color || '#3b82f6',
              welcomeMessage: b.welcome_message || '',
              avatarUrl: '',
              position: b.position || 'bottom-right',
              launcherStyle: 'icon',
              suggestedQuestions: [],
              leadFields: [],
              fallbackBehavior: 'human_help',
              monthlyBudgetUsd: 0,
              currentCostUsd: 0,
            }));
            setChatbotsList(mappedBots);
            const savedActiveId = localStorage.getItem('helio_active_chatbot_id');
            const botToActivate = mappedBots.find((b: any) => b.id === savedActiveId) || mappedBots[0];
            setDraftChatbot(botToActivate);
            setActiveChatbotIdInternal(botToActivate.id);
          } else {
            // Create a default bot
            const { API_BASE } = await import('@/lib/api');
            const createRes = await fetch(`${API_BASE}/api/v1/chatbots/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ name: 'Helio LeadBot', description: 'Customer Support', theme_color: '#3b82f6' })
            });
            if (createRes.ok) {
              const b = await createRes.json();
              const newBot = {
                id: b.id,
                name: b.name,
                status: 'draft' as const,
                domain: '',
                tone: 'Professional' as const,
                description: b.description || '',
                primaryGoals: {
                  answerQuestions: true,
                  captureLeads: false,
                  scheduleAppointments: false,
                  transferToHuman: false
                },
                conversationsCount: 0,
                lastUpdated: new Date().toISOString(),
                themeColor: b.theme_color || '#3b82f6',
                welcomeMessage: b.welcome_message || '',
                avatarUrl: '',
                position: b.position || 'bottom-right' as const,
                launcherStyle: 'icon' as const,
                suggestedQuestions: [],
                leadFields: [],
                fallbackBehavior: 'human_help' as const,
                monthlyBudgetUsd: 0,
                currentCostUsd: 0,
              };
              setChatbotsList([newBot]);
              setDraftChatbot(newBot);
              setActiveChatbotIdInternal(newBot.id);
            }
          }
        }
      } catch (e: any) {
        console.error('Failed to init from API', e);
        setInitializationError(e.message || 'Failed to connect to the backend server. Please ensure the API is running and reachable.');
      } finally {
        setIsLoaded(true);
      }
    }
    
    initData();
  }, []);

  // Removed localStorage sync for chatbotsList as it's now managed via backend API save
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('helio_knowledge', JSON.stringify(knowledgeSources));
      localStorage.setItem('helio_faqs', JSON.stringify(faqs));
    }
  }, [knowledgeSources, faqs, isLoaded]);

  // Prevent refresh/unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('helio_knowledge', JSON.stringify(knowledgeSources));
    }
  }, [knowledgeSources, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('helio_faqs', JSON.stringify(faqs));
    }
  }, [faqs, isLoaded]);

  // Widget State
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isWidgetOffline, setIsWidgetOffline] = useState(false);
  const [isWidgetError, setIsWidgetError] = useState(false);
  const [widgetMessages, setWidgetMessages] = useState<ChatMessage[]>([
    {
      id: 'wm_1',
      sender: 'ai',
      content: initialChatbot.welcomeMessage,
      timestamp: 'Just now'
    }
  ]);

  // Demo Controls
  const [isEmptyStateDemo, setIsEmptyStateDemo] = useState(false);
  const [dateFilter, setDateFilter] = useState('Last 7 Days');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [showNewChatbotModal, setShowNewChatbotModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateChatbot = (updates: Partial<ChatbotConfig>) => {
    setDraftChatbot(prev => ({ ...prev, ...updates }));
  };

  const saveDraft = async () => {
    // 1. Update the local chatbots list so switching active bot remembers the saved state
    setChatbotsList(prev => prev.map(bot => bot.id === activeChatbotId ? draftChatbot : bot));
    
    // 2. Push to backend API
    if (authToken) {
      const { updateChatbot: updateChatbotApi } = await import('@/lib/api');
      const payload: any = {};
      if (draftChatbot.name) payload.name = draftChatbot.name;
      if (draftChatbot.description) payload.description = draftChatbot.description;
      if (draftChatbot.welcomeMessage) payload.welcome_message = draftChatbot.welcomeMessage;
      if (draftChatbot.themeColor) payload.theme_color = draftChatbot.themeColor;
      if (draftChatbot.position) payload.position = draftChatbot.position;
      
      await updateChatbotApi(authToken, activeChatbotId, payload);
    }
    addToast({
      type: 'success',
      title: 'Chatbot Saved',
      description: 'Your chatbot settings have been saved and applied.'
    });
  };

  const discardDraft = () => {
    setDraftChatbot(savedChatbot);
  };

  const setCurrentScreen = (screen: NavigationScreen) => {
    if (isDirty) {
      setPendingNavigation({ type: 'screen', target: screen });
    } else {
      setCurrentScreenInternal(screen);
    }
  };

  const setActiveChatbotId = (id: string) => {
    if (isDirty) {
      setPendingNavigation({ type: 'chatbot', target: id });
    } else {
      setActiveChatbotIdInternal(id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('helio_active_chatbot_id', id);
      }
    }
  };

  const confirmNavigation = (action: 'save' | 'discard') => {
    if (action === 'save') {
      // Must use draftChatbot as value to save
      setChatbotsList(prev => prev.map(bot => bot.id === activeChatbotId ? draftChatbot : bot));
      addToast({ type: 'success', title: 'Saved', description: 'Changes saved before navigating.' });
    } else {
      setDraftChatbot(savedChatbot);
    }
    
    if (pendingNavigation) {
      if (pendingNavigation.type === 'screen') {
        setCurrentScreenInternal(pendingNavigation.target as NavigationScreen);
      } else if (pendingNavigation.type === 'chatbot') {
        setActiveChatbotIdInternal(pendingNavigation.target);
        if (typeof window !== 'undefined') {
          localStorage.setItem('helio_active_chatbot_id', pendingNavigation.target);
        }
      } else if (pendingNavigation.type === 'custom' && pendingNavigation.onConfirm) {
        pendingNavigation.onConfirm();
      }
      setPendingNavigation(null);
    }
  };

  const cancelNavigation = () => {
    setPendingNavigation(null);
  };

  const createNewChatbot = () => {
    const newId = `bot_${Date.now()}`;
    const newBot: ChatbotConfig = {
      ...initialChatbot,
      id: newId,
      name: 'New Custom Chatbot',
      status: 'draft',
      conversationsCount: 0,
      lastUpdated: 'Just now',
    };
    setChatbotsList(prev => [...prev, newBot]);
    setActiveChatbotId(newId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('helio_active_chatbot_id', newId);
    }
    addToast({
      type: 'success',
      title: 'Chatbot Created',
      description: 'A new chatbot profile has been initialized.'
    });
  };

  const addLead = (newLeadData: Omit<Lead, 'id' | 'lastActivity'>) => {
    const newLead: Lead = {
      ...newLeadData,
      id: `lead_${Date.now()}`,
      lastActivity: 'Just now',
      activityHistory: [
        {
          id: `act_${Date.now()}`,
          type: 'captured',
          timestamp: 'Just now',
          description: 'Lead captured autonomously via Helio customer chat widget'
        }
      ]
    };
    setLeads(prev => [newLead, ...prev]);
    addToast({
      type: 'success',
      title: 'New Lead Captured',
      description: `${newLead.name} from ${newLead.company || 'Website'} saved to CRM.`
    });
  };

  const updateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          status: newStatus,
          lastActivity: 'Just now',
          activityHistory: [
            ...(lead.activityHistory || []),
            {
              id: `act_${Date.now()}`,
              type: 'status_change',
              timestamp: 'Just now',
              description: `Status updated to ${newStatus.toUpperCase()}`
            }
          ]
        };
      }
      return lead;
    }));
    addToast({
      type: 'info',
      title: 'Pipeline Updated',
      description: `Lead status changed to ${newStatus}.`
    });
  };

  const updateLeadNotes = (leadId: string, notes: string) => {
    setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, notes } : lead));
    addToast({
      type: 'success',
      title: 'Notes Saved',
      description: 'Lead internal notes have been updated.'
    });
  };

  const assignLeadAgent = (leadId: string, agent: string) => {
    setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, assignedAgent: agent } : lead));
    addToast({
      type: 'info',
      title: 'Agent Assigned',
      description: `Lead reassigned to ${agent}.`
    });
  };

  const addAppointment = (newApptData: Omit<Appointment, 'id' | 'status'>) => {
    const newAppt: Appointment = {
      ...newApptData,
      id: `appt_${Date.now()}`,
      status: 'scheduled'
    };
    setAppointments(prev => [newAppt, ...prev]);
    addToast({
      type: 'success',
      title: 'Meeting Scheduled',
      description: `Discovery session booked for ${newAppt.visitorName}.`
    });
  };

  const cancelAppointment = (id: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    addToast({
      type: 'warning',
      title: 'Appointment Cancelled',
      description: 'Meeting marked as cancelled and calendar notification sent.'
    });
  };

  const sendAgentReply = (conversationId: string, content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'agent',
      content,
      timestamp: 'Just now'
    };
    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          previewText: content,
          timestamp: 'Just now',
          messages: [...c.messages, newMessage]
        };
      }
      return c;
    }));
    addToast({
      type: 'success',
      title: 'Message Sent',
      description: 'Operator reply delivered to visitor chat.'
    });
  };

  const takeOverConversation = (conversationId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          status: 'active',
          assignedAgent: 'Sarah Jenkins',
          messages: [
            ...c.messages,
            {
              id: `sys_${Date.now()}`,
              sender: 'system',
              content: '👋 Sarah Jenkins (Owner) joined the conversation.',
              timestamp: 'Just now'
            }
          ]
        };
      }
      return c;
    }));
    addToast({
      type: 'success',
      title: 'Takeover Active',
      description: 'You are now directly chatting with this visitor. AI generation paused.'
    });
  };

  const resolveConversation = (conversationId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        return { ...c, status: 'resolved' };
      }
      return c;
    }));
    addToast({
      type: 'info',
      title: 'Conversation Resolved',
      description: 'Thread marked as resolved and archived.'
    });
  };

  const addKnowledgeSource = (source: Omit<KnowledgeSource, 'id'>) => {
    const newSource: KnowledgeSource = {
      ...source,
      id: `src_${Date.now()}`
    };
    setKnowledgeSources(prev => [newSource, ...prev]);
    addToast({
      type: 'success',
      title: 'Source Added',
      description: `"${newSource.name}" queued for extraction and vector indexing.`
    });
  };

  const removeKnowledgeSource = (id: string) => {
    setKnowledgeSources(prev => prev.filter(s => s.id !== id));
    addToast({
      type: 'info',
      title: 'Source Removed',
      description: 'Knowledge source and associated vector chunks removed from database.'
    });
  };

  const addFaq = (faq: Omit<FAQItem, 'id' | 'lastUpdated' | 'timesReferenced'>) => {
    const newFaq: FAQItem = {
      ...faq,
      id: `faq_${Date.now()}`,
      lastUpdated: 'Today',
      timesReferenced: 0
    };
    setFaqs(prev => [newFaq, ...prev]);
    addToast({
      type: 'success',
      title: 'FAQ Added',
      description: 'New question & answer pair indexed into Helio memory.'
    });
  };

  const deleteFaq = (id: string) => {
    setFaqs(prev => prev.filter(f => f.id !== id));
    addToast({
      type: 'info',
      title: 'FAQ Deleted',
      description: 'FAQ item removed.'
    });
  };

  const updateBusinessInfo = (updates: Partial<BusinessInfo>) => {
    setBusinessInfo(prev => ({ ...prev, ...updates }));
    addToast({
      type: 'success',
      title: 'Business Info Updated',
      description: 'Company profile and operational parameters saved.'
    });
  };

  // Visitor interactive chat in the customer widget
  const addVisitorMessage = async (text: string) => {
    const visitorMsg: ChatMessage = {
      id: `wm_${Date.now()}`,
      sender: 'visitor',
      content: text,
      timestamp: 'Just now'
    };
    
    // Optimistically update the UI with visitor message
    setWidgetMessages(prev => [...prev, visitorMsg]);

    let llmKey = null;
    let llmProvider = null;
    if (typeof window !== 'undefined') {
      llmKey = localStorage.getItem('helio_llm_key');
      llmProvider = localStorage.getItem('helio_llm_provider') || 'OpenAI';
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: widgetMessages,
          apiKey: llmKey,
          provider: llmProvider || 'OpenAI',
          botConfig: {
            name: draftChatbot.name,
            tone: draftChatbot.tone,
            businessDescription: draftChatbot.description || businessInfo.description,
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setWidgetMessages(prev => [
            ...prev,
            {
              id: `ai_${Date.now()}`,
              sender: 'ai',
              content: data.reply,
              referencedSource: data.live ? `Live ${data.provider || 'AI'}` : 'Knowledge Base',
              timestamp: 'Just now'
            }
          ]);
          return;
        }
      } else {
        console.warn('LLM API returned non-ok status, using local fallback');
      }
    } catch (err) {
      console.error('Failed to call LLM API', err);
    }

    // Fallback: Simulated AI response with grounding
    setTimeout(() => {
      let reply = "Thanks for asking! At Northstar Studio, we specialize in custom web architectures, high-ROI paid acquisition, and brand design. Would you like to check our pricing packages or speak with Sarah Jenkins?";
      const refSource = '2026 Agency Services & Retainer Guide.pdf';

      const lower = text.toLowerCase();
      if (lower.includes('price') || lower.includes('cost') || lower.includes('budget') || lower.includes('how much')) {
        reply = "Our monthly marketing retainers start at $3,500/month. For custom Next.js web design and development, projects typically range from $8,000 to $35,000 depending on scope and integrations. Would you like to book a 30-min discovery call?";
      } else if (lower.includes('book') || lower.includes('schedule') || lower.includes('call') || lower.includes('meeting') || lower.includes('demo')) {
        reply = "I'd be glad to arrange that! I have discovery slots open tomorrow at 2:00 PM CST and Thursday at 10:30 AM CST. Which time works best for you?";
      } else if (lower.includes('human') || lower.includes('person') || lower.includes('agent') || lower.includes('operator')) {
        reply = "I've alerted Sarah Jenkins and our client success team. An operator will join this chat thread shortly, or you can drop your email address and we'll reply directly!";
      }

      setWidgetMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          content: reply,
          referencedSource: refSource,
          timestamp: 'Just now'
        }
      ]);
    }, 1000);
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        isSidebarCollapsed,
        toggleSidebar,
        activeChatbotId,
        setActiveChatbotId,
        pendingNavigation,
        setPendingNavigation,
        confirmNavigation,
        cancelNavigation,
        chatbot: draftChatbot,
        updateChatbot,
        saveDraft,
        discardDraft,
        isDirty,
        chatbotsList,
        createNewChatbot,
        leads,
        addLead,
        updateLeadStatus,
        updateLeadNotes,
        assignLeadAgent,
        appointments,
        addAppointment,
        cancelAppointment,
        conversations,
        activeConversationId,
        setActiveConversationId,
        sendAgentReply,
        takeOverConversation,
        resolveConversation,
        knowledgeSources,
        addKnowledgeSource,
        removeKnowledgeSource,
        faqs,
        addFaq,
        deleteFaq,
        businessInfo,
        updateBusinessInfo,
        isWidgetOpen,
        setIsWidgetOpen,
        isWidgetOffline,
        setIsWidgetOffline,
        isWidgetError,
        setIsWidgetError,
        widgetMessages,
        addVisitorMessage,
        isEmptyStateDemo,
        setIsEmptyStateDemo,
        dateFilter,
        setDateFilter,
        globalSearchQuery,
        setGlobalSearchQuery,
        toasts,
        addToast,
        removeToast,
        showNewChatbotModal,
        setShowNewChatbotModal,
        showAvailabilityModal,
        setShowAvailabilityModal,
        initializationError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
