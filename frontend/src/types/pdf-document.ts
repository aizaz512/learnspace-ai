
/**
 * Existing frontend prototype document structure.
 * Kept for compatibility with the current App.tsx.
 */
export interface PdfDocument {
  id: string;
  chapterId: number;
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
}

/**
 * Document returned by the FastAPI backend.
 */
export interface StoredPdfDocument {
  id: string;
  chapterId: number;
  name: string;
  size: number;
  uploadedAt: string;
  pageCount: number;
  pagesWithText: number;
  extractionStatus: "text_extracted" | "no_text_found";
}
