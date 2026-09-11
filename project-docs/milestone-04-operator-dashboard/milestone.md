# Milestone 04: Operator Dashboard, Inbox, Leads CRM & Analytics

**Platform:** `chatbot-agent`  
**Phase:** Phase 1 (Core Product)  
**Milestone ID:** `M4`  
**Status:** Defined / Pending M3 & UI Design Gate  

---

## 1. Milestone Goal
Build the Next.js 14 App Router dashboard for organization operators: self-serve onboarding wizard, conversation inbox and thread viewer, lead pipeline table with CSV export, and AI token cost analytics.

---

## 2. Requirements Covered
- **REQ-CONV-01:** Conversation List with Filters & Search
- **REQ-CONV-02:** Conversation Detail Thread & Context View
- **REQ-LEAD-01:** Lead Profile & Detail Sidebar
- **REQ-LEAD-02:** Lead Pipeline List & Search
- **REQ-LEAD-03:** Lead Export to CSV
- **REQ-ANALYTICS-01:** Executive Overview Dashboard
- **REQ-ANALYTICS-05:** AI Usage & Per-Tenant Token Cost Accounting

---

## 3. Implementation Tasks
1. **Next.js 14 App Router Scaffolding (`frontend/src/app/`):**
   - Theme provider, sidebar navigation, authenticated layouts.
2. **Onboarding Setup Wizard (`/onboarding`):**
   - Step 1: Business Profile & hours.
   - Step 2: Knowledge file upload.
   - Step 3: Interactive live chatbot preview & snippet generator.
3. **Conversations Module (`/dashboard/conversations`):**
   - Real-time conversation list, status filter (`Active`, `Resolved`, `Abandoned`).
   - Thread viewer with visitor metadata (IP, location, browser, referrer).
4. **Leads CRM Module (`/dashboard/leads`):**
   - Lead table with search, status dropdown (`New`, `Contacted`, `Converted`).
   - Lead detail slide-over sidebar with conversation transcript link.
   - Streaming CSV export endpoint.
5. **Analytics & AI Cost Metrics (`/dashboard/overview`):**
   - Token consumption counters and estimated cost breakdown per model.
