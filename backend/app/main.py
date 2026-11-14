from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.documents import router as documents_router
from app.api.routes.assistant import router as assistant_router

from app.core.config import (
    CORS_ORIGINS,
    UPLOAD_DIR,
)

from app.core.supabase_auth import SupabaseAuthMiddleware


# Keep local application folders used by quiz storage and other services.
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="LearnSpace AI API",
    description=(
        "Backend API for the LearnSpace AI Digital Learning Notebook."
    ),
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Protect document and AI endpoints using Supabase authentication.
app.add_middleware(SupabaseAuthMiddleware)

app.include_router(documents_router)
app.include_router(assistant_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to LearnSpace AI API",
        "status": "running",
        "version": "1.1.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "LearnSpace AI Backend",
    }