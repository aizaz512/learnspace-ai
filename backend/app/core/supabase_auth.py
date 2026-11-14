
import logging

from contextvars import ContextVar
from dataclasses import dataclass
from functools import lru_cache

from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from starlette.types import ASGIApp, Receive, Scope, Send

from supabase import create_client, Client
from supabase.client import ClientOptions

from app.core.config import (
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
)


logger = logging.getLogger(__name__)


# ==========================================
# AUTHENTICATED REQUEST CONTEXT
# ==========================================

@dataclass(frozen=True)
class SupabaseRequestContext:
    client: object
    user_id: str


_request_context: ContextVar[
    SupabaseRequestContext | None
] = ContextVar(
    "supabase_request_context",
    default=None,
)


def get_supabase_context() -> SupabaseRequestContext:
    context = _request_context.get()

    if context is None:
        raise RuntimeError(
            "No authenticated Supabase request context is available."
        )

    return context


def get_user_supabase_client():
    return get_supabase_context().client


def get_authenticated_user_id() -> str:
    return get_supabase_context().user_id


# ==========================================
# PRIVILEGED SERVER-ONLY SUPABASE CLIENT
# ==========================================

@lru_cache(maxsize=1)
def _create_service_supabase_client() -> Client:
    if not SUPABASE_URL:
        raise RuntimeError(
            "SUPABASE_URL is missing from backend configuration."
        )

    if not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY is missing from backend/.env. "
            "It is required for private quiz session storage."
        )

    return create_client(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        options=ClientOptions(
            auto_refresh_token=False,
            persist_session=False,
        ),
    )


def get_service_supabase_client() -> Client:
    """
    Return the privileged backend-only Supabase client.

    This client bypasses RLS. Every operation using it must
    explicitly filter records by the authenticated user ID.
    """
    return _create_service_supabase_client()


# ==========================================
# AUTHENTICATE USER ACCESS TOKEN
# ==========================================

def _authenticate_access_token(
    access_token: str,
) -> SupabaseRequestContext:

    if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
        raise RuntimeError(
            "Supabase backend configuration is missing."
        )

    options = ClientOptions(
        headers={
            "Authorization": f"Bearer {access_token}",
        },
        auto_refresh_token=False,
        persist_session=False,
    )

    client = create_client(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        options=options,
    )

    response = client.auth.get_user(access_token)

    user = getattr(response, "user", None)

    if user is None or not getattr(user, "id", None):
        raise ValueError(
            "Invalid authentication session."
        )

    return SupabaseRequestContext(
        client=client,
        user_id=str(user.id),
    )


# ==========================================
# AUTHENTICATION MIDDLEWARE
# ==========================================

class SupabaseAuthMiddleware:
    """
    Require a valid Supabase user session for PDF
    and AI endpoints.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
    ) -> None:

        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")

        protected_path = (
            path.startswith("/api/documents")
            or path.startswith("/api/assistant")
        )

        method = scope.get(
            "method",
            "GET",
        ).upper()

        if not protected_path or method == "OPTIONS":
            await self.app(scope, receive, send)
            return

        headers = dict(
            scope.get("headers", [])
        )

        authorization = headers.get(
            b"authorization",
            b"",
        ).decode("latin-1").strip()

        if not authorization.lower().startswith("bearer "):
            response = JSONResponse(
                {
                    "detail": "Authentication is required."
                },
                status_code=401,
            )

            await response(scope, receive, send)
            return

        access_token = authorization[7:].strip()

        if not access_token:
            response = JSONResponse(
                {
                    "detail": "Invalid authentication token."
                },
                status_code=401,
            )

            await response(scope, receive, send)
            return

        try:
            context = await run_in_threadpool(
                _authenticate_access_token,
                access_token,
            )

        except Exception:
            logger.warning(
                "Supabase authentication rejected a backend request."
            )

            response = JSONResponse(
                {
                    "detail": (
                        "Your session is invalid or expired. "
                        "Please sign in again."
                    )
                },
                status_code=401,
            )

            await response(scope, receive, send)
            return

        context_token = _request_context.set(context)

        try:
            await self.app(scope, receive, send)

        finally:
            _request_context.reset(context_token)
