export type NavigationScreen = 
  | 'home'
  | 'chatbots'
  | 'knowledge'
  | 'appearance'
  | 'conversations'
  | 'leads'
  | 'appointments'
  | 'analytics'
  | 'integrations'
  | 'deployment'
  | 'ai-models'
  | 'developer'
  | 'billing'
  | 'settings'
  | 'onboarding'
  | 'landing'
  | 'status';


export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'booked' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  score: number; // 0-100
  status: LeadStatus;
  lastActivity: string;
  assignedAgent: string;
  assignedAvatar?: string;
  chatbotSource: string;
  requirements?: string;
  budget?: string;
  conversationId?: string;
  qualificationAnswers?: {
    serviceNeeded: string;
    timeline: string;
    decisionMaker: boolean;
  };
  notes?: string;
  activityHistory?: {
    id: string;
    type: 'captured' | 'email' | 'status_change' | 'meeting_scheduled' | 'note';
    timestamp: string;
    description: string;
  }[];
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  visitorName: string;
  visitorEmail: string;
  company: string;
  dateTime: string; // ISO or formatted
  durationMinutes: number;
  assignedCalendar: string;
  assignedAgent: string;
  bookingSource: string;
  status: AppointmentStatus;
  conversationId?: string;
  meetingLink?: string;
  notes?: string;
}

export type ConversationStatus = 'active' | 'waiting_handoff' | 'resolved' | 'abandoned';

export interface ChatMessage {
  id: string;
  sender: 'visitor' | 'ai' | 'agent' | 'system';
  content: string;
  timestamp: string;
  referencedSource?: string;
  toolCall?: {
    name: string;
    status: 'success' | 'executing';
    data?: any;
  };
}

export interface Conversation {
  id: string;
  visitorName: string;
  visitorEmail?: string;
  visitorAvatar?: string;
  visitorLocation: string;
  visitorIp: string;
  visitorBrowser: string;
  visitorReferrer: string;
  previewText: string;
  timestamp: string;
  status: ConversationStatus;
  leadScore: number;
  isUnread: boolean;
  assignedAgent?: string;
  assignedAvatar?: string;
  aiConfidence: number; // 0-100
  summary: string;
  notes?: string;
  chatbotName: string;
  messages: ChatMessage[];
}

export type KnowledgeSourceType = 'document' | 'website' | 'faq' | 'business_info';
export type KnowledgeSourceStatus = 'ready' | 'processing' | 'failed';

export interface KnowledgeSource {
  id: string;
  chatbotId?: string;
  name: string;
  type: KnowledgeSourceType;
  status: KnowledgeSourceStatus;
  chunksIndexed: number;
  fileSize?: string;
  lastUpdated: string;
  errorReason?: string;
  category?: string;
  contentSnippet?: string;
}

export interface FAQItem {
  id: string;
  chatbotId?: string;
  question: string;
  answer: string;
  category: string;
  lastUpdated: string;
  timesReferenced: number;
}

export interface BusinessInfo {
  companyName: string;
  website: string;
  industry: string;
  description: string;
  services: string[];
  pricingGuidance: string;
  address: string;
  hours: string;
  email: string;
  phone: string;
}

export interface ChatbotConfig {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'disabled';
  domain: string;
  description?: string;
  primaryGoals?: {
    answerQuestions: boolean;
    captureLeads: boolean;
    scheduleAppointments: boolean;
    transferToHuman: boolean;
  };
  conversationsCount: number;
  lastUpdated: string;
  themeColor: string;
  welcomeMessage: string;
  tone: 'Professional' | 'Friendly' | 'Concise' | 'Warm';
  avatarUrl: string;
  position: 'bottom-right' | 'bottom-left';
  launcherStyle: 'icon' | 'text-icon' | 'pill';
  suggestedQuestions: string[];
  leadFields: string[];
  fallbackBehavior: 'human_help' | 'capture_lead' | 'share_contact';
  monthlyBudgetUsd: number;
  currentCostUsd: number;
}

export interface AIModelLog {
  id: string;
  timestamp: string;
  chatbot: string;
  model: string;
  provider: 'OpenRouter' | 'OpenAI' | 'Anthropic';
  tokens: number;
  cost: number;
  latencyMs: number;
  status: 'Success' | 'Fallback';
}

export interface WebhookConfig {
  id: string;
  url: string;
  secretMasked: string;
  isActive: boolean;
  events: {
    leadCreated: boolean;
    conversationStarted: boolean;
    handoffRequested: boolean;
    appointmentBooked: boolean;
  };
  lastDelivered?: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyMasked: string;
  created: string;
  lastUsed: string;
  status: 'active' | 'revoked';
}
