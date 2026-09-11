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
  chatbot: ChatbotConfig;
  updateChatbot: (updates: Partial<ChatbotConfig>) => void;
  chatbotsList: ChatbotConfig[];
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [chatbot, setChatbot] = useState<ChatbotConfig>(initialChatbot);
  const [chatbotsList, setChatbotsList] = useState<ChatbotConfig[]>(mockChatbotsList);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv_01');
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(mockKnowledgeSources);
  const [faqs, setFaqs] = useState<FAQItem[]>(mockFaqs);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(initialBusinessInfo);

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
    setChatbot(prev => ({ ...prev, ...updates }));
    setChatbotsList(prev => prev.map(bot => bot.id === chatbot.id ? { ...bot, ...updates } : bot));
    addToast({
      type: 'success',
      title: 'Chatbot Saved',
      description: 'Your chatbot settings have been saved and applied to the widget.'
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
  const addVisitorMessage = (text: string) => {
    const visitorMsg: ChatMessage = {
      id: `wm_${Date.now()}`,
      sender: 'visitor',
      content: text,
      timestamp: 'Just now'
    };
    setWidgetMessages(prev => [...prev, visitorMsg]);

    // Simulated AI response with grounding
    setTimeout(() => {
      let reply = "Thanks for asking! At Northstar Studio, we specialize in custom web architectures, high-ROI paid acquisition, and brand design. Would you like to check our pricing packages or speak with Sarah Jenkins?";
      let refSource = '2026 Agency Services & Retainer Guide.pdf';

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
        chatbot,
        updateChatbot,
        chatbotsList,
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
