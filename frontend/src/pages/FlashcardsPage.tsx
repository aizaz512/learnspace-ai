import { useEffect, useMemo, useState } from "react";

import type { Chapter } from "../types/chapter";
import type { Subject } from "../types/subject";
import type { StoredPdfDocument } from "../types/pdf-document";

import { listDocuments } from "../services/documents";

import { generateDocumentFlashcards } from "../services/assistant";

import type { GeneratedFlashcard } from "../services/assistant";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

type FlashcardStatus = "new" | "known" | "missed";

interface SavedFlashcard extends GeneratedFlashcard {
  status: FlashcardStatus;
}

interface SavedFlashcardDeck {
  documentId: string;
  documentName: string;
  pageCount: number;
  requestedCount: number;
  cards: SavedFlashcard[];
  createdAt: string;
  updatedAt: string;
}

type SavedDeckCollection = Record<string, SavedFlashcardDeck>;

type ReviewMode = "all" | "missed";

interface FlashcardsPageProps {
  chapters: Chapter[];
  subjects: Subject[];
  initialChapterId: number | null;
  onOpenPdfLibrary: (chapterId: number) => void;
}

// ==========================================
// STORAGE
// ==========================================

const STORAGE_KEY = "learnspace-ai-flashcards-v1";

function loadSavedDecks(): SavedDeckCollection {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) return {};

    const parsed: unknown = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    const result: SavedDeckCollection = {};

    for (const [documentId, value] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      if (!value || typeof value !== "object") {
        continue;
      }

      const deck = value as Partial<SavedFlashcardDeck>;

      if (
        typeof deck.documentId !== "string" ||
        typeof deck.documentName !== "string" ||
        !Array.isArray(deck.cards)
      ) {
        continue;
      }

      const validCards = deck.cards.filter(
        (card): card is SavedFlashcard => {
          if (!card || typeof card !== "object") {
            return false;
          }

          return (
            typeof card.id === "string" &&
            typeof card.question === "string" &&
            typeof card.answer === "string" &&
            typeof card.page_number === "number" &&
            ["new", "known", "missed"].includes(card.status)
          );
        }
      );

      result[documentId] = {
        documentId: deck.documentId,
        documentName: deck.documentName,
        pageCount: deck.pageCount ?? 0,
        requestedCount: deck.requestedCount ?? validCards.length,
        cards: validCards,
        createdAt: deck.createdAt ?? new Date().toISOString(),
        updatedAt: deck.updatedAt ?? new Date().toISOString(),
      };
    }

    return result;
  } catch (error) {
    console.error("Unable to load flashcard decks:", error);
    return {};
  }
}

// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently created";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function FlashcardsPage({
  chapters,
  subjects,
  initialChapterId,
  onOpenPdfLibrary,
}: FlashcardsPageProps) {
  // ==========================================
  // STATE
  // ==========================================

  const [documents, setDocuments] = useState<StoredPdfDocument[]>([]);

  const [selectedChapterId, setSelectedChapterId] =
    useState<number | null>(
      initialChapterId ?? chapters[0]?.id ?? null
    );

  const [selectedDocumentId, setSelectedDocumentId] = useState("");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [storageWarning, setStorageWarning] = useState("");

  const [cardCount, setCardCount] = useState(10);

  const [decks, setDecks] = useState<SavedDeckCollection>(
    loadSavedDecks
  );

  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const [reviewMode, setReviewMode] = useState<ReviewMode>("all");

  const [reloadToken, setReloadToken] = useState(0);

  // ==========================================
  // SAVE DECKS AUTOMATICALLY
  // ==========================================

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(decks)
      );

      setStorageWarning("");
    } catch (err) {
      console.error("Unable to save flashcards:", err);

      setStorageWarning(
        "Your browser could not save the flashcard deck. Check available storage."
      );
    }
  }, [decks]);

  // ==========================================
  // LOAD DOCUMENTS
  // ==========================================

  useEffect(() => {
    let active = true;

    async function loadAllDocuments() {
      setLoading(true);
      setError("");

      const chapterIds = Array.from(
        new Set([
          ...chapters.map((chapter) => chapter.id),
          1,
        ])
      );

      try {
        const results = await Promise.allSettled(
          chapterIds.map((chapterId) => listDocuments(chapterId))
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
            "Some chapters could not be loaded. Check your backend connection."
          );
        }

        const preferredChapter =
          initialChapterId &&
          uniqueDocuments.some(
            (document) => document.chapterId === initialChapterId
          )
            ? initialChapterId
            : uniqueDocuments.some(
                  (document) => document.chapterId === 1
                )
              ? 1
              : uniqueDocuments[0]?.chapterId ??
                chapters[0]?.id ??
                null;

        setSelectedChapterId(preferredChapter);

        const firstDocument = uniqueDocuments.find(
          (document) => document.chapterId === preferredChapter
        );

        setSelectedDocumentId(firstDocument?.id ?? "");
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your documents."
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
        (document) => document.chapterId === selectedChapterId
      ),
    [documents, selectedChapterId]
  );

  const selectedDocument =
    chapterDocuments.find(
      (document) => document.id === selectedDocumentId
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

    const knownIds = new Set(chapters.map((chapter) => chapter.id));

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

    return [...actualOptions, ...additionalOptions];
  }, [chapters, documents]);

  // ==========================================
  // CURRENT DECK
  // ==========================================

  const activeDeck = selectedDocument
    ? decks[selectedDocument.id] ?? null
    : null;

  // ==========================================
  // REVIEW CARDS
  // ==========================================

  const visibleCards = useMemo(() => {
    if (!activeDeck) return [];

    if (reviewMode === "missed") {
      return activeDeck.cards.filter(
        (card) => card.status === "missed"
      );
    }

    return activeDeck.cards;
  }, [activeDeck, reviewMode]);

  const currentCard = visibleCards[cardIndex] ?? null;

  // ==========================================
  // DECK STATISTICS
  // ==========================================

  const totalCards = activeDeck?.cards.length ?? 0;

  const knownCards =
    activeDeck?.cards.filter(
      (card) => card.status === "known"
    ).length ?? 0;

  const missedCards =
    activeDeck?.cards.filter(
      (card) => card.status === "missed"
    ).length ?? 0;

  const newCards =
    activeDeck?.cards.filter(
      (card) => card.status === "new"
    ).length ?? 0;

  const progressPercentage =
    totalCards > 0
      ? Math.round((knownCards / totalCards) * 100)
      : 0;

  // ==========================================
  // RESET CARD NAVIGATION WHEN DECK CHANGES
  // ==========================================

  useEffect(() => {
    setCardIndex(0);
    setFlipped(false);
    setReviewMode("all");
  }, [selectedDocument?.id]);

  // ==========================================
  // RESET WHEN REVIEW MODE CHANGES
  // ==========================================

  useEffect(() => {
    setCardIndex(0);
    setFlipped(false);
  }, [reviewMode]);

  // ==========================================
  // GENERATE FLASHCARDS
  // ==========================================

  async function handleGenerateFlashcards() {
    if (!selectedDocument || generating) return;

    if (activeDeck) {
      const confirmed = window.confirm(
        "Generating a new deck will replace the saved deck and its review progress for this PDF. Continue?"
      );

      if (!confirmed) return;
    }

    setGenerating(true);
    setError("");
    setFlipped(false);

    try {
      const result = await generateDocumentFlashcards(
        selectedDocument.id,
        cardCount
      );

      const now = new Date().toISOString();

      const savedCards: SavedFlashcard[] = result.cards.map(
        (card) => ({
          ...card,
          status: "new",
        })
      );

      if (savedCards.length === 0) {
        throw new Error(
          "Gemini did not generate any valid flashcards."
        );
      }

      const newDeck: SavedFlashcardDeck = {
        documentId: result.document_id,
        documentName: result.document_name,
        pageCount: result.page_count,
        requestedCount: result.requested_count,
        cards: savedCards,
        createdAt: now,
        updatedAt: now,
      };

      setDecks((current) => ({
        ...current,
        [result.document_id]: newDeck,
      }));

      setCardIndex(0);
      setReviewMode("all");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate flashcards."
      );
    } finally {
      setGenerating(false);
    }
  }

  // ==========================================
  // FLIP CURRENT CARD
  // ==========================================

  function handleFlipCard() {
    if (!currentCard) return;

    setFlipped((current) => !current);
  }

  // ==========================================
  // PREVIOUS CARD
  // ==========================================

  function handlePreviousCard() {
    if (visibleCards.length === 0) return;

    setFlipped(false);

    setCardIndex((current) =>
      current > 0
        ? current - 1
        : visibleCards.length - 1
    );
  }

  // ==========================================
  // NEXT CARD
  // ==========================================

  function handleNextCard() {
    if (visibleCards.length === 0) return;

    setFlipped(false);

    setCardIndex((current) =>
      current < visibleCards.length - 1
        ? current + 1
        : 0
    );
  }

  // ==========================================
  // MARK CARD STATUS
  // ==========================================

  function updateCardStatus(status: FlashcardStatus) {
    if (!selectedDocument || !currentCard) {
      return;
    }

    const currentCardId = currentCard.id;

    setDecks((current) => {
      const deck = current[selectedDocument.id];

      if (!deck) return current;

      const updatedDeck: SavedFlashcardDeck = {
        ...deck,
        cards: deck.cards.map((card) =>
          card.id === currentCardId
            ? {
                ...card,
                status,
              }
            : card
        ),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...current,
        [selectedDocument.id]: updatedDeck,
      };
    });

    setFlipped(false);

    if (reviewMode === "missed") {
      const remainingCount =
        visibleCards.length - (status === "known" ? 1 : 0);

      setCardIndex((current) =>
        remainingCount <= 0
          ? 0
          : Math.min(current, remainingCount - 1)
      );
    } else {
      setCardIndex((current) =>
        current < visibleCards.length - 1
          ? current + 1
          : current
      );
    }
  }

  // ==========================================
  // RESET DECK PROGRESS
  // ==========================================

  function handleResetProgress() {
    if (!selectedDocument || !activeDeck) return;

    const confirmed = window.confirm(
      "Reset all flashcard progress for this PDF?"
    );

    if (!confirmed) return;

    setDecks((current) => {
      const deck = current[selectedDocument.id];

      if (!deck) return current;

      return {
        ...current,
        [selectedDocument.id]: {
          ...deck,
          cards: deck.cards.map((card) => ({
            ...card,
            status: "new",
          })),
          updatedAt: new Date().toISOString(),
        },
      };
    });

    setCardIndex(0);
    setFlipped(false);
    setReviewMode("all");
  }

  // ==========================================
  // REFRESH DOCUMENTS
  // ==========================================

  function handleRefreshDocuments() {
    if (loading) return;

    setSelectedDocumentId("");
    setError("");

    setReloadToken((current) => current + 1);
  }

  // ==========================================
  // SELECT DOCUMENT
  // ==========================================

  function handleChapterChange(value: string) {
    const chapterId = value ? Number(value) : null;

    setSelectedChapterId(chapterId);

    const firstDocument = documents.find(
      (document) => document.chapterId === chapterId
    );

    setSelectedDocumentId(firstDocument?.id ?? "");
    setError("");
  }

  // ==========================================
  // PAGE RENDER
  // ==========================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-indigo-600">
            <Sparkles size={17} />

            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
              Active recall learning
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            AI Flashcards
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Turn your PDFs into interactive study cards and
            strengthen your memory.
          </p>
        </div>
      </section>

      {/* MATERIAL SELECTOR */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen
            size={18}
            className="text-indigo-600"
          />

          <h2 className="text-sm font-bold text-slate-900">
            Choose your study material
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">

          {/* CHAPTER */}

          <div>
            <label
              htmlFor="flashcard-chapter"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Chapter
            </label>

            <select
              id="flashcard-chapter"
              value={selectedChapterId ?? ""}
              onChange={(event) =>
                handleChapterChange(event.target.value)
              }
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

          {/* PDF DOCUMENT */}

          <div>
            <label
              htmlFor="flashcard-document"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              PDF document
            </label>

            <select
              id="flashcard-document"
              value={selectedDocument?.id ?? ""}
              onChange={(event) => {
                setSelectedDocumentId(event.target.value);
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {loading
              ? "Loading documents..."
              : `${documents.length} PDF document(s) found`}
          </span>

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

      {/* ERROR */}

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

      {/* STORAGE WARNING */}

      {storageWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {storageWarning}
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <section className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <LoaderCircle
              size={28}
              className="mx-auto animate-spin text-indigo-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading your study materials...
            </p>
          </div>
        </section>
      )}

      {/* NO DOCUMENTS */}

      {!loading && !selectedDocument && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileText size={26} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No PDF selected
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Upload study material through your PDF Library.
            Then generate flashcards automatically from its content.
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

      {/* SELECTED PDF WORKSPACE */}

      {!loading && selectedDocument && (
        <>
          {/* GENERATOR */}

          {!activeDeck && (
            <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                    <Sparkles size={23} />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Generate AI flashcards
                    </h2>

                    <p className="mt-1 max-w-lg text-xs leading-5 text-slate-600">
                      Gemini will analyze your extracted PDF text
                      and create useful question-and-answer cards
                      with original page references.
                    </p>

                    <p className="mt-2 truncate text-[11px] font-semibold text-indigo-700">
                      {selectedDocument.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-indigo-600" />

                  <span className="text-xs font-semibold text-indigo-700">
                    5–30 cards
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <div>
                  <label
                    htmlFor="flashcard-count"
                    className="mb-2 block text-xs font-semibold text-slate-700"
                  >
                    Number of flashcards
                  </label>

                  <select
                    id="flashcard-count"
                    value={cardCount}
                    onChange={(event) =>
                      setCardCount(Number(event.target.value))
                    }
                    disabled={generating}
                    className="min-w-36 rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                  >
                    {[5, 10, 15, 20, 25, 30].map((count) => (
                      <option key={count} value={count}>
                        {count} cards
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => void handleGenerateFlashcards()}
                  disabled={generating}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating ? (
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Sparkles size={15} />
                  )}

                  {generating
                    ? "Generating flashcards..."
                    : "Generate flashcards"}
                </button>
              </div>

              {generating && (
                <div className="mt-5 rounded-xl bg-white/70 p-3 text-xs text-indigo-700">
                  <div className="flex items-center gap-2">
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                    />

                    Gemini is reading your study material and
                    preparing the flashcards.
                  </div>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Generation may take longer for large PDFs.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* SAVED DECK */}

          {activeDeck && (
            <>
              {/* DECK HEADER */}

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <BookOpen size={21} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900">
                        {activeDeck.documentName}
                      </h2>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {totalCards} cards · Created{" "}
                        {formatDate(activeDeck.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetProgress}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <RotateCcw size={13} />
                      Reset progress
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleGenerateFlashcards()}
                      disabled={generating}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[10px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <RefreshCw size={13} />
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* PROGRESS */}

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Learning progress
                    </span>

                    <span className="font-bold text-indigo-600">
                      {progressPercentage}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      style={{
                        width: `${progressPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                {/* STATISTICS */}

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-lg font-bold text-slate-800">
                      {newCards}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      New
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-lg font-bold text-emerald-700">
                      {knownCards}
                    </p>

                    <p className="mt-1 text-[10px] text-emerald-600">
                      Known
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="text-lg font-bold text-amber-700">
                      {missedCards}
                    </p>

                    <p className="mt-1 text-[10px] text-amber-600">
                      Review again
                    </p>
                  </div>
                </div>
              </section>

              {/* REVIEW MODE */}

              <section className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Practice your knowledge
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Select an answer status to track your progress.
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setReviewMode("all")}
                    className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition ${
                      reviewMode === "all"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    All cards ({totalCards})
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewMode("missed")}
                    className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition ${
                      reviewMode === "missed"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Review missed ({missedCards})
                  </button>
                </div>
              </section>

              {/* EMPTY MISSED REVIEW */}

              {reviewMode === "missed" &&
                visibleCards.length === 0 && (
                  <section className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-12 text-center">
                    <CheckCircle2
                      size={34}
                      className="mx-auto text-emerald-600"
                    />

                    <h3 className="mt-3 text-base font-bold text-slate-900">
                      Nothing to review!
                    </h3>

                    <p className="mt-2 text-xs text-slate-500">
                      You have no missed cards. Great work!
                    </p>

                    <button
                      type="button"
                      onClick={() => setReviewMode("all")}
                      className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Return to all cards
                    </button>
                  </section>
                )}

              {/* FLASHCARD */}

              {currentCard && (
                <section className="mx-auto w-full max-w-3xl">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Card {cardIndex + 1} of {visibleCards.length}
                    </span>

                    <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-semibold text-indigo-700">
                      {currentCard.topic || "Study concept"}
                    </span>
                  </div>

                  {/* CLICKABLE CARD */}

                  <button
                    type="button"
                    onClick={handleFlipCard}
                    aria-pressed={flipped}
                    className={`flex min-h-[310px] w-full flex-col items-center justify-center rounded-3xl border p-7 text-center shadow-sm transition duration-200 sm:min-h-[350px] sm:p-12 ${
                      flipped
                        ? "border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md"
                    }`}
                  >
                    {flipped ? (
                      <>
                        <span className="mb-5 rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                          Answer
                        </span>

                        <p className="max-w-xl text-base font-medium leading-8 text-slate-800 sm:text-lg">
                          {currentCard.answer}
                        </p>

                        <span className="mt-7 text-[10px] font-medium text-violet-500">
                          Tap to see question
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mb-5 rounded-full bg-indigo-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          Question
                        </span>

                        <p className="max-w-xl text-xl font-bold leading-9 text-slate-900 sm:text-2xl">
                          {currentCard.question}
                        </p>

                        <span className="mt-7 text-[10px] font-medium text-slate-400">
                          Tap anywhere to reveal the answer
                        </span>
                      </>
                    )}
                  </button>

                  {/* PAGE REFERENCE */}

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <FileText
                      size={13}
                      className="text-indigo-500"
                    />

                    <span className="text-[10px] font-semibold text-slate-500">
                      Source: PDF page {currentCard.page_number}
                    </span>
                  </div>

                  {/* CARD NAVIGATION */}

                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handlePreviousCard}
                      disabled={visibleCards.length < 2}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Previous flashcard"
                    >
                      <ArrowLeft size={17} />
                    </button>

                    <span className="min-w-24 text-center text-xs font-semibold text-slate-600">
                      {cardIndex + 1} / {visibleCards.length}
                    </span>

                    <button
                      type="button"
                      onClick={handleNextCard}
                      disabled={visibleCards.length < 2}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Next flashcard"
                    >
                      <ArrowRight size={17} />
                    </button>
                  </div>

                  {/* ANSWER ACTIONS */}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateCardStatus("missed")}
                      className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
                    >
                      <XCircle size={17} />
                      Review again
                    </button>

                    <button
                      type="button"
                      onClick={() => updateCardStatus("known")}
                      className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <CheckCircle2 size={17} />
                      Know it
                    </button>
                  </div>
                </section>
              )}
            </>
          )}

          {/* GENERATING OVERLAY MESSAGE */}

          {generating && activeDeck && (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <LoaderCircle
                size={18}
                className="animate-spin text-indigo-600"
              />

              <p className="text-xs text-indigo-800">
                Generating your replacement deck...
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}