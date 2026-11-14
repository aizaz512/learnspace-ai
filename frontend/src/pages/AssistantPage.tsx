import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BookOpen,
  Bot,
  Download,
  FileText,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import type { Chapter } from "../types/chapter";
import type { Subject } from "../types/subject";
import type { StoredPdfDocument } from "../types/pdf-document";

import {
  getPdfFileUrl,
  listDocuments,
} from "../services/documents";

import {
  generateDocumentSummary,
} from "../services/assistant";

import type {
  DocumentSummaryResponse,
} from "../services/assistant";

import DocumentAssistant from "../components/DocumentAssistant";


interface AssistantPageProps {
  chapters: Chapter[];
  subjects: Subject[];
  initialChapterId: number | null;
  onOpenPdfLibrary: (chapterId: number) => void;
}


// ==========================================
// SUMMARY CONTENT RENDERER
// ==========================================

interface SummaryContentProps {
  content: string;
  onPageClick: (pageNumber: number) => void;
}

function SummaryContent({
  content,
  onPageClick,
}: SummaryContentProps) {

  function renderInlineText(line: string) {
    const parts = line.split(
      /(\[Page\s+\d+\])/gi
    );

    return parts.map((part, index) => {
      const citation = part.match(
        /^\[Page\s+(\d+)\]$/i
      );

      if (!citation) {
        return (
          <span key={`text-${index}`}>
            {part}
          </span>
        );
      }

      const pageNumber = Number(citation[1]);

      return (
        <button
          key={`citation-${index}`}
          type="button"
          onClick={() => onPageClick(pageNumber)}
          title={`Open PDF page ${pageNumber}`}
          aria-label={`Navigate to PDF page ${pageNumber}`}
          className="mx-0.5 inline-flex cursor-pointer items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-bold text-indigo-700 underline decoration-indigo-300 underline-offset-2 transition hover:bg-indigo-100 hover:text-indigo-900"
        >
          Page {pageNumber}
        </button>
      );
    });
  }

  const lines = content.split(/\r?\n/);

  return (
    <div className="space-y-3 text-sm leading-7 text-slate-700">

      {lines.map((line, index) => {
        const value = line.trim();

        if (!value) {
          return (
            <div
              key={index}
              className="h-1"
            />
          );
        }

        // Main heading
        if (value.startsWith("# ")) {
          return (
            <h2
              key={index}
              className="mt-7 border-b border-slate-100 pb-2 text-xl font-bold text-slate-900"
            >
              {renderInlineText(
                value.replace(/^#+\s*/, "")
              )}
            </h2>
          );
        }

        // Secondary heading
        if (value.startsWith("## ")) {
          return (
            <h3
              key={index}
              className="mt-5 text-base font-bold text-slate-800"
            >
              {renderInlineText(
                value.replace(/^#+\s*/, "")
              )}
            </h3>
          );
        }

        // Tertiary heading
        if (value.startsWith("### ")) {
          return (
            <h4
              key={index}
              className="mt-4 text-sm font-bold text-indigo-700"
            >
              {renderInlineText(
                value.replace(/^#+\s*/, "")
              )}
            </h4>
          );
        }

        // Bullet points
        if (
          value.startsWith("- ") ||
          value.startsWith("* ")
        ) {
          return (
            <div
              key={index}
              className="flex items-start gap-2 pl-2"
            >
              <span className="mt-0.5 text-indigo-500">
                •
              </span>

              <p className="min-w-0">
                {renderInlineText(value.slice(2))}
              </p>
            </div>
          );
        }

        // Numbered points
        if (/^\d+\.\s/.test(value)) {
          return (
            <p
              key={index}
              className="pl-3"
            >
              {renderInlineText(value)}
            </p>
          );
        }

        // Normal paragraph
        return (
          <p key={index}>
            {renderInlineText(value)}
          </p>
        );
      })}

    </div>
  );
}


// ==========================================
// MAIN ASSISTANT PAGE
// ==========================================

export default function AssistantPage({
  chapters,
  subjects,
  initialChapterId,
  onOpenPdfLibrary,
}: AssistantPageProps) {

  // ==========================================
  // STATE
  // ==========================================

  const [documents, setDocuments] = useState<
    StoredPdfDocument[]
  >([]);

  const [selectedChapterId, setSelectedChapterId] =
    useState<number | null>(
      initialChapterId ?? chapters[0]?.id ?? null
    );

  const [selectedDocumentId, setSelectedDocumentId] =
    useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [summaryLoading, setSummaryLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [summaryError, setSummaryError] = useState("");

  const [summary, setSummary] =
    useState<DocumentSummaryResponse | null>(null);

  const [reloadToken, setReloadToken] = useState(0);


  // ==========================================
  // LOAD BACKEND DOCUMENTS
  // ==========================================

  useEffect(() => {
    let active = true;

    async function loadAllDocuments() {
      setLoading(true);
      setError("");

      // Include actual frontend chapters and chapter 1
      // for documents uploaded earlier through Swagger.
      const chapterIds = Array.from(
        new Set([
          ...chapters.map((chapter) => chapter.id),
          1,
        ])
      );

      try {
        const results = await Promise.allSettled(
          chapterIds.map((chapterId) =>
            listDocuments(chapterId)
          )
        );

        if (!active) return;

        const loadedDocuments: StoredPdfDocument[] = [];

        let failedRequests = 0;

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            loadedDocuments.push(...result.value);
          } else {
            failedRequests += 1;
          }
        });

        // Remove duplicate backend document IDs.
        const uniqueDocuments = Array.from(
          new Map(
            loadedDocuments.map((document) => [
              document.id,
              document,
            ])
          ).values()
        );

        setDocuments(uniqueDocuments);

        if (failedRequests > 0) {
          setError(
            "Some chapters could not be loaded. Please check your backend connection."
          );
        }

        // Prefer the previously selected chapter if it contains PDFs.
        const preferredChapter =
          initialChapterId &&
          uniqueDocuments.some(
            (document) =>
              document.chapterId === initialChapterId
          )
            ? initialChapterId
            : uniqueDocuments.some(
                  (document) =>
                    document.chapterId === 1
                )
              ? 1
              : uniqueDocuments[0]?.chapterId ??
                chapters[0]?.id ??
                null;

        setSelectedChapterId(preferredChapter);

        const firstDocument = uniqueDocuments.find(
          (document) =>
            document.chapterId === preferredChapter
        );

        setSelectedDocumentId(
          firstDocument?.id ?? ""
        );

      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your PDF documents."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAllDocuments();

    return () => {
      active = false;
    };

  }, [chapters, initialChapterId, reloadToken]);


  // ==========================================
  // DERIVED DOCUMENTS
  // ==========================================

  const chapterDocuments = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.chapterId === selectedChapterId
      ),
    [documents, selectedChapterId]
  );

  const selectedDocument =
    chapterDocuments.find(
      (document) =>
        document.id === selectedDocumentId
    ) ??
    chapterDocuments[0] ??
    null;


  // ==========================================
  // CHAPTER OPTIONS
  // ==========================================

  const chapterOptions = useMemo(() => {

    const actualOptions = chapters.map((chapter) => ({
      id: chapter.id,
      label: chapter.title,
    }));

    const knownIds = new Set(
      chapters.map((chapter) => chapter.id)
    );

    const additionalOptions = Array.from(
      new Set(
        documents
          .map((document) => document.chapterId)
          .filter((id) => !knownIds.has(id))
      )
    ).map((id) => ({
      id,
      label: `Other uploads (backend chapter ${id})`,
    }));

    return [
      ...actualOptions,
      ...additionalOptions,
    ];

  }, [chapters, documents]);


  // ==========================================
  // RESET SUMMARY WHEN PDF CHANGES
  // ==========================================

  useEffect(() => {
    setCurrentPage(1);
    setSummary(null);
    setSummaryError("");
  }, [selectedDocument?.id]);


  // ==========================================
  // PDF PAGE NAVIGATION
  // ==========================================

  function handleSourceClick(pageNumber: number) {
    if (!selectedDocument) return;

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > selectedDocument.pageCount
    ) {
      setError(
        `Invalid page reference. This PDF contains ${selectedDocument.pageCount} pages.`
      );

      return;
    }

    setError("");

    setCurrentPage(pageNumber);

    window.setTimeout(() => {
      window.document
        .getElementById("assistant-pdf-reader")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }


  // ==========================================
  // GENERATE STUDY SUMMARY
  // ==========================================

  async function handleGenerateSummary() {
    if (!selectedDocument || summaryLoading) {
      return;
    }

    setSummary(null);
    setSummaryError("");
    setSummaryLoading(true);

    try {
      const result = await generateDocumentSummary(
        selectedDocument.id
      );

      setSummary(result);

    } catch (err) {
      setSummaryError(
        err instanceof Error
          ? err.message
          : "Unable to generate the study summary."
      );

    } finally {
      setSummaryLoading(false);
    }
  }


  // ==========================================
  // DOWNLOAD STUDY SUMMARY
  // ==========================================

  function handleDownloadSummary() {
    if (!summary) return;

    const generatedDate = new Date(
      summary.generated_at
    );

    const formattedDate = Number.isNaN(
      generatedDate.getTime()
    )
      ? "Not available"
      : generatedDate.toLocaleString();

    const markdownContent = [
      `# Study Summary: ${summary.document_name}`,
      "",
      `**Total PDF pages:** ${summary.page_count}`,
      `**Generated:** ${formattedDate}`,
      "",
      "---",
      "",
      summary.summary,
      "",
      "---",
      "",
      "## Source Reference Guide",
      "",
      "The citations such as [Page 3] refer to the original physical pages of the PDF.",
      "",
      "Open this summary inside LearnSpace AI to use clickable page navigation.",
      "",
    ].join("\n");

    const blob = new Blob(
      [markdownContent],
      {
        type: "text/markdown;charset=utf-8",
      }
    );

    const objectUrl = URL.createObjectURL(blob);

    const safeFilename = summary.document_name
      .replace(/\.pdf$/i, "")
      .replace(/[^a-z0-9-_]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    const anchor = window.document.createElement("a");

    anchor.href = objectUrl;

    anchor.download =
      `${safeFilename || "document"}-study-summary.md`;

    window.document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }


  // ==========================================
  // REFRESH DOCUMENTS
  // ==========================================

  function handleRefreshDocuments() {
    if (loading) return;

    setSelectedDocumentId("");
    setSummary(null);
    setSummaryError("");

    setReloadToken((current) => current + 1);
  }


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <div className="mb-2 flex items-center gap-2 text-indigo-600">
            <Sparkles size={17} />

            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
              Intelligent learning assistant
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            AI Study Assistant
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Understand your study materials, ask questions,
            and prepare for exams.
          </p>
        </div>

      </div>


      {/* MATERIAL SELECTOR */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center gap-2">
          <BookOpen
            size={18}
            className="text-indigo-600"
          />

          <h2 className="text-sm font-bold text-slate-900">
            Select learning material
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">

          {/* CHAPTER SELECTOR */}

          <div>
            <label
              htmlFor="assistant-chapter"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Chapter
            </label>

            <select
              id="assistant-chapter"
              value={selectedChapterId ?? ""}
              onChange={(event) => {
                const value = Number(
                  event.target.value
                );

                setSelectedChapterId(
                  value || null
                );

                const firstDocument = documents.find(
                  (document) =>
                    document.chapterId === value
                );

                setSelectedDocumentId(
                  firstDocument?.id ?? ""
                );

                setSummary(null);
                setError("");
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
            >
              <option value="">
                Select a chapter
              </option>

              {chapterOptions.map((chapter) => {
                const actualChapter = chapters.find(
                  (item) => item.id === chapter.id
                );

                const subject = subjects.find(
                  (item) =>
                    item.id === actualChapter?.subjectId
                );

                return (
                  <option
                    key={chapter.id}
                    value={chapter.id}
                  >
                    {subject
                      ? `${subject.name} — ${chapter.label}`
                      : chapter.label}
                  </option>
                );
              })}
            </select>
          </div>


          {/* PDF SELECTOR */}

          <div>
            <label
              htmlFor="assistant-document"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              PDF document
            </label>

            <select
              id="assistant-document"
              value={selectedDocument?.id ?? ""}
              onChange={(event) => {
                setSelectedDocumentId(
                  event.target.value
                );
              }}
              disabled={chapterDocuments.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 disabled:bg-slate-50"
            >
              <option value="">
                Select a PDF
              </option>

              {chapterDocuments.map((document) => (
                <option
                  key={document.id}
                  value={document.id}
                >
                  {document.name}
                </option>
              ))}
            </select>
          </div>

        </div>


        {/* SELECTOR FOOTER */}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

          <div className="text-xs text-slate-400">
            {loading
              ? "Loading documents..."
              : `${documents.length} PDF document(s) found`}
          </div>

          <button
            type="button"
            onClick={handleRefreshDocuments}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin" : ""}
            />

            Refresh documents
          </button>

        </div>

      </section>


      {/* GENERAL ERROR */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
        >
          <AlertCircle
            size={15}
            className="mt-0.5 shrink-0"
          />

          {error}
        </div>
      )}


      {/* LOADING */}

      {loading && (
        <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white">

          <div className="text-center">

            <LoaderCircle
              size={28}
              className="mx-auto animate-spin text-indigo-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading your learning materials...
            </p>

          </div>

        </div>
      )}


      {/* NO DOCUMENT */}

      {!loading && !selectedDocument && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileText size={26} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No PDF selected
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Upload a PDF in a chapter's PDF Library.
            Once uploaded, it will appear here for AI-powered
            question answering and study summaries.
          </p>

          {chapters.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const chapterId =
                  chapters.find(
                    (chapter) =>
                      chapter.id === selectedChapterId
                  )?.id ?? chapters[0].id;

                onOpenPdfLibrary(chapterId);
              }}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              Open PDF Library
            </button>
          )}

        </section>
      )}


      {/* SELECTED PDF TOOLS */}

      {!loading && selectedDocument && (
        <>

          {/* ACTION CARDS */}

          <div className="grid gap-4 md:grid-cols-2">

            {/* ASK PDF */}

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Bot size={20} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Ask your PDF
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Get answers with source references.
                  </p>
                </div>

              </div>

            </div>


            {/* STUDY SUMMARY */}

            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">

              <div className="flex items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <WandSparkles size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Study summary
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Create structured revision notes.
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => void handleGenerateSummary()}
                  disabled={summaryLoading}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-[11px] font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {summaryLoading ? (
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Sparkles size={14} />
                  )}

                  {summaryLoading
                    ? "Generating..."
                    : "Generate"}
                </button>

              </div>

            </div>

          </div>


          {/* PDF READER AND CHAT */}

          <div className="grid min-w-0 grid-cols-1 gap-5 2xl:grid-cols-2">

            {/* PDF READER */}

            <section
              id="assistant-pdf-reader"
              className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4">

                <div className="flex min-w-0 items-center gap-2">

                  <FileText
                    size={17}
                    className="shrink-0 text-indigo-600"
                  />

                  <h2 className="truncate text-sm font-bold text-slate-900">
                    {selectedDocument.name}
                  </h2>

                </div>

                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                  Page {currentPage} / {selectedDocument.pageCount}
                </span>

              </div>

              <iframe
                key={`${selectedDocument.id}-${currentPage}`}
                src={`${getPdfFileUrl(selectedDocument.id)}#page=${currentPage}`}
                title={selectedDocument.name}
                className="h-[700px] w-full bg-slate-100"
              />

              <div className="border-t border-slate-100 p-3 text-[10px] text-slate-400">
                Click a source citation in the assistant or summary to navigate to its PDF page.
              </div>

            </section>


            {/* CHAT ASSISTANT */}

            <section className="min-w-0">

              <DocumentAssistant
                key={selectedDocument.id}
                documentId={selectedDocument.id}
                documentName={selectedDocument.name}
                onSourceClick={handleSourceClick}
              />

            </section>

          </div>


          {/* SUMMARY GENERATION STATUS */}

          {summaryLoading && (
            <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4">

              <LoaderCircle
                size={19}
                className="animate-spin text-violet-600"
              />

              <div>
                <p className="text-xs font-bold text-violet-900">
                  Generating your study summary
                </p>

                <p className="mt-1 text-[11px] text-violet-700">
                  Processing your PDF and preparing structured revision notes.
                  Large documents may require several Gemini requests.
                </p>
              </div>

            </div>
          )}


          {/* SUMMARY ERROR */}

          {summaryError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
            >
              <AlertCircle
                size={15}
                className="mt-0.5 shrink-0"
              />

              {summaryError}
            </div>
          )}


          {/* GENERATED SUMMARY */}

          {summary && (

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* SUMMARY HEADER */}

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <WandSparkles size={20} />
                  </div>

                  <div>

                    <h2 className="text-base font-bold text-slate-900">
                      AI Study Summary
                    </h2>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {summary.document_name} · {summary.page_count} pages
                    </p>

                  </div>

                </div>


                <div className="flex items-center gap-2">

                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-semibold text-green-700">
                    Generated
                  </span>

                  <button
                    type="button"
                    onClick={handleDownloadSummary}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-[11px] font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <Download size={14} />
                    Download .md
                  </button>

                </div>

              </div>


              {/* CITATION INSTRUCTIONS */}

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 bg-indigo-50/50 px-5 py-3">

                <p className="text-[11px] leading-5 text-indigo-800">
                  Click any page citation below to open its original PDF page.
                </p>

                <span className="text-[10px] font-semibold text-indigo-600">
                  Interactive source references
                </span>

              </div>


              {/* SUMMARY BODY */}

              <div className="p-5 sm:p-7">

                <SummaryContent
                  content={summary.summary}
                  onPageClick={handleSourceClick}
                />

              </div>


              {/* SUMMARY FOOTER */}

              <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">

                <div className="flex flex-wrap items-center justify-between gap-2">

                  <div className="text-[10px] leading-5 text-slate-500">
                    Generated from extracted PDF content.
                    Verify important information against the original document.
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadSummary}
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Download size={12} />
                    Download study notes
                  </button>

                </div>

              </div>

            </section>

          )}

        </>
      )}

    </div>
  );
}