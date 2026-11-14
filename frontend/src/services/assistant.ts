import {
  API_URL,
  authenticatedFetch,
} from "./api";

// ==========================================
// QUESTION ANSWERING TYPES
// ==========================================

export interface AssistantSource {
  chunk_id: string;
  page_number: number;
  excerpt: string;
  similarity: number;
}

export interface AssistantResponse {
  document_id: string;
  question: string;
  answer: string;
  sources: AssistantSource[];
}

// ==========================================
// STUDY SUMMARY TYPES
// ==========================================

export interface DocumentSummaryResponse {
  document_id: string;
  document_name: string;
  page_count: number;
  source_pages: number[];
  summary: string;
  generated_at: string;
}

// ==========================================
// FLASHCARD TYPES
// ==========================================

export interface GeneratedFlashcard {
  id: string;
  question: string;
  answer: string;
  page_number: number;
  topic: string;
}

export interface DocumentFlashcardsResponse {
  document_id: string;
  document_name: string;
  page_count: number;
  requested_count: number;
  generated_count: number;
  source_pages: number[];
  cards: GeneratedFlashcard[];
  generated_at: string;
}

// ==========================================
// API ERROR HANDLING
// ==========================================

async function getErrorMessage(
  response: Response,
  defaultMessage: string
): Promise<string> {
  try {
    const errorData: unknown = await response.json();

    if (
      typeof errorData === "object" &&
      errorData !== null &&
      "detail" in errorData
    ) {
      const detail = errorData.detail;

      if (typeof detail === "string") {
        return detail;
      }

      if (Array.isArray(detail)) {
        return detail
          .map((item: unknown) => {
            if (
              typeof item === "object" &&
              item !== null &&
              "msg" in item &&
              typeof item.msg === "string"
            ) {
              return item.msg;
            }

            return "Invalid request";
          })
          .join(", ");
      }
    }
  } catch {
    // Use the default error message.
  }

  return defaultMessage;
}

// ==========================================
// ASK QUESTIONS ABOUT A PDF
// ==========================================

export async function askDocumentQuestion(
  documentId: string,
  question: string
): Promise<AssistantResponse> {
  if (!documentId.trim()) {
    throw new Error("Please select a PDF document.");
  }

  if (!question.trim()) {
    throw new Error("Please enter a question.");
  }

  const response = await authenticatedFetch(
    `${API_URL}/api/assistant/${encodeURIComponent(
      documentId
    )}/ask`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        question: question.trim(),
      }),
    }
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "Unable to get an answer from LearnSpace AI."
    );

    throw new Error(message);
  }

  return (await response.json()) as AssistantResponse;
}

// ==========================================
// GENERATE PDF STUDY SUMMARY
// ==========================================

export async function generateDocumentSummary(
  documentId: string
): Promise<DocumentSummaryResponse> {
  if (!documentId.trim()) {
    throw new Error("Please select a PDF document.");
  }

  const response = await authenticatedFetch(
    `${API_URL}/api/assistant/${encodeURIComponent(
      documentId
    )}/summary`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "Unable to generate the study summary."
    );

    throw new Error(message);
  }

  return (await response.json()) as DocumentSummaryResponse;
}

// ==========================================
// GENERATE PDF FLASHCARDS
// ==========================================

export async function generateDocumentFlashcards(
  documentId: string,
  cardCount: number = 10
): Promise<DocumentFlashcardsResponse> {
  if (!documentId.trim()) {
    throw new Error("Please select a PDF document.");
  }

  if (
    !Number.isInteger(cardCount) ||
    cardCount < 5 ||
    cardCount > 30
  ) {
    throw new Error(
      "Flashcard count must be between 5 and 30."
    );
  }

  const query = new URLSearchParams({
    card_count: String(cardCount),
  });

  const response = await authenticatedFetch(
    `${API_URL}/api/assistant/${encodeURIComponent(
      documentId
    )}/flashcards?${query.toString()}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const message = await getErrorMessage(
      response,
      "Unable to generate flashcards from this PDF."
    );

    throw new Error(message);
  }

  const result =
    (await response.json()) as DocumentFlashcardsResponse;

  if (
    !Array.isArray(result.cards) ||
    result.cards.length === 0
  ) {
    throw new Error(
      "The API did not return any valid flashcards."
    );
  }

  return result;
}