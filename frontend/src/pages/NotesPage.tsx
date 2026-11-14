import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Trash2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  Minus,
  CheckCircle2,
  Save,
} from "lucide-react";

import type { Chapter } from "../types/chapter";
import type { Note } from "../types/note";

import "./NotesPage.css";

// ============================================
// COMPONENT PROPS
// ============================================

type NoteSaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error";

interface NotesPageProps {
  chapter: Chapter;
  notes: Note[];

  onBack: () => void;
  onAddNote: () => Note | Promise<Note>;

  onUpdateNote: (
    id: number,
    updates: Partial<Pick<Note, "title" | "content">>
  ) => void;

  onDeleteNote: (id: number) => void | Promise<void>;

  isLoading?: boolean;
  loadError?: string | null;
  onRetryLoad?: () => void;
  saveStatuses?: Record<number, NoteSaveStatus>;
}

// ============================================
// TOOLBAR BUTTON
// ============================================

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
        active
          ? "bg-indigo-100 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100"
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

// ============================================
// RICH TEXT EDITOR
// ============================================

interface NoteEditorProps {
  note: Note;

  onUpdateNote: (
    id: number,
    updates: Partial<Pick<Note, "title" | "content">>
  ) => void;
}

function NoteEditor({
  note,
  onUpdateNote,
}: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],

    content: note.content || "<p></p>",

    onUpdate: ({ editor }) => {
      onUpdateNote(note.id, {
        content: editor.getHTML(),
      });
    },

    editorProps: {
      attributes: {
        class: "focus:outline-none",
        "aria-label": "Your learning notes",
      },
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[420px] p-6 text-sm text-slate-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="notes-editor">

      {/* TOOLBAR */}

      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-3 py-3">

        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
        >
          <Bold size={17} />
        </ToolbarButton>

        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
        >
          <Italic size={17} />
        </ToolbarButton>

        <ToolbarButton
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 size={18} />
        </ToolbarButton>

        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={18} />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
        >
          <Quote size={17} />
        </ToolbarButton>

        <ToolbarButton
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() =>
            editor.chain().focus().toggleCodeBlock().run()
          }
        >
          <Code size={17} />
        </ToolbarButton>

        <ToolbarButton
          label="Horizontal divider"
          onClick={() =>
            editor.chain().focus().setHorizontalRule().run()
          }
        >
          <Minus size={17} />
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <ToolbarButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() =>
            editor.chain().focus().undo().run()
          }
        >
          <Undo2 size={17} />
        </ToolbarButton>

        <ToolbarButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() =>
            editor.chain().focus().redo().run()
          }
        >
          <Redo2 size={17} />
        </ToolbarButton>

      </div>

      {/* EDITOR CONTENT */}

      <EditorContent editor={editor} />

    </div>
  );
}

// ============================================
// MAIN NOTES PAGE
// ============================================

export default function NotesPage({
  chapter,
  notes,
  onBack,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  isLoading = false,
  loadError = null,
  onRetryLoad,
  saveStatuses,
}: NotesPageProps) {

  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [selectedNoteId, setSelectedNoteId] =
    useState<number | null>(notes[0]?.id ?? null);

  // ==========================================
  // SORT NOTES
  // ==========================================

  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
      ),
    [notes]
  );

  // ==========================================
  // FILTER NOTES
  // ==========================================

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortedNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }, [sortedNotes, search]);

  // ==========================================
  // SELECTED NOTE
  // ==========================================

  const selectedNote =
    notes.find((note) => note.id === selectedNoteId) ?? null;

  const selectedSaveStatus = selectedNote
    ? saveStatuses?.[selectedNote.id] ?? "saved"
    : "idle";

  // ==========================================
  // KEEP SELECTED NOTE VALID
  // ==========================================

  useEffect(() => {
    if (
      selectedNoteId !== null &&
      !notes.some((note) => note.id === selectedNoteId)
    ) {
      setSelectedNoteId(notes[0]?.id ?? null);
    }

    if (selectedNoteId === null && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  // ==========================================
  // CREATE NOTE
  // ==========================================

  async function handleCreateNote() {
    if (isCreating) return;

    setIsCreating(true);

    try {
      const newNote = await onAddNote();

      setSelectedNoteId(newNote.id);
      setSearch("");
    } catch (error) {
      window.alert(
        error instanceof Error
          ? `Unable to create note: ${error.message}`
          : "Unable to create note."
      );
    } finally {
      setIsCreating(false);
    }
  }

  // ==========================================
  // DELETE NOTE
  // ==========================================

  async function handleDeleteNote(note: Note) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${note.title}"?`
    );

    if (!confirmed) return;

    try {
      await onDeleteNote(note.id);

      const remaining = notes.filter(
        (item) => item.id !== note.id
      );

      if (selectedNoteId === note.id) {
        setSelectedNoteId(remaining[0]?.id ?? null);
      }
    } catch {
      // The parent handler displays the cloud deletion error.
    }
  }

  // ==========================================
  // DATE FORMAT
  // ==========================================

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Recently updated";
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // ==========================================
  // CLOUD LOADING AND ERROR STATES
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="text-sm text-slate-500">
            Loading your notes from the cloud...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
        <h2 className="text-base font-bold text-slate-800">
          We couldn't load your notes.
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

  // ==========================================
  // MAIN RETURN
  // ==========================================

  return (
    <div>

      {/* BACK BUTTON */}

      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft size={16} />
        Back to chapters
      </button>

      {/* CHAPTER HEADER */}

      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        <p className="mb-2 text-[10px] font-bold tracking-wider text-indigo-600">
          DIGITAL NOTEBOOK
        </p>

        <h1 className="text-xl font-bold text-slate-900">
          {chapter.title}
        </h1>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          {chapter.description ||
            "Create and organize your personal study notes."}
        </p>

      </div>

      {/* NOTES WORKSPACE */}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">

        {/* NOTES SIDEBAR */}

        <aside className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                My notes
              </h2>

              <p className="mt-1 text-[10px] text-slate-400">
                {notes.length} note{notes.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              onClick={() => void handleCreateNote()}
              disabled={isCreating}
              title="Create a new note"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700"
            >
              <Plus size={18} />
            </button>

          </div>

          {/* SEARCH */}

          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search size={15} className="text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search notes..."
              className="h-10 min-w-0 flex-1 bg-transparent text-xs outline-none"
            />
          </div>

          {/* NOTE LIST */}

          <div className="max-h-[560px] space-y-2 overflow-y-auto">

            {filteredNotes.map((note) => {
              const active = note.id === selectedNoteId;

              return (
                <div
                  key={note.id}
                  className={`group rounded-xl border p-3 transition ${
                    active
                      ? "border-indigo-100 bg-indigo-50"
                      : "border-transparent hover:border-slate-100 hover:bg-slate-50"
                  }`}
                >

                  <button
                    onClick={() => setSelectedNoteId(note.id)}
                    className="flex w-full items-start gap-2 text-left"
                  >
                    <FileText
                      size={16}
                      className={`mt-0.5 shrink-0 ${
                        active
                          ? "text-indigo-600"
                          : "text-slate-400"
                      }`}
                    />

                    <span className="min-w-0 flex-1">

                      <span
                        className={`block truncate text-xs font-semibold ${
                          active
                            ? "text-indigo-700"
                            : "text-slate-700"
                        }`}
                      >
                        {note.title || "Untitled note"}
                      </span>

                      <span className="mt-1 block text-[10px] text-slate-400">
                        {formatDate(note.updatedAt)}
                      </span>

                    </span>
                  </button>

                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handleDeleteNote(note)}
                      aria-label={`Delete ${note.title}`}
                      className="rounded-lg p-1.5 text-slate-300 opacity-100 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400">
                {notes.length === 0
                  ? "No notes yet. Create your first note."
                  : "No notes match your search."}
              </p>
            )}

          </div>

          <button
            onClick={() => void handleCreateNote()}
            disabled={isCreating}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 py-3 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
          >
            <Plus size={15} />
            Create new note
          </button>

        </aside>

        {/* EDITOR PANEL */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          {selectedNote ? (
            <>

              {/* NOTE TITLE */}

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">

                <div className="min-w-0 flex-1">

                  <label
                    htmlFor="note-title"
                    className="mb-2 block text-[10px] font-bold tracking-wider text-slate-400"
                  >
                    NOTE TITLE
                  </label>

                  <input
                    id="note-title"
                    value={selectedNote.title}
                    maxLength={120}
                    onChange={(event) =>
                      onUpdateNote(selectedNote.id, {
                        title: event.target.value,
                      })
                    }
                    placeholder="Untitled note"
                    className="w-full min-w-0 bg-transparent text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300 sm:text-xl"
                  />

                </div>

                <button
                  onClick={() => handleDeleteNote(selectedNote)}
                  aria-label="Delete current note"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>

              </div>

              {/* SAVE STATUS */}

              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 sm:px-5">

                <span className="text-[10px] text-slate-400">
                  Last edited: {formatDate(selectedNote.updatedAt)}
                </span>

                <span
                  className={`flex items-center gap-1.5 text-[10px] font-medium ${
                    selectedSaveStatus === "error"
                      ? "text-rose-600"
                      : selectedSaveStatus === "saving"
                        ? "text-amber-600"
                        : "text-emerald-700"
                  }`}
                >
                  <Save size={13} />
                  {selectedSaveStatus === "saving"
                    ? "Saving to cloud..."
                    : selectedSaveStatus === "error"
                      ? "Cloud save failed"
                      : "Saved to cloud"}
                </span>

              </div>

              {/* RICH TEXT EDITOR */}

              <NoteEditor
                key={selectedNote.id}
                note={selectedNote}
                onUpdateNote={onUpdateNote}
              />

              {/* FOOTER */}

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">

                <span className="text-[10px] text-slate-400">
                  Your notes are stored securely in the cloud.
                </span>

                <span className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                  <CheckCircle2 size={13} />
                  Ready
                </span>

              </div>

            </>
          ) : (

            /* EMPTY STATE */

            <div className="flex min-h-[500px] flex-col items-center justify-center px-5 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FileText size={28} />
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                Start your learning notes
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Create your first note for this chapter and organize
                your knowledge in one place.
              </p>

              <button
                onClick={() => void handleCreateNote()}
                disabled={isCreating}
                className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                <Plus size={16} />
                Create first note
              </button>

            </div>
          )}

        </section>
      </div>
    </div>
  );
}