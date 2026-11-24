
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  X,
  Layers3,
  BookMarked,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  GraduationCap,
  Sparkles,
  ChevronRight,
  FolderOpen,
} from "lucide-react";

import type { Subject } from "../types/subject";
import type { Semester } from "../types/semester";

interface SubjectsPageProps {
  subjects: Subject[];
  semesters: Semester[];
  currentSemesterName: string | null;

  onAddSubject: (
    name: string,
    description: string
  ) => void;

  onDeleteSubject: (id: number) => void;
  onOpenSubject: (subject: Subject) => void;
}

type SubjectFilter =
  | "all"
  | "in-progress"
  | "completed"
  | "not-started";

function getSubjectProgress(subject: Subject): number {
  const progress = Number(subject.progress) || 0;

  return Math.min(100, Math.max(0, progress));
}

function getSubjectStatus(subject: Subject) {
  const progress = getSubjectProgress(subject);
  const total = Number(subject.chapters) || 0;
  const completed = Number(subject.completed) || 0;

  if (total > 0 && completed >= total) {
    return {
      label: "Completed",
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700",
      dotClassName: "bg-emerald-500",
    };
  }

  if (progress > 0) {
    return {
      label: "In progress",
      icon: CircleDashed,
      className: "bg-blue-50 text-blue-700",
      dotClassName: "bg-blue-500",
    };
  }

  return {
    label: "Not started",
    icon: CircleDashed,
    className: "bg-slate-100 text-slate-600",
    dotClassName: "bg-slate-400",
  };
}

export default function SubjectsPage({
  subjects,
  semesters,
  currentSemesterName,
  onAddSubject,
  onDeleteSubject,
  onOpenSubject,
}: SubjectsPageProps) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [activeFilter, setActiveFilter] =
    useState<SubjectFilter>("all");

  // ==========================================
  // DERIVED STATISTICS
  // ==========================================

  const totalChapters = subjects.reduce(
    (total, subject) =>
      total + (Number(subject.chapters) || 0),
    0
  );

  const completedChapters = subjects.reduce(
    (total, subject) =>
      total + (Number(subject.completed) || 0),
    0
  );

  // Weighted progress: based on actual chapters, not
  // an average of subject percentages.
  const averageProgress =
    totalChapters > 0
      ? Math.round(
          (completedChapters / totalChapters) * 100
        )
      : 0;

  const completedSubjects = subjects.filter(
    (subject) => getSubjectStatus(subject).label === "Completed"
  ).length;

  const inProgressSubjects = subjects.filter(
    (subject) => getSubjectStatus(subject).label === "In progress"
  ).length;


  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      const semester = semesters.find(
        (item) => item.id === subject.semesterId
      );

      const matchesSearch =
        subject.name.toLowerCase().includes(query) ||
        (subject.description || "")
          .toLowerCase()
          .includes(query) ||
        (semester?.name.toLowerCase().includes(query) ?? false);

      const status = getSubjectStatus(subject);

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "completed" &&
          status.label === "Completed") ||
        (activeFilter === "in-progress" &&
          status.label === "In progress") ||
        (activeFilter === "not-started" &&
          status.label === "Not started");

      return matchesSearch && matchesFilter;
    });
  }, [subjects, semesters, search, activeFilter]);


  // ==========================================
  // FORM HANDLING
  // ==========================================

  function resetForm() {
    setName("");
    setDescription("");
    setShowForm(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) return;

    if (!currentSemesterName) {
      window.alert(
        "Please create or select a current semester before adding subjects."
      );

      return;
    }

    onAddSubject(
      trimmedName,
      description.trim()
    );

    resetForm();
  }


  // ==========================================
  // DELETE HANDLING
  // ==========================================

  function handleDelete(subject: Subject) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subject.name}" and its chapters? This action cannot be undone.`
    );

    if (confirmed) {
      onDeleteSubject(subject.id);
    }
  }


  // ==========================================
  // FILTER CONFIGURATION
  // ==========================================

  const filters: {
    id: SubjectFilter;
    label: string;
    count: number;
  }[] = [
    {
      id: "all",
      label: "All subjects",
      count: subjects.length,
    },
    {
      id: "in-progress",
      label: "In progress",
      count: inProgressSubjects,
    },
    {
      id: "completed",
      label: "Completed",
      count: completedSubjects,
    },
    {
      id: "not-started",
      label: "Not started",
      count:
        subjects.length -
        inProgressSubjects -
        completedSubjects,
    },
  ];


  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="page-enter space-y-8 pb-8">

      {/* =====================================
          PAGE HEADER
      ====================================== */}

      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

        <div>

          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <GraduationCap size={16} />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-blue-700">
              Your academic workspace
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-[34px]">
            My subjects
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Keep your university courses organized, follow your
            chapter progress and continue learning at your own pace.
          </p>

          {currentSemesterName && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5">
              <CalendarDays
                size={14}
                className="text-blue-700"
              />

              <span className="text-xs font-semibold text-blue-800">
                {currentSemesterName}
              </span>

              <span className="text-[10px] text-blue-600">
                Current semester
              </span>
            </div>
          )}

        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="interactive-scale inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-900/10 transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {showForm ? (
            <X size={17} />
          ) : (
            <Plus size={17} />
          )}

          {showForm ? "Close form" : "Add a subject"}
        </button>

      </section>


      {/* =====================================
          ADD SUBJECT FORM
      ====================================== */}

      {showForm && (
        <section className="animate-fade-up overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">

            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <BookOpen size={21} />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Add a new subject
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Create a course space for your university studies.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={resetForm}
              aria-label="Close subject form"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>

          </div>


          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-5 sm:p-7"
          >

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="subject-name"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Subject name
                  <span className="ml-1 text-rose-500">*</span>
                </label>

                <input
                  id="subject-name"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Artificial Intelligence"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <p className="mt-1.5 text-[10px] text-slate-400">
                  Give your course a recognizable name.
                </p>
              </div>


              <div>
                <label
                  htmlFor="subject-description"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Short description
                </label>

                <input
                  id="subject-description"
                  maxLength={180}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="What will you learn in this course?"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <p className="mt-1.5 text-[10px] text-slate-400">
                  Add a brief course description.
                </p>
              </div>

            </div>


            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">

              <div className="flex items-center gap-2">
                <CalendarDays
                  size={16}
                  className="text-blue-700"
                />

                <div>
                  <p className="text-[10px] text-slate-500">
                    Assigned to
                  </p>

                  <p className="text-xs font-semibold text-slate-800">
                    {currentSemesterName || "No current semester selected"}
                  </p>
                </div>
              </div>

              {!currentSemesterName && (
                <span className="text-[10px] font-medium text-amber-700">
                  Select a semester first
                </span>
              )}

            </div>


            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!currentSemesterName || !name.trim()}
                className="interactive-scale inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={15} />
                Create subject
              </button>

            </div>

          </form>
        </section>
      )}


      {/* =====================================
          OVERVIEW STATISTICS
      ====================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {/* SUBJECT COUNT */}

        <div className="interactive-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Layers3 size={21} />
            </div>

            <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-semibold text-slate-500">
              Courses
            </span>

          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            {subjects.length}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Total subjects
          </p>

          <p className="mt-3 text-[11px] leading-5 text-slate-400">
            Your university courses in one place.
          </p>

        </div>


        {/* CHAPTER COUNT */}

        <div className="interactive-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <BookMarked size={21} />
            </div>

            <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-semibold text-slate-500">
              Learning material
            </span>

          </div>

          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            {totalChapters}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Total chapters
          </p>

          <p className="mt-3 text-[11px] leading-5 text-slate-400">
            Chapters organized across your subjects.
          </p>

        </div>


        {/* OVERALL PROGRESS */}

        <div className="interactive-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">

          <div className="flex items-center justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={21} />
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">
              Overall progress
            </span>

          </div>

          <div className="mt-5 flex items-end justify-between">

            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-950">
                {averageProgress}%
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Chapter completion
              </p>
            </div>

            <p className="pb-1 text-[11px] text-slate-400">
              {completedChapters}/{totalChapters} chapters
            </p>

          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
              style={{
                width: `${averageProgress}%`,
              }}
            />
          </div>

        </div>

      </section>


      {/* =====================================
          SUBJECT COLLECTION
      ====================================== */}

      <section>

        {/* SECTION HEADING */}

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">
                Your courses
              </h2>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                {subjects.length}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Select a subject to access its chapters and study material.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 transition hover:text-blue-900"
          >
            <Plus size={15} />
            Add another subject
          </button>

        </div>


        {/* SEARCH AND FILTERS */}

        <div className="mb-5 space-y-4">

          <div className="relative">

            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by subject, description or semester..."
              aria-label="Search subjects"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}

          </div>


          <div className="flex gap-2 overflow-x-auto pb-1">

            {filters.map((filter) => {
              const selected = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold transition ${
                    selected
                      ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-800"
                  }`}
                >
                  {filter.label}

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                      selected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {filter.count}
                  </span>

                </button>
              );
            })}

          </div>

        </div>


        {/* SUBJECT GRID */}

        {filteredSubjects.length > 0 ? (

          <div className="stagger-in grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredSubjects.map((subject) => {
              const Icon = subject.icon;
              const progress = getSubjectProgress(subject);
              const status = getSubjectStatus(subject);
              const semester = semesters.find(
                (item) => item.id === subject.semesterId
              );

              

              return (
                <article
                  key={subject.id}
                  className="group interactive-card flex min-h-[310px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
                >

                  {/* CARD TOP */}

                  <div className="flex items-start justify-between p-5 pb-3">

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${subject.background} ${subject.color}`}
                    >
                      <Icon size={23} strokeWidth={1.9} />
                    </div>

                    <div className="flex items-center gap-2">

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-semibold ${status.className}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
                        />
                        {status.label}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDelete(subject)}
                        aria-label={`Delete ${subject.name}`}
                        title="Delete subject"
                        className="rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </div>


                  {/* SUBJECT INFORMATION */}

                  <div className="flex-1 px-5">

                    <h3 className="text-base font-bold tracking-tight text-slate-900 transition group-hover:text-blue-800">
                      {subject.name}
                    </h3>

                    <p className="mt-2 min-h-[40px] text-xs leading-5 text-slate-500">
                      {subject.description ||
                        "Keep your notes, chapters and learning material organized here."}
                    </p>


                    {/* SEMESTER */}

                    <div className="mt-4 flex items-center gap-2">

                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <CalendarDays size={14} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-medium text-slate-600">
                          {semester?.name || "Semester not assigned"}
                        </p>

                        <p className="text-[9px] text-slate-400">
                          Academic term
                        </p>
                      </div>

                    </div>

                  </div>


                  {/* PROGRESS */}

                  <div className="px-5 pb-4 pt-5">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-[10px] font-semibold text-slate-600">
                        Learning progress
                      </span>

                      <span className="text-xs font-bold tabular-nums text-slate-900">
                        {progress}%
                      </span>

                    </div>

                    <div
                      className="h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={`${subject.name} progress`}
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between">

                      <span className="text-[10px] text-slate-400">
                        {Number(subject.completed) || 0} of{" "}
                        {Number(subject.chapters) || 0} chapters completed
                      </span>

                      <span className="text-[10px] font-medium text-slate-400">
                        {Math.max(
                          0,
                          (Number(subject.chapters) || 0) -
                            (Number(subject.completed) || 0)
                        )}{" "}
                        remaining
                      </span>

                    </div>

                  </div>


                  {/* CARD ACTION */}

                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">

                    <button
                      type="button"
                      onClick={() => onOpenSubject(subject)}
                      className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-700 transition hover:text-blue-700"
                    >
                      <span className="flex items-center gap-2">
                        <FolderOpen
                          size={15}
                          className="text-blue-700"
                        />
                        Open course
                      </span>

                      <span className="flex items-center gap-1 text-blue-700 transition group-hover:translate-x-1">
                        View chapters
                        <ChevronRight size={15} />
                      </span>
                    </button>

                  </div>

                </article>
              );
            })}

          </div>

        ) : (

          /* =================================
             EMPTY STATE
          ================================== */

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              {subjects.length === 0 ? (
                <BookOpen size={28} />
              ) : (
                <Search size={27} />
              )}
            </div>

            <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">
              {subjects.length === 0
                ? "Start building your course library"
                : "No subjects found"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {subjects.length === 0
                ? "Create your first subject to bring your university notes, chapters and study material together."
                : "Try a different search term or change the selected filter."}
            </p>

            {subjects.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="interactive-scale mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-xs font-semibold text-white transition hover:bg-blue-800"
              >
                <Plus size={16} />
                Create your first subject
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("all");
                }}
                className="mt-6 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear search and filters
              </button>
            )}

          </div>

        )}

      </section>


      {/* =====================================
          LEARNING NOTE
      ====================================== */}

      {subjects.length > 0 && (
        <section className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
              <Sparkles size={19} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Make every study session count
              </h3>

              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
                Open a subject, divide it into chapters, then use your
                notebooks and AI study assistant to understand your course material.
              </p>
            </div>

          </div>

          <div className="shrink-0 text-[11px] font-semibold text-blue-800">
            {completedSubjects} of {subjects.length} courses completed
            <ArrowRight
              size={14}
              className="ml-1 inline"
            />
          </div>

        </section>
      )}

    </div>
  );
}
