
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import {
  ArrowLeft,
  FileText,
  Upload,
  Search,
  Trash2,
  Download,
  Eye,
  HardDrive,
  AlertCircle,
  ArrowUpRight,
  X,
  LoaderCircle,
  RefreshCw,
  Bot,
  MessageSquare,
} from "lucide-react";

import type { Chapter } from "../types/chapter";
import type {
  PdfDocument,
  StoredPdfDocument,
} from "../types/pdf-document";

import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  getPdfFileBlob,
} from "../services/documents";

import DocumentAssistant from "../components/DocumentAssistant";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface PdfLibraryPageProps {
  chapter: Chapter;
  documents: PdfDocument[];
  onUploadFiles: (files: File[]) => void;
  onDeleteDocument: (id: string) => void;
  onBack: () => void;
}

interface PdfObjectUrl {
  documentId: string;
  url: string;
}

export default function PdfLibraryPage({
  chapter,
  onBack,
}: PdfLibraryPageProps) {
  const [documents, setDocuments] = useState<StoredPdfDocument[]>([]);
  const [search, setSearch] = useState("");

  const [selectedDocumentId, setSelectedDocumentId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);

  const [pdfFile, setPdfFile] = useState<PdfObjectUrl | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [downloadingDocumentId, setDownloadingDocumentId] =
    useState<string | null>(null);

  // ==========================================
  // LOAD DOCUMENTS
  // ==========================================

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      setLoading(true);
      setError("");

      try {
        const result = await listDocuments(chapter.id);

        if (active) {
          setDocuments(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load documents. Check your backend."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      active = false;
    };
  }, [chapter.id, reloadToken]);

  // ==========================================
  // SELECTED DOCUMENT
  // ==========================================

  const selectedDocument =
    documents.find(
      (document) => document.id === selectedDocumentId
    ) ?? null;

  // ==========================================
  // FETCH AUTHENTICATED PDF
  // ==========================================
// ==========================================
// FETCH AUTHENTICATED PDF PREVIEW
// ==========================================

useEffect(() => {
  if (selectedDocumentId === null) {
    setPdfFile(null);
    setPdfLoading(false);
    return;
  }

  let cancelled = false;
  let generatedObjectUrl: string | null = null;

  // Explicitly require a string parameter.
  async function loadPdfFile(documentId: string) {
    setPdfFile(null);
    setPdfLoading(true);
    setError("");

    try {
      const blob = await getPdfFileBlob(documentId);

      if (cancelled) {
        return;
      }

      generatedObjectUrl = URL.createObjectURL(blob);

      setPdfFile({
        documentId: documentId,
        url: generatedObjectUrl,
      });
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this PDF file."
        );
      }
    } finally {
      if (!cancelled) {
        setPdfLoading(false);
      }
    }
  }

  // The null check above guarantees this is a string.
  void loadPdfFile(selectedDocumentId);

  return () => {
    cancelled = true;

    if (generatedObjectUrl !== null) {
      URL.revokeObjectURL(generatedObjectUrl);
    }
  };
}, [selectedDocumentId]);

  // ==========================================
  // PDF VIEWER URL
  // ==========================================

  // Explicit null checks prevent TypeScript errors.
  const selectedPdfUrl =
    pdfFile !== null &&
    selectedDocument !== null &&
    pdfFile.documentId === selectedDocument.id
      ? pdfFile.url
      : null;

  const pdfViewerUrl = selectedPdfUrl
    ? `${selectedPdfUrl}#page=${currentPage}`
    : null;

  // ==========================================
  // SEARCH DOCUMENTS
  // ==========================================

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) =>
      document.name.toLowerCase().includes(query)
    );
  }, [documents, search]);

  // ==========================================
  // FORMAT HELPERS
  // ==========================================

  function formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Recently uploaded";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // ==========================================
  // UPLOAD PDF FILES
  // ==========================================

  async function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);

    input.value = "";

    if (files.length === 0) {
      return;
    }

    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    for (const file of files) {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        rejectedFiles.push(`${file.name}: not a PDF`);
        continue;
      }

      if (file.size === 0) {
        rejectedFiles.push(`${file.name}: empty file`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(
          `${file.name}: larger than 20 MB`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      setError(rejectedFiles.join("; "));
      return;
    }

    setUploading(true);
    setError("");

    const uploadErrors: string[] = [];

    for (const file of validFiles) {
      try {
        const uploaded = await uploadDocument(
          file,
          chapter.id
        );

        setDocuments((current) => [
          uploaded,
          ...current.filter(
            (item) => item.id !== uploaded.id
          ),
        ]);
      } catch (err) {
        uploadErrors.push(
          `${file.name}: ${
            err instanceof Error
              ? err.message
              : "Upload failed"
          }`
        );
      }
    }

    setUploading(false);

    const allErrors = [
      ...rejectedFiles,
      ...uploadErrors,
    ];

    if (allErrors.length > 0) {
      setError(allErrors.join("; "));
    }
  }

  // ==========================================
  // NAVIGATE TO PDF PAGE FROM AI CITATION
  // ==========================================

  function handleSourceClick(pageNumber: number) {
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      setError(
        "The AI returned an invalid PDF page reference."
      );

      return;
    }

    if (
      selectedDocument &&
      pageNumber > selectedDocument.pageCount
    ) {
      setError(
        `Page ${pageNumber} does not exist in this PDF. It contains ${selectedDocument.pageCount} pages.`
      );

      return;
    }

    setError("");
    setCurrentPage(pageNumber);
  }

  // ==========================================
  // DOWNLOAD PDF
  // ==========================================

  async function handleDownloadDocument(
    document: StoredPdfDocument
  ) {
    setError("");
    setDownloadingDocumentId(document.id);

    try {
      const blob = await getPdfFileBlob(document.id);
      const objectUrl = URL.createObjectURL(blob);

      const link = window.document.createElement("a");

      link.href = objectUrl;
      link.download = document.name;

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 30000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download the PDF."
      );
    } finally {
      setDownloadingDocumentId(null);
    }
  }

  // ==========================================
  // DELETE PDF DOCUMENT
  // ==========================================

  async function handleDelete(
    document: StoredPdfDocument
  ) {
    const confirmed = window.confirm(
      `Delete "${document.name}" from this chapter?`
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deleteDocument(document.id);

      setDocuments((current) =>
        current.filter(
          (item) => item.id !== document.id
        )
      );

      if (selectedDocumentId === document.id) {
        setSelectedDocumentId(null);
        setCurrentPage(1);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete the document."
      );
    }
  }

  // ==========================================
  // DISMISS ERROR
  // ==========================================

  function dismissError() {
    setError("");
  }

  // ==========================================
  // PDF READER + AI ASSISTANT
  // ==========================================

  if (selectedDocument) {
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <button
              onClick={() => {
                setSelectedDocumentId(null);
                setCurrentPage(1);
                setError("");
              }}
              className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600"
            >
              <ArrowLeft size={16} />
              Back to PDF library
            </button>

            <h1 className="truncate text-lg font-bold text-slate-900">
              {selectedDocument.name}
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              {formatSize(selectedDocument.size)} ·{" "}
              {selectedDocument.pageCount} pages
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedPdfUrl ? (
              <>
                <a
                  href={selectedPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Open separately
                  <ArrowUpRight size={14} />
                </a>

                <a
                  href={selectedPdfUrl}
                  download={selectedDocument.name}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Download size={15} />
                  Download
                </a>
              </>
            ) : (
              <button
                disabled
                className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-400"
              >
                <LoaderCircle
                  size={15}
                  className={pdfLoading ? "animate-spin" : ""}
                />
                {pdfLoading
                  ? "Preparing PDF..."
                  : "PDF unavailable"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
          >
            <AlertCircle size={16} />

            <span className="flex-1">{error}</span>

            <button
              onClick={dismissError}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(350px,0.9fr)]">
          {/* PDF VIEWER */}

          <section className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <FileText
                size={17}
                className="text-red-500"
              />

              <h2 className="text-sm font-bold text-slate-800">
                PDF Reader
              </h2>

              <span className="ml-auto rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                Page {currentPage} of{" "}
                {selectedDocument.pageCount}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm">
              {pdfLoading ? (
                <div className="flex h-[700px] min-h-[500px] flex-col items-center justify-center bg-white text-sm text-slate-500">
                  <LoaderCircle
                    size={28}
                    className="mb-3 animate-spin text-indigo-600"
                  />

                  Loading your PDF securely...
                </div>
              ) : pdfViewerUrl ? (
                <iframe
                  key={`${selectedDocument.id}-${currentPage}`}
                  src={pdfViewerUrl}
                  title={selectedDocument.name}
                  className="h-[700px] min-h-[500px] w-full bg-white"
                />
              ) : (
                <div className="flex h-[700px] min-h-[500px] flex-col items-center justify-center bg-white px-5 text-center">
                  <FileText
                    size={35}
                    className="mb-3 text-slate-300"
                  />

                  <h3 className="text-sm font-bold text-slate-700">
                    PDF preview unavailable
                  </h3>

                  <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
                    Check your connection and login session,
                    then return to the library and try again.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
              <span>
                Uploaded{" "}
                {formatDate(selectedDocument.uploadedAt)}
              </span>

              <span>
                {selectedDocument.pagesWithText} pages contain
                extractable text
              </span>
            </div>
          </section>

          {/* AI ASSISTANT */}

          <section className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <Bot
                size={18}
                className="text-indigo-600"
              />

              <h2 className="text-sm font-bold text-slate-800">
                Ask your PDF
              </h2>
            </div>

            <DocumentAssistant
              key={selectedDocument.id}
              documentId={selectedDocument.id}
              documentName={selectedDocument.name}
              onSourceClick={handleSourceClick}
            />
          </section>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN PDF LIBRARY
  // ==========================================

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft size={16} />
        Back to chapters
      </button>

      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-wider text-indigo-600">
            DOCUMENT LIBRARY
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            PDF Library
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage lecture slides, textbooks and study materials.
          </p>

          <p className="mt-2 text-xs font-medium text-indigo-600">
            Chapter: {chapter.title}
          </p>
        </div>

        <button
          onClick={() =>
            setReloadToken((value) => value + 1)
          }
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800"
        >
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />

          <div className="min-w-0 flex-1">{error}</div>

          <button
            onClick={dismissError}
            aria-label="Dismiss error"
            className="shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <FileText size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {documents.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            PDF documents
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <HardDrive size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {formatSize(
              documents.reduce(
                (total, document) =>
                  total + document.size,
                0
              )
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Total stored file size
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <FileText size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {documents.reduce(
              (total, document) =>
                total + document.pageCount,
              0
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Total PDF pages
          </p>
        </div>
      </div>

      {/* UPLOAD */}

      <div className="mb-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-5 py-9 text-center transition hover:border-indigo-400">
        <label
          htmlFor="backend-pdf-upload"
          className={`flex flex-col items-center ${
            uploading
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
            {uploading ? (
              <LoaderCircle
                size={23}
                className="animate-spin"
              />
            ) : (
              <Upload size={23} />
            )}
          </div>

          <h2 className="mt-4 text-sm font-bold text-slate-800">
            {uploading
              ? "Uploading and processing PDFs..."
              : "Upload your study materials"}
          </h2>

          <p className="mt-2 text-xs text-slate-500">
            {uploading
              ? "Please keep this page open until uploads finish."
              : "Select one or multiple PDF files from your computer."}
          </p>

          <p className="mt-2 text-[10px] text-slate-400">
            PDF only · Maximum 20 MB per file
          </p>

          <span className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white">
            {uploading
              ? "Please wait..."
              : "Choose PDF files"}
          </span>
        </label>

        <input
          type="file"
          id="backend-pdf-upload"
          accept="application/pdf,.pdf"
          multiple
          disabled={uploading}
          onChange={handleFileSelection}
          className="sr-only"
        />
      </div>

      {/* SEARCH */}

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3">
        <Search
          size={17}
          className="text-slate-400"
        />

        <input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search PDF documents..."
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* DOCUMENT LIST HEADER */}

      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">
          Your documents
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          {filteredDocuments.length} document(s) displayed
        </p>
      </div>

      {/* DOCUMENT LIST */}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white text-sm text-slate-500">
          <LoaderCircle
            size={20}
            className="animate-spin text-indigo-600"
          />

          Loading documents from your cloud library...
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <FileText size={24} />
                </div>

                <button
                  onClick={() =>
                    void handleDelete(document)
                  }
                  aria-label={`Delete ${document.name}`}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <h3
                className="truncate text-sm font-bold text-slate-900"
                title={document.name}
              >
                {document.name}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                <span>{formatSize(document.size)}</span>
                <span>·</span>
                <span>{document.pageCount} pages</span>
              </div>

              <p className="mt-2 text-[10px] text-slate-400">
                Uploaded {formatDate(document.uploadedAt)}
              </p>

              <div className="mt-3">
                {document.extractionStatus ===
                "text_extracted" ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                    Text extracted
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                    No selectable text
                  </span>
                )}
              </div>

              <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => {
                    setSelectedDocumentId(document.id);
                    setCurrentPage(1);
                    setError("");
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Eye size={15} />
                  Read PDF
                </button>

                <button
                  onClick={() =>
                    void handleDownloadDocument(document)
                  }
                  disabled={
                    downloadingDocumentId === document.id
                  }
                  title="Download PDF"
                  aria-label={`Download ${document.name}`}
                  className="flex items-center justify-center rounded-lg border border-slate-200 px-3 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloadingDocumentId === document.id ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Download size={16} />
                  )}
                </button>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[10px] text-indigo-600">
                <MessageSquare size={12} />
                AI assistant available inside PDF reader
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-14 text-center">
          <FileText
            size={32}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 text-base font-bold text-slate-800">
            {documents.length === 0
              ? "No PDF documents yet"
              : "No matching documents"}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {documents.length === 0
              ? "Upload your first lecture PDF or textbook to this chapter."
              : "Try a different search term."}
          </p>
        </div>
      )}

      {/* STORAGE INFORMATION */}

      <p className="mt-6 text-center text-[10px] leading-5 text-slate-400">
        Your PDFs are stored in your private LearnSpace cloud
        library using Supabase Storage.
      </p>
    </div>
  );
}
