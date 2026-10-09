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
        # 1. Content-Security-Policy (CSP) & CORS for public widget endpoints
        # Allows widget embedding and cross-origin public API calls across customer websites
        is_widget = request.url.path.startswith("/api/v1/widget") or request.url.path.startswith("/widget")
        
        # Handle OPTIONS preflights for public widget endpoints
        if is_widget and request.method == "OPTIONS":
            origin = request.headers.get("origin") or "*"
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
                    "Access-Control-Max-Age": "86400",
                    "Vary": "Origin"
                }
            )

        response = await call_next(request)

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
            origin = request.headers.get("origin") or "*"
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept"
            response.headers["Vary"] = "Origin"
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
