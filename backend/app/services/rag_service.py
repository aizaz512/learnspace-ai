import math
import re

from datetime import datetime, timezone

from app.core.config import GEMINI_EMBEDDING_MODEL

from app.services.embedding_service import embed_texts

from app.services.pdf_service import (
    PDFProcessingError,
    load_document_metadata,
    save_document_metadata,
)


CHUNK_SIZE = 1200
CHUNK_OVERLAP = 180
MAX_CHUNKS_PER_DOCUMENT = 200
DEFAULT_TOP_K = 5


class RAGProcessingError(Exception):
    """Raised when PDF indexing or retrieval fails."""


# ==========================================
# LOAD METADATA
# ==========================================

def _load_metadata(document_id: str) -> dict:

    if not re.fullmatch(r"[0-9a-f]{32}", document_id):
        raise FileNotFoundError("Document not found.")

    metadata = load_document_metadata(document_id)

    if not isinstance(metadata, dict):
        raise FileNotFoundError("Document not found.")

    return metadata


# ==========================================
# BUILD TEXT CHUNKS
# ==========================================

def _build_chunks(pages: list[dict]) -> list[dict]:

    chunks = []
    step = CHUNK_SIZE - CHUNK_OVERLAP

    for page in pages:
        if not isinstance(page, dict):
            continue

        page_number = int(page.get("page_number", 0))
        page_text = str(page.get("text", "")).strip()

        if page_number <= 0 or not page_text:
            continue

        chunk_index = 0

        for start in range(0, len(page_text), step):

            chunk_text = page_text[
                start:start + CHUNK_SIZE
            ].strip()

            if chunk_text:
                chunks.append({
                    "chunk_id": f"p{page_number}-c{chunk_index}",
                    "page_number": page_number,
                    "text": chunk_text,
                })

                chunk_index += 1

            if start + CHUNK_SIZE >= len(page_text):
                break

    if not chunks:
        raise RAGProcessingError(
            "This PDF does not contain extractable text."
        )

    if len(chunks) > MAX_CHUNKS_PER_DOCUMENT:
        raise RAGProcessingError(
            "This PDF is too large for the current indexing limit. "
            "Please split it into smaller PDFs."
        )

    return chunks


# ==========================================
# SAVE CLOUD METADATA AND EMBEDDINGS
# ==========================================

def _save_metadata(
    document_id: str,
    metadata: dict,
) -> None:

    try:
        save_document_metadata(
            document_id=document_id,
            metadata=metadata,
        )

    except Exception as exc:
        raise RAGProcessingError(
            f"Could not save the document index: {exc}"
        ) from exc


# ==========================================
# CREATE DOCUMENT INDEX
# ==========================================

def _create_document_index(
    document_id: str,
    metadata: dict,
) -> list[dict]:

    pages = metadata.get("pages", [])

    if not isinstance(pages, list):
        raise RAGProcessingError(
            "The PDF text data has an invalid format."
        )

    chunks = _build_chunks(pages)

    texts = [
        chunk["text"]
        for chunk in chunks
    ]

    embeddings = embed_texts(
        texts=texts,
        task_type="RETRIEVAL_DOCUMENT",
    )

    if len(embeddings) != len(chunks):
        raise RAGProcessingError(
            "The number of generated embeddings does not match the chunks."
        )

    for chunk, embedding in zip(chunks, embeddings):
        chunk["embedding"] = embedding

    metadata["rag_index"] = {
        "embedding_model": GEMINI_EMBEDDING_MODEL,
        "chunk_count": len(chunks),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "chunks": chunks,
    }

    _save_metadata(document_id, metadata)

    return chunks


# ==========================================
# GET DOCUMENT INDEX
# ==========================================

def get_document_index(document_id: str) -> list[dict]:

    metadata = _load_metadata(document_id)

    saved_index = metadata.get("rag_index")

    if isinstance(saved_index, dict):
        if (
            saved_index.get("embedding_model") == GEMINI_EMBEDDING_MODEL
            and isinstance(saved_index.get("chunks"), list)
            and saved_index.get("chunks")
        ):
            return saved_index["chunks"]

    return _create_document_index(
        document_id,
        metadata,
    )


# ==========================================
# COSINE SIMILARITY
# ==========================================

def _cosine_similarity(
    vector_a: list[float],
    vector_b: list[float],
) -> float:

    if len(vector_a) != len(vector_b):
        return -1.0

    dot_product = sum(
        a * b for a, b in zip(vector_a, vector_b)
    )

    norm_a = math.sqrt(
        sum(a * a for a in vector_a)
    )

    norm_b = math.sqrt(
        sum(b * b for b in vector_b)
    )

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot_product / (norm_a * norm_b)


# ==========================================
# RETRIEVE RELEVANT CHUNKS
# ==========================================

def retrieve_relevant_chunks(
    document_id: str,
    question: str,
    top_k: int = DEFAULT_TOP_K,
) -> list[dict]:

    chunks = get_document_index(document_id)

    query_embeddings = embed_texts(
        texts=[question],
        task_type="RETRIEVAL_QUERY",
    )

    if not query_embeddings:
        raise RAGProcessingError(
            "Could not create an embedding for your question."
        )

    query_embedding = query_embeddings[0]

    ranked_chunks = []

    for chunk in chunks:

        chunk_embedding = chunk.get("embedding")

        if not isinstance(chunk_embedding, list):
            continue

        score = _cosine_similarity(
            query_embedding,
            chunk_embedding,
        )

        ranked_chunks.append({
            **chunk,
            "similarity": score,
        })

    ranked_chunks.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )

    return ranked_chunks[:top_k]