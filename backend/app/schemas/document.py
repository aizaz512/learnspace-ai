
from typing import Literal

from pydantic import BaseModel, Field


ExtractionStatus = Literal[
    "text_extracted",
    "no_text_found",
]


class PageText(BaseModel):
    page_number: int = Field(ge=1)
    text: str


class DocumentSummary(BaseModel):
    document_id: str
    chapter_id: int
    filename: str
    size_bytes: int
    page_count: int
    pages_with_text: int
    uploaded_at: str
    extraction_status: ExtractionStatus


class DocumentUploadResponse(DocumentSummary):
    text_preview: str


class DocumentTextResponse(BaseModel):
    document_id: str
    filename: str
    page_count: int
    pages: list[PageText]


class DocumentDeleteResponse(BaseModel):
    message: str
    document_id: str
