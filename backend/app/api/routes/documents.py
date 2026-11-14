from uuid import uuid4
from urllib.parse import quote

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool

from app.core.config import MAX_UPLOAD_SIZE_BYTES

from app.schemas.document import (
    DocumentDeleteResponse,
    DocumentSummary,
    DocumentTextResponse,
    DocumentUploadResponse,
    PageText,
)

from app.services.pdf_service import (
    PDFProcessingError,
    delete_document,
    extract_pdf_pages,
    get_document_file,
    list_documents_for_chapter,
    load_document_metadata,
    save_document,
)


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)


# ==========================================
# LIST DOCUMENTS FOR CHAPTER
# ==========================================

@router.get(
    "",
    response_model=list[DocumentSummary],
)
def get_chapter_documents(chapter_id: int):

    if chapter_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid chapter ID.",
        )

    try:
        return list_documents_for_chapter(chapter_id)

    except PDFProcessingError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc


# ==========================================
# UPLOAD PDF
# ==========================================

@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
)
async def upload_pdf(
    chapter_id: int = Form(...),
    file: UploadFile = File(...),
):

    if chapter_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Invalid chapter ID.",
        )

    filename = (
        (file.filename or "document.pdf")
        .replace("\\", "/")
        .split("/")[-1]
        .strip()
    )

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="A filename is required.",
        )

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=415,
            detail="Only PDF files are allowed.",
        )

    try:
        content = await file.read(
            MAX_UPLOAD_SIZE_BYTES + 1
        )

        if len(content) > MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="The file exceeds the 20 MB upload limit.",
            )

        try:
            pages = await run_in_threadpool(
                extract_pdf_pages,
                content,
            )

            document_id = uuid4().hex

            await run_in_threadpool(
                save_document,
                document_id,
                chapter_id,
                filename,
                content,
                pages,
            )

            metadata = await run_in_threadpool(
                load_document_metadata,
                document_id,
            )

            if metadata is None:
                raise PDFProcessingError(
                    "Unable to retrieve the uploaded document metadata."
                )

        except PDFProcessingError as exc:
            raise HTTPException(
                status_code=502,
                detail=str(exc),
            ) from exc

        text_preview = "\n\n".join(
            f"Page {page['page_number']}\n{page['text']}"
            for page in pages
            if page["text"].strip()
        )[:2000]

        return DocumentUploadResponse(
            document_id=document_id,
            chapter_id=chapter_id,
            filename=filename,
            size_bytes=len(content),
            page_count=len(pages),
            pages_with_text=metadata["pages_with_text"],
            uploaded_at=metadata["uploaded_at"],
            extraction_status=metadata["extraction_status"],
            text_preview=text_preview,
        )

    finally:
        await file.close()


# ==========================================
# GET EXTRACTED PDF TEXT
# ==========================================

@router.get(
    "/{document_id}/text",
    response_model=DocumentTextResponse,
)
def get_extracted_text(document_id: str):

    try:
        metadata = load_document_metadata(document_id)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except PDFProcessingError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    if metadata is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    return DocumentTextResponse(
        document_id=metadata["document_id"],
        filename=metadata["filename"],
        page_count=metadata["page_count"],
        pages=[
            PageText(**page)
            for page in metadata["pages"]
        ],
    )


# ==========================================
# VIEW / DOWNLOAD PDF
# ==========================================

@router.get("/{document_id}/file")
def get_pdf_file(document_id: str):

    try:
        content, metadata = get_document_file(document_id)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail="PDF document not found.",
        ) from exc

    except PDFProcessingError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    filename = metadata.get(
        "filename",
        "document.pdf",
    )

    safe_filename = quote(filename, safe="")

    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f"inline; filename*=UTF-8''{safe_filename}"
            ),
            "Content-Length": str(len(content)),
            "X-Content-Type-Options": "nosniff",
        },
    )


# ==========================================
# DELETE PDF
# ==========================================

@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
)
def remove_pdf(document_id: str):

    try:
        deleted = delete_document(document_id)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except PDFProcessingError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    return DocumentDeleteResponse(
        message="Document deleted successfully.",
        document_id=document_id,
    )