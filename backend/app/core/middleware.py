from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import logging

logger = logging.getLogger("helio-security-headers")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Injects enterprise-grade HTTP security headers on all API responses.
    Allows iframe embedding for widget endpoints while enforcing strict frame-ancestors
    and CSP policies across admin and dashboard routes.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # 1. Content-Security-Policy (CSP)
        # Allows widget embedding while restricting scripts and frames for dashboard
        is_widget = request.url.path.startswith("/api/v1/widget") or request.url.path.startswith("/widget")
        if is_widget:
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; "
                "style-src 'self' 'unsafe-inline' https:; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https: ws: wss:; "
                "frame-ancestors *;"
            )
            response.headers["X-Frame-Options"] = "ALLOWALL"
        else:
            csp = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https: ws: wss:; "
                "frame-ancestors 'self';"
            )
            response.headers["X-Frame-Options"] = "SAMEORIGIN"

        response.headers["Content-Security-Policy"] = csp

        # 2. Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 3. HTTP Strict Transport Security (HSTS)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # 4. Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 5. X-XSS-Protection (Legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # 6. Permissions Policy
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=()"

        return response
