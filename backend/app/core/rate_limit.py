import time
from collections import defaultdict
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
import logging

logger = logging.getLogger("helio-rate-limiter")


class SlidingWindowRateLimiter:
    """
    In-memory sliding window rate limiter tracking request timestamps per client key.
    Automatically purges expired window entries to prevent memory growth.
    """

    def __init__(self):
        # Key: client_key -> List of timestamps
        self._history: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int, int]:
        """
        Determines whether a request with the given key is allowed.
        Returns (is_allowed, remaining_requests, retry_after_seconds).
        """
        now = time.time()
        window_start = now - window_seconds

        # Clean timestamps older than the window
        timestamps = [t for t in self._history[key] if t > window_start]
        self._history[key] = timestamps

        if len(timestamps) >= max_requests:
            # Oldest timestamp in window determines retry-after
            oldest = timestamps[0]
            retry_after = max(1, int(window_seconds - (now - oldest)))
            return False, 0, retry_after

        # Record this request
        self._history[key].append(now)
        remaining = max_requests - len(self._history[key])
        return True, remaining, 0

    def reset(self):
        """Clears all rate limit state (useful in test harnesses)."""
        self._history.clear()


limiter = SlidingWindowRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Enforces per-route sliding window rate limits on incoming HTTP requests.
    Excludes health check endpoints and documentation paths.
    """

    # Route prefix -> (max_requests_per_window, window_seconds)
    ROUTE_LIMITS = {
        "/api/v1/auth/login": (15, 60),
        "/api/v1/auth/register": (15, 60),
        "/api/v1/widget/message": (60, 60),
        "/api/v1/public/": (120, 60),
    }
    DEFAULT_LIMIT = (300, 60)

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # Whitelist health checks and docs
        if path in ("/health", "/api/v1/health", "/docs", "/redoc", "/openapi.json"):
            return await call_next(request)

        # Determine client identifier (API Key header, Authorization header, or Client IP)
        api_key = request.headers.get("X-API-Key")
        auth_header = request.headers.get("Authorization")
        client_ip = request.client.host if request.client else "127.0.0.1"

        client_id = api_key or auth_header or client_ip

        # Match limit policy
        max_requests, window_seconds = self.DEFAULT_LIMIT
        for prefix, limit_policy in self.ROUTE_LIMITS.items():
            if path.startswith(prefix):
                max_requests, window_seconds = limit_policy
                break

        key = f"{client_id}:{path}"
        allowed, remaining, retry_after = limiter.is_allowed(key, max_requests, window_seconds)

        if not allowed:
            logger.warning(f"Rate limit exceeded for {key} on {path} (retry after {retry_after}s)")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please wait before retrying.",
                    "retry_after": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0"
                }
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
