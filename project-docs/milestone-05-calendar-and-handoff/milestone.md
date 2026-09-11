# Milestone 05: Google Calendar Scheduling & Real-Time Human Operator Handoff

**Platform:** `chatbot-agent`  
**Phase:** Phase 2 (Full Platform)  
**Milestone ID:** `M5`  
**Status:** Defined / Pending M4  

---

## 1. Milestone Goal
Add conversational appointment booking via Google Calendar OAuth 2.0 and implement real-time human agent takeover over WebSockets and Redis Pub/Sub.

---

## 2. Requirements Covered
- **REQ-APPT-01:** Calendar Provider Abstraction & Google OAuth 2.0
- **REQ-APPT-02:** In-Widget Slot Selection & Booking
- **REQ-APPT-03:** Appointment List in Dashboard
- **REQ-APPT-04:** Calendar Failure Graceful Degradation
- **REQ-AI-05:** Human Agent Handoff Protocol
- **REQ-CONV-03:** Real-Time Conversation Updates (WebSockets)
- **REQ-INT-01:** Integration Framework & Encrypted Vault

---

## 3. Implementation Tasks
1. **Google Calendar Adapter (`app/adapters/calendar/google.py`):**
   - OAuth 2.0 flow, token encryption with AES-256-GCM.
   - Query free/busy slots via `freeBusy` API.
   - Create calendar events with Google Meet links.
2. **Calendar Tool Calling in RAG Engine:**
   - Tools: `check_availability(date)` and `book_appointment(date, time, name, email)`.
3. **In-Widget Calendar Component:**
   - Lightweight date-picker and available slot selector embedded in chat stream.
4. **Real-Time Human Handoff Engine (`app/services/handoff_service.py`):**
   - Visitor requests human $\rightarrow$ conversation status transitions to `waiting_handoff`.
   - Redis Pub/Sub dispatches real-time WebSocket alert to dashboard operators.
   - Operator clicks "Take Over", AI generation pauses, bi-directional live operator messaging activates.
