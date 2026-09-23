# Backend Troubleshooting Guide (Render, FastAPI, PostgreSQL)

This document contains standard operating procedures (SOPs) for diagnosing and resolving back-end issues related to the Render deployment, database connections, and API behavior.

## 1. CORS Errors (Cross-Origin Resource Sharing)
**Symptom**: When the widget tries to fetch data from the backend, the browser console shows a red `CORS policy` error, blocking the request.
**Root Cause**: The Render backend is rejecting requests because the origin (the website where the widget is embedded) is not in the allowed CORS list.
**Diagnosis**:
Check the Network tab in Developer Tools. The `OPTIONS` preflight request will fail.

**Solution**:
1. Check the `BACKEND_CORS_ORIGINS` environment variable in your Render dashboard.
2. Ensure the specific domain where the widget is embedded (e.g., `http://127.0.0.1:3000` or `https://client-website.com`) is allowed.
3. The backend currently uses regex matching (`CORS_ORIGIN_REGEX`) for dynamic origins. Ensure the regex correctly covers the required domains.

**Configuration Snippet (`backend/app/core/config.py`)**:
```python
# To allow wildcard for widgets (use with caution in production):
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Or specifically list client domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 2. Database Connection Errors (Supabase / Postgres)
**Symptom**: Render deployment fails to start, or API endpoints return `500 Internal Server Error`. Render Logs show `asyncpg.exceptions.InvalidAuthorizationSpecificationError` or `Connection refused`.
**Root Cause**: The FastAPI app is failing to connect to the PostgreSQL (Supabase) database.
**Diagnosis**:
Check the Render Logs for the specific Python traceback during startup.

**Solution**:
1. Go to your Render Dashboard -> Environment Variables.
2. Ensure `DATABASE_ASYNC_URL` is set correctly. 
3. **Crucial Detail**: Because you are using `asyncpg`, the URL must use the `postgresql+asyncpg://` scheme, NOT `postgres://` or `postgresql://`.

**Snippet for Render Env Var:**
```env
# Correct
DATABASE_ASYNC_URL="postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[SUPABASE-PROJECT-REF].supabase.co:5432/postgres"

# Incorrect (will cause runtime crashes)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[SUPABASE-PROJECT-REF].supabase.co:5432/postgres"
```

---

## 3. Chat Session Fails / Chatbot Offline 
**Symptom**: The `/api/v1/widget/session` or `/api/v1/widget/config` endpoints return `404 Not Found` even when Render is up and running.
**Root Cause**: The chatbot `data-chatly-id` passed from the widget script doesn't match an active chatbot in the database.
**Diagnosis**:
Check the Render application logs. If the query `select(Chatbot).where(Chatbot.widget_token == token)` returns `None`, a 404 is deliberately thrown by the application logic.

**Solution**:
1. Verify the exact `bot_xxxxxx` token in the snippet.
2. Check your Supabase database `chatbots` table to ensure that specific `widget_token` exists and `is_active` is set to `true`.

**SQL Snippet (Supabase SQL Editor):**
```sql
-- Check if the token exists and is active
SELECT id, name, is_active FROM chatbots WHERE widget_token = 'bot_1790168230791';

-- Manually reactivate if necessary
UPDATE chatbots SET is_active = true WHERE widget_token = 'bot_1790168230791';
```

---

## 4. Render Deployment Fails (Build Errors)
**Symptom**: The "Deploy" step in Render fails with `ModuleNotFoundError` or similar python packaging errors.
**Root Cause**: Render is executing from the wrong root directory or using an incorrect build command.
**Solution**:
Ensure your Render Web Service settings are configured properly for a monorepo setup.

**Render Settings Snippet:**
*   **Root Directory:** `backend` (Important: If you deploy the whole monorepo, set root dir to backend)
*   **Build Command:** `pip install -r requirements.txt`
*   **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## 5. Google Calendar OAuth: `invalid_client` Error
**Symptom**: After selecting a Google Account on the consent screen, the user is redirected back to the frontend with an error toast reading: `Google Calendar authorization failed: Failed to exchange Google OAuth code: { "error": "invalid_client", "error_description": "..." }`.
**Root Cause**: The backend successfully received the authorization code from Google but failed to exchange it for an access token because the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` provided in the backend's `.env` (or Render Environment Variables) are either invalid, mismatched, or have been revoked in the Google Cloud Console.
**Diagnosis**:
Check the `.env` file or Render environment variables for `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. If they are placeholder values (like `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` which is often a generic mock structure), the real Google OAuth exchange will fail.

**Solution**:
You have two options depending on your goal:

**Option A (Production - Real Integration):**
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a Project and configure the **OAuth consent screen**.
3. Go to **Credentials** -> Create Credentials -> **OAuth client ID** (Web application).
4. Add your exact Redirect URI (e.g., `https://helio-backend-s55x.onrender.com/api/v1/integrations/google-calendar/callback`) to the **Authorized redirect URIs**.
5. Copy the generated **Client ID** and **Client Secret** and update your backend `.env` (or Render Dashboard).

**Option B (Local Testing - Mock Integration):**
If you just want to test the booking UI without setting up a real GCP project, force the backend into the mock flow by prefixing the secret with `mock-`.
1. Open your backend `.env` file.
2. Change the secret to: `GOOGLE_CLIENT_SECRET=mock-secret`
3. Restart the backend. When you click Connect, it will use a mock flow and immediately succeed, allowing you to test the widget's appointment booking logic.
