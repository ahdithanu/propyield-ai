import time
from collections import defaultdict
from typing import Dict, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding window token-bucket rate limiter.
    Provides DDoS protection and brute-force authentication protection.
    """
    def __init__(
        self,
        app,
        global_limit: int = 150,
        auth_limit: int = 15,
        window_seconds: int = 60,
        max_tracked_ips: int = 10000
    ):
        super().__init__(app)
        self.global_limit = global_limit
        self.auth_limit = auth_limit
        self.window_seconds = window_seconds
        self.max_tracked_ips = max_tracked_ips
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.auth_requests: Dict[str, List[float]] = defaultdict(list)

    def _evict_stale_ips(self, window_start: float) -> None:
        """Evicts expired IP buckets and enforces a hard upper bound on tracked keys."""
        for store in (self.requests, self.auth_requests):
            stale_ips = [ip for ip, ts in store.items() if not ts or ts[-1] <= window_start]
            for ip in stale_ips:
                store.pop(ip, None)
            if len(store) > self.max_tracked_ips:
                # Evict oldest 20% of tracked IPs if under spoofed IP flood
                sorted_ips = sorted(store.items(), key=lambda kv: kv[1][-1] if kv[1] else 0.0)
                for ip, _ in sorted_ips[: max(1, self.max_tracked_ips // 5)]:
                    store.pop(ip, None)

    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        now = time.time()
        window_start = now - self.window_seconds

        if len(self.requests) >= self.max_tracked_ips or len(self.auth_requests) >= self.max_tracked_ips:
            self._evict_stale_ips(window_start)

        # Clean old timestamps for current client_ip
        if client_ip in self.requests:
            self.requests[client_ip] = [t for t in self.requests[client_ip] if t > window_start]
            if not self.requests[client_ip]:
                self.requests.pop(client_ip, None)
        if client_ip in self.auth_requests:
            self.auth_requests[client_ip] = [t for t in self.auth_requests[client_ip] if t > window_start]
            if not self.auth_requests[client_ip]:
                self.auth_requests.pop(client_ip, None)

        # Check strict auth limits on login / register / token routes
        if "/auth/" in path and request.method == "POST":
            if len(self.auth_requests[client_ip]) >= self.auth_limit:
                retry_after = int(self.window_seconds - (now - self.auth_requests[client_ip][0]))
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many authentication attempts. Please try again later.",
                        "error_code": "AUTH_RATE_LIMIT_EXCEEDED"
                    },
                    headers={"Retry-After": str(max(1, retry_after))}
                )
            self.auth_requests[client_ip].append(now)

        # Check global limit
        if len(self.requests[client_ip]) >= self.global_limit:
            retry_after = int(self.window_seconds - (now - self.requests[client_ip][0]))
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Global API rate limit exceeded. Please slow down your requests.",
                    "error_code": "GLOBAL_RATE_LIMIT_EXCEEDED"
                },
                headers={"Retry-After": str(max(1, retry_after))}
            )

        self.requests[client_ip].append(now)
        response = await call_next(request)

        remaining = max(0, self.global_limit - len(self.requests[client_ip]))
        response.headers["X-RateLimit-Limit"] = str(self.global_limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(now + self.window_seconds))

        return response
