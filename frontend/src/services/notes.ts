import type { Note } from "../types/note";
import { supabase } from "../lib/supabase";

// ============================================
// DATABASE TYPES
// ============================================

export interface UpdateNoteInput {
  title: string;
  content: string;
}

interface NoteRow {
  id: number;
  chapter_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const NOTE_COLUMNS =
  "id, chapter_id, title, content, created_at, updated_at";

// ============================================
// DATABASE MAPPING
// ============================================

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================
// VALIDATION
// ============================================

function validateId(id: number, label: string): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`A valid ${label} is required.`);
  }
}

// ============================================
// GET ALL NOTES FOR SIGNED-IN USER
// ============================================

export async function getMyNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapNote(row as NoteRow));
}

// ============================================
// CREATE NOTE
// ============================================

export async function createNote(chapterId: number): Promise<Note> {
  validateId(chapterId, "chapter ID");

  const { data, error } = await supabase
    .from("notes")
    .insert({
      chapter_id: chapterId,
      title: "Untitled note",
      content: "<p></p>",
    })
    .select(NOTE_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapNote(data as NoteRow);
}

// ============================================
// UPDATE NOTE
// ============================================

export async function updateNote(
  id: number,
  input: UpdateNoteInput
): Promise<void> {
  validateId(id, "note ID");

  const title = input.title.trim() || "Untitled note";

  const { data, error } = await supabase
    .from("notes")
    .update({
      title,
      content: input.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Note not found or could not be updated.");
  }
}

// ============================================
// DELETE NOTE
// ============================================

export async function deleteNote(id: number): Promise<void> {
  validateId(id, "note ID");

  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Note not found or could not be deleted.");
  }
}