
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Edit3,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
  Check,
  FileText,
  ArrowRight,
} from "lucide-react";

import type { Subject } from "../types/subject";
import type { Chapter } from "../types/chapter";

interface ChaptersPageProps {
  subject: Subject;
  chapters: Chapter[];

  onBack: () => void;

  onAddChapter: (
    title: string,
    description: string
  ) => void;

  onUpdateChapter: (
    id: number,
    title: string,
    description: string
  ) => void;

  onDeleteChapter: (id: number) => void;
  onToggleChapter: (id: number) => void;

  onOpenNotes: (chapter: Chapter) => void;
  onOpenPdfs: (chapter: Chapter) => void;
}

export default function ChaptersPage({
  subject,
  chapters,
  onBack,
  onAddChapter,
  onUpdateChapter,
  onDeleteChapter,
  onToggleChapter,
  onOpenNotes,
  onOpenPdfs,
}: ChaptersPageProps) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const filteredChapters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...chapters]
      .filter(
        (chapter) =>
          chapter.title.toLowerCase().includes(query) ||
          chapter.description.toLowerCase().includes(query)
      )
      .sort((a, b) => a.position - b.position);
  }, [chapters, search]);

  const completedCount = chapters.filter(
    (chapter) => chapter.isCompleted
  ).length;

  const progress =
    chapters.length > 0
      ? Math.round(
          (completedCount / chapters.length) * 100
        )
      : 0;

  function resetForm() {
    setTitle("");
    setDescription("");
    setEditingId(null);
    setShowForm(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) return;

    if (editingId !== null) {
      onUpdateChapter(
        editingId,
        title.trim(),
        description.trim()
      );
    } else {
      onAddChapter(
        title.trim(),
        description.trim()
      );
    }

    resetForm();
  }

  function startEditing(chapter: Chapter) {
    setEditingId(chapter.id);
    setTitle(chapter.title);
    setDescription(chapter.description);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleDelete(chapter: Chapter) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${chapter.title}" and its associated materials?`
    );

    if (confirmed) {
      onDeleteChapter(chapter.id);

      if (editingId === chapter.id) {
        resetForm();
      }
    }
  }

  return (
    <div>
      {/* BACK BUTTON */}

      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft size={16} />
        Back to subjects
      </button>

      {/* SUBJECT HEADER */}

      <div className="mb-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${subject.background} ${subject.color}`}
            >
              <BookOpen size={27} />
            </div>

            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-indigo-600">
                SUBJECT WORKSPACE
              </p>

              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {subject.name}
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                {subject.description ||
                  "Manage your subject chapters."}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (showForm && editingId === null) {
                resetForm();
              } else {
                setEditingId(null);
                setTitle("");
                setDescription("");
                setShowForm(true);
              }
            }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {showForm && editingId === null ? (
              <X size={16} />
            ) : (
              <Plus size={16} />
            )}

            {showForm && editingId === null
              ? "Close form"
              : "Add chapter"}
          </button>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Layers size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {chapters.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Total chapters
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {completedCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Completed chapters
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <BookOpen size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {progress}%
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Subject completion
          </p>
        </div>
      </div>

      {/* PROGRESS */}

      <div className="mb-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Learning progress
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Based on completed chapters
            </p>
          </div>

          <span className="text-sm font-bold text-indigo-600">
            {progress}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ADD / EDIT FORM */}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-7 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingId !== null
                  ? "Edit chapter"
                  : "Create a new chapter"}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Subject: {subject.name}
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4">
            <div>
              <label
                htmlFor="chapter-title"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Chapter title *
              </label>

              <input
                id="chapter-title"
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Introduction to Machine Learning"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="chapter-description"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Chapter description
              </label>

              <textarea
                id="chapter-description"
                maxLength={500}
                rows={3}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="What concepts does this chapter cover?"
                className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Check size={15} />

              {editingId !== null
                ? "Save changes"
                : "Create chapter"}
            </button>
          </div>
        </form>
      )}

      {/* SEARCH */}

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3">
        <Search size={17} className="text-slate-400" />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search chapters..."
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* CHAPTER LIST */}

      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">
          Your chapters
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Manage chapters, notes and PDF resources.
        </p>
      </div>

      {filteredChapters.length > 0 ? (
        <div className="space-y-3">
          {filteredChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-indigo-100 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() =>
                    onToggleChapter(chapter.id)
                  }
                  aria-label={
                    chapter.isCompleted
                      ? "Mark chapter incomplete"
                      : "Mark chapter completed"
                  }
                  className={`mt-1 shrink-0 transition ${
                    chapter.isCompleted
                      ? "text-emerald-600"
                      : "text-slate-300 hover:text-indigo-600"
                  }`}
                >
                  {chapter.isCompleted ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <Circle size={22} />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      CHAPTER {chapter.position}
                    </span>

                    {chapter.isCompleted && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                        COMPLETED
                      </span>
                    )}
                  </div>

                  <h3
                    className={`mt-1 text-sm font-bold ${
                      chapter.isCompleted
                        ? "text-slate-400"
                        : "text-slate-900"
                    }`}
                  >
                    {chapter.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {chapter.description ||
                      "No description added yet."}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() =>
                      startEditing(chapter)
                    }
                    aria-label={`Edit ${chapter.title}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(chapter)
                    }
                    aria-label={`Delete ${chapter.title}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* CHAPTER ACTIONS */}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-2 text-[10px] text-slate-400">
                  <FileText size={14} />
                  Learning resources
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onOpenPdfs(chapter)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <FileText size={14} />
                    PDF Library
                  </button>

                  <button
                    onClick={() => onOpenNotes(chapter)}
                    className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Open notes
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-14 text-center">
          <Layers
            size={32}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 text-base font-bold text-slate-800">
            {chapters.length === 0
              ? "No chapters yet"
              : "No matching chapters"}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {chapters.length === 0
              ? "Create your first chapter to start organizing this subject."
              : "Try another search term."}
          </p>

          {chapters.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Create first chapter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
