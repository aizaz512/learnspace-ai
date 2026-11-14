
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

import type { Chapter } from "../types/chapter";
import type { Subject } from "../types/subject";
import type { StoredPdfDocument } from "../types/pdf-document";

import { listDocuments } from "../services/documents";

import {
  generateDocumentQuiz,
  submitDocumentQuiz,
} from "../services/quizzes";

import type {
  GeneratedQuiz,
  QuizDifficulty,
  QuizQuestionType,
  QuizSubmissionResult,
} from "../services/quizzes";


// ============================================
// PAGE PROPS
// ============================================

interface QuizzesPageProps {
  chapters: Chapter[];
  subjects: Subject[];
  initialChapterId: number | null;
  onOpenPdfLibrary: (chapterId: number) => void;
}


// ============================================
// QUESTION TYPE OPTIONS
// ============================================

const questionTypeOptions: {
  value: QuizQuestionType;
  label: string;
  description: string;
}[] = [
  {
    value: "mcq",
    label: "Multiple Choice",
    description: "Choose one correct answer.",
  },
  {
    value: "true_false",
    label: "True / False",
    description: "Evaluate a statement.",
  },
  {
    value: "short_answer",
    label: "Short Answer",
    description: "Write an answer in your own words.",
  },
];


// ============================================
// DIFFICULTY OPTIONS
// ============================================

const difficultyOptions: {
  value: QuizDifficulty;
  label: string;
  description: string;
}[] = [
  {
    value: "easy",
    label: "Easy",
    description: "Fundamental concepts and definitions.",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Understanding and application.",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Deeper conceptual understanding.",
  },
];


// ============================================
// MAIN PAGE
// ============================================

export default function QuizzesPage({
  chapters,
  subjects,
  initialChapterId,
  onOpenPdfLibrary,
}: QuizzesPageProps) {

  // ==========================================
  // DOCUMENT STATE
  // ==========================================

  const [documents, setDocuments] = useState<
    StoredPdfDocument[]
  >([]);

  const [selectedDocumentId, setSelectedDocumentId] =
    useState("");

  const [loadingDocuments, setLoadingDocuments] =
    useState(true);

  const [documentError, setDocumentError] =
    useState("");

  const [reloadToken, setReloadToken] =
    useState(0);


  // ==========================================
  // QUIZ SETTINGS
  // ==========================================

  const [questionCount, setQuestionCount] =
    useState(10);

  const [difficulty, setDifficulty] =
    useState<QuizDifficulty>("medium");

  const [questionTypes, setQuestionTypes] =
    useState<QuizQuestionType[]>([
      "mcq",
      "true_false",
      "short_answer",
    ]);


  // ==========================================
  // QUIZ STATE
  // ==========================================

  const [quiz, setQuiz] =
    useState<GeneratedQuiz | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [answers, setAnswers] =
    useState<Record<string, string>>({});

  const [result, setResult] =
    useState<QuizSubmissionResult | null>(null);


  // ==========================================
  // LOADING AND ERROR STATES
  // ==========================================

  const [generating, setGenerating] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================
  // LOAD AVAILABLE PDF DOCUMENTS
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    async function loadAvailableDocuments() {
      setLoadingDocuments(true);
      setDocumentError("");

      try {
        /*
         * Load documents belonging to existing chapters.
         *
         * Backend chapter 1 is also included because
         * the test PDF was previously uploaded through
         * Swagger using chapter_id = 1.
         */

        const chapterIds = Array.from(
          new Set([
            ...chapters.map((chapter) => chapter.id),
            1,
          ])
        );

        const documentGroups = await Promise.all(
          chapterIds.map(async (chapterId) => {
            try {
              return await listDocuments(chapterId);
            } catch {
              return [];
            }
          })
        );

        if (cancelled) return;

        // Remove duplicate documents.
        const uniqueDocuments = new Map<
          string,
          StoredPdfDocument
        >();

        documentGroups.flat().forEach((document) => {
          uniqueDocuments.set(
            document.id,
            document
          );
        });

        const loadedDocuments = Array.from(
          uniqueDocuments.values()
        ).sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() -
            new Date(a.uploadedAt).getTime()
        );

        setDocuments(loadedDocuments);

        setSelectedDocumentId((current) => {
          // Keep the existing selection if still available.
          if (
            current &&
            loadedDocuments.some(
              (document) => document.id === current
            )
          ) {
            return current;
          }

          // Prefer a document from the selected chapter.
          const preferredDocument =
            initialChapterId !== null
              ? loadedDocuments.find(
                  (document) =>
                    document.chapterId === initialChapterId
                )
              : undefined;

          return (
            preferredDocument?.id ??
            loadedDocuments[0]?.id ??
            ""
          );
        });

        if (loadedDocuments.length === 0) {
          setDocumentError(
            "No uploaded PDF documents were found. Upload a PDF to a chapter before generating a quiz."
          );
        }

      } catch (err) {
        if (!cancelled) {
          setDocumentError(
            err instanceof Error
              ? err.message
              : "Unable to load PDF documents."
          );
        }

      } finally {
        if (!cancelled) {
          setLoadingDocuments(false);
        }
      }
    }

    loadAvailableDocuments();

    return () => {
      cancelled = true;
    };

  }, [
    chapters,
    initialChapterId,
    reloadToken,
  ]);


  // ==========================================
  // SELECTED DOCUMENT
  // ==========================================

  const selectedDocument = useMemo(
    () =>
      documents.find(
        (document) =>
          document.id === selectedDocumentId
      ) ?? null,
    [
      documents,
      selectedDocumentId,
    ]
  );


  // ==========================================
  // SELECTED DOCUMENT CHAPTER
  // ==========================================

  const selectedDocumentChapter = useMemo(
    () => {
      if (!selectedDocument) return null;

      return (
        chapters.find(
          (chapter) =>
            chapter.id === selectedDocument.chapterId
        ) ?? null
      );
    },
    [
      chapters,
      selectedDocument,
    ]
  );


  // ==========================================
  // SELECTED DOCUMENT SUBJECT
  // ==========================================

  /*
   * This declaration is required because the PDF
   * information card displays the subject name.
   *
   * It belongs here, outside the JSX return.
   */

  const selectedDocumentSubject = useMemo(
    () => {
      if (!selectedDocumentChapter) return null;

      return (
        subjects.find(
          (subject) =>
            subject.id === selectedDocumentChapter.subjectId
        ) ?? null
      );
    },
    [
      subjects,
      selectedDocumentChapter,
    ]
  );


  // ==========================================
  // CURRENT QUESTION
  // ==========================================

  const currentQuestion =
    quiz?.questions[currentQuestionIndex] ?? null;


  // ==========================================
  // ANSWERED QUESTION COUNT
  // ==========================================

  const answeredCount = useMemo(
    () => {
      if (!quiz) return 0;

      return quiz.questions.filter(
        (question) =>
          Boolean(answers[question.id]?.trim())
      ).length;
    },
    [
      answers,
      quiz,
    ]
  );


  // ==========================================
  // QUESTION TYPE LABEL
  // ==========================================

  function getQuestionTypeLabel(
    type: QuizQuestionType
  ): string {
    switch (type) {
      case "mcq":
        return "Multiple Choice";

      case "true_false":
        return "True / False";

      case "short_answer":
        return "Short Answer";

      default:
        return type;
    }
  }


  // ==========================================
  // FILE SIZE FORMAT
  // ==========================================

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }


  // ==========================================
  // TOGGLE QUESTION TYPE
  // ==========================================

  function toggleQuestionType(
    type: QuizQuestionType
  ) {
    setQuestionTypes((current) => {
      if (current.includes(type)) {
        return current.filter(
          (item) => item !== type
        );
      }

      return [
        ...current,
        type,
      ];
    });
  }


  // ==========================================
  // GENERATE QUIZ
  // ==========================================

  async function handleGenerateQuiz() {
    if (!selectedDocument) {
      setError("Please select a PDF document first.");
      return;
    }

    if (questionTypes.length === 0) {
      setError("Select at least one question type.");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const generatedQuiz =
        await generateDocumentQuiz(
          selectedDocument.id,
          {
            question_count: questionCount,
            difficulty,
            question_types: questionTypes,
          }
        );

      setQuiz(generatedQuiz);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setResult(null);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate your quiz."
      );

    } finally {
      setGenerating(false);
    }
  }


  // ==========================================
  // SAVE STUDENT ANSWER
  // ==========================================

  function handleAnswerChange(
    questionId: string,
    answer: string
  ) {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  }


  // ==========================================
  // SUBMIT QUIZ
  // ==========================================

  async function handleSubmitQuiz() {
    if (!quiz) return;

    const confirmed = window.confirm(
      "Are you sure you want to submit this quiz? You will see your results after submission."
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError("");

    try {
      const submittedAnswers = quiz.questions.map(
        (question) => ({
          question_id: question.id,
          answer: answers[question.id] ?? "",
        })
      );

      const submissionResult =
        await submitDocumentQuiz(
          quiz.quiz_id,
          submittedAnswers
        );

      setResult(submissionResult);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit the quiz."
      );

    } finally {
      setSubmitting(false);
    }
  }


  // ==========================================
  // RESET QUIZ
  // ==========================================

  function handleCreateAnotherQuiz() {
    setQuiz(null);
    setResult(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  // ==========================================
  // OPEN PDF LIBRARY
  // ==========================================

  function handleOpenLibrary() {
    const chapterId =
      selectedDocument?.chapterId &&
      chapters.some(
        (chapter) =>
          chapter.id === selectedDocument.chapterId
      )
        ? selectedDocument.chapterId
        : initialChapterId ??
          chapters[0]?.id;

    if (chapterId === undefined || chapterId === null) {
      setError(
        "Create a chapter before uploading a PDF."
      );
      return;
    }

    onOpenPdfLibrary(chapterId);
  }


  // ==========================================
  // QUIZ RESULTS SCREEN
  // ==========================================

  if (result && quiz) {
    const isExcellent =
      result.score_percentage >= 80;

    const isPassing =
      result.score_percentage >= 50;

    return (
      <div className="space-y-6">

        {/* RESULT HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Quiz completed
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Your quiz results
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {result.document_name}
            </p>
          </div>

          <button
            onClick={handleCreateAnotherQuiz}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <RefreshCw size={15} />
            Create another quiz
          </button>
        </div>


        {/* SCORE CARD */}

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[auto_1fr]">

            <div
              className={`flex h-36 w-36 flex-col items-center justify-center rounded-full border-[9px] ${
                isExcellent
                  ? "border-emerald-100 bg-emerald-50"
                  : isPassing
                    ? "border-indigo-100 bg-indigo-50"
                    : "border-rose-100 bg-rose-50"
              }`}
            >
              <span
                className={`text-3xl font-bold ${
                  isExcellent
                    ? "text-emerald-700"
                    : isPassing
                      ? "text-indigo-700"
                      : "text-rose-700"
                }`}
              >
                {result.score_percentage}%
              </span>

              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Your score
              </span>
            </div>


            <div>
              <div className="flex items-center gap-2">
                <Trophy
                  size={22}
                  className={
                    isExcellent
                      ? "text-emerald-600"
                      : "text-indigo-600"
                  }
                />

                <h2 className="text-lg font-bold text-slate-900">
                  {isExcellent
                    ? "Excellent work!"
                    : isPassing
                      ? "Good effort!"
                      : "Keep practicing!"}
                </h2>
              </div>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {isExcellent
                  ? "You demonstrated strong understanding of the material. Keep reviewing to maintain your progress."
                  : isPassing
                    ? "You understand several important concepts. Review the questions you missed to improve further."
                    : "Review the explanations below, revisit the relevant pages in your PDF, and try another quiz."}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] text-slate-400">
                    Total questions
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {result.total_questions}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-[10px] text-emerald-700">
                    Correct
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    {result.correct_count}
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50 p-3">
                  <p className="text-[10px] text-rose-700">
                    Incorrect
                  </p>

                  <p className="mt-1 text-xl font-bold text-rose-700">
                    {result.incorrect_count}
                  </p>
                </div>

                <div className="rounded-xl bg-indigo-50 p-3">
                  <p className="text-[10px] text-indigo-700">
                    Score
                  </p>

                  <p className="mt-1 text-xl font-bold text-indigo-700">
                    {result.score_percentage}%
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>


        {/* ANSWER REVIEW */}

        <section className="space-y-4">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Review your answers
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Check the correct answers and understand your mistakes.
            </p>
          </div>

          {result.results.map((item, index) => (
            <article
              key={item.question_id}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
            >
              <div className="flex items-start gap-3 p-5">

                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    item.is_correct
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {item.is_correct ? (
                    <Check size={17} />
                  ) : (
                    <XCircle size={17} />
                  )}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Question {index + 1}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-500">
                      {getQuestionTypeLabel(item.question_type)}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                        item.is_correct
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {item.is_correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold leading-6 text-slate-900">
                    {item.question}
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Your answer
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-700">
                        {item.student_answer || "Not answered"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Correct answer
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-emerald-900">
                        {item.correct_answer}
                      </p>
                    </div>

                  </div>

                  {item.feedback && (
                    <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">

                      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                        <Sparkles size={13} />
                        Explanation and feedback
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-700">
                        {item.feedback}
                      </p>

                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">

                    {item.topic && (
                      <span>
                        Topic: {item.topic}
                      </span>
                    )}

                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      Source: Page {item.page_number}
                    </span>

                  </div>

                </div>
              </div>
            </article>
          ))}

        </section>


        {/* RESULT ACTIONS */}

        <div className="flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-100 bg-white p-4">

          <button
            onClick={handleCreateAnotherQuiz}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw size={15} />
            Back to quiz settings
          </button>

          <button
            onClick={handleGenerateQuiz}
            disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles size={15} />
            Generate another quiz
          </button>

        </div>

      </div>
    );
  }


  // ==========================================
  // QUIZ TAKING SCREEN
  // ==========================================

  if (quiz && currentQuestion) {
    const progress = Math.round(
      ((currentQuestionIndex + 1) /
        quiz.questions.length) *
        100
    );

    const isLastQuestion =
      currentQuestionIndex === quiz.questions.length - 1;

    return (
      <div className="space-y-6">

        {/* QUIZ HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>
            <button
              onClick={handleCreateAnotherQuiz}
              className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-indigo-600"
            >
              <ArrowLeft size={14} />
              Back to quiz settings
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {quiz.document_name}
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Complete your quiz and submit your answers to see your score.
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
              Difficulty
            </p>

            <p className="mt-1 text-sm font-bold capitalize text-indigo-700">
              {quiz.difficulty}
            </p>
          </div>

        </div>


        {/* QUIZ PROGRESS */}

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">

            <span className="text-xs font-semibold text-slate-700">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>

            <span className="text-xs font-semibold text-indigo-600">
              {answeredCount} answered
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">

            {quiz.questions.map((question, index) => {
              const isAnswered =
                Boolean(answers[question.id]?.trim());

              const isCurrent =
                index === currentQuestionIndex;

              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  aria-label={`Go to question ${index + 1}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold transition ${
                    isCurrent
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                      : isAnswered
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}

          </div>

        </section>


        {/* QUESTION CARD */}

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold text-indigo-700">
                  {getQuestionTypeLabel(
                    currentQuestion.question_type
                  )}
                </span>

                {currentQuestion.topic && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500">
                    {currentQuestion.topic}
                  </span>
                )}

              </div>

              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <FileText size={12} />
                Page {currentQuestion.page_number}
              </span>

            </div>

          </div>


          <div className="p-5 sm:p-7">

            <h2 className="max-w-3xl text-lg font-bold leading-8 text-slate-900">
              {currentQuestion.question}
            </h2>


            {/* MULTIPLE CHOICE AND TRUE/FALSE */}

            {currentQuestion.question_type !== "short_answer" && (
              <div className="mt-7 space-y-3">

                {currentQuestion.options.map(
                  (option, index) => {
                    const selected =
                      answers[currentQuestion.id] === option;

                    const optionLetter =
                      String.fromCharCode(65 + index);

                    return (
                      <label
                        key={`${currentQuestion.id}-${option}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                          selected
                            ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100"
                            : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                        }`}
                      >

                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value={option}
                          checked={selected}
                          onChange={() =>
                            handleAnswerChange(
                              currentQuestion.id,
                              option
                            )
                          }
                          className="h-4 w-4 accent-indigo-600"
                        />

                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            selected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {currentQuestion.question_type === "true_false"
                            ? option === "True"
                              ? "T"
                              : "F"
                            : optionLetter}
                        </span>

                        <span className="text-sm font-medium text-slate-700">
                          {option}
                        </span>

                        {selected && (
                          <Check
                            size={17}
                            className="ml-auto text-indigo-600"
                          />
                        )}

                      </label>
                    );
                  }
                )}

              </div>
            )}


            {/* SHORT ANSWER */}

            {currentQuestion.question_type === "short_answer" && (
              <div className="mt-7">

                <label
                  htmlFor={`answer-${currentQuestion.id}`}
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  Your answer
                </label>

                <textarea
                  id={`answer-${currentQuestion.id}`}
                  rows={5}
                  value={answers[currentQuestion.id] ?? ""}
                  onChange={(event) =>
                    handleAnswerChange(
                      currentQuestion.id,
                      event.target.value
                    )
                  }
                  placeholder="Write your answer in your own words..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                />

                <p className="mt-2 text-[10px] text-slate-400">
                  Explain the main idea clearly. Your answer will be evaluated against the PDF-based reference answer.
                </p>

              </div>
            )}

          </div>

        </section>


        {/* QUESTION NAVIGATION */}

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

          <button
            onClick={() =>
              setCurrentQuestionIndex((current) =>
                Math.max(0, current - 1)
              )
            }
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={15} />
            Previous
          </button>

          <p className="text-[10px] text-slate-400">
            {quiz.questions.length - answeredCount} unanswered
          </p>

          {isLastQuestion ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Submit quiz
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestionIndex((current) =>
                  Math.min(
                    quiz.questions.length - 1,
                    current + 1
                  )
                )
              }
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              Next question
              <ArrowRight size={15} />
            </button>
          )}

        </section>


        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <CircleAlert
              size={18}
              className="mt-0.5 shrink-0"
            />
            {error}
          </div>
        )}

      </div>
    );
  }


  // ==========================================
  // QUIZ SETTINGS SCREEN
  // ==========================================

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <BrainCircuit size={20} />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-indigo-600">
              Intelligent study tool
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            AI Quiz Generator
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Turn your university notes into interactive quizzes. Test your understanding, receive instant feedback, and find the topics you need to revise.
          </p>
        </div>

        <div className="hidden h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 sm:flex">
          <Sparkles size={34} />
        </div>

      </div>


      {/* FEATURE CARDS */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileText size={18} />
          </div>

          <p className="mt-3 text-sm font-bold text-slate-800">
            PDF-based questions
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            Generate questions from your uploaded learning material.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Target size={18} />
          </div>

          <p className="mt-3 text-sm font-bold text-slate-800">
            Different difficulty levels
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            Practice fundamentals or challenge your understanding.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Trophy size={18} />
          </div>

          <p className="mt-3 text-sm font-bold text-slate-800">
            Instant evaluation
          </p>

          <p className="mt-1 text-[11px] leading-5 text-slate-400">
            Review your score, answers, explanations, and source pages.
          </p>
        </div>

      </section>


      {/* ERROR MESSAGE */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <CircleAlert
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}


      {/* MAIN SETTINGS */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">

        {/* LEFT COLUMN */}

        <div className="space-y-6">

          {/* PDF SELECTION */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 flex items-center justify-between gap-3">

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileText size={19} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Select study material
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Choose the PDF you want to practice.
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setReloadToken((current) => current + 1)
                }
                disabled={loadingDocuments}
                title="Refresh documents"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-40"
              >
                <RefreshCw
                  size={16}
                  className={
                    loadingDocuments
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>

            </div>


            {loadingDocuments ? (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                <Loader2
                  size={18}
                  className="animate-spin text-indigo-600"
                />
                Loading your PDF documents...
              </div>

            ) : documents.length > 0 ? (
              <div>

                <label
                  htmlFor="quiz-document"
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  Uploaded PDF
                </label>

                <select
                  id="quiz-document"
                  value={selectedDocumentId}
                  onChange={(event) => {
                    setSelectedDocumentId(event.target.value);
                    setError("");
                  }}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                >
                  {documents.map((document) => {
                    const chapter = chapters.find(
                      (item) =>
                        item.id === document.chapterId
                    );

                    const locationLabel =
                      chapter?.title ??
                      (
                        document.chapterId === 1
                          ? "Other uploads (backend chapter 1)"
                          : `Chapter ${document.chapterId}`
                      );

                    return (
                      <option
                        key={document.id}
                        value={document.id}
                      >
                        {document.name} — {locationLabel}
                      </option>
                    );
                  })}
                </select>


                {/* SELECTED PDF INFORMATION */}

                {selectedDocument && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                      <FileText size={19} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="break-words text-xs font-bold text-slate-800">
                        {selectedDocument.name}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">

                        <span>
                          {formatFileSize(selectedDocument.size)}
                        </span>

                        <span>
                          {selectedDocument.pageCount} pages
                        </span>

                        <span>
                          {selectedDocument.pagesWithText} pages with text
                        </span>

                      </div>

                      {selectedDocumentChapter && (
                        <p className="mt-2 text-[10px] font-medium text-indigo-600">
                          {selectedDocumentChapter.title}
                        </p>
                      )}

                      {selectedDocumentSubject && (
                        <p className="mt-1 text-[10px] text-slate-500">
                          Subject: {selectedDocumentSubject.name}
                        </p>
                      )}

                    </div>

                    <CheckCircle2
                      size={17}
                      className="shrink-0 text-emerald-600"
                    />

                  </div>
                )}


                <button
                  onClick={handleOpenLibrary}
                  className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  <BookOpen size={14} />
                  Open PDF library
                  <ArrowRight size={13} />
                </button>

              </div>

            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">

                <FileText
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-3 text-sm font-bold text-slate-700">
                  No PDF documents yet
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">
                  Upload a text-based PDF in your chapter's PDF Library. Then return here to generate a quiz.
                </p>

                {documentError && (
                  <p className="mt-3 text-[10px] text-rose-500">
                    {documentError}
                  </p>
                )}

                <button
                  onClick={handleOpenLibrary}
                  disabled={chapters.length === 0}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText size={15} />
                  Open PDF Library
                </button>

              </div>
            )}

          </div>


          {/* QUESTION COUNT */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Target size={19} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Number of questions
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Choose how many questions to generate.
                </p>
              </div>

            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">

              {[5, 10, 15, 20, 25, 30].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`rounded-xl border py-3 text-sm font-bold transition ${
                    questionCount === count
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                  }`}
                >
                  {count}
                </button>
              ))}

            </div>

          </div>


          {/* DIFFICULTY */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Target size={19} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Difficulty level
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Select how challenging the questions should be.
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              {difficultyOptions.map((option) => {
                const selected =
                  difficulty === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => setDifficulty(option.value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100"
                        : "border-slate-200 hover:border-indigo-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">

                      <span
                        className={`text-sm font-bold ${
                          selected
                            ? "text-indigo-700"
                            : "text-slate-700"
                        }`}
                      >
                        {option.label}
                      </span>

                      {selected && (
                        <CheckCircle2
                          size={17}
                          className="text-indigo-600"
                        />
                      )}

                    </div>

                    <p className="mt-2 text-[10px] leading-5 text-slate-400">
                      {option.description}
                    </p>

                  </button>
                );
              })}

            </div>

          </div>


          {/* QUESTION TYPES */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Question types
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Select one or more types for your quiz.
                </p>
              </div>

            </div>

            <div className="space-y-3">

              {questionTypeOptions.map((option) => {
                const checked =
                  questionTypes.includes(option.value);

                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                      checked
                        ? "border-indigo-200 bg-indigo-50/60"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >

                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleQuestionType(option.value)
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />

                    <div className="min-w-0 flex-1">

                      <p className="text-xs font-bold text-slate-800">
                        {option.label}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {option.description}
                      </p>

                    </div>

                    {checked && (
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-indigo-600"
                      />
                    )}

                  </label>
                );
              })}

            </div>

            {questionTypes.length === 0 && (
              <p className="mt-3 text-xs text-rose-600">
                Select at least one question type.
              </p>
            )}

          </div>

        </div>


        {/* RIGHT COLUMN */}

        <aside className="space-y-5">

          {/* QUIZ OVERVIEW */}

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white">

              <div className="flex items-center gap-2">
                <Sparkles size={18} />

                <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-indigo-100">
                  Quiz configuration
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold">
                Your practice quiz
              </h2>

              <p className="mt-2 text-xs leading-5 text-indigo-100">
                Review your selections and generate questions from your PDF.
              </p>

            </div>

            <div className="space-y-4 p-5">

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Study material
                </span>

                <span className="max-w-[60%] truncate text-right text-xs font-semibold text-slate-800">
                  {selectedDocument?.name ?? "Not selected"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Questions
                </span>

                <span className="text-xs font-bold text-slate-800">
                  {questionCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Difficulty
                </span>

                <span className="text-xs font-bold capitalize text-slate-800">
                  {difficulty}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Question types
                </span>

                <span className="text-xs font-bold text-slate-800">
                  {questionTypes.length} selected
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4">

                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Included formats
                </p>

                <div className="flex flex-wrap gap-2">

                  {questionTypes.map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-semibold text-indigo-700"
                    >
                      {getQuestionTypeLabel(type)}
                    </span>
                  ))}

                  {questionTypes.length === 0 && (
                    <span className="text-xs text-rose-500">
                      No question types selected
                    </span>
                  )}

                </div>

              </div>

              <button
                onClick={handleGenerateQuiz}
                disabled={
                  generating ||
                  loadingDocuments ||
                  !selectedDocument ||
                  questionTypes.length === 0
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Generating quiz...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate AI quiz
                  </>
                )}
              </button>

              <p className="text-center text-[10px] leading-5 text-slate-400">
                Questions are generated using your PDF content. Correct answers are revealed after submission.
              </p>

            </div>

          </div>


          {/* HOW IT WORKS */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

            <h3 className="text-sm font-bold text-slate-900">
              How it works
            </h3>

            <div className="mt-5 space-y-5">

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                  1
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Choose a PDF
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-400">
                    Select your uploaded lecture notes or study material.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                  2
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Configure your quiz
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-400">
                    Select question count, difficulty, and question types.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                  3
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Answer and submit
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-400">
                    Complete your questions and submit your answers.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
                  4
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Review your performance
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-400">
                    See your score, correct answers, and explanations.
                  </p>
                </div>
              </div>

            </div>

          </div>


          {/* STUDY TIP */}

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">

            <div className="flex items-center gap-2 text-amber-700">
              <Clock3 size={17} />

              <h3 className="text-xs font-bold">
                Study tip
              </h3>
            </div>

            <p className="mt-2 text-xs leading-6 text-amber-800">
              Try answering each question without checking your notes first. Active recall helps you identify what you truly understand.
            </p>

          </div>

        </aside>

      </section>

    </div>
  );
}
