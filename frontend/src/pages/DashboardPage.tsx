
import { useMemo } from "react";

import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  FileText,
  Layers3,
  NotebookPen,
  Plus,
  Sparkles,
} from "lucide-react";

import type { Subject } from "../types/subject";
import type { Chapter } from "../types/chapter";
import type { Note } from "../types/note";

interface DashboardPageProps {
  userName: string;
  currentSemesterName: string | null;
  subjects: Subject[];
  chapters: Chapter[];
  notes: Note[];
  search: string;
  isLoading: boolean;
  onNavigate: (page: string) => void;
  onOpenSubject: (subject: Subject) => void;
  onOpenNote: (chapter: Chapter) => void;
}

interface RecentNoteItem {
  note: Note;
  chapter: Chapter;
  subject: Subject | undefined;
}

const courseThemes = [
  {
    background: "#E9EDF5",
    icon: "#526B91",
    progress: "#526B91",
    border: "#DCE3EF",
  },
  {
    background: "#EEE9F3",
    icon: "#756185",
    progress: "#756185",
    border: "#E4DCEA",
  },
  {
    background: "#F0EBE2",
    icon: "#927D60",
    progress: "#A18B6C",
    border: "#E9E1D5",
  },
  {
    background: "#E9EAE9",
    icon: "#697483",
    progress: "#778494",
    border: "#DEE1E3",
  },
];

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getProgress(
  subject: Subject,
  chapters: Chapter[]
) {
  const related = chapters.filter(
    (chapter) => chapter.subjectId === subject.id
  );

  const total = related.length;

  const completed = related.filter(
    (chapter) => chapter.isCompleted
  ).length;

  return {
    total,
    completed,
    percentage:
      total > 0
        ? Math.round((completed / total) * 100)
        : 0,
  };
}

export default function DashboardPage({
  userName,
  currentSemesterName,
  subjects,
  chapters,
  notes,
  search,
  isLoading,
  onNavigate,
  onOpenSubject,
  onOpenNote,
}: DashboardPageProps) {
  const firstName =
    userName.trim().split(/\s+/)[0] || "Student";

  // ==========================================
  // LEARNING STATISTICS
  // ==========================================

  const completedChapters = chapters.filter(
    (chapter) => chapter.isCompleted
  ).length;

  const overallProgress =
    chapters.length > 0
      ? Math.round(
          (completedChapters / chapters.length) * 100
        )
      : 0;

  const statistics = [
    {
      label: "Subjects",
      value: subjects.length,
      icon: BookOpen,
      color: "#526B91",
      background: "#E9EDF5",
    },
    {
      label: "Chapters",
      value: chapters.length,
      icon: Layers3,
      color: "#756185",
      background: "#EEE9F3",
    },
    {
      label: "Saved notes",
      value: notes.length,
      icon: FileText,
      color: "#927D60",
      background: "#F0EBE2",
    },
    {
      label: "Completed",
      value: completedChapters,
      icon: CircleCheck,
      color: "#657765",
      background: "#E9EEE8",
    },
  ];

  // ==========================================
  // SEARCH SUBJECTS
  // ==========================================

  const visibleSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return subjects;

    return subjects.filter((subject) =>
      subject.name.toLowerCase().includes(query) ||
      (subject.description || "")
        .toLowerCase()
        .includes(query)
    );
  }, [subjects, search]);

  // ==========================================
  // RECENT NOTES
  // ==========================================

  const recentNotes = useMemo<RecentNoteItem[]>(() => {
    const chapterMap = new Map(
      chapters.map((chapter) => [chapter.id, chapter])
    );

    const subjectMap = new Map(
      subjects.map((subject) => [subject.id, subject])
    );

    return notes
      .reduce<RecentNoteItem[]>((result, note) => {
        const chapter = chapterMap.get(note.chapterId);

        if (!chapter) return result;

        result.push({
          note,
          chapter,
          subject: subjectMap.get(chapter.subjectId),
        });

        return result;
      }, [])
      .sort(
        (a, b) =>
          new Date(b.note.updatedAt).getTime() -
          new Date(a.note.updatedAt).getTime()
      )
      .slice(0, 4);
  }, [notes, chapters, subjects]);

  // ==========================================
  // STUDY TOOL SHORTCUTS
  // ==========================================

  const quickLinks = [
    {
      title: "Notebooks",
      description: "Notes and materials",
      icon: NotebookPen,
      page: "My Notebooks",
      iconColor: "#526B91",
      iconBackground: "#E9EDF5",
    },
    {
      title: "AI Assistant",
      description: "Understand topics",
      icon: BrainCircuit,
      page: "AI Assistant",
      iconColor: "#756185",
      iconBackground: "#EEE9F3",
    },
    {
      title: "Quizzes",
      description: "Test your knowledge",
      icon: Sparkles,
      page: "Quizzes",
      iconColor: "#756185",
      iconBackground: "#F0ECF4",
    },
    {
      title: "Study planner",
      description: "Organize your work",
      icon: CalendarDays,
      page: "Study Planner",
      iconColor: "#927D60",
      iconBackground: "#F0EBE2",
    },
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="-mx-5 -my-7 min-h-[calc(100vh-76px)] bg-[#F1F0ED] px-5 py-6 sm:-mx-8 sm:-my-9 sm:px-8 sm:py-7">

      <div className="mx-auto max-w-[1320px] space-y-5">


        {/* =====================================
            WELCOME
        ====================================== */}

        <section className="flex flex-wrap items-center justify-between gap-4">

          <div className="min-w-0">

            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-[#92939C]">
              LEARNING WORKSPACE
            </p>

            <h1 className="text-[24px] font-semibold tracking-tight text-[#263653] sm:text-[28px]">
              Welcome back, {firstName}
            </h1>

            {currentSemesterName && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#777C87]">
                <CalendarDays
                  size={12}
                  className="text-[#526B91]"
                />
                {currentSemesterName}
              </p>
            )}

          </div>

          <div className="flex shrink-0 gap-2">

            <button
              type="button"
              onClick={() => onNavigate("My Subjects")}
              className="interactive-scale inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DCDDE3] bg-[#FDFCFA] px-3 text-[10px] font-semibold text-[#41475A] transition hover:border-[#AEBBD5] hover:bg-white"
            >
              <BookOpen size={14} />
              Courses
            </button>

            <button
              type="button"
              onClick={() => onNavigate("My Notebooks")}
              className="interactive-scale inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#263653] px-3.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#344766]"
            >
              <Plus size={14} />
              New study
            </button>

          </div>

        </section>


        {/* =====================================
            PREMIUM STATISTIC CARDS
        ====================================== */}

        <section className="stagger-in grid grid-cols-2 gap-2.5 sm:grid-cols-4">

          {statistics.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="group relative overflow-hidden rounded-xl border border-[#E1E0DE] bg-[#FDFCFA] p-3.5 shadow-[0_2px_8px_rgba(38,54,83,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#C9D0DE] hover:shadow-[0_9px_22px_rgba(38,54,83,0.07)] sm:p-4"
              >

                {/* SUBTLE COLOR DETAIL */}

                <div
                  className="absolute right-0 top-0 h-16 w-16 rounded-bl-full opacity-30 transition-transform duration-300 group-hover:scale-125"
                  style={{
                    backgroundColor: stat.background,
                  }}
                />

                <div className="relative flex items-start justify-between gap-2">

                  <div>
                    <p className="text-[9px] font-medium text-[#858895]">
                      {stat.label}
                    </p>

                    <p className="mt-2 text-[25px] font-semibold leading-none tracking-tight text-[#263653] tabular-nums">
                      {isLoading ? "—" : stat.value}
                    </p>
                  </div>

                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:scale-110"
                    style={{
                      backgroundColor: stat.background,
                      color: stat.color,
                    }}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                  </div>

                </div>

                <div
                  className="relative mt-4 h-[3px] overflow-hidden rounded-full"
                  style={{
                    backgroundColor: stat.background,
                  }}
                >
                  <div
                    className="h-full w-1/3 rounded-full transition-all duration-500 group-hover:w-2/3"
                    style={{
                      backgroundColor: stat.color,
                    }}
                  />
                </div>

              </article>
            );
          })}

        </section>


        {/* =====================================
            MAIN CONTENT GRID
        ====================================== */}

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(275px,0.8fr)]">


          {/* ===================================
              LEFT COLUMN
          ==================================== */}

          <div className="min-w-0 space-y-4">


            {/* COURSE COLLECTION */}

            <section className="overflow-hidden rounded-xl border border-[#E1E0DE] bg-[#FDFCFA] shadow-[0_2px_8px_rgba(38,54,83,0.025)]">

              <div className="flex items-center justify-between gap-3 border-b border-[#EAE8E5] px-4 py-3.5">

                <div>
                  <div className="flex items-center gap-2">

                    <h2 className="text-xs font-semibold text-[#263653]">
                      My courses
                    </h2>

                    <span className="rounded-full bg-[#E9EDF5] px-2 py-0.5 text-[9px] font-semibold text-[#526B91]">
                      {subjects.length}
                    </span>

                  </div>

                  <p className="mt-1 text-[9px] text-[#92939C]">
                    Your university subjects
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate("My Subjects")}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#526B91] transition hover:text-[#263653]"
                >
                  View all
                  <ArrowRight size={12} />
                </button>

              </div>


              <div className="p-3">


                {/* LOADING STATE */}

                {isLoading ? (

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="rounded-lg border border-[#ECEAE6] bg-white p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="skeleton h-9 w-9 rounded-lg" />

                          <div className="flex-1 space-y-2">
                            <div className="skeleton h-3 w-2/3" />
                            <div className="skeleton h-2 w-1/3" />
                          </div>
                        </div>

                        <div className="mt-5 skeleton h-1.5 w-full" />
                      </div>
                    ))}

                  </div>

                ) : subjects.length === 0 ? (

                  /* EMPTY STATE */

                  <div className="px-4 py-8 text-center">

                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#E9EDF5] text-[#526B91]">
                      <Layers3 size={21} />
                    </div>

                    <p className="mt-3 text-xs font-semibold text-[#263653]">
                      No courses yet
                    </p>

                    <button
                      type="button"
                      onClick={() => onNavigate("My Subjects")}
                      className="interactive-scale mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#263653] px-3.5 py-2 text-[10px] font-semibold text-white transition hover:bg-[#344766]"
                    >
                      <Plus size={13} />
                      Add a subject
                    </button>

                  </div>

                ) : visibleSubjects.length === 0 ? (

                  <div className="py-7 text-center text-[11px] text-[#858895]">
                    No subjects match your search.
                  </div>

                ) : (

                  /* SUBJECT CARD GRID */

                  <div className="stagger-in grid grid-cols-1 gap-2.5 sm:grid-cols-2">

                    {visibleSubjects.slice(0, 6).map((subject, index) => {
                      const Icon = subject.icon;

                      const progress = getProgress(
                        subject,
                        chapters
                      );

                      const theme =
                        courseThemes[index % courseThemes.length];

                      const status =
                        progress.total > 0 &&
                        progress.completed === progress.total
                          ? "Completed"
                          : progress.completed > 0
                            ? "In progress"
                            : "Not started";

                      const statusColor =
                        status === "Completed"
                          ? "#657765"
                          : status === "In progress"
                            ? "#526B91"
                            : "#92939C";

                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => onOpenSubject(subject)}
                          className="group relative flex min-h-[126px] flex-col overflow-hidden rounded-lg border border-[#EAE8E5] bg-white p-3.5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(38,54,83,0.08)]"
                          style={{
                            borderColor: undefined,
                          }}
                        >

                          {/* CARD HEADER */}

                          <div className="flex items-center justify-between gap-2">

                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                              style={{
                                backgroundColor: theme.background,
                                color: theme.icon,
                              }}
                            >
                              <Icon size={17} strokeWidth={1.8} />
                            </div>

                            <span
                              className="rounded-full px-2 py-1 text-[8px] font-semibold"
                              style={{
                                backgroundColor: theme.background,
                                color: statusColor,
                              }}
                            >
                              {status}
                            </span>

                          </div>


                          {/* COURSE TITLE */}

                          <p className="mt-3 truncate text-[11px] font-semibold text-[#263653] transition-colors group-hover:text-[#526B91]">
                            {subject.name}
                          </p>

                          <p className="mt-1 truncate text-[9px] text-[#92939C]">
                            {progress.completed} of {progress.total} chapters completed
                          </p>


                          {/* PROGRESS */}

                          <div className="mt-auto pt-3">

                            <div className="flex items-center gap-2">

                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#ECEBE8]">
                                <div
                                  className="h-full rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${progress.percentage}%`,
                                    backgroundColor: theme.progress,
                                  }}
                                />
                              </div>

                              <span className="text-[9px] font-semibold text-[#777C87] tabular-nums">
                                {progress.percentage}%
                              </span>

                            </div>

                          </div>


                          {/* HOVER CORNER DETAIL */}

                          <div className="pointer-events-none absolute bottom-0 right-0 h-8 w-8 rounded-tl-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            style={{
                              backgroundColor: theme.background,
                            }}
                          />

                        </button>
                      );
                    })}

                  </div>

                )}

              </div>


              {!isLoading && visibleSubjects.length > 6 && (
                <button
                  type="button"
                  onClick={() => onNavigate("My Subjects")}
                  className="flex w-full items-center justify-center gap-1 border-t border-[#EAE8E5] py-2.5 text-[10px] font-semibold text-[#526B91] transition hover:bg-[#E8EDF4]"
                >
                  View all {visibleSubjects.length} subjects
                  <ArrowRight size={12} />
                </button>
              )}

            </section>


            {/* LEARNING PROGRESS CARD */}

            <section className="relative overflow-hidden rounded-xl border border-[#DDE1E9] bg-[#E9EDF4] p-4">

              <div className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full border-[20px] border-[#526B91]/5" />

              <div className="relative flex flex-wrap items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#526B91] shadow-sm">
                    <Layers3 size={17} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-[#263653]">
                      Overall learning progress
                    </p>

                    <p className="mt-1 text-[9px] text-[#777C87]">
                      Across all your chapters
                    </p>
                  </div>

                </div>

                <p className="text-2xl font-semibold tracking-tight text-[#263653] tabular-nums">
                  {isLoading ? "—" : `${overallProgress}%`}
                </p>

              </div>


              <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/80">

                <div
                  className="h-full rounded-full bg-[#526B91] transition-all duration-700 ease-out"
                  style={{
                    width: isLoading
                      ? "0%"
                      : `${overallProgress}%`,
                  }}
                />

              </div>


              <div className="relative mt-2 flex items-center justify-between text-[9px] text-[#777C87]">

                <span>
                  {completedChapters} completed
                </span>

                <span>
                  {Math.max(0, chapters.length - completedChapters)} remaining
                </span>

              </div>

            </section>

          </div>


          {/* ===================================
              RIGHT COLUMN
          ==================================== */}

          <aside className="min-w-0 space-y-4">


            {/* STUDY TOOLS */}

            <section className="overflow-hidden rounded-xl border border-[#E1E0DE] bg-[#FDFCFA] shadow-[0_2px_8px_rgba(38,54,83,0.025)]">

              <div className="border-b border-[#EAE8E5] px-4 py-3.5">

                <h2 className="text-xs font-semibold text-[#263653]">
                  Study tools
                </h2>

              </div>

              <div className="grid grid-cols-2 gap-2 p-3">

                {quickLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <button
                      key={link.page}
                      type="button"
                      onClick={() => onNavigate(link.page)}
                      className="group relative flex min-h-[76px] flex-col items-start justify-between overflow-hidden rounded-lg border border-[#EAE8E5] bg-white p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C9D0DE] hover:shadow-[0_5px_15px_rgba(38,54,83,0.06)]"
                    >

                      <div className="flex w-full items-center justify-between">

                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-md"
                          style={{
                            backgroundColor: link.iconBackground,
                            color: link.iconColor,
                          }}
                        >
                          <Icon size={15} />
                        </div>

                        <ArrowRight
                          size={12}
                          className="text-[#ACAFB8] transition group-hover:translate-x-1 group-hover:text-[#526B91]"
                        />

                      </div>

                      <div className="mt-2">
                        <p className="text-[10px] font-semibold text-[#263653]">
                          {link.title}
                        </p>

                        <p className="mt-0.5 text-[8px] text-[#92939C]">
                          {link.description}
                        </p>
                      </div>

                    </button>
                  );
                })}

              </div>

            </section>


            {/* RECENT NOTES */}

            <section className="overflow-hidden rounded-xl border border-[#E1E0DE] bg-[#FDFCFA] shadow-[0_2px_8px_rgba(38,54,83,0.025)]">

              <div className="flex items-center justify-between gap-2 border-b border-[#EAE8E5] px-4 py-3.5">

                <div>
                  <h2 className="text-xs font-semibold text-[#263653]">
                    Recent notes
                  </h2>

                  <p className="mt-1 text-[9px] text-[#92939C]">
                    Recently updated
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate("My Notebooks")}
                  className="text-[10px] font-semibold text-[#526B91] transition hover:text-[#263653]"
                >
                  View all
                </button>

              </div>


              {isLoading ? (

                <div className="space-y-3 p-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex gap-2.5">
                      <div className="skeleton h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-2.5 w-2/3" />
                        <div className="skeleton h-2 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>

              ) : recentNotes.length === 0 ? (

                <div className="px-4 py-7 text-center">

                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEE9F3] text-[#756185]">
                    <FileText size={17} />
                  </div>

                  <p className="mt-2.5 text-[10px] font-semibold text-[#263653]">
                    No saved notes
                  </p>

                  <button
                    type="button"
                    onClick={() => onNavigate("My Notebooks")}
                    className="mt-2 text-[9px] font-semibold text-[#526B91] hover:text-[#263653]"
                  >
                    Open notebooks
                  </button>

                </div>

              ) : (

                <div className="divide-y divide-[#EAE8E5]">

                  {recentNotes.map((item) => (

                    <button
                      key={item.note.id}
                      type="button"
                      onClick={() => onOpenNote(item.chapter)}
                      className="group flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-[#F0F2F7]"
                    >

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9EDF5] text-[#526B91] transition group-hover:bg-[#526B91] group-hover:text-white">
                        <FileText size={15} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-[10px] font-semibold text-[#263653] group-hover:text-[#526B91]">
                          {item.note.title || "Untitled note"}
                        </p>

                        <p className="mt-0.5 truncate text-[9px] text-[#92939C]">
                          {item.subject?.name ?? "Subject"}
                          {" · "}
                          {item.chapter.title}
                        </p>

                      </div>

                      <span className="shrink-0 text-[9px] text-[#92939C]">
                        {formatDate(item.note.updatedAt)}
                      </span>

                    </button>

                  ))}

                </div>

              )}

            </section>


            {/* AI FEATURE CARD */}

            <button
              type="button"
              onClick={() => onNavigate("AI Assistant")}
              className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-[#DDD5E7] bg-[#EEE9F3] p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C3B2D5] hover:shadow-[0_7px_18px_rgba(117,97,133,0.10)]"
            >

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#756185] shadow-sm">
                <BrainCircuit size={17} />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-[11px] font-semibold text-[#51415F]">
                  Your AI study partner
                </p>

                <p className="mt-0.5 text-[9px] text-[#81748B]">
                  Ask questions about your material
                </p>

              </div>

              <ChevronRight
                size={15}
                className="shrink-0 text-[#756185] transition group-hover:translate-x-1"
              />

            </button>

          </aside>

        </div>


        {/* =====================================
            FOOTER
        ====================================== */}

        <footer className="flex items-center justify-between border-t border-[#E0DEDB] pt-3">

          <span className="text-[9px] text-[#92939C]">
            LearnSpace AI
          </span>

          <span className="text-[9px] text-[#92939C]">
            Your academic workspace
          </span>

        </footer>

      </div>

    </div>
  );
}
