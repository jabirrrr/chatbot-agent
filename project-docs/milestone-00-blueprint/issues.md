# Milestone Issues & Defect Register

**Milestone:** `FE-01 / Prototype & Design Verification`  
**Classification:** Quality Assurance & Audit Records  
**Status:** All Issues Resolved  

---

## 1. Resolved Issues During Validation

### ISS-01: Widget Lead & Appointment Submissions Not Persisted to CRM State
* **Severity:** P2 - HIGH
* **Requirement Affected:** `REQ-FE-LEADS`, `REQ-FE-APPTS`, `REQ-FE-WIDGET`
* **Root Cause:** In the initial widget implementation, `handleLeadSubmit` and `handleSlotSelect` dispatched user toasts and updated internal widget flags, but did not call state mutators on `AppContext` to insert records into `leads` or `appointments`.
* **Impact:** In interactive testing, after a visitor submitted their email in the widget or picked a calendar slot, visiting the Leads CRM or Appointments tab did not show the new entry.
* **Resolution:** Added `addLead` and `addAppointment` to `AppContext.tsx` and connected them directly to `handleLeadSubmit` and `handleSlotSelect` in `CustomerChatWidget.tsx`.
* **Verification:** Re-tested by submitting "Sarah Miller" in chat widget; lead immediately appeared in the Kanban "New Inquiries" stage and appointment appeared in Tuesday's calendar grid.
* **Status:** 🟢 **FIXED & VERIFIED**

---

### ISS-02: Missing Filter Pills in Conversations Inbox
* **Severity:** P3 - MEDIUM
* **Requirement Affected:** `REQ-FE-INBOX`
* **Root Cause:** `ConversationsInbox.tsx` only exposed `All`, `Open`, `Handoff Alert`, and `Resolved` pill buttons in the header, omitting `AI Handled` and `Assigned To Me` requested by the PRD.
* **Impact:** Operators could not quickly filter threads specifically handled autonomously by AI or assigned directly to their user profile.
* **Resolution:** Extended `statusFilter` union type in `ConversationsInbox.tsx` to include `ai-handled` and `assigned_to_me`, updated filter evaluation logic, and added the missing UI pill buttons.
* **Verification:** Re-tested clicking `AI Handled` (displays 2 threads) and `Assigned To Me` (filters to Sarah Jenkins's threads).
* **Status:** 🟢 **FIXED & VERIFIED**

---

## 2. Deferred / Future Work Issues
* None for current frontend milestone. Fullstack backend integration, PostgreSQL `pgvector` containerization, and Celery workers are scheduled for subsequent milestones per `implementation.md`.
