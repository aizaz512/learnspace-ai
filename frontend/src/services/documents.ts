
import type { StoredPdfDocument } from "../types/pdf-document";

import {
  API_URL,
  authenticatedFetch,
} from "./api";

// ==========================================
// BACKEND RESPONSE STRUCTURE
// ==========================================

interface BackendDocument {
  document_id: string;
  chapter_id: number;
  filename: string;
  size_bytes: number;
  page_count: number;
  pages_with_text: number;
  uploaded_at: string;
  extraction_status: "text_extracted" | "no_text_found";
}

// ==========================================
// API RESPONSE HANDLING
// ==========================================

async function handleResponse<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data: unknown = await response.json();

      if (
        typeof data === "object" &&
        data !== null &&
        "detail" in data
      ) {
        const detail = data.detail;

        if (typeof detail === "string") {
          message = detail;
        } else if (Array.isArray(detail)) {
          message = detail
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
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ==========================================
// MAP BACKEND DOCUMENT
// ==========================================

function mapDocument(
  document: BackendDocument
): StoredPdfDocument {
  return {
    id: document.document_id,
    chapterId: document.chapter_id,
    name: document.filename,
    size: document.size_bytes,
    uploadedAt: document.uploaded_at,
    pageCount: document.page_count,
    pagesWithText: document.pages_with_text,
    extractionStatus: document.extraction_status,
  };
}

// ==========================================
// LIST DOCUMENTS
// ==========================================

export async function listDocuments(
  chapterId: number
): Promise<StoredPdfDocument[]> {
  const response = await authenticatedFetch(
    `${API_URL}/api/documents?chapter_id=${encodeURIComponent(
      chapterId
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const result = await handleResponse<BackendDocument[]>(
    response
  );

  return result.map(mapDocument);
}

// ==========================================
// UPLOAD DOCUMENT
// ==========================================

export async function uploadDocument(
  file: File,
  chapterId: number
): Promise<StoredPdfDocument> {
  const formData = new FormData();

  formData.append("chapter_id", String(chapterId));
  formData.append("file", file);

  const response = await authenticatedFetch(
    `${API_URL}/api/documents/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await handleResponse<BackendDocument>(
    response
  );

  return mapDocument(result);
}

// ==========================================
// DELETE DOCUMENT
// ==========================================

export async function deleteDocument(
  documentId: string
): Promise<void> {
  if (!documentId.trim()) {
    throw new Error("Invalid document ID.");
  }

  const response = await authenticatedFetch(
    `${API_URL}/api/documents/${encodeURIComponent(
      documentId
    )}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    }
  );

  await handleResponse<{ message: string }>(response);
}

// ==========================================
// DOWNLOAD PROTECTED PDF AS BLOB
// ==========================================

/**
 * Fetch a PDF using the authenticated user's access token.
 *
 * The returned Blob can be displayed in an iframe or
 * downloaded through a temporary browser object URL.
 */
export async function getPdfFileBlob(
  documentId: string
): Promise<Blob> {
  if (!documentId.trim()) {
    throw new Error("Invalid document ID.");
  }

  const response = await authenticatedFetch(
    `${API_URL}/api/documents/${encodeURIComponent(
      documentId
    )}/file`,
    {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    }
  );

  if (!response.ok) {
    await handleResponse<never>(response);
    throw new Error("Unable to download the PDF.");
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error("The downloaded PDF file is empty.");
  }

  return blob;
}

// ==========================================
// LEGACY PDF FILE URL
// ==========================================

/**
 * Returns the backend endpoint URL.
 *
 * IMPORTANT:
 * This URL does not contain authentication credentials.
 * Use getPdfFileBlob() for protected PDF previews/downloads.
 */
export function getPdfFileUrl(
  documentId: string
): string {
  return (
    `${API_URL}/api/documents/` +
    `${encodeURIComponent(documentId)}/file`
  );
}

// ==========================================
// EXTRACTED PDF TEXT TYPES
// ==========================================

export interface ExtractedPdfPage {
  page_number: number;
  text: string;
}

export interface ExtractedPdfDocument {
  document_id: string;
  filename: string;
  page_count: number;
  pages: ExtractedPdfPage[];
}

// ==========================================
// GET EXTRACTED PDF TEXT
// ==========================================

export async function getExtractedPdfText(
  documentId: string
): Promise<ExtractedPdfDocument> {
  if (!documentId.trim()) {
    throw new Error("Invalid document ID.");
  }

  const response = await authenticatedFetch(
    `${API_URL}/api/documents/${encodeURIComponent(
      documentId
    )}/text`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  return handleResponse<ExtractedPdfDocument>(response);
}
