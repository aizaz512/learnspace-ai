
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import type { Subject } from "../types/subject";
import type { Chapter } from "../types/chapter";
import type { Note } from "../types/note";

import {
  loadQuizHistory,
  QUIZ_HISTORY_UPDATED_EVENT,
} from "../services/quizzes";

import type {
  StoredQuizAttempt,
} from "../services/quizzes";


// ============================================
// PROPS AND TYPES
// ============================================

interface AnalyticsPageProps {
  subjects: Subject[];
  chapters: Chapter[];
  notes: Note[];
}

interface PlannerTaskRecord {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

interface TopicPerformance {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
}

const PLANNER_STORAGE_KEY =
  "learnspace-ai-study-planner-v1";


// ============================================
// HELPERS
// ============================================

function getTodayDate(): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function loadPlannerTasks(): PlannerTaskRecord[] {
  try {
    const stored = window.localStorage.getItem(
      PLANNER_STORAGE_KEY
    );

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is PlannerTaskRecord =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.subject === "string" &&
        typeof item.dueDate === "string" &&
        typeof item.completed === "boolean" &&
        (
          item.priority === "low" ||
          item.priority === "medium" ||
          item.priority === "high"
        )
    );

  } catch {
    console.warn(
      "Unable to read Study Planner analytics."
    );

    return [];
  }
}


function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


// ============================================
// REUSABLE STAT CARD
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: typeof BookOpen;
  color: string;
  background: string;
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  color,
  background,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <span className="text-xs font-medium text-slate-500">
          {label}
        </span>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${background} ${color}`}
        >
          <Icon size={19} />
        </div>

      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>

    </div>
  );
}


// ============================================
// QUIZ HISTORY ANALYTICS
// ============================================

interface QuizHistorySectionProps {
  attempts: StoredQuizAttempt[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

function QuizHistorySection({
  attempts,
  loading,
  error,
  onRefresh,
}: QuizHistorySectionProps) {

  // ==========================================
  // CALCULATE QUIZ STATISTICS
  // ==========================================

  const averageScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce(
            (total, attempt) =>
              total + attempt.score_percentage,
            0
          ) / attempts.length
        )
      : 0;

  const bestScore =
    attempts.length > 0
      ? Math.max(
          ...attempts.map(
            (attempt) => attempt.score_percentage
          )
        )
      : 0;

  const totalQuestions = attempts.reduce(
    (total, attempt) =>
      total + attempt.total_questions,
    0
  );

  const totalCorrect = attempts.reduce(
    (total, attempt) =>
      total + attempt.correct_count,
    0
  );

  const totalIncorrect = attempts.reduce(
    (total, attempt) =>
      total + attempt.incorrect_count,
    0
  );


  // ==========================================
  // TOPIC PERFORMANCE
  // ==========================================

  const topicPerformance = useMemo(() => {
    const topicMap = new Map<
      string,
      {
        total: number;
        correct: number;
      }
    >();

    attempts.forEach((attempt) => {
      attempt.results.forEach((result) => {
        const topic =
          result.topic?.trim() ||
          "General Concepts";

        const current = topicMap.get(topic) ?? {
          total: 0,
          correct: 0,
        };

        current.total += 1;

        if (result.is_correct) {
          current.correct += 1;
        }

        topicMap.set(topic, current);
      });
    });

    const topics: TopicPerformance[] = Array.from(
      topicMap.entries()
    ).map(([topic, data]) => ({
      topic,
      total: data.total,
      correct: data.correct,
      accuracy:
        data.total > 0
          ? Math.round(
              (data.correct / data.total) * 100
            )
          : 0,
    }));

    return topics.sort(
      (a, b) =>
        a.accuracy - b.accuracy ||
        b.total - a.total
    );

  }, [attempts]);


  // ==========================================
  // RECENT ATTEMPTS
  // ==========================================

  const recentAttempts = attempts.slice(0, 7);

  const trendAttempts = [...recentAttempts].reverse();


  // ==========================================
  // QUIZ HISTORY UI
  // ==========================================

  return (
    <div className="space-y-5">

      {/* SECTION HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>
          <div className="flex items-center gap-2">

            <Trophy
              size={19}
              className="text-violet-600"
            />

            <h2 className="text-base font-bold text-slate-900">
              Quiz performance
            </h2>

          </div>

          <p className="mt-1 text-xs text-slate-400">
            Your cloud-saved quiz attempts and learning performance.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh quiz history"
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
          />

          {loading ? "Loading..." : "Refresh history"}
        </button>

      </div>


      {/* HISTORY ERROR */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0 text-amber-600"
          />

          <div className="min-w-0 flex-1">

            <p className="text-xs font-semibold text-amber-800">
              Unable to load quiz history
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              {error}
            </p>

          </div>

          <button
            onClick={onRefresh}
            className="shrink-0 text-xs font-semibold text-amber-800 underline"
          >
            Retry
          </button>

        </div>
      )}


      {/* INITIAL LOADING */}

      {loading && attempts.length === 0 ? (

        <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">

          <LoaderCircle
            size={27}
            className="animate-spin text-indigo-600"
          />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading your quiz history
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Retrieving your saved attempts from the cloud.
          </p>

        </div>

      ) : attempts.length === 0 ? (

        /* EMPTY STATE */

        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Target size={27} />
          </div>

          <h3 className="mt-4 text-sm font-bold text-slate-800">
            No quiz attempts yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-400">
            Generate and complete a quiz from your uploaded PDFs.
            Your scores and topic performance will appear here
            automatically after submission.
          </p>

        </div>

      ) : (

        <>
          {/* QUIZ SUMMARY */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              label="Quiz attempts"
              value={attempts.length}
              description="Cloud-saved completed quizzes"
              icon={Trophy}
              color="text-violet-600"
              background="bg-violet-50"
            />

            <StatCard
              label="Average score"
              value={`${averageScore}%`}
              description="Across saved attempts"
              icon={TrendingUp}
              color="text-indigo-600"
              background="bg-indigo-50"
            />

            <StatCard
              label="Best score"
              value={`${bestScore}%`}
              description="Your highest quiz result"
              icon={Award}
              color="text-amber-600"
              background="bg-amber-50"
            />

            <StatCard
              label="Questions answered"
              value={totalQuestions}
              description={`${totalCorrect} correct answers`}
              icon={CheckCircle2}
              color="text-emerald-600"
              background="bg-emerald-50"
            />

          </div>


          {/* QUESTION ACCURACY */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

            <h3 className="text-sm font-bold text-slate-900">
              Overall answer accuracy
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Correct and incorrect answers across your saved attempts.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div className="rounded-xl bg-emerald-50 p-4">

                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  Correct answers
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {totalCorrect}
                </p>

              </div>

              <div className="rounded-xl bg-rose-50 p-4">

                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                  Incorrect answers
                </p>

                <p className="mt-2 text-2xl font-bold text-rose-700">
                  {totalIncorrect}
                </p>

              </div>

            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-rose-100">

              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${
                    totalQuestions > 0
                      ? (totalCorrect / totalQuestions) * 100
                      : 0
                  }%`,
                }}
              />

            </div>

            <div className="mt-2 flex justify-between text-[10px] text-slate-400">

              <span>
                {totalQuestions > 0
                  ? Math.round(
                      (totalCorrect / totalQuestions) * 100
                    )
                  : 0}% correct
              </span>

              <span>
                {totalQuestions} total questions
              </span>

            </div>

          </div>


          {/* SCORE TREND */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

            <h3 className="text-sm font-bold text-slate-900">
              Recent score trend
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Your latest seven completed quiz attempts, in chronological order.
            </p>

            <div className="mt-6 flex h-48 items-end gap-3">

              {trendAttempts.map((attempt, index) => {

                const score = Math.max(
                  0,
                  Math.min(100, attempt.score_percentage)
                );

                return (
                  <div
                    key={attempt.quiz_id}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    title={`${attempt.document_name}: ${score}%`}
                  >

                    <span className="text-[10px] font-bold text-slate-600">
                      {score}%
                    </span>

                    <div className="flex h-32 w-full items-end justify-center rounded-t-lg bg-slate-50">

                      <div
                        className="w-full max-w-10 rounded-t-md bg-indigo-500 transition-all"
                        style={{
                          height: `${Math.max(score, 3)}%`,
                        }}
                      />

                    </div>

                    <span className="text-[9px] text-slate-400">
                      {index + 1}
                    </span>

                  </div>
                );
              })}

            </div>

            <p className="mt-3 text-center text-[10px] text-slate-400">
              Older attempts appear on the left; newest appears on the right.
            </p>

          </div>


          {/* TOPIC PERFORMANCE */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5">

              <h3 className="text-sm font-bold text-slate-900">
                Topic performance
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Identify topics where your answers need improvement.
              </p>

            </div>


            {topicPerformance.length === 0 ? (

              <p className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">
                No topic-level data is available yet.
              </p>

            ) : (

              <div className="space-y-5">

                {topicPerformance.slice(0, 10).map((topic) => {

                  const needsRevision =
                    topic.accuracy < 70;

                  return (
                    <div key={topic.topic}>

                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">

                        <div className="min-w-0">

                          <p className="truncate text-xs font-semibold text-slate-800">
                            {topic.topic}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {topic.correct} correct out of {topic.total}
                          </p>

                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                            needsRevision
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {topic.accuracy}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className={`h-full rounded-full transition-all ${
                            needsRevision
                              ? "bg-rose-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${topic.accuracy}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                })}

              </div>

            )}

            {topicPerformance.some(
              (topic) => topic.accuracy < 70
            ) && (

              <div className="mt-6 flex items-start gap-3 rounded-xl bg-amber-50 p-4">

                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <p className="text-xs leading-5 text-amber-800">
                  Topics below 70% accuracy may need additional revision.
                  Review the associated PDF explanations and practice again.
                </p>

              </div>
            )}

          </div>


          {/* RECENT ATTEMPTS */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

            <h3 className="text-sm font-bold text-slate-900">
              Recent quiz attempts
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Your latest saved quiz results.
            </p>

            <div className="mt-4 divide-y divide-slate-100">

              {recentAttempts.map((attempt) => (

                <div
                  key={attempt.quiz_id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-xs font-semibold text-slate-800">
                        {attempt.document_name}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatDate(attempt.submitted_at)}
                        {" · "}
                        {attempt.total_questions} questions
                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <p
                      className={`text-sm font-bold ${
                        attempt.score_percentage >= 80
                          ? "text-emerald-600"
                          : attempt.score_percentage >= 50
                            ? "text-indigo-600"
                            : "text-rose-600"
                      }`}
                    >
                      {attempt.score_percentage}%
                    </p>

                    <p className="mt-1 text-[9px] text-slate-400">
                      {attempt.correct_count} correct
                    </p>

                  </div>

                </div>

              ))}

            </div>

            {attempts.length > 7 && (
              <p className="mt-3 text-center text-[10px] text-slate-400">
                Showing 7 of {attempts.length} saved attempts.
                Your recent attempts are stored in the cloud.
              </p>
            )}

          </div>

        </>
      )}

    </div>
  );
}


// ============================================
// MAIN ANALYTICS PAGE
// ============================================

export default function AnalyticsPage({
  subjects,
  chapters,
  notes,
}: AnalyticsPageProps) {

  // ==========================================
  // LOAD LOCAL ANALYTICS DATA
  // ==========================================

  const [plannerTasks] = useState<PlannerTaskRecord[]>(
    loadPlannerTasks
  );

  const [quizHistory, setQuizHistory] =
    useState<StoredQuizAttempt[]>([]);

  const [quizHistoryLoading, setQuizHistoryLoading] =
    useState(true);

  const [quizHistoryError, setQuizHistoryError] =
    useState("");

  const [selectedSubjectId, setSelectedSubjectId] =
    useState<number | "all">("all");

  const today = getTodayDate();


  // ==========================================
  // REFRESH CLOUD QUIZ HISTORY
  // ==========================================

  const handleRefreshQuizHistory = useCallback(
    async () => {
      setQuizHistoryLoading(true);
      setQuizHistoryError("");

      try {
        const history = await loadQuizHistory();

        setQuizHistory(history);

      } catch (err) {
        setQuizHistoryError(
          err instanceof Error
            ? err.message
            : "Unable to load your quiz history."
        );

      } finally {
        setQuizHistoryLoading(false);
      }
    },
    []
  );


  // ==========================================
  // LOAD HISTORY + SUBSCRIBE TO QUIZ UPDATES
  // ==========================================

  useEffect(() => {
    void handleRefreshQuizHistory();

    function handleQuizHistoryUpdate() {
      void handleRefreshQuizHistory();
    }

    window.addEventListener(
      QUIZ_HISTORY_UPDATED_EVENT,
      handleQuizHistoryUpdate
    );

    return () => {
      window.removeEventListener(
        QUIZ_HISTORY_UPDATED_EVENT,
        handleQuizHistoryUpdate
      );
    };
  }, [handleRefreshQuizHistory]);


  // ==========================================
  // CHAPTER STATISTICS
  // ==========================================

  const completedChapters = chapters.filter(
    (chapter) => chapter.isCompleted
  ).length;

  const pendingChapters =
    chapters.length - completedChapters;

  const chapterCompletionRate =
    chapters.length > 0
      ? Math.round(
          (completedChapters / chapters.length) * 100
        )
      : 0;


  // ==========================================
  // SUBJECT PROGRESS
  // ==========================================

  const subjectAnalytics = useMemo(() => {
    return subjects.map((subject) => {

      const relatedChapters = chapters.filter(
        (chapter) =>
          chapter.subjectId === subject.id
      );

      const completed = relatedChapters.filter(
        (chapter) => chapter.isCompleted
      ).length;

      const total = relatedChapters.length;

      const progress =
        total > 0
          ? Math.round((completed / total) * 100)
          : 0;

      return {
        id: subject.id,
        name: subject.name,
        total,
        completed,
        pending: total - completed,
        progress,
      };

    });
  }, [subjects, chapters]);


  // ==========================================
  // PLANNER STATISTICS
  // ==========================================

  const completedPlannerTasks = plannerTasks.filter(
    (task) => task.completed
  ).length;

  const pendingPlannerTasks = plannerTasks.filter(
    (task) => !task.completed
  ).length;

  const overduePlannerTasks = plannerTasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate < today
  ).length;

  const plannerCompletionRate =
    plannerTasks.length > 0
      ? Math.round(
          (completedPlannerTasks / plannerTasks.length) * 100
        )
      : 0;


  // ==========================================
  // PRIORITY BREAKDOWN
  // ==========================================

  const priorityBreakdown = {
    high: plannerTasks.filter(
      (task) =>
        !task.completed &&
        task.priority === "high"
    ).length,

    medium: plannerTasks.filter(
      (task) =>
        !task.completed &&
        task.priority === "medium"
    ).length,

    low: plannerTasks.filter(
      (task) =>
        !task.completed &&
        task.priority === "low"
    ).length,
  };


  // ==========================================
  // FILTER SUBJECTS
  // ==========================================

  const visibleSubjects = useMemo(
    () =>
      selectedSubjectId === "all"
        ? subjectAnalytics
        : subjectAnalytics.filter(
            (subject) =>
              subject.id === selectedSubjectId
          ),
    [
      selectedSubjectId,
      subjectAnalytics,
    ]
  );


  // ==========================================
  // RECENT NOTES
  // ==========================================

  const recentNotes = useMemo(
    () =>
      [...notes]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [notes]
  );


  // ==========================================
  // COMPLETION MESSAGE
  // ==========================================

  const progressMessage =
    chapters.length === 0
      ? "Add chapters to start tracking academic progress."
      : chapterCompletionRate === 100
        ? "Excellent! All your chapters are completed."
        : chapterCompletionRate >= 60
          ? "You're making strong progress. Keep going."
          : "Build a consistent study routine and complete one chapter at a time.";


  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}

      <div>

        <div className="mb-2 flex items-center gap-2">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Activity size={20} />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-indigo-600">
            Learning performance
          </span>

        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
          Learning Analytics
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Understand your academic progress, monitor chapter completion,
          review quiz performance, and track your study responsibilities.
        </p>

      </div>


      {/* MAIN STATISTICS */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Total subjects"
          value={subjects.length}
          description="Subjects in your workspace"
          icon={GraduationCap}
          color="text-indigo-600"
          background="bg-indigo-50"
        />

        <StatCard
          label="Completed chapters"
          value={`${completedChapters}/${chapters.length}`}
          description={`${pendingChapters} chapters remaining`}
          icon={BookOpen}
          color="text-emerald-600"
          background="bg-emerald-50"
        />

        <StatCard
          label="Study notes"
          value={notes.length}
          description="Saved notes in your workspace"
          icon={FileText}
          color="text-blue-600"
          background="bg-blue-50"
        />

        <StatCard
          label="Planner tasks"
          value={plannerTasks.length}
          description={`${completedPlannerTasks} tasks completed`}
          icon={CalendarDays}
          color="text-violet-600"
          background="bg-violet-50"
        />

      </section>


      {/* OVERALL ACADEMIC PROGRESS */}

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>

            <div className="flex items-center gap-2">

              <TrendingUp
                size={19}
                className="text-indigo-600"
              />

              <h2 className="text-base font-bold text-slate-900">
                Overall academic progress
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-400">
              Based on completed chapters across all subjects.
            </p>

          </div>

          <span className="text-2xl font-bold text-indigo-600">
            {chapterCompletionRate}%
          </span>

        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">

          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{
              width: `${chapterCompletionRate}%`,
            }}
          />

        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-2 text-[10px] text-slate-400">

          <span>
            {completedChapters} completed chapters
          </span>

          <span>
            {pendingChapters} remaining chapters
          </span>

        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-indigo-50 p-4">

          <Target
            size={18}
            className="mt-0.5 shrink-0 text-indigo-600"
          />

          <p className="text-xs leading-6 text-indigo-800">
            {progressMessage}
          </p>

        </div>

      </section>


      {/* SUBJECT PERFORMANCE */}

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

          <div>

            <h2 className="text-base font-bold text-slate-900">
              Subject performance
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Chapter completion for each subject.
            </p>

          </div>

          <select
            value={selectedSubjectId}
            onChange={(event) =>
              setSelectedSubjectId(
                event.target.value === "all"
                  ? "all"
                  : Number(event.target.value)
              )
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-indigo-300"
          >

            <option value="all">
              All subjects
            </option>

            {subjects.map((subject) => (
              <option
                key={subject.id}
                value={subject.id}
              >
                {subject.name}
              </option>
            ))}

          </select>

        </div>


        {visibleSubjects.length === 0 ? (

          <div className="rounded-xl bg-slate-50 p-8 text-center">

            <BookOpen
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No subjects available
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Add subjects to begin tracking progress.
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {visibleSubjects.map((subject) => (

              <div key={subject.id}>

                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">

                  <h3 className="text-sm font-semibold text-slate-800">
                    {subject.name}
                  </h3>

                  <span className="text-xs font-bold text-indigo-600">
                    {subject.progress}%
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{
                      width: `${subject.progress}%`,
                    }}
                  />

                </div>

                <div className="mt-2 flex justify-between text-[10px] text-slate-400">

                  <span>
                    {subject.completed} of {subject.total} chapters completed
                  </span>

                  <span>
                    {subject.pending} remaining
                  </span>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>


      {/* STUDY PLANNER ANALYTICS */}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* TASK COMPLETION */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-center gap-2">

            <CheckCircle2
              size={19}
              className="text-emerald-600"
            />

            <h2 className="text-base font-bold text-slate-900">
              Study Planner progress
            </h2>

          </div>

          <p className="mt-1 text-xs text-slate-400">
            Completion of tasks saved in your Study Planner.
          </p>

          <div className="mt-6 flex items-center gap-5">

            <div
              className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#10b981 ${plannerCompletionRate * 3.6}deg, #f1f5f9 0deg)`,
              }}
            >

              <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-white">

                <span className="text-xl font-bold text-slate-900">
                  {plannerCompletionRate}%
                </span>

                <span className="text-[9px] text-slate-400">
                  Completed
                </span>

              </div>

            </div>

            <div className="min-w-0 flex-1 space-y-3">

              <div className="flex items-center justify-between">

                <span className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Completed
                </span>

                <span className="text-xs font-bold text-slate-800">
                  {completedPlannerTasks}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  Pending
                </span>

                <span className="text-xs font-bold text-slate-800">
                  {pendingPlannerTasks}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Overdue
                </span>

                <span className="text-xs font-bold text-slate-800">
                  {overduePlannerTasks}
                </span>

              </div>

            </div>

          </div>

          {plannerTasks.length === 0 && (
            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
              Add tasks in Study Planner to see your task completion analytics.
            </p>
          )}

        </div>


        {/* PRIORITIES */}

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-center gap-2">

            <AlertCircle
              size={19}
              className="text-amber-600"
            />

            <h2 className="text-base font-bold text-slate-900">
              Pending task priorities
            </h2>

          </div>

          <p className="mt-1 text-xs text-slate-400">
            Breakdown of your unfinished tasks.
          </p>


          <div className="mt-6 space-y-5">

            {[
              {
                label: "High priority",
                count: priorityBreakdown.high,
                color: "bg-rose-500",
                background: "bg-rose-50",
              },
              {
                label: "Medium priority",
                count: priorityBreakdown.medium,
                color: "bg-amber-500",
                background: "bg-amber-50",
              },
              {
                label: "Low priority",
                count: priorityBreakdown.low,
                color: "bg-emerald-500",
                background: "bg-emerald-50",
              },
            ].map((item) => {

              const percentage =
                pendingPlannerTasks > 0
                  ? (item.count / pendingPlannerTasks) * 100
                  : 0;

              return (
                <div key={item.label}>

                  <div className="mb-2 flex items-center justify-between">

                    <span className="text-xs font-medium text-slate-600">
                      {item.label}
                    </span>

                    <span className="text-xs font-bold text-slate-800">
                      {item.count}
                    </span>

                  </div>

                  <div className={`h-2 overflow-hidden rounded-full ${item.background}`}>

                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                </div>
              );
            })}

          </div>

          {pendingPlannerTasks === 0 && (
            <p className="mt-6 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
              No pending tasks. You're all caught up!
            </p>
          )}

        </div>

      </section>


      {/* QUIZ HISTORY */}

      <QuizHistorySection
        attempts={quizHistory}
        loading={quizHistoryLoading}
        error={quizHistoryError}
        onRefresh={() => {
          void handleRefreshQuizHistory();
        }}
      />


      {/* RECENT NOTES */}

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

        <div className="mb-5 flex items-center justify-between gap-3">

          <div>

            <div className="flex items-center gap-2">

              <FileText
                size={19}
                className="text-blue-600"
              />

              <h2 className="text-base font-bold text-slate-900">
                Recently updated notes
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-400">
              Your latest saved learning notes.
            </p>

          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-700">
            {notes.length} total
          </span>

        </div>


        {recentNotes.length === 0 ? (

          <div className="rounded-xl bg-slate-50 p-8 text-center">

            <FileText
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No notes created yet
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Create learning notes to see your recent activity here.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {recentNotes.map((note) => {

              const chapter = chapters.find(
                (item) =>
                  item.id === note.chapterId
              );

              return (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-3 py-4"
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText size={17} />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-xs font-semibold text-slate-800">
                        {note.title}
                      </p>

                      <p className="mt-1 truncate text-[10px] text-slate-400">
                        {chapter?.title ?? "Chapter unavailable"}
                      </p>

                    </div>

                  </div>

                  <span className="shrink-0 text-[10px] text-slate-400">
                    {formatDate(note.updatedAt)}
                  </span>

                </div>
              );
            })}

          </div>

        )}

      </section>


      {/* STORAGE INFORMATION */}

      <section className="rounded-2xl border border-violet-100 bg-violet-50/70 p-5">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600">
            <Target size={18} />
          </div>

          <div>

            <h3 className="text-sm font-bold text-slate-900">
              Your analytics data
            </h3>

            <p className="mt-1 text-xs leading-6 text-slate-600">
              Completed quiz attempts are synchronized with your
              private Supabase account and remain available across
              devices. Study Planner tasks are still stored in this
              browser and will be migrated separately.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}
