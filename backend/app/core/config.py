
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")

# Application directories.
UPLOAD_DIR = BASE_DIR / "uploads"

# PDF limits.
MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024
MAX_PDF_PAGES = 500

# CORS configuration.
# Supply multiple origins separated by commas in production.
_raw_cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173",
)

CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in _raw_cors_origins.split(",")
    if origin.strip()
]

# Gemini configuration.
GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY",
    "",
).strip()

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-flash-latest",
).strip()

GEMINI_EMBEDDING_MODEL = os.getenv(
    "GEMINI_EMBEDDING_MODEL",
    "gemini-embedding-001",
).strip()

GEMINI_EMBEDDING_DIMENSIONS = 768

# Supabase configuration.
SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "",
).strip()

SUPABASE_PUBLISHABLE_KEY = os.getenv(
    "SUPABASE_PUBLISHABLE_KEY",
    "",
).strip()

# Server-only key. Never expose it to the frontend.
SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "",
).strip()

PDF_STORAGE_BUCKET = os.getenv(
    "PDF_STORAGE_BUCKET",
    "learnspace-pdfs",
).strip()
