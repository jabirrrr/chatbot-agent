# Milestone 04 Test Plan & Verification Matrix

**Milestone:** `M4 - Operator Dashboard & Leads CRM`  
**Status:** Defined / Pending M3  

---

## 1. Test Cases

| Test ID | Requirement ID | Description | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-CONV-001` | REQ-CONV-01 | Conversation list search & filter | Conversations in DB | Filter by `status = active` and search visitor keyword | Matching threads returned; list updates reactively | NOT RUN |
| `TEST-CONV-002` | REQ-CONV-02 | Thread detail viewing | Selected conversation | Click conversation in list | Thread renders user and assistant messages with token timestamps | NOT RUN |
| `TEST-LEAD-001` | REQ-LEAD-01 | Lead detail drawer | Captured lead | Click lead name in table | Sidebar slides open displaying email, phone, requirements, and origin conversation link | NOT RUN |
| `TEST-LEAD-003` | REQ-LEAD-03 | Lead CSV export | Leads exist | Click "Export CSV" button | Downloads valid `.csv` file with RFC 4180 escaping | NOT RUN |
| `TEST-ANA-005` | REQ-ANALYTICS-05 | AI token cost calculation | Messages exchanged | View overview dashboard | Displays accurate token usage and cost accounting matching OpenRouter rates | NOT RUN |
