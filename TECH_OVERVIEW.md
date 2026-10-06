# Helio - Product & Technology Overview

## Product Description
**Helio** is an autonomous AI chatbot and lead generation SaaS platform designed specifically for small and medium-sized businesses (SMBs). It allows business owners to create, train, and deploy custom AI agents on their websites in under 30 minutes. 

The platform enables these AI agents to:
- Answer business queries grounded in company documentation (Knowledge Base).
- Capture high-intent leads and qualify them.
- Schedule calendar meetings automatically.
- Seamlessly hand off conversations to human operators.

---

## 🛠️ Technology Stack

### Frontend Architecture
- **Framework**: Next.js 16+ (using the App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Area charts, bar charts, line charts for analytics)
- **State Management**: Centralized React Context (`AppContext.tsx`) with optimistic updates.
- **Components**: Radix UI / custom accessible components (inferred from modern Next.js practices).

### Backend Architecture
- **Framework**: FastAPI (Python)
- **Language**: Python 3.14+ (or compatible versions)
- **Database ORM**: SQLAlchemy (with `asyncio` for asynchronous database operations)
- **Migrations**: Alembic
- **Validation**: Pydantic v2 (for robust data validation and settings management)
- **Background Tasks/Caching**: Redis (Optional rate limiting and async broker)

### Database & Storage
- **Primary Database**: PostgreSQL 
- **Vector Database**: PostgreSQL with `pgvector` extension (used for storing document embeddings and enabling semantic search in the Knowledge Base Studio).
- **Object Storage**: S3-compatible storage (AWS S3, Cloudflare R2, MinIO) for storing user-uploaded documents for AI training.

---

## 🔌 APIs & External Services

The platform relies on several key external APIs to power its autonomous features:

### 1. Artificial Intelligence (LLMs & Embeddings)
- **OpenRouter API**: The primary LLM API provider used to power the conversational AI agent, reasoning, and tool execution.
- **OpenAI API**: Specifically used for generating 1536-dimensional vector embeddings (via `text-embedding-3-small`) when businesses upload their documentation.
- **Fallback Providers**: Support for Anthropic, Gemini, and Groq APIs for robust model routing.

### 2. Integrations & Communications
- **Google Calendar API**: Used to allow the AI agent to view availability and autonomously schedule appointments directly into the business's calendar.
- **Transactional Email**: SMTP/Resend integration for system notifications (e.g., hot lead alerts, daily briefings).

### 3. Infrastructure & Operations
- **Stripe API**: Used for commercial monetization, billing, and handling subscription tiers (Free, Starter, Pro).
- **Sentry**: For error tracking and performance monitoring.

---

## 🔐 Authentication & OAuth

Helio employs a secure, multi-layered authentication strategy:

- **Primary Authentication**: 
  - Standard email/password flow utilizing **Passlib with Argon2** hashing for secure password storage.
  - **JWT (JSON Web Tokens)** via `python-jose` for secure, stateless API session management (Access & Refresh tokens).

- **Google OAuth 2.0**:
  - Frontend utilizes `@react-oauth/google` for "Sign in with Google" flows.
  - Required for the **Google Calendar Integration**. The system requests specific scopes to manage calendar events, allowing the AI to book meetings on behalf of the user.

- **Data Encryption**:
  - A dedicated AES-256-GCM Vault Key (`VAULT_SECRET_KEY`) is used at the database level to encrypt sensitive third-party OAuth tokens (like the Google Calendar refresh tokens) before they are stored in PostgreSQL.

---

## 🚀 Key Platform Features
- **5-Step Onboarding**: Wizard to set up the business profile, upload knowledge, configure AI tone, and customize the chat widget.
- **Knowledge Base Studio**: Manages vector search chunking, FAQs, and URLs to ground the AI's answers.
- **Conversations Inbox**: A 3-panel workspace for human operators to monitor AI chats, take over threads, and view visitor telemetry.
- **Leads CRM**: Kanban pipeline visualizing leads from 'New' to 'Booked' and 'Won'.
- **Deep Analytics Dashboard**: Visualizes conversation volumes, lead funnels, and AI token cost expenditure.
