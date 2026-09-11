import { 
  ChatbotConfig, 
  Conversation, 
  Lead, 
  Appointment, 
  KnowledgeSource, 
  FAQItem, 
  BusinessInfo, 
  AIModelLog, 
  ApiKeyItem, 
  WebhookConfig 
} from '@/types';

export const initialChatbot: ChatbotConfig = {
  id: 'bot_01',
  name: 'Helio LeadBot',
  status: 'active',
  domain: 'northstarstudio.io',
  conversationsCount: 1248,
  lastUpdated: 'Today at 10:14 AM',
  themeColor: '#2563eb', // Cobalt Blue
  welcomeMessage: "👋 Hi there! I'm Helio, the AI assistant for Northstar Studio. How can we help grow your brand or project today?",
  tone: 'Friendly',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  position: 'bottom-right',
  launcherStyle: 'pill',
  suggestedQuestions: [
    'What services does Northstar offer?',
    'How much does a custom website cost?',
    'Book a discovery call with your team',
    'Do you handle paid ads and SEO?'
  ],
  leadFields: ['name', 'email', 'phone', 'company', 'budget'],
  fallbackBehavior: 'human_help',
  monthlyBudgetUsd: 150,
  currentCostUsd: 42.18
};

export const mockChatbotsList: ChatbotConfig[] = [
  initialChatbot,
  {
    id: 'bot_02',
    name: 'Client Support Concierge',
    status: 'active',
    domain: 'portal.northstarstudio.io',
    conversationsCount: 412,
    lastUpdated: 'Yesterday at 4:30 PM',
    themeColor: '#10b981', // Emerald
    welcomeMessage: 'Welcome to Northstar Support. Have a question regarding an active sprint or asset?',
    tone: 'Professional',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
    position: 'bottom-right',
    launcherStyle: 'icon',
    suggestedQuestions: [
      'Check active sprint status',
      'Submit a revision request',
      'Contact our project manager'
    ],
    leadFields: ['name', 'email'],
    fallbackBehavior: 'human_help',
    monthlyBudgetUsd: 80,
    currentCostUsd: 18.50
  },
  {
    id: 'bot_03',
    name: 'Brand Discovery Assistant',
    status: 'draft',
    domain: 'staging.northstarstudio.io',
    conversationsCount: 0,
    lastUpdated: '3 days ago',
    themeColor: '#4f46e5',
    welcomeMessage: 'Ready to elevate your brand visual identity? Let’s explore your aesthetic goals.',
    tone: 'Warm',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    position: 'bottom-left',
    launcherStyle: 'text-icon',
    suggestedQuestions: [
      'Brand guideline deliverables',
      'Timeline for full rebrand',
      'Design portfolio samples'
    ],
    leadFields: ['name', 'email', 'company', 'budget'],
    fallbackBehavior: 'capture_lead',
    monthlyBudgetUsd: 50,
    currentCostUsd: 0.00
  }
];

export const initialBusinessInfo: BusinessInfo = {
  companyName: 'Northstar Studio',
  website: 'https://northstarstudio.io',
  industry: 'Digital Marketing & Web Design Agency',
  description: 'Northstar Studio is a premium digital agency based in Chicago. We build high-converting websites, execute ROI-driven paid acquisition campaigns, and formulate bespoke brand identities for growth-stage businesses.',
  services: [
    'Custom Web Design & Next.js Development',
    'Paid Search & Social Advertising (Google & Meta Ads)',
    'Search Engine Optimization (SEO) & Content Strategy',
    'Brand Identity & Visual Design Systems',
    'Conversion Rate Optimization (CRO)'
  ],
  pricingGuidance: 'Monthly marketing retainers start at $3,500/month. Custom design & development projects typically range from $8,000 to $35,000 depending on scope.',
  address: '222 W Merchandise Mart Plaza, Suite 1200, Chicago, IL 60654',
  hours: 'Monday – Friday, 8:30 AM – 5:30 PM CST',
  email: 'hello@northstarstudio.io',
  phone: '+1 (312) 555-0194'
};

export const mockKnowledgeSources: KnowledgeSource[] = [
  {
    id: 'src_01',
    name: '2026 Agency Services & Retainer Guide.pdf',
    type: 'document',
    status: 'ready',
    chunksIndexed: 84,
    fileSize: '2.4 MB',
    lastUpdated: 'Yesterday at 2:15 PM',
    category: 'Pricing & Services',
    contentSnippet: 'Outlines Core Retainer tiers ($3,500/mo, $6,500/mo, and $12,000/mo enterprise) including dedicated Slack channels, weekly sprints, and reporting cadence.'
  },
  {
    id: 'src_02',
    name: 'Web Design Process & Tech Stack Overview.docx',
    type: 'document',
    status: 'ready',
    chunksIndexed: 56,
    fileSize: '1.1 MB',
    lastUpdated: 'Sep 08, 2026',
    category: 'Development',
    contentSnippet: 'Explains our Next.js, Tailwind CSS, TypeScript, and headless CMS development methodology with 99.9% uptime SLA and WCAG AA compliance.'
  },
  {
    id: 'src_03',
    name: 'https://northstarstudio.io/case-studies/fintech-rebrand',
    type: 'website',
    status: 'ready',
    chunksIndexed: 32,
    fileSize: 'Web Page',
    lastUpdated: 'Sep 05, 2026',
    category: 'Case Studies',
    contentSnippet: 'Deep dive into the 310% lead generation increase achieved for Apex FinTech via complete brand repositioning and Next.js landing page overhaul.'
  },
  {
    id: 'src_04',
    name: 'Enterprise Master Services Agreement FAQ.pdf',
    type: 'document',
    status: 'failed',
    chunksIndexed: 0,
    fileSize: '4.8 MB',
    lastUpdated: 'Sep 09, 2026',
    errorReason: 'PDF is a scanned image container without an OCR text layer. Please upload a searchable text PDF or export from Word.',
    category: 'Legal & Contract'
  },
  {
    id: 'src_05',
    name: 'Northstar Standard Onboarding & Client FAQ.txt',
    type: 'faq',
    status: 'ready',
    chunksIndexed: 44,
    fileSize: '48 KB',
    lastUpdated: 'Today at 9:00 AM',
    category: 'General FAQ',
    contentSnippet: 'Frequently asked questions regarding kickoff timelines, invoice payment terms (Net-15), communication protocols, and deliverables.'
  },
  {
    id: 'src_06',
    name: 'Q3 Agency Portfolio Showcase.pdf',
    type: 'document',
    status: 'processing',
    chunksIndexed: 18,
    fileSize: '14.2 MB',
    lastUpdated: 'Just now',
    category: 'Portfolio',
    contentSnippet: 'Currently extracting high-resolution case studies and testimonials...'
  }
];

export const mockFaqs: FAQItem[] = [
  {
    id: 'faq_01',
    question: 'How fast can a new website project launch?',
    answer: 'Most custom website projects launch within 4 to 8 weeks depending on scope and client asset readiness. We provide a guaranteed milestone roadmap at project kickoff.',
    category: 'Timeline',
    lastUpdated: 'Sep 04, 2026',
    timesReferenced: 218
  },
  {
    id: 'faq_02',
    question: 'What is included in your monthly marketing retainer?',
    answer: 'Retainers include full-funnel paid search & social management, conversion landing page design, bi-weekly CRO testing, weekly dashboard reporting, and dedicated Slack communication.',
    category: 'Pricing',
    lastUpdated: 'Sep 02, 2026',
    timesReferenced: 184
  },
  {
    id: 'faq_03',
    question: 'Do you work with non-US or international clients?',
    answer: 'Yes! While our headquarters is in Chicago, approximately 35% of our client base is located across the UK, Canada, and Western Europe.',
    category: 'General',
    lastUpdated: 'Aug 28, 2026',
    timesReferenced: 92
  },
  {
    id: 'faq_04',
    question: 'What payment methods and payment schedules do you accept?',
    answer: 'We accept ACH wire transfer, major credit cards via Stripe, and corporate purchase orders. Custom projects are structured as 50% deposit and 50% upon launch milestone signoff.',
    category: 'Billing',
    lastUpdated: 'Aug 20, 2026',
    timesReferenced: 64
  }
];

export const mockLeads: Lead[] = [
  {
    id: 'lead_01',
    name: 'Sarah Miller',
    email: 'sarah.miller@apexlogistics.com',
    phone: '+1 (415) 555-2671',
    company: 'Apex Logistics Corp',
    score: 96,
    status: 'qualified',
    lastActivity: '12 mins ago',
    assignedAgent: 'Sarah Jenkins',
    assignedAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    chatbotSource: 'Helio LeadBot',
    requirements: 'Complete site redesign + migration to Next.js. Ready to sign contract in Q4.',
    budget: '$25,000 – $40,000',
    conversationId: 'conv_01',
    qualificationAnswers: {
      serviceNeeded: 'Enterprise Website Redesign',
      timeline: 'Immediate (Next 30 days)',
      decisionMaker: true
    },
    notes: 'Very high intent. Spoke with Helio for 12 turns, requested a calendar demo.',
    activityHistory: [
      { id: 'act_1', type: 'captured', timestamp: 'Today at 10:48 AM', description: 'Lead captured via Helio LeadBot on homepage' },
      { id: 'act_2', type: 'meeting_scheduled', timestamp: 'Today at 10:52 AM', description: 'Discovery call booked for Tomorrow at 2:00 PM CST' }
    ]
  },
  {
    id: 'lead_02',
    name: 'David Vance',
    email: 'david@vancecapital.io',
    phone: '+1 (212) 555-8902',
    company: 'Vance Capital Partners',
    score: 91,
    status: 'booked',
    lastActivity: '45 mins ago',
    assignedAgent: 'Marcus Sterling',
    assignedAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    chatbotSource: 'Helio LeadBot',
    requirements: 'Brand identity refresh and investor portal UI/UX architecture.',
    budget: '$15,000 – $25,000',
    conversationId: 'conv_02',
    qualificationAnswers: {
      serviceNeeded: 'Brand & Portal Design',
      timeline: 'Q1 2027',
      decisionMaker: true
    },
    notes: 'Private equity firm. Needs high aesthetic caliber and strict security compliance.',
    activityHistory: [
      { id: 'act_3', type: 'captured', timestamp: 'Today at 9:30 AM', description: 'Contact details provided during pricing inquiry' }
    ]
  },
  {
    id: 'lead_03',
    name: 'Elena Rostova',
    email: 'elena@novabio.health',
    phone: '+1 (617) 555-3419',
    company: 'NovaBio Health Labs',
    score: 84,
    status: 'new',
    lastActivity: '1 hour ago',
    assignedAgent: 'Sarah Jenkins',
    assignedAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    chatbotSource: 'Helio LeadBot',
    requirements: 'Search advertising campaign for new clinical diagnostic software launch.',
    budget: '$5,000/mo retainer',
    conversationId: 'conv_03',
    qualificationAnswers: {
      serviceNeeded: 'Paid Search & CRO',
      timeline: '2–3 weeks',
      decisionMaker: false
    },
    notes: 'Director of Marketing. Wants a custom audit of their current Google Ads account.'
  },
  {
    id: 'lead_04',
    name: 'Chloe Bennett',
    email: 'cbennett@zenithretail.com',
    company: 'Zenith Retail Collective',
    score: 72,
    status: 'contacted',
    lastActivity: '3 hours ago',
    assignedAgent: 'Unassigned',
    chatbotSource: 'Helio LeadBot',
    requirements: 'Headless Shopify rebuild for 2,400 SKU luxury apparel brand.',
    budget: '$30,000+',
    conversationId: 'conv_04',
    qualificationAnswers: {
      serviceNeeded: 'Headless E-Commerce Rebuild',
      timeline: 'Q1 2027',
      decisionMaker: true
    }
  },
  {
    id: 'lead_05',
    name: 'Tyler Reed',
    email: 'treed@foundryworks.co',
    phone: '+1 (312) 555-9011',
    company: 'Foundry Works Co',
    score: 68,
    status: 'won',
    lastActivity: '1 day ago',
    assignedAgent: 'Marcus Sterling',
    chatbotSource: 'Helio LeadBot',
    requirements: 'Website maintenance retainer + ongoing SEO sprint.',
    budget: '$3,500/mo',
    conversationId: 'conv_05'
  },
  {
    id: 'lead_06',
    name: 'Julian Hayes',
    email: 'jhayes@strataform.org',
    company: 'Strataform Architecture',
    score: 55,
    status: 'lost',
    lastActivity: '3 days ago',
    assignedAgent: 'Unassigned',
    chatbotSource: 'Helio LeadBot',
    requirements: 'Wanted free pro-bono consulting for an architectural nonprofit.',
    budget: '<$1,000'
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: 'appt_01',
    visitorName: 'Sarah Miller',
    visitorEmail: 'sarah.miller@apexlogistics.com',
    company: 'Apex Logistics Corp',
    dateTime: 'Tomorrow, 2:00 PM – 2:30 PM CST',
    durationMinutes: 30,
    assignedCalendar: 'Sarah Jenkins (Google Calendar)',
    assignedAgent: 'Sarah Jenkins',
    bookingSource: 'Helio LeadBot (Homepage)',
    status: 'scheduled',
    meetingLink: 'https://meet.google.com/xyz-north-star',
    notes: 'Initial 30-min discovery call to review Apex Logistics enterprise RFP.'
  },
  {
    id: 'appt_02',
    visitorName: 'David Vance',
    visitorEmail: 'david@vancecapital.io',
    company: 'Vance Capital Partners',
    dateTime: 'Thursday, 10:30 AM – 11:00 AM CST',
    durationMinutes: 30,
    assignedCalendar: 'Marcus Sterling (Google Calendar)',
    assignedAgent: 'Marcus Sterling',
    bookingSource: 'Helio LeadBot (Pricing Page)',
    status: 'scheduled',
    meetingLink: 'https://meet.google.com/vcp-meet-demo',
    notes: 'Walkthrough of brand identity deliverables and investor portal UX.'
  },
  {
    id: 'appt_03',
    visitorName: 'Michael Chang',
    visitorEmail: 'mchang@luminaryai.tech',
    company: 'Luminary AI',
    dateTime: 'Yesterday, 3:00 PM – 3:30 PM CST',
    durationMinutes: 30,
    assignedCalendar: 'Sarah Jenkins (Google Calendar)',
    assignedAgent: 'Sarah Jenkins',
    bookingSource: 'Client Concierge',
    status: 'completed',
    notes: 'Completed discovery. Sent custom proposal for $18,500 retainer.'
  }
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv_01',
    visitorName: 'Sarah Miller',
    visitorEmail: 'sarah.miller@apexlogistics.com',
    visitorLocation: 'San Francisco, CA, United States',
    visitorIp: '192.0.2.45',
    visitorBrowser: 'Chrome 128 / macOS',
    visitorReferrer: 'google.com (Organic Search: "enterprise Next.js agency")',
    previewText: "Awesome, I just booked tomorrow at 2:00 PM. Looking forward to speaking with Sarah.",
    timestamp: '12m ago',
    status: 'active',
    leadScore: 96,
    isUnread: true,
    assignedAgent: 'Sarah Jenkins',
    aiConfidence: 98,
    summary: 'Visitor is looking for a comprehensive redesign of Apex Logistics enterprise web portal. Budget is $25k-$40k. Successfully booked discovery meeting for tomorrow.',
    notes: 'Operator note: High-value lead. Review Apex Logistics current website prior to 2 PM call.',
    chatbotName: 'Helio LeadBot',
    messages: [
      {
        id: 'm_1',
        sender: 'ai',
        content: "👋 Hi there! I'm Helio, the AI assistant for Northstar Studio. How can we help grow your brand or project today?",
        timestamp: '10:42 AM'
      },
      {
        id: 'm_2',
        sender: 'visitor',
        content: "Hi! We're planning to rebuild our company website on Next.js before year-end. Do you have experience with logistics platforms?",
        timestamp: '10:43 AM'
      },
      {
        id: 'm_3',
        sender: 'ai',
        content: "Yes, absolutely! Northstar specializes in high-performance Next.js architectures for B2B and logistics companies. In fact, we recently modernized Apex FinTech's portal, resulting in a 310% lead surge and sub-second load times.",
        referencedSource: '2026 Agency Services & Retainer Guide.pdf',
        timestamp: '10:43 AM'
      },
      {
        id: 'm_4',
        sender: 'visitor',
        content: "That sounds right up our alley. What does a typical project cost, and could we speak with an advisor?",
        timestamp: '10:44 AM'
      },
      {
        id: 'm_5',
        sender: 'ai',
        content: "Our custom web development engagements typically range from $8,000 to $35,000+ depending on integrations and scale. I'd love to connect you directly with our Principal, Sarah Jenkins! Could I grab your name, company email, and best phone number?",
        timestamp: '10:45 AM'
      },
      {
        id: 'm_6',
        sender: 'visitor',
        content: "Sure! Sarah Miller, Apex Logistics Corp. My email is sarah.miller@apexlogistics.com and phone is (415) 555-2671.",
        timestamp: '10:46 AM'
      },
      {
        id: 'm_7',
        sender: 'ai',
        content: "Thank you Sarah! I've noted your details. Would you like to pick a quick 30-minute discovery slot on Sarah Jenkins's calendar right now?",
        toolCall: { name: 'create_lead', status: 'success' },
        timestamp: '10:47 AM'
      },
      {
        id: 'm_8',
        sender: 'visitor',
        content: "Yes, tomorrow afternoon around 2 PM would be ideal.",
        timestamp: '10:48 AM'
      },
      {
        id: 'm_9',
        sender: 'ai',
        content: "Done! I've reserved Tomorrow, 2:00 PM – 2:30 PM CST with Sarah Jenkins. A Google Meet invitation and confirmation email have been sent to sarah.miller@apexlogistics.com.",
        toolCall: { name: 'book_appointment', status: 'success' },
        timestamp: '10:49 AM'
      },
      {
        id: 'm_10',
        sender: 'visitor',
        content: "Awesome, I just booked tomorrow at 2:00 PM. Looking forward to speaking with Sarah.",
        timestamp: '10:50 AM'
      }
    ]
  },
  {
    id: 'conv_02',
    visitorName: 'David Vance',
    visitorEmail: 'david@vancecapital.io',
    visitorLocation: 'New York, NY, United States',
    visitorIp: '198.51.100.12',
    visitorBrowser: 'Safari 17 / iPadOS',
    visitorReferrer: 'Direct Navigation',
    previewText: "Can someone confirm if your team provides custom Figma design systems?",
    timestamp: '45m ago',
    status: 'waiting_handoff',
    leadScore: 91,
    isUnread: true,
    aiConfidence: 89,
    summary: 'Visitor is asking for human operator confirmation regarding Figma component token handoffs for private equity firm.',
    chatbotName: 'Helio LeadBot',
    messages: [
      {
        id: 'm_21',
        sender: 'ai',
        content: "Hello! Welcome to Northstar Studio. How can I assist you today?",
        timestamp: '9:25 AM'
      },
      {
        id: 'm_22',
        sender: 'visitor',
        content: "Can someone confirm if your team provides custom Figma design systems for internal enterprise engineering teams?",
        timestamp: '9:26 AM'
      },
      {
        id: 'm_23',
        sender: 'ai',
        content: "Yes! Every brand and digital design project includes a comprehensive, tokenized Figma design system built with Radix and Tailwind variables. Would you like me to connect you with our Design Lead right now?",
        timestamp: '9:26 AM'
      },
      {
        id: 'm_24',
        sender: 'visitor',
        content: "Yes please, I'd like to speak with a human agent to review our specific token constraints.",
        timestamp: '9:27 AM'
      },
      {
        id: 'm_25',
        sender: 'system',
        content: "⚡ Human agent handoff requested. Notifying on-call operators...",
        timestamp: '9:27 AM'
      }
    ]
  },
  {
    id: 'conv_03',
    visitorName: 'Anonymous Visitor #841',
    visitorLocation: 'London, United Kingdom',
    visitorIp: '203.0.113.89',
    visitorBrowser: 'Firefox 129 / Windows',
    visitorReferrer: 'linkedin.com/feed',
    previewText: "What are your business hours in GMT?",
    timestamp: '2h ago',
    status: 'resolved',
    leadScore: 42,
    isUnread: false,
    aiConfidence: 99,
    summary: 'Visitor queried operating hours and UK time zone overlap. AI answered using standard business profile.',
    chatbotName: 'Helio LeadBot',
    messages: [
      {
        id: 'm_31',
        sender: 'visitor',
        content: "What are your business hours in GMT?",
        timestamp: '8:10 AM'
      },
      {
        id: 'm_32',
        sender: 'ai',
        content: "Our Chicago headquarters operates Monday through Friday from 8:30 AM to 5:30 PM CST, which is 2:30 PM to 11:30 PM GMT. However, our client services team schedules European meetings between 8:00 AM and 12:00 PM CST to provide convenient same-day overlap.",
        referencedSource: 'Northstar Standard Onboarding & Client FAQ.txt',
        timestamp: '8:10 AM'
      }
    ]
  }
];

export const mock7DayVolumeData = [
  { day: 'Mon', conversations: 142, leads: 11, resolvedPct: 78 },
  { day: 'Tue', conversations: 168, leads: 14, resolvedPct: 72 },
  { day: 'Wed', conversations: 195, leads: 16, resolvedPct: 76 },
  { day: 'Thu', conversations: 184, leads: 13, resolvedPct: 74 },
  { day: 'Fri', conversations: 210, leads: 18, resolvedPct: 79 },
  { day: 'Sat', conversations: 172, leads: 7,  resolvedPct: 69 },
  { day: 'Sun', conversations: 177, leads: 7,  resolvedPct: 70 }
];

export const mockLeadFunnelData = [
  { stage: 'Total Conversations', count: 1248, dropPct: '100%' },
  { stage: 'Captured Leads', count: 86, dropPct: '6.9% conversion' },
  { stage: 'Qualified Opportunities', count: 53, dropPct: '61.6% of leads' },
  { stage: 'Booked Appointments', count: 23, dropPct: '43.3% of qualified' }
];

export const mockUnansweredQuestions = [
  {
    id: 'uq_1',
    question: 'Do you offer HIPAA-compliant web hosting and BAA signing?',
    occurrences: 14,
    lastAsked: '2 hours ago',
    suggestedAction: 'Add HIPAA compliance policy to Business Knowledge'
  },
  {
    id: 'uq_2',
    question: 'What is your hourly emergency rate for active website outages?',
    occurrences: 9,
    lastAsked: 'Yesterday',
    suggestedAction: 'Create an SLA FAQ item for emergency response'
  },
  {
    id: 'uq_3',
    question: 'Can you migrate our legacy Drupal 7 database to Webflow?',
    occurrences: 6,
    lastAsked: '3 days ago',
    suggestedAction: 'Document supported CMS migrations'
  }
];

export const mockRecentActivities = [
  {
    id: 'act_101',
    type: 'lead',
    title: 'New Hot Lead Captured',
    description: 'Sarah Miller (Apex Logistics Corp) captured by Helio LeadBot. Score: 96.',
    time: '12m ago',
    icon: 'UserPlus'
  },
  {
    id: 'act_102',
    type: 'appointment',
    title: 'Discovery Meeting Booked',
    description: 'David Vance booked 30m slot with Marcus Sterling for Thursday at 10:30 AM.',
    time: '45m ago',
    icon: 'Calendar'
  },
  {
    id: 'act_103',
    type: 'handoff',
    title: 'Human Takeover Requested',
    description: 'Visitor #842 requested human operator assistance on pricing inquiries.',
    time: '1h ago',
    icon: 'Headphones'
  },
  {
    id: 'act_104',
    type: 'knowledge',
    title: 'Knowledge Source Processed',
    description: 'Successfully indexed 84 chunks from 2026 Agency Services & Retainer Guide.pdf.',
    time: '3h ago',
    icon: 'FileCheck'
  }
];

export const mockAIModelLogs: AIModelLog[] = [
  {
    id: 'log_01',
    timestamp: '10:43:12',
    chatbot: 'Helio LeadBot',
    model: 'openai/gpt-4o-mini',
    provider: 'OpenRouter',
    tokens: 642,
    cost: 0.000096,
    latencyMs: 780,
    status: 'Success'
  },
  {
    id: 'log_02',
    timestamp: '10:45:04',
    chatbot: 'Helio LeadBot',
    model: 'anthropic/claude-3.5-sonnet',
    provider: 'OpenRouter',
    tokens: 1280,
    cost: 0.003840,
    latencyMs: 1420,
    status: 'Success'
  },
  {
    id: 'log_03',
    timestamp: '09:26:30',
    chatbot: 'Client Concierge',
    model: 'openai/gpt-4o-mini',
    provider: 'OpenRouter',
    tokens: 512,
    cost: 0.000076,
    latencyMs: 810,
    status: 'Success'
  },
  {
    id: 'log_04',
    timestamp: '08:10:14',
    chatbot: 'Helio LeadBot',
    model: 'meta-llama/llama-3.1-8b-instruct',
    provider: 'OpenRouter',
    tokens: 380,
    cost: 0.000020,
    latencyMs: 620,
    status: 'Success'
  }
];

export const mockApiKeys: ApiKeyItem[] = [
  {
    id: 'key_01',
    name: 'Production Website Ingestion Key',
    keyMasked: 'cba_live_7x9q...k49a',
    created: 'Aug 14, 2026',
    lastUsed: '4 mins ago',
    status: 'active'
  },
  {
    id: 'key_02',
    name: 'Staging CI/CD Integration',
    keyMasked: 'cba_test_4m2b...90pz',
    created: 'Sep 01, 2026',
    lastUsed: '2 days ago',
    status: 'active'
  }
];

export const initialWebhookConfig: WebhookConfig = {
  id: 'wh_01',
  url: 'https://api.northstarstudio.io/webhooks/helio-events',
  secretMasked: 'whsec_99a8b7c6d5...e4f3',
  isActive: true,
  events: {
    leadCreated: true,
    conversationStarted: false,
    handoffRequested: true,
    appointmentBooked: true
  },
  lastDelivered: 'Today at 10:48 AM (HTTP 200 OK)'
};
