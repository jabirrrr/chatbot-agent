# Milestone 05 Test Plan & Verification Matrix

**Milestone:** `M5 - Calendar Scheduling & Human Handoff`  
**Status:** Defined / Pending M4  

---

## 1. Test Cases

| Test ID | Requirement ID | Description | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-APPT-001` | REQ-APPT-01 | Google Calendar OAuth link | Org Admin | Initiate Google OAuth connect flow | Redirects, completes handshake; refresh token stored encrypted in DB | NOT RUN |
| `TEST-APPT-002` | REQ-APPT-02 | In-chat slot booking | Calendar connected | Ask bot: *"Can I book a demo tomorrow at 2 PM?"* | Bot calls `check_availability`, offers slot, confirms booking; event appears on Google Calendar | NOT RUN |
| `TEST-APPT-004` | REQ-APPT-04 | Calendar failure degradation | Calendar API error | Simulate Google 500 error | Bot politely informs visitor: *"Calendar is temporarily unavailable. What time works best? I'll notify the team directly."* | NOT RUN |
| `TEST-AI-005` | REQ-AI-05 | Human agent takeover flow | Active chat | Visitor types: *"I need to speak to a person"* | Status updates to `waiting_handoff`; dashboard receives instant WebSocket notification; operator joins and sends message | NOT RUN |
