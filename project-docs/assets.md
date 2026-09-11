# Project Asset Register & Requirements Specification

**Platform:** `chatbot-agent`  
**Classification:** Engineering Asset Management  
**Version:** 1.0.0  

---

## 1. Asset Protocol Standards

In strict accordance with the Zero-Assumption Protocol:
- **No artificial or manufactured assets** (fake brand logos, hallucinated design systems, mocked customer credentials) may be substituted without explicit authorization.
- **Mandatory UI Design Gate:** Implementation of the user-facing dashboard and widget cannot commence until the UI design prompt and reference image/Figma specification are provided.

---

## 2. Master Asset Register

| Asset Name | Why It Is Required | Required Format | Recommended Dimensions / Specs | Where It Will Be Used | Target Milestone | Blocking Status | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **UI Design Prompt & Reference Designs** | Defines visual design tokens, layout hierarchy, color palettes, dark/light modes, spacing, typography, and states for the Dashboard and Widget | Text Prompt + High-Res PNG / Figma URL | 1920x1080 (Desktop), 390x844 (Mobile) | Frontend Dashboard & Widget CSS Architecture | **Milestone 1** | **YES (Hard Gate)** | `PENDING_USER_INPUT` |
| **Platform Brand Logo & Iconography** | Core product branding | Vector SVG + PNG | Vector SVG, 512x512 PNG transparent | Dashboard Header, Auth Screens, Favicon | Milestone 1 | Non-blocking (clean minimal SVG placeholder allowed until final asset) | `PENDING_USER_INPUT` |
| **OpenRouter API Key** | Primary LLM gateway execution for chat completions and tool calls | Secret String (`sk-or-v1-...`) | Active OpenRouter key with account balance | Backend `adapters.llm.openrouter` | Milestone 3 | **YES for M3 testing** | `PENDING_USER_INPUT` |
| **OpenAI API Key** | Semantic vector embeddings (`text-embedding-3-small`) and direct fallback | Secret String (`sk-...`) | Active OpenAI API key with embedding access | Backend `services.rag_service` | Milestone 2 | **YES for M2 testing** | `PENDING_USER_INPUT` |
| **Google Cloud OAuth 2.0 Credentials** | Calendar appointment scheduling integration and consent screen | Client ID & Client Secret | Google Cloud Console OAuth 2.0 Web Application | Backend `adapters.calendar.google` | Milestone 5 | **YES for M5 testing** | `PENDING_USER_INPUT` |
| **Stripe Test API Credentials** | Subscription billing, checkout sessions, and webhook processing | Publishable Key (`pk_test_...`), Secret Key (`sk_test_...`), Webhook Secret (`whsec_...`) | Stripe Sandbox Account | Backend `adapters.billing.stripe` & Frontend Checkout | Milestone 6 | **YES for M6 testing** | `PENDING_USER_INPUT` |
| **Sample Business Knowledge Documents** | Verification of file ingestion, text chunking, and semantic retrieval | PDF, DOCX, TXT | 1–10 pages of typical SMB service FAQs, pricing, terms | Test Harness & Seed Data | Milestone 2 | Non-blocking (can synthesize neutral open sample data) | `READY_FOR_SYNTHESIS` |
