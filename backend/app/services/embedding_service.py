
from google import genai
from google.genai import types

from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_EMBEDDING_MODEL,
    GEMINI_EMBEDDING_DIMENSIONS,
)


class EmbeddingServiceError(Exception):
    """Raised when Gemini embedding generation fails."""


_client = None


def get_gemini_client():
    """Create and reuse the Gemini API client."""

    global _client

    if not GEMINI_API_KEY:
        raise EmbeddingServiceError(
            "GEMINI_API_KEY is missing from backend/.env."
        )

    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)

    return _client


def embed_texts(
    texts: list[str],
    task_type: str,
) -> list[list[float]]:
    """
    Generate one embedding for each input text.

    task_type should be:
    - RETRIEVAL_DOCUMENT for PDF chunks
    - RETRIEVAL_QUERY for student questions
    """

    if not texts:
        return []

    client = get_gemini_client()
    all_embeddings = []

    # Small batches help keep requests manageable.
    batch_size = 16

    for start in range(0, len(texts), batch_size):
        batch = texts[start:start + batch_size]

        try:
            response = client.models.embed_content(
                model=GEMINI_EMBEDDING_MODEL,
                contents=batch,
                config=types.EmbedContentConfig(
                    task_type=task_type,
                    output_dimensionality=GEMINI_EMBEDDING_DIMENSIONS,
                ),
            )

            returned_embeddings = response.embeddings or []

            if len(returned_embeddings) != len(batch):
                raise EmbeddingServiceError(
                    "Gemini returned an unexpected number of embeddings."
                )

            for item in returned_embeddings:
                if not item.values:
                    raise EmbeddingServiceError(
                        "Gemini returned an empty embedding."
                    )

                all_embeddings.append(
                    [float(value) for value in item.values]
                )

        except EmbeddingServiceError:
            raise
        except Exception as exc:
            raise EmbeddingServiceError(
                f"Could not generate text embeddings: {exc}"
            ) from exc

    return all_embeddings
