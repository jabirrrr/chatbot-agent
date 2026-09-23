'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  
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
  deleteChatbot: (id: string) => Promise<void>;
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
  resetWidgetConversation: (botId?: string) => void;

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
  const [currentScreen, setCurrentScreenInternal] = useState<NavigationScreen>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const screen = params.get('screen');
      if (screen) {
        return screen as NavigationScreen;
      }
    }
    return 'home';
  });
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
  
  // Persist Knowledge Base elements to localStorage so they survive page refreshes
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('helio_knowledge_sources');
      if (saved) return JSON.parse(saved);
    }
    return mockKnowledgeSources;
  });
  
  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('helio_faqs');
      if (saved) return JSON.parse(saved);
    }
    return mockFaqs;
  });
  
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('helio_business_info');
      if (saved) return JSON.parse(saved);
    }
    return initialBusinessInfo;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('helio_knowledge_sources', JSON.stringify(knowledgeSources));
    }
  }, [knowledgeSources]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('helio_faqs', JSON.stringify(faqs));
    }
  }, [faqs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('helio_business_info', JSON.stringify(businessInfo));
    }
  }, [businessInfo]);

  // LocalStorage / API Persistence
  const [isLoaded, setIsLoaded] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    async function initData() {
      try {
        const { API_BASE, fetchChatbots } = await import('@/lib/api');
        
        let tokenToUse = authToken;
        if (!tokenToUse && typeof window !== 'undefined') {
          tokenToUse = localStorage.getItem('helio_auth_token');
          if (tokenToUse) {
            setAuthToken(tokenToUse);
            return; // Setting state will trigger a re-render and re-run this effect
          }
        }
        
        if (tokenToUse) {
          let bots: any[] = [];
          try {
            bots = await fetchChatbots(tokenToUse);
          } catch (fetchErr) {
            // Token might be stale/invalid
            console.warn('Initial token rejected, clearing credentials...', fetchErr);
            tokenToUse = null;
            setAuthToken(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('helio_auth_token');
            }
          }

          if (bots && bots.length > 0) {
            const mappedBots: ChatbotConfig[] = bots.map((b: any) => {
              const cfg = b.config_json || {};
              return {
                id: b.id,
                name: b.name,
                status: b.is_active ? 'active' : 'draft',
                domain: b.domain || '',
                tone: cfg.tone || 'Friendly',
                description: b.description || '',
                primaryGoals: cfg.primaryGoals || {
                  answerQuestions: true,
                  captureLeads: true,
                  scheduleAppointments: true,
                  transferToHuman: true
                },
                conversationsCount: b.conversations_count || 1248,
                lastUpdated: 'Just now',
                themeColor: b.theme_color || '#2563eb',
                welcomeMessage: b.welcome_message || "👋 Hi there! How can we help you today?",
                avatarUrl: cfg.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
                position: b.position || 'bottom-right',
                launcherStyle: cfg.launcherStyle || 'pill',
                suggestedQuestions: cfg.suggestedQuestions || [
                  'What services do you offer?',
                  'How much does a project cost?',
                  'Book a discovery call'
                ],
                leadFields: cfg.leadFields || ['name', 'email', 'phone', 'company', 'budget'],
                fallbackBehavior: cfg.fallbackBehavior || 'human_help',
                monthlyBudgetUsd: cfg.monthlyBudgetUsd || 150,
                currentCostUsd: cfg.currentCostUsd || 42.18,
              };
            });

            setChatbotsList(mappedBots);
            const savedActiveId = typeof window !== 'undefined' ? localStorage.getItem('helio_active_chatbot_id') : null;
            const botToActivate = mappedBots.find((b: any) => b.id === savedActiveId) || mappedBots[0];
            setDraftChatbot(botToActivate);
            setActiveChatbotIdInternal(botToActivate.id);
          } else if (tokenToUse) {
            // Create default bot on backend
            try {
              const createRes = await fetch(`${API_BASE}/api/v1/chatbots/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenToUse}` },
                body: JSON.stringify({ name: 'Helio LeadBot', description: 'Customer Support & Sales', theme_color: '#2563eb' })
              });
              if (createRes.ok) {
                const b = await createRes.json();
                const cfg = b.config_json || {};
                const newBot: ChatbotConfig = {
                  id: b.id,
                  name: b.name,
                  status: 'active',
                  domain: 'northstarstudio.io',
                  tone: cfg.tone || 'Friendly',
                  description: b.description || '',
                  primaryGoals: cfg.primaryGoals || {
                    answerQuestions: true,
                    captureLeads: true,
                    scheduleAppointments: true,
                    transferToHuman: true
                  },
                  conversationsCount: 0,
                  lastUpdated: 'Just now',
                  themeColor: b.theme_color || '#2563eb',
                  welcomeMessage: b.welcome_message || "👋 Hi there! How can we help you today?",
                  avatarUrl: cfg.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
                  position: b.position || 'bottom-right',
                  launcherStyle: cfg.launcherStyle || 'pill',
                  suggestedQuestions: cfg.suggestedQuestions || [
                    'What services do you offer?',
                    'How much does a project cost?',
                    'Book a discovery call'
                  ],
                  leadFields: cfg.leadFields || ['name', 'email', 'phone', 'company', 'budget'],
                  fallbackBehavior: cfg.fallbackBehavior || 'human_help',
                  monthlyBudgetUsd: cfg.monthlyBudgetUsd || 150,
                  currentCostUsd: cfg.currentCostUsd || 0,
                };
                setChatbotsList([newBot]);
                setDraftChatbot(newBot);
                setActiveChatbotIdInternal(newBot.id);
              }
            } catch (createErr) {
              console.warn('Could not create default bot on backend:', createErr);
            }
          }
        } else {
          // No token found, reset to mock state (e.g. after logout)
          setChatbotsList(mockChatbotsList);
          const defaultBot = mockChatbotsList[0];
          setDraftChatbot(defaultBot);
          setActiveChatbotIdInternal(defaultBot.id);
        }
      } catch (e: any) {
        console.warn('Backend init error, continuing with cached/default state:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    
    initData();
  }, [authToken]);

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

  // Helper to load or initialize messages for a specific chatbot
  const getInitialBotMessages = (botId: string, welcomeMsg?: string): ChatMessage[] => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`helio_conversation_${botId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored conversation for bot', botId, e);
      }
    }
    return [
      {
        id: `wm_${botId}_init`,
        sender: 'ai',
        content: welcomeMsg || "👋 Hi there! How can we help you today?",
        timestamp: 'Just now'
      }
    ];
  };

  // Chatbot-scoped conversations mapping in memory
  const [chatbotConversations, setChatbotConversations] = useState<Record<string, ChatMessage[]>>({});
  const activeChatbotIdRef = useRef<string>(activeChatbotId);
  useEffect(() => {
    activeChatbotIdRef.current = activeChatbotId;
  }, [activeChatbotId]);

  // Widget State
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isWidgetOffline, setIsWidgetOffline] = useState(false);
  const [isWidgetError, setIsWidgetError] = useState(false);
  const [widgetMessages, setWidgetMessages] = useState<ChatMessage[]>(() => {
    return getInitialBotMessages(initialChatbot.id, initialChatbot.welcomeMessage);
  });

  // Switch conversation whenever activeChatbotId changes
  useEffect(() => {
    if (!activeChatbotId) return;
    const currentBot = chatbotsList.find(b => b.id === activeChatbotId) || draftChatbot;
    const welcome = currentBot?.welcomeMessage || "👋 Hi there! How can we help you today?";

    if (chatbotConversations[activeChatbotId] && chatbotConversations[activeChatbotId].length > 0) {
      setWidgetMessages(chatbotConversations[activeChatbotId]);
    } else {
      const loaded = getInitialBotMessages(activeChatbotId, welcome);
      setWidgetMessages(loaded);
      setChatbotConversations(prev => ({ ...prev, [activeChatbotId]: loaded }));
    }
  }, [activeChatbotId]);

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
      if (draftChatbot.status) payload.is_active = draftChatbot.status === 'active';
      
      payload.config_json = {
        tone: draftChatbot.tone,
        avatarUrl: draftChatbot.avatarUrl,
        launcherStyle: draftChatbot.launcherStyle,
        suggestedQuestions: draftChatbot.suggestedQuestions,
        leadFields: draftChatbot.leadFields,
        fallbackBehavior: draftChatbot.fallbackBehavior,
        monthlyBudgetUsd: draftChatbot.monthlyBudgetUsd,
        currentCostUsd: draftChatbot.currentCostUsd,
        primaryGoals: draftChatbot.primaryGoals
      };
      
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

  const createNewChatbot = async () => {
    let newId = `bot_${Date.now()}`;
    let newName = 'New Custom Chatbot';
    
    // Create on backend if authenticated
    if (authToken) {
      try {
        const { API_BASE } = await import('@/lib/api');
        const createRes = await fetch(`${API_BASE}/api/v1/chatbots/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
          body: JSON.stringify({ name: newName, description: 'A new chatbot assistant', theme_color: '#2563eb' })
        });
        if (createRes.ok) {
          const b = await createRes.json();
          newId = b.id;
          newName = b.name;
        }
      } catch (err) {
        console.error('Failed to create new chatbot on backend:', err);
      }
    }

    const newBot: ChatbotConfig = {
      ...initialChatbot,
      id: newId,
      name: newName,
      status: 'draft',
      conversationsCount: 0,
      lastUpdated: 'Just now',
    };
    setChatbotsList(prev => [...prev, newBot]);
    setActiveChatbotIdInternal(newId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('helio_active_chatbot_id', newId);
    }
    addToast({
      type: 'success',
      title: 'Chatbot Created',
      description: 'A new chatbot profile has been initialized.'
    });
  };

  const deleteChatbot = async (id: string) => {
    if (authToken) {
      const { deleteChatbot: deleteChatbotApi } = await import('@/lib/api');
      await deleteChatbotApi(authToken, id);
    }
    
    setChatbotsList(prev => {
      const filtered = prev.filter(bot => bot.id !== id);
      if (activeChatbotIdInternal === id) {
        const nextId = filtered.length > 0 ? filtered[0].id : '';
        setActiveChatbotIdInternal(nextId);
        if (typeof window !== 'undefined') {
          if (nextId) localStorage.setItem('helio_active_chatbot_id', nextId);
          else localStorage.removeItem('helio_active_chatbot_id');
        }
      }
      return filtered;
    });

    addToast({
      type: 'info',
      title: 'Chatbot Deleted',
      description: 'The chatbot has been permanently removed.'
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

  // Reset conversation for a specific chatbot or currently active bot
  const resetWidgetConversation = (botId?: string) => {
    const targetId = botId || activeChatbotId;
    const currentBot = chatbotsList.find(b => b.id === targetId) || draftChatbot;
    const welcome = currentBot?.welcomeMessage || "👋 Hi there! How can we help you today?";
    const initialMsgs: ChatMessage[] = [
      {
        id: `wm_${targetId}_${Date.now()}`,
        sender: 'ai',
        content: welcome,
        timestamp: 'Just now'
      }
    ];
    setChatbotConversations(prev => ({ ...prev, [targetId]: initialMsgs }));
    if (targetId === activeChatbotId) {
      setWidgetMessages(initialMsgs);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`helio_conversation_${targetId}`);
    }
  };

  // Visitor interactive chat in the customer widget (scoped strictly to target chatbot)
  const addVisitorMessage = async (text: string) => {
    const targetBotId = activeChatbotId;
    const currentBot = chatbotsList.find(b => b.id === targetBotId) || draftChatbot;
    const visitorMsg: ChatMessage = {
      id: `wm_${Date.now()}`,
      sender: 'visitor',
      content: text,
      timestamp: 'Just now'
    };

    const currentHistory = chatbotConversations[targetBotId] || widgetMessages;
    const updatedHistory = [...currentHistory, visitorMsg];

    // Optimistically update memory and storage
    setChatbotConversations(prev => ({ ...prev, [targetBotId]: updatedHistory }));
    if (activeChatbotIdRef.current === targetBotId) {
      setWidgetMessages(updatedHistory);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(`helio_conversation_${targetBotId}`, JSON.stringify(updatedHistory));
    }

    const appendAiResponse = (replyText: string, refSrc?: string) => {
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        content: replyText,
        referencedSource: refSrc,
        timestamp: 'Just now'
      };
      setChatbotConversations(prev => {
        const hist = prev[targetBotId] || updatedHistory;
        const newHist = [...hist, aiMsg];
        if (typeof window !== 'undefined') {
          localStorage.setItem(`helio_conversation_${targetBotId}`, JSON.stringify(newHist));
        }
        return { ...prev, [targetBotId]: newHist };
      });
      // Race condition guard: only update live widget if user is STILL viewing targetBotId
      if (activeChatbotIdRef.current === targetBotId) {
        setWidgetMessages(prev => [...prev, aiMsg]);
      }
    };

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
          history: updatedHistory,
          apiKey: llmKey,
          provider: llmProvider || 'OpenAI',
          botConfig: {
            name: currentBot.name,
            tone: currentBot.tone,
            businessDescription: currentBot.description || businessInfo.description,
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          appendAiResponse(data.reply, data.source || undefined);
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
      let reply = `Thanks for asking! At ${currentBot.name || 'our studio'}, we specialize in custom web architectures, high-ROI paid acquisition, and brand design. Would you like to check our pricing packages or speak with an agent?`;
      const refSource = '2026 Agency Services & Retainer Guide.pdf';

      const lower = text.toLowerCase();
      if (lower.includes('price') || lower.includes('cost') || lower.includes('budget') || lower.includes('how much')) {
        reply = "Our monthly marketing retainers start at $3,500/month. For custom Next.js web design and development, projects typically range from $8,000 to $35,000 depending on scope and integrations. Would you like to book a 30-min discovery call?";
      } else if (lower.includes('book') || lower.includes('schedule') || lower.includes('call') || lower.includes('meeting') || lower.includes('demo')) {
        reply = "I'd be glad to arrange that! I have discovery slots open tomorrow at 2:00 PM CST and Thursday at 10:30 AM CST. Which time works best for you?";
      } else if (lower.includes('human') || lower.includes('person') || lower.includes('agent') || lower.includes('operator')) {
        reply = "I've alerted our client success team. An operator will join this chat thread shortly, or you can drop your email address and we'll reply directly!";
      }

      appendAiResponse(reply, refSource);
    }, 1000);
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        isSidebarCollapsed,
        toggleSidebar,
        authToken,
        setAuthToken,
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
        deleteChatbot,
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
        resetWidgetConversation,
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
