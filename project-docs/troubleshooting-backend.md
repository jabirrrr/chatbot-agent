# Troubleshooting Backend

## Symptom
The chat widget throws a 'Backend Error: An unexpected internal server error occurred.' when the user attempts to book a consultation or check availability (e.g. providing a date and time). The LLM processes the message correctly but the tool execution fails.

## Root Cause
Two main issues were causing 500 Internal Server Errors during the execution of calendar tools (create_calendar_event and get_calendar_availability):
1. **TypeError on duration_minutes**: If the LLM omitted the duration_minutes argument or passed it as a string, `timedelta(minutes=duration_minutes)` or `int(duration_minutes)` would throw a TypeError because the code didn't gracefully handle None or string types.
2. **AttributeError on metadata_json**: When fetching the Cal.com integration, the system called `calcom.metadata_json.get(...)`. If metadata_json was None (which is valid for JSON columns), this threw an AttributeError.
3. **httpx.HTTPStatusError in Cal.com Adapter**: The `CalComService.create_booking` method used `resp.raise_for_status()` when calling the Cal.com API. If the API key was a mock key (e.g. in preview/testing environments) or the slot was invalid, it returned a 400 or 401 error. This threw an unhandled exception that bubbled up and crashed the server with a 500 error instead of gracefully returning a failed status.

## Diagnosis
By tracing the execution path in `backend/app/api/v1/chatbots.py` and `CalendarToolsExecutor.execute_tool` in `calendar_tools.py`, it was evident that the LLM was returning valid tool arguments, but the extraction and type coercion were unsafe. Specifically, `.get('duration_minutes')` can return None if the LLM explicitly returns null in JSON.
In addition, `test_preview.py` execution confirmed that an unhandled `httpx.HTTPStatusError` during booking creation caused the backend preview endpoint to crash prematurely.

## Solution
1. Modified `backend/app/services/calendar_tools.py` to safely parse integers and handle None for JSON metadata fields.
2. Wrapped the POST request in `backend/app/adapters/calendar/calcom.py` within a `try/except` block to gracefully handle API errors.

```python
# 1. Safely handle duration_minutes
raw_duration = args.get('duration_minutes')
try:
    duration_minutes = int(raw_duration) if raw_duration is not None else 30
except (ValueError, TypeError):
    duration_minutes = 30

# 2. Safely handle optional JSON metadata
event_type_id = calcom.metadata_json.get('event_type_id') if calcom.metadata_json else None

# 3. Handle Cal.com API HTTP errors gracefully
try:
    resp = await client.post(
        f"{CalComService.BASE_URL}/bookings",
        params={"apiKey": api_key},
        json=payload
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("booking", {})
except Exception as e:
    print(f"Error creating Cal.com booking: {e}")
    return {}
```

## Symptom
The frontend throws a `TypeError: Failed to fetch` when logging in or navigating to the Admin Dashboard integrations page. The true HTTP 500 error is masked because the browser blocks the response.

## Root Cause
1. **Database Enum Mismatch**: The PostgreSQL `platform_integrations` table contained a row with `provider = 'groq'`, but the Python backend's `ProviderEnum` (in `app/schemas/platform_integration.py`) only defined `openai`, `openrouter`, and `stripe`. This caused SQLAlchemy to crash with a `LookupError` during deserialization.
2. **Missing CORS Headers on Exception**: Because the error occurred deep inside the service layer and bubbled up to the global `ExceptionMiddleware`, Starlette's `CORSMiddleware` (which was outside the exception handler) failed to append `Access-Control-Allow-Origin` headers to the 500 response. This caused the browser to fail the CORS preflight/response check, throwing a generic `Failed to fetch` error that hid the true 500 status.

## Diagnosis
The `Failed to fetch` error locally indicated a network issue, but curling the production backend from PowerShell explicitly returned a `500 Internal Server Error` without CORS headers. A local test script executing `get_integrations(db)` isolated the `LookupError: 'groq' is not among the defined enum values`.

## Solution
Updated the `ProviderEnum` to include `groq` to match the database values.

```python
class ProviderEnum(str, Enum):
    openrouter = "openrouter"
    openai = "openai"
    stripe = "stripe"
    groq = "groq"
```

## Symptom
The login page returns `Failed to fetch` because the production backend endpoint `POST /api/v1/auth/login` fails with a `500 Internal Server Error`, triggering the CORS masking behavior.

## Root Cause
**Schema Drift in RBAC Implementation**: The database was migrated to use `platform_role` instead of `is_superuser`, but the SQLAlchemy `User` model, multiple Pydantic schemas, and API dependencies still expected and queried the `is_superuser` column. When the `/auth/login` endpoint queried the user, the database engine threw an `UndefinedColumnError` causing the auth flow to fail.

## Diagnosis
A local reproduction script was built to test `POST /auth/login` directly via SQLAlchemy session, bypassing the HTTP layer. This immediately surfaced the `psycopg2.errors.UndefinedColumn: column users.is_superuser does not exist`.

## Solution
Updated the codebase to align with the database migration by removing all instances of `is_superuser` and transitioning them to `platform_role`.

1. Replaced `is_superuser` with `platform_role` in `User` model.
2. Updated Pydantic schemas (`UserRead`, `AdminUserItem`).
3. Re-wrote Role-Based Access Control logic in `app/api/deps.py`.
4. Refactored test cases and bootstrap scripts.

## Symptom
External websites embedding the Helio chatbot widget via `<script src=".../widget.js">` encounter browser CORS blocks when initializing chat sessions: `Access to fetch at 'https://.../api/v1/widget/session' from origin 'https://customer-site.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status (status code 400)`. Additionally, saving appearance customizations from the dashboard was erasing unrelated chatbot configurations (e.g. integration settings, calendar IDs, lead capture settings).

## Root Cause
1. **Middleware Ordering in Starlette/FastAPI**: Starlette executes middlewares in reverse order of registration (`app.add_middleware`). Because `CORSMiddleware` was added after `SecurityHeadersMiddleware`, `CORSMiddleware` intercepted incoming requests first. When an external customer origin sent an `OPTIONS` preflight, `CORSMiddleware` rejected it with `400 Bad Request` because the customer domain was not explicitly listed in `settings.BACKEND_CORS_ORIGINS`.
2. **Shallow Replacement in `ChatbotService.update`**: Updating a chatbot's `config_json` replaced the entire dictionary attribute instead of performing a deep merge with existing stored keys.

## Diagnosis
Inspecting the FastAPI middleware stack in `backend/app/main.py` confirmed that `CORSMiddleware` was outermost and threw 400 on unregistered preflight origins. Unit testing `tests/test_domain_auth.py` reproduced the HTTP 400 preflight response. In addition, reviewing `ChatbotService.update()` in `backend/app/services/chatbot_service.py` revealed `setattr(chatbot, k, v)` unconditionally overwritten `config_json`.

## Solution
1. In `backend/app/main.py`, reordered middlewares so `SecurityHeadersMiddleware` wraps `CORSMiddleware` as the outermost handler, directly intercepting public widget routes (`/api/v1/widget/*`) and returning `200 OK` with appropriate CORS preflight headers (`Access-Control-Allow-Origin: <origin>`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Vary: Origin`), while delegating domain restriction enforcement to the endpoint logic.
2. In `backend/app/services/chatbot_service.py`, updated `ChatbotService.update()` to merge incoming `config_json` updates into existing stored settings before persisting.

```python
# backend/app/main.py
# 1. Internal CORS
app.add_middleware(CORSMiddleware, allow_origins=settings.BACKEND_CORS_ORIGINS, ...)

# 2. Rate Limiter
app.add_middleware(RateLimitMiddleware)

# 3. Security Headers & Widget CORS (outermost)
app.add_middleware(SecurityHeadersMiddleware)

# backend/app/services/chatbot_service.py
if "config_json" in update_dict and update_dict["config_json"] is not None:
    merged_config = dict(chatbot.config_json or {})
    merged_config.update(update_dict["config_json"])
    chatbot.config_json = merged_config
    del update_dict["config_json"]
```


