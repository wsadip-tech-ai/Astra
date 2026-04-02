import os
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class InternalSecretMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        expected = os.environ.get("INTERNAL_SECRET", "")
        provided = request.headers.get("X-Internal-Secret", "")

        if not expected or provided != expected:
            return JSONResponse(
                status_code=401,
                content={"error": "unauthorized"},
            )

        return await call_next(request)
