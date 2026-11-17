
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Clock3,
  ArrowUpRight,
  Layers3,
  X,
  FolderOpen,
  LoaderCircle,
  BookMarked,
  AlertCircle,
} from "lucide-react";

import type { Subject } from "../types/subject";
import type { Chapter } from "../types/chapter";
import type { Note } from "../types/note";

interface MyNotebooksPageProps {
  subjects: Subject[];
  chapters: Chapter[];
  notes: Note[];
  isLoading: boolean;
  loadError: string | null;
  onRetryLoad: () => void;

  onOpenNotebook: (chapter: Chapter) => void;

  onCreateNotebook: (
    subjectId: number,
    title: string,
    description: string
  ) => Promise<void>;
}

interface NotebookItem {
  chapter: Chapter;
  subject: Subject;
  notes: Note[];
  latestUpdatedAt: string | null;
}

function formatDate(value: string | null): string {
  if (!value) return "No notes yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNotePreview(content: string): string {
  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

  return plainText || "No text added yet.";
}

export default function MyNotebooksPage({
  subjects,
  chapters,
  notes,
  isLoading,
  loadError,
  onRetryLoad,
  onOpenNotebook,
  onCreateNotebook,
}: MyNotebooksPageProps) {
  const [search, setSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] =
    useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newSubjectId, setNewSubjectId] =
    useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createError, setCreateError] = useState("");

  // Build notebook data using existing chapters and notes.
  // Each notebook is represented by one chapter.
  const notebooks = useMemo<NotebookItem[]>(() => {
    const items = chapters.reduce<NotebookItem[]>(
      (result, chapter) => {
        const subject = subjects.find(
          (item) => item.id === chapter.subjectId
        );

        // Skip chapters whose subject is unavailable.
        if (!subject) {
          return result;
        }

        const notebookNotes = notes
          .filter((note) => note.chapterId === chapter.id)
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() -
              new Date(a.updatedAt).getTime()
          );

        const latestUpdatedAt: string | null =
          notebookNotes[0]?.updatedAt ?? null;

        result.push({
          chapter,
          subject,
          notes: notebookNotes,
          latestUpdatedAt,
        });

        return result;
      },
      []
    );

    return items.sort((a, b) => {
      if (!a.latestUpdatedAt && !b.latestUpdatedAt) {
        return a.chapter.position - b.chapter.position;
      }

      if (!a.latestUpdatedAt) return 1;
      if (!b.latestUpdatedAt) return -1;

      return (
        new Date(b.latestUpdatedAt).getTime() -
        new Date(a.latestUpdatedAt).getTime()
      );
    });
  }, [chapters, subjects, notes]);

  // Search and subject filtering.
  const filteredNotebooks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notebooks.filter((notebook) => {
      const matchesSubject =
        selectedSubjectId === "all" ||
        notebook.subject.id === Number(selectedSubjectId);

      const matchesSearch =
        !query ||
        notebook.chapter.title.toLowerCase().includes(query) ||
        notebook.chapter.description.toLowerCase().includes(query) ||
        notebook.subject.name.toLowerCase().includes(query) ||
        notebook.notes.some((note) =>
          note.title.toLowerCase().includes(query)
        );

      return matchesSubject && matchesSearch;
    });
  }, [notebooks, search, selectedSubjectId]);

  const totalNotes = notes.length;

  function openCreateDialog() {
    setNewSubjectId(
      subjects.length > 0 ? String(subjects[0].id) : ""
    );

    setNewTitle("");
    setNewDescription("");
    setCreateError("");
    setCreateOpen(true);
  }

  async function handleCreateNotebook(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (creating) return;

    const title = newTitle.trim();
    const description = newDescription.trim();
    const subjectId = Number(newSubjectId);

    if (!title) {
      setCreateError("Please enter a notebook name.");
      return;
    }

    if (!Number.isSafeInteger(subjectId) || subjectId <= 0) {
      setCreateError("Please select a valid subject.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      await onCreateNotebook(
        subjectId,
        title,
        description
      );

      setCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewSubjectId("");
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Unable to create your notebook."
      );
    } finally {
      setCreating(false);
    }
  }

  // Loading state.
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle
            size={32}
            className="animate-spin text-indigo-600"
          />
          <p className="text-sm text-slate-500">
            Loading your notebooks...
          </p>
        </div>
      </div>
    );
  }

  // Error state.
  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
        <AlertCircle
          size={32}
          className="mx-auto text-rose-500"
        />

        <h2 className="mt-4 text-base font-bold text-slate-800">
          Unable to load your notebooks
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {loadError}
        </p>

        <button
          type="button"
          onClick={onRetryLoad}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <BookMarked size={19} className="text-indigo-600" />

            <span className="text-[10px] font-bold tracking-[0.16em] text-indigo-600">
              YOUR LEARNING LIBRARY
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Notebooks
          </h1>

          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Organize your learning notes by subject and notebook.
            Everything is saved securely in your cloud workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateDialog}
          disabled={subjects.length === 0}
          title={
            subjects.length === 0
              ? "Create a subject first"
              : "Create a notebook"
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          New notebook
        </button>
      </section>

      {/* STATISTICS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Total notebooks
            </p>

            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <BookOpen size={18} />
            </div>
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {notebooks.length}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Across all your subjects
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Total notes
            </p>

            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <FileText size={18} />
            </div>
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {totalNotes}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Saved in your cloud
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Active subjects
            </p>

            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Layers3 size={18} />
            </div>
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {subjects.length}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Your learning categories
          </p>
        </div>
      </section>

      {/* SEARCH AND FILTER */}
      <section className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
          <Search size={17} className="text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notebooks, subjects or notes..."
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <select
          value={selectedSubjectId}
          onChange={(event) =>
            setSelectedSubjectId(event.target.value)
          }
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-indigo-400"
          aria-label="Filter notebooks by subject"
        >
          <option value="all">All subjects</option>

          {subjects.map((subject) => (
            <option
              key={subject.id}
              value={String(subject.id)}
            >
              {subject.name}
            </option>
          ))}
        </select>
      </section>

      {/* NOTEBOOKS GRID */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Your notebooks
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredNotebooks.length} notebook
              {filteredNotebooks.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <Layers3
              size={32}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-4 text-base font-bold text-slate-800">
              Create your first subject
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Notebooks belong to subjects. Create a subject first,
              then organize its chapters and notes here.
            </p>
          </div>
        ) : filteredNotebooks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <FolderOpen
              size={32}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-4 text-base font-bold text-slate-800">
              {notebooks.length === 0
                ? "No notebooks yet"
                : "No matching notebooks"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              {notebooks.length === 0
                ? "Create your first notebook to organize notes and study material."
                : "Try another search term or choose a different subject."}
            </p>

            {notebooks.length === 0 && (
              <button
                type="button"
                onClick={openCreateDialog}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={15} />
                Create first notebook
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredNotebooks.map((notebook) => (
              <article
                key={notebook.chapter.id}
                className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <BookOpen size={23} />
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      notebook.chapter.isCompleted
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {notebook.chapter.isCompleted
                      ? "Completed"
                      : "In progress"}
                  </span>
                </div>

                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {notebook.subject.name}
                </p>

                <h3 className="mt-1 truncate text-base font-bold text-slate-900">
                  {notebook.chapter.title}
                </h3>

                <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">
                  {notebook.chapter.description ||
                    "Your personal learning notebook."}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <FileText size={14} />

                    {notebook.notes.length} note
                    {notebook.notes.length === 1 ? "" : "s"}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock3 size={12} />
                    {formatDate(notebook.latestUpdatedAt)}
                  </div>
                </div>

                {/* RECENT NOTES */}
                <div className="mt-4 min-h-16 space-y-2">
                  {notebook.notes.length > 0 ? (
                    notebook.notes.slice(0, 2).map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <p className="truncate text-xs font-semibold text-slate-700">
                          {note.title || "Untitled note"}
                        </p>

                        <p className="mt-1 truncate text-[10px] text-slate-400">
                          {getNotePreview(note.content)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="flex items-center gap-2 py-2 text-xs text-slate-400">
                      <FileText size={14} />
                      No notes yet. Start writing.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onOpenNotebook(notebook.chapter)
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
                >
                  Open notebook
                  <ArrowUpRight size={15} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* CREATE NOTEBOOK MODAL */}
      {createOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) {
              setCreateOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-notebook-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookMarked size={21} />
                </div>

                <h2
                  id="create-notebook-title"
                  className="mt-4 text-lg font-bold text-slate-900"
                >
                  Create notebook
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Choose a subject and give your notebook a name.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreateNotebook}
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="notebook-subject"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Subject
                </label>

                <select
                  id="notebook-subject"
                  value={newSubjectId}
                  onChange={(event) =>
                    setNewSubjectId(event.target.value)
                  }
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="" disabled>
                    Select a subject
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={String(subject.id)}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="notebook-name"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Notebook name
                </label>

                <input
                  id="notebook-name"
                  value={newTitle}
                  onChange={(event) =>
                    setNewTitle(event.target.value)
                  }
                  placeholder="e.g. Neural Networks"
                  maxLength={120}
                  required
                  autoFocus
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label
                  htmlFor="notebook-description"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Description
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <textarea
                  id="notebook-description"
                  value={newDescription}
                  onChange={(event) =>
                    setNewDescription(event.target.value)
                  }
                  placeholder="What will you study in this notebook?"
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>

              {createError && (
                <p
                  role="alert"
                  className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
                >
                  {createError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating || subjects.length === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <LoaderCircle
                        size={15}
                        className="animate-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      Create notebook
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
