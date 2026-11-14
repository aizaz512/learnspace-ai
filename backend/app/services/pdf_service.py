import json
import re

from datetime import datetime, timezone
from typing import Any

import fitz

from app.core.config import (
    MAX_PDF_PAGES,
    PDF_STORAGE_BUCKET,
)

from app.core.supabase_auth import (
    get_supabase_context,
    get_user_supabase_client,
    get_authenticated_user_id,
)


class PDFProcessingError(Exception):
    """Raised when PDF processing or storage fails."""


# ==========================================
# AUTHENTICATED SUPABASE CLIENT
# ==========================================

def _get_client():
    return get_user_supabase_client()


def _validate_document_id(document_id: str) -> None:
    if not re.fullmatch(r"[0-9a-f]{32}", document_id):
        raise ValueError("Invalid document ID.")


def _get_document_record(
    document_id: str,
) -> dict[str, Any] | None:

    _validate_document_id(document_id)

    try:
        response = (
            _get_client()
            .table("pdf_documents")
            .select("*")
            .eq("document_id", document_id)
            .maybe_single()
            .execute()
        )

        return response.data

    except Exception as exc:
        raise PDFProcessingError(
            "Unable to retrieve PDF document metadata from Supabase."
        ) from exc


def _upload_storage_object(
    path: str,
    content: bytes,
    content_type: str,
    upsert: bool = False,
) -> None:

    try:
        (
            _get_client()
            .storage
            .from_(PDF_STORAGE_BUCKET)
            .upload(
                path=path,
                file=content,
                file_options={
                    "content-type": content_type,
                    "cache-control": "3600",
                    "upsert": "true" if upsert else "false",
                },
            )
        )

    except Exception as exc:
        raise PDFProcessingError(
            "Unable to upload a file to Supabase Storage."
        ) from exc


# ==========================================
# EXTRACT PDF PAGES
# ==========================================

def extract_pdf_pages(content: bytes) -> list[dict[str, Any]]:
    if not content:
        raise PDFProcessingError("The PDF file is empty.")

    if b"%PDF-" not in content[:1024]:
        raise PDFProcessingError(
            "The uploaded content is not a valid PDF file."
        )

    try:
        document = fitz.open(
            stream=content,
            filetype="pdf",
        )

    except Exception as exc:
        raise PDFProcessingError(
            "Unable to open this PDF. The file may be damaged."
        ) from exc

    try:
        if document.needs_pass:
            raise PDFProcessingError(
                "Password-protected PDFs are not supported yet."
            )

        page_count = document.page_count

        if page_count < 1:
            raise PDFProcessingError(
                "The PDF does not contain any pages."
            )

        if page_count > MAX_PDF_PAGES:
            raise PDFProcessingError(
                f"The PDF exceeds the {MAX_PDF_PAGES}-page limit."
            )

        pages = []

        for index, page in enumerate(document, start=1):
            extracted_text = page.get_text("text").strip()

            pages.append({
                "page_number": index,
                "text": extracted_text,
            })

        return pages

    except PDFProcessingError:
        raise

    except Exception as exc:
        raise PDFProcessingError(
            "An error occurred while extracting PDF text."
        ) from exc

    finally:
        document.close()


# ==========================================
# SAVE PDF TO SUPABASE STORAGE
# ==========================================

def save_document(
    document_id: str,
    chapter_id: int,
    filename: str,
    content: bytes,
    pages: list[dict[str, Any]],
) -> None:

    _validate_document_id(document_id)

    if chapter_id <= 0:
        raise ValueError("Invalid chapter ID.")

    if not content:
        raise ValueError("The PDF content is empty.")

    if len(content) > 20 * 1024 * 1024:
        raise ValueError("The PDF exceeds the 20 MB limit.")

    context = get_supabase_context()

    user_id = context.user_id

    # Each user gets an isolated storage folder.
    folder = (
        f"{user_id}/{chapter_id}/{document_id}"
    )

    storage_path = f"{folder}/document.pdf"
    metadata_path = f"{folder}/metadata.json"

    uploaded_paths: list[str] = []

    uploaded_at = datetime.now(
        timezone.utc
    ).isoformat()

    extraction_status = (
        "text_extracted"
        if any(page.get("text", "").strip() for page in pages)
        else "no_text_found"
    )

    metadata = {
        "document_id": document_id,
        "user_id": user_id,
        "chapter_id": chapter_id,
        "filename": filename,
        "size_bytes": len(content),
        "page_count": len(pages),
        "pages_with_text": sum(
            1 for page in pages
            if page.get("text", "").strip()
        ),
        "uploaded_at": uploaded_at,
        "extraction_status": extraction_status,
        "storage_path": storage_path,
        "metadata_path": metadata_path,
        "pages": pages,
    }

    try:
        # 1. Upload original PDF.
        _upload_storage_object(
            path=storage_path,
            content=content,
            content_type="application/pdf",
        )

        uploaded_paths.append(storage_path)

        # 2. Upload extracted text metadata.
        metadata_content = json.dumps(
            metadata,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")

        _upload_storage_object(
            path=metadata_path,
            content=metadata_content,
            content_type="application/json",
        )

        uploaded_paths.append(metadata_path)

        # 3. Insert database record.
        # user_id uses the database default auth.uid().
        (
            _get_client()
            .table("pdf_documents")
            .insert({
                "document_id": document_id,
                "chapter_id": chapter_id,
                "filename": filename,
                "storage_path": storage_path,
                "metadata_path": metadata_path,
                "size_bytes": len(content),
                "page_count": len(pages),
                "pages_with_text": metadata["pages_with_text"],
                "extraction_status": extraction_status,
                "uploaded_at": uploaded_at,
            })
            .execute()
        )

    except Exception as exc:
        # Best-effort cleanup if an upload or database insert fails.
        if uploaded_paths:
            try:
                (
                    _get_client()
                    .storage
                    .from_(PDF_STORAGE_BUCKET)
                    .remove(uploaded_paths)
                )
            except Exception:
                pass

        if isinstance(exc, PDFProcessingError):
            raise

        raise PDFProcessingError(
            f"Unable to save the PDF document: {exc}"
        ) from exc


# ==========================================
# LOAD DOCUMENT METADATA
# ==========================================

def load_document_metadata(
    document_id: str,
) -> dict[str, Any] | None:

    record = _get_document_record(document_id)

    if record is None:
        return None

    metadata_path = record.get("metadata_path")

    if not metadata_path:
        raise PDFProcessingError(
            "The document metadata path is missing."
        )

    try:
        content = (
            _get_client()
            .storage
            .from_(PDF_STORAGE_BUCKET)
            .download(metadata_path)
        )

        metadata = json.loads(content)

        if not isinstance(metadata, dict):
            raise PDFProcessingError(
                "The stored document metadata is invalid."
            )

        if metadata.get("document_id") != document_id:
            raise PDFProcessingError(
                "The stored document ID does not match."
            )

        return metadata

    except PDFProcessingError:
        raise

    except Exception as exc:
        raise PDFProcessingError(
            "Unable to download PDF metadata from Supabase Storage."
        ) from exc


# ==========================================
# SAVE UPDATED METADATA / RAG INDEX
# ==========================================

def save_document_metadata(
    document_id: str,
    metadata: dict[str, Any],
) -> None:

    record = _get_document_record(document_id)

    if record is None:
        raise FileNotFoundError("Document not found.")

    metadata_path = record.get("metadata_path")

    if not metadata_path:
        raise PDFProcessingError(
            "The document metadata path is missing."
        )

    try:
        metadata_content = json.dumps(
            metadata,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")

        _upload_storage_object(
            path=metadata_path,
            content=metadata_content,
            content_type="application/json",
            upsert=True,
        )

    except Exception as exc:
        raise PDFProcessingError(
            "Unable to update the stored PDF metadata."
        ) from exc


# ==========================================
# DOWNLOAD ORIGINAL PDF
# ==========================================

def get_document_file(
    document_id: str,
) -> tuple[bytes, dict[str, Any]]:

    record = _get_document_record(document_id)

    if record is None:
        raise FileNotFoundError("PDF document not found.")

    storage_path = record.get("storage_path")

    if not storage_path:
        raise PDFProcessingError(
            "The PDF storage path is missing."
        )

    try:
        content = (
            _get_client()
            .storage
            .from_(PDF_STORAGE_BUCKET)
            .download(storage_path)
        )

        return content, record

    except Exception as exc:
        raise PDFProcessingError(
            "Unable to download the PDF from Supabase Storage."
        ) from exc


# ==========================================
# LIST DOCUMENTS FOR A CHAPTER
# ==========================================

def list_documents_for_chapter(
    chapter_id: int,
) -> list[dict[str, Any]]:

    if chapter_id <= 0:
        raise ValueError("Invalid chapter ID.")

    try:
        response = (
            _get_client()
            .table("pdf_documents")
            .select(
                "document_id, chapter_id, filename, size_bytes, "
                "page_count, pages_with_text, uploaded_at, "
                "extraction_status"
            )
            .eq("chapter_id", chapter_id)
            .order("uploaded_at", desc=True)
            .execute()
        )

        return response.data or []

    except Exception as exc:
        raise PDFProcessingError(
            "Unable to list PDF documents from Supabase."
        ) from exc


# ==========================================
# DELETE PDF
# ==========================================

def delete_document(document_id: str) -> bool:

    record = _get_document_record(document_id)

    if record is None:
        return False

    paths = [
        record["storage_path"],
        record["metadata_path"],
    ]

    try:
        # Remove original PDF and extracted metadata.
        (
            _get_client()
            .storage
            .from_(PDF_STORAGE_BUCKET)
            .remove(paths)
        )

        # Remove database metadata.
        (
            _get_client()
            .table("pdf_documents")
            .delete()
            .eq("document_id", document_id)
            .execute()
        )

        return True

    except Exception as exc:
        raise PDFProcessingError(
            "Unable to delete the PDF document from Supabase."
        ) from exc