from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    World-class CISO compliance middleware: injects strict HTTP security headers
    to defend against clickjacking, MIME sniffing, SSL stripping, and XSS attacks.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # 1. Enforce HSTS (HTTP Strict Transport Security) over TLS
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        
        # 2. Defend against Clickjacking
        response.headers.setdefault("X-Frame-Options", "DENY")
        
        # 3. Defend against MIME-type confusion attacks
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        
        # 4. Strict Referrer policy prevents token/path leaks
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        
        # 5. Lock down browser hardware APIs
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)")
        
        # 6. Legacy XSS filter backstop
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        
        return response
