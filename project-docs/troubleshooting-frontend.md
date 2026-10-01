# Frontend Troubleshooting Guide (Vercel & Widget)

This document contains standard operating procedures (SOPs) for diagnosing and resolving front-end issues related to the Next.js Vercel deployment and the `widget.js` embed.

## 1. Widget: "Chatbot Unavailable" Card Appears
**Symptom**: When embedding the widget on a test site or client site, a large white card reading "Chatbot Unavailable" takes over the screen.
**Root Cause**: A conflicting or legacy chat script (e.g., `adszoobot-chatbot-widget`) is present on the page alongside our script.
**Solution**:
1. Search the host HTML file for any other `<script>` tags injecting chatbots.
2. Remove the conflicting script. 

**Snippet to Remove:**
```html
<!-- REMOVE THIS -->
<script>
  (function() {
    var d = document, s = d.createElement("script");
    s.src = "https://adszoobot-chatbot-widget-5911.ai.studio/embed.js";
    // ...
  })();
</script>
```

---

## 2. Widget: Chat Window is Completely Empty (Silent Failure)
**Symptom**: The chat widget button appears, but when clicked, the window opens completely blank. No welcome message is shown, and typing/sending a message does nothing.
**Root Cause**: The `widget.js` script failed to initialize its session by calling the backend API (`/api/v1/widget/config`), and aborted silently. This usually means the Vercel proxy is failing (returning a 404).
**Diagnosis**:
1. Open Browser Developer Tools (F12) -> **Network Tab**.
2. Refresh the page. Look for requests to `/api/v1/widget/config` and `/api/v1/widget/session`.
3. If they return `404 Not Found`, proceed to the solution below.

**Solution**:
Ensure that Vercel knows how to proxy API requests to your Render backend.
1. Go to your **Vercel Project Dashboard** -> **Settings** -> **Environment Variables**.
2. Add a new variable: 
   * **Key:** `FASTAPI_URL`
   * **Value:** `https://your-backend-app.onrender.com` (Your Render deployment URL)
3. **Redeploy** the Vercel project so the Next.js config (`next.config.ts`) can apply the rewrite rule.

---

## 3. Widget: Hardcoding the API Backend (Bypassing Vercel Proxy)
**Scenario**: You want the widget to talk *directly* to the Render backend, skipping the Vercel proxy entirely to reduce latency and avoid Vercel's 10-second timeout limits.
**Solution**: 
Provide the `data-api` attribute directly in the embed snippet given to clients.

**Optimal Embed Snippet:**
```html
<script 
  src="https://chatbot-agent-lemon.vercel.app/widget.js" 
  data-chatly-id="bot_1790168230791" 
  data-api="https://your-backend-app.onrender.com" 
  async>
</script>
```
*Note: The `widget.js` script is programmed to prioritize `data-api` as the `API_BASE` if it exists.*

---

## 4. Next.js Routing Conflicts
**Symptom**: You added a new Python endpoint on Render, but when fetching it via Vercel (e.g., `/api/chat`), Next.js intercepts it instead of proxying it.
**Root Cause**: Next.js automatically claims any route defined in `src/app/api/`. If you have `src/app/api/chat/route.ts`, Vercel will **never** proxy `/api/chat` to Render.
**Solution**:
Keep a strict separation of concerns.
* Next.js API Routes (Server Actions/Webhooks): Keep under `/api/` (e.g., `src/app/api/...`)
* Python FastAPI Routes: Keep entirely under `/api/v1/` to match the exact `next.config.ts` rewrite rule, ensuring they don't overlap with Next.js specific routes.

---

## 5. Integrations: Google Calendar Redirects to Dashboard
**Symptom**: After completing the Google OAuth flow to connect Google Calendar, the user is redirected back to the app but ends up on the main dashboard (`currentScreen = 'home'`) with no success message or indication that the integration worked.
**Root Cause**: When the backend callback (`/api/v1/integrations/google-calendar/callback`) successfully finishes, it redirects the user to `/?screen=integrations&gcal_success=true`. However, the React application context (`AppContext.tsx`) hardcoded the initial `currentScreen` to `'home'`, completely ignoring the `?screen=` query parameter in the URL. Because the app mounted on `'home'`, the `IntegrationsPage` component was never rendered, meaning it never got the chance to read the `gcal_success` URL parameter and show the success toast.
**Diagnosis**:
1. Check if the URL contains `/?screen=integrations&gcal_success=true` after the redirect, but the UI is showing the dashboard.
2. Check `src/context/AppContext.tsx` for how `currentScreen` state is initialized.

**Solution**:
Initialize the `currentScreen` state lazily by parsing `window.location.search`.

**Snippet:**
```tsx
// src/context/AppContext.tsx
const [currentScreen, setCurrentScreenInternal] = useState<NavigationScreen>(() => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const screen = params.get('screen');
    if (screen) {
      return screen as NavigationScreen;
    }
  }
  return 'home';
});
```

### 401 Unauthorized / Network Error during URL Ingestion
**Symptom**: 
Toast notification 'Ingestion Failed: Failed to scrape and index URL' when trying to add a website URL source on the Knowledge Base page.

**Root Cause**: 
There were two simultaneous issues:
1. The `fetch` request was missing the `Authorization: Bearer <token>` header, leading to a 401 Unauthorized response from the backend because the endpoint requires authentication.
2. The `fetch` URL was hardcoded to fallback to `http://localhost:8000` (`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`) instead of using the centralized `API_BASE`. On Vercel, if `NEXT_PUBLIC_API_URL` is undefined, this caused the browser to block the request (Mixed Content) or fail to connect to localhost, completely bypassing Next.js rewrites.

**Diagnosis**: 
Checked `KnowledgeBasePage.tsx` and found the headers object lacked the `Authorization` property, and the fetch URL used a hardcoded fallback instead of `API_BASE` from `src/lib/api.ts`.

**Solution**: 
Extracted `authToken` from `useApp()` context and appended it to the request headers. Also replaced the hardcoded URL with `API_BASE` to ensure correct proxying on Vercel.

**Snippet:**
```tsx
// src/components/knowledge/KnowledgeBasePage.tsx
import { API_BASE } from '@/lib/api';
// ...
const { addToast, knowledgeSources, addKnowledgeSource, removeKnowledgeSource, activeChatbotId, authToken } = useApp();

// ...
const res = await fetch(`${API_BASE}/api/v1/knowledge/sources/url?chatbot_id=${activeChatbotId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  },

},
```
