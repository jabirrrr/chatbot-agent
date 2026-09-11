# Helio - Autonomous AI Chatbot & Lead Generation Platform for SMBs

**Helio** is a frontend-only AI chatbot SaaS web application tailored for small and medium-sized businesses (SMBs). Designed with a **B2B SaaS aesthetic**, it enables business owners, operators, and developers to create, train, customize, deploy, and monitor an AI agent on their website in under 30 minutes.

Seeded for **Northstar Studio** (a digital marketing and creative agency in Chicago, IL), the platform showcases how an autonomous website agent answers business queries grounded in company documentation, captures high-intent leads, schedules calendar meetings, and hands off chats to human operators.

---

## 🚀 Key Features & Screens

1. **Home: Analytics Command Center**
   - Live uptime status and widget health indicators
   - Five Core KPIs: Conversations (1,248, +18.4%), Leads (86, +12.1%), AI Resolution Rate (74%), Booked Appointments (23), and AI Cost Budget meter ($42.18 / $150.00)
   - 7-Day Conversation Volume interactive area chart (Recharts)
   - Conversion Funnel visualization (Conversations ➔ Leads ➔ Qualified ➔ Booked)
   - Hot Leads table with qualification scores, assigned agents, and status badges
   - "Questions your AI could not answer" card with recommended training actions
   - Knowledge Base health score card & real-time operational activity feed
   - Interactive toggle for **Empty State** demonstration

2. **5-Step Onboarding Wizard**
   - Fast setup wizard (<2 minutes per step):
     - **Step 1: Business Profile** (Legal name, website, industry, starter questions)
     - **Step 2: Add Knowledge** (Drag-and-drop document uploader, URL crawler, FAQ builder)
     - **Step 3: Configure AI** (Bot persona, tone selector, lead fields, fallback behaviors)
     - **Step 4: Customize Widget** (Brand color picker, avatar, positioning, launcher style, live mobile preview)
     - **Step 5: Install Widget** (Copyable JS snippet, domain allowlist, platform guides for HTML, WordPress, Shopify, Webflow, React, simulated live ping)

3. **Chatbots Management**
   - Multi-bot fleet overview (Active, Draft, Disabled)
   - Status filters, search bar, and bot duplication
   - Chatbot details drawer with tabs for Overview, Appearance, Behavior, Installation, and Advanced settings

4. **Knowledge Base Studio**
   - Transparent vector search inspection: indexed chunks, file sizes, and sync dates
   - Multi-tab management: Documents, Website Pages, FAQs, and Business Information
   - Modal dialogs for uploading documents with simulated chunking and adding new FAQ pairs
   - Vector health diagnostics and knowledge gap recommendations

5. **Appearance Studio**
   - Split two-column customizer with **live synchronized mobile preview**
   - Color palette presets, widget positioning (bottom-right / bottom-left), custom welcome messages, and question chips
   - Direct real-time updates as user edits controls

6. **Conversations Inbox (3-Panel Workspace)**
   - **Left Panel:** Thread search, filter tags (All, Open, AI-handled, Needs handoff, Resolved), unread badges, lead scores
   - **Center Panel:** Thread history with source citations, human takeover toggle, "Suggest AI Reply" generator, operator composer
   - **Right Panel:** Visitor telemetry (IP, location, referrer), lead score progress, conversation summary, internal notes

7. **Leads CRM & Pipeline**
   - Dual view: **Kanban Pipeline** (New ➔ Qualified ➔ Contacted ➔ Booked ➔ Won ➔ Lost) and **Table View**
   - Summary metric badges and search/filter bar
   - Side drawer inspecting contact details, qualification answers, conversation links, and activity timelines

8. **Appointments & Scheduling**
   - Weekly calendar visual grid + list view
   - Google Calendar sync status
   - Appointment detail drawer with reschedule/cancellation actions
   - Working hours & availability configuration modal

9. **Deep Analytics Dashboard**
   - 4 specialized analytics modules:
     - **Conversations:** Volume curves, resolution rates, response latency, handoff trends
     - **Leads:** Funnel drop-offs, lead score distribution, top-performing bots
     - **Knowledge:** Most referenced files, low-confidence queries, training recommendations
     - **AI Cost:** Budget progress, model expenditure breakdown, token count tracking

10. **AI Provider & Model Routing**
    - Multi-provider cards: OpenRouter, OpenAI, Anthropic
    - Tiered routing rules (Standard chat vs. Complex questions vs. Fallback)
    - Organization budget guardrails with soft warnings and hard limit behaviors
    - Real-time simulated inference log with token counts, costs, and latency metrics

11. **Developer & Integrations**
    - Copy-to-clipboard embed script with domain allowlisting
    - Masked API key generation and revocation
    - Webhook event dispatch subscriptions (Lead Created, Conversation Started, Handoff Requested, Appointment Booked) with test ping tool
    - Platform installation snippets (HTML, React, WordPress, Shopify, Webflow)

12. **Billing & Subscriptions**
    - Free, Starter, and Pro tier comparison
    - Plan limits meters (Conversations, Knowledge sources, Team seats)
    - Invoice history table with receipt download simulation

13. **Settings & Team Governance**
    - Organization profile & timezone configuration
    - Team member roles (Owner, Admin, Agent, Viewer) and invite modal
    - Event notification dispatch toggles (Hot lead alert, Daily AI briefing)
    - GDPR/CCPA data retention and IP masking controls
    - Workspace backup export

14. **Customer-Facing Chat Widget**
    - Interactive floating widget (bottom-right or bottom-left)
    - Streaming message simulation with source citations
    - Interactive lead capture form
    - Autonomous appointment booking with tappable time slot chips
    - Human operator handoff button
    - Offline & error state simulators for testing

---

## 🛠️ Tech Stack & Constraints

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (Warm slate palette, zero neon, accessible contrast)
- **Icons:** Lucide React
- **Data Visualizations:** Recharts (ResponsiveContainer, AreaChart, BarChart, LineChart)
- **State Management:** Centralized React Context (`AppContext.tsx`) with optimistic updates and custom toasts
- **Architecture:** Pure frontend architecture with seeded mock data—no external API keys or server databases required.

---

## 💻 Local Development

### Prerequisites
- Node.js 18.17+ or Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/jabirrrr/chatbot-agent.git
cd chatbot-agent

# Install dependencies
npm install

# Start the development server (configured with Webpack for Windows compatibility)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```
