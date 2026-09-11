# Milestone 04 Issues & Technical Debt

**Milestone:** `M4 - Operator Dashboard, Inbox, Leads CRM & Analytics`  
**Status:** Clean (0 Open Issues / 0 Blockers)  
**Last Audited:** 2026-09-12 00:26:00 UTC  

---

## 1. Resolved Issues During Implementation

| Issue ID | Category | Description | Resolution | Status |
| :--- | :--- | :--- | :--- | :---: |
| `ISSUE-M4-001` | Test Isolation | Module-level dependency overrides in `test_api_endpoints.py` cleared by test reset fixture | Defined explicit dependency overrides inside `test_public_widget_config_not_found` and scoped tests cleanly | **RESOLVED** |
| `ISSUE-M4-002` | Pydantic Schema | `tokens_used` missing or None on older test fixtures causing validation error | Added `Optional[int] = 0` default to `MessageRead` schema | **RESOLVED** |
| `ISSUE-M4-003` | Mock Session Query Dispatch | Ambiguous SQL string matching in `MockDbSessionAnalytics` between daily trend and model group queries | Added specific `to_char` token inspection to differentiate daily metrics from model breakdown | **RESOLVED** |

---

## 2. Technical Debt Register
- None. Zero technical debt items accumulated in Milestone 04.
