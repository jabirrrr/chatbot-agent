# Milestone 09: Issues & Resolution Register

**Platform:** `chatbot-agent`  
**Milestone:** `M9` — Public Launch & Scaling (General Availability)  
**Date:** September 12, 2026  

---

## 1. Issues Register

| Issue ID | Severity | Description | Root Cause | Status | Resolution |
| :---: | :---: | :--- | :--- | :---: | :--- |
| `ISSUE-M9-01` | P3 | `test_beta_pilot.py` 404 when router prefix was duplicated | In `router.py`, `beta_router` was mounted with redundant `prefix="/beta"` while `beta_router` already declared `prefix="/beta"`. | **RESOLVED** | Removed redundant `prefix="/beta"` in `router.py`. All 95 tests now pass cleanly. |
| `ISSUE-M9-02` | P4 | Missing `Globe` and `Activity` icon imports in `Sidebar.tsx` | Added navigation links without updating the `lucide-react` import statement. | **RESOLVED** | Added `Globe` and `Activity` to `Sidebar.tsx` imports. Clean build verified. |

---

## 2. Unresolved Issues
- **None (0 open issues).**
