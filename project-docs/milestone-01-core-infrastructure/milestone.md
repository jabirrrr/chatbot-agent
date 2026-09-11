# Milestone 01: Core Infrastructure, Multi-Tenant Authentication & RBAC

**Platform:** `chatbot-agent`  
**Phase:** Phase 0 (Foundation)  
**Milestone ID:** `M1`  
**Status:** Blocked on Mandatory UI Design Gate / Awaiting M0  

---

## 1. Milestone Goal
Deliver complete multi-tenant database isolation, user identity, session management, organization workspaces, and role-based access control (RBAC).

---

## 2. Requirements Covered
- **REQ-AUTH-01:** User Registration (Email/Password with Argon2id)
- **REQ-AUTH-02:** Login & Refresh Token Rotation (HttpOnly cookies)
- **REQ-AUTH-03:** Password Reset via Email
- **REQ-AUTH-04:** Google OAuth 2.0 Social Login
- **REQ-AUTH-05:** Email Verification Flow
- **REQ-ORG-01:** Organization / Workspace Creation
- **REQ-ORG-02:** Role-Based Access Control (`Owner`, `Admin`, `Member`)
- **REQ-ORG-03:** Team Member Invitations with signed tokens
- **REQ-ORG-04:** Strict PostgreSQL Row-Level Security (RLS)

---

## 3. Implementation Tasks
1. **Database Models & Alembic Migrations:**
   - `users`, `organizations`, `organization_members`, `invitations`.
   - PostgreSQL Row-Level Security policies on tenant-scoped tables.
2. **Security & Cryptography Subsystem:**
   - Argon2id password hashing (`passlib[argon2]`).
   - Short-lived JWT access tokens (15–30 min) and rotating refresh tokens (30 days).
3. **API Endpoints (`app/api/v1/`):**
   - `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/verify-email`.
   - `POST /auth/forgot-password`, `POST /auth/reset-password`.
   - `POST /organizations`, `GET /organizations/me`, `POST /organizations/invite`.
4. **Tenant Context Middleware:**
   - Injects `SET LOCAL app.current_org_id = :org_id` on every authenticated request.

---

## 4. Mandatory UI Design Gate
> [!IMPORTANT]
> Milestone 1 frontend implementation requires the approved UI design prompt and reference design before dashboard component development can commence.
