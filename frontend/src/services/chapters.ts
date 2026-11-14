import type { Chapter } from "../types/chapter";
import { supabase } from "../lib/supabase";

/**
 * Input required to create a chapter.
 */
export interface CreateChapterInput {
  subjectId: number;
  title: string;
  description: string;
  position: number;
}

/**
 * Database representation of a chapter.
 */
interface ChapterRow {
  id: number;
  subject_id: number;
  title: string;
  description: string | null;
  position: number;
  is_completed: boolean;
}

/**
 * Keep this as a string literal so Supabase can infer
 * the selected columns.
 */
const CHAPTER_COLUMNS =
  "id, subject_id, title, description, position, is_completed";

/**
 * Convert a database chapter row into the frontend Chapter type.
 */
function mapChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    description: row.description ?? "",
    position: row.position,
    isCompleted: row.is_completed,
  };
}

/**
 * Validate a chapter ID before making database requests.
 */
function validateChapterId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("A valid chapter ID is required.");
  }
}

/**
 * Get all chapters belonging to the authenticated student.
 *
 * Supabase Row Level Security should restrict the results
 * to the currently authenticated user.
 */
export async function getMyChapters(): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from("chapters")
    .select(CHAPTER_COLUMNS)
    .order("subject_id", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    mapChapter(row as ChapterRow)
  );
}

/**
 * Create a chapter. The database generates its ID.
 */
export async function createChapter(
  input: CreateChapterInput
): Promise<Chapter> {
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) {
    throw new Error("Chapter title is required.");
  }

  if (!Number.isInteger(input.subjectId) || input.subjectId <= 0) {
    throw new Error("A valid subject is required.");
  }

  if (!Number.isInteger(input.position) || input.position < 1) {
    throw new Error("A valid chapter position is required.");
  }

  const { data, error } = await supabase
    .from("chapters")
    .insert({
      subject_id: input.subjectId,
      title,
      description,
      position: input.position,
      is_completed: false,
    })
    .select(CHAPTER_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapChapter(data as ChapterRow);
}

/**
 * Update a chapter's title and description.
 */
export async function updateChapter(
  id: number,
  title: string,
  description: string
): Promise<void> {
  validateChapterId(id);

  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error("Chapter title is required.");
  }

  const { data, error } = await supabase
    .from("chapters")
    .update({
      title: cleanTitle,
      description: description.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Chapter not found or could not be updated.");
  }
}

/**
 * Save a chapter's completion state.
 */
export async function updateChapterCompletion(
  id: number,
  isCompleted: boolean
): Promise<void> {
  validateChapterId(id);

  const { data, error } = await supabase
    .from("chapters")
    .update({
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Chapter not found or could not be updated.");
  }
}

/**
 * Delete a chapter belonging to the authenticated student.
 */
export async function deleteChapter(
  id: number
): Promise<void> {
  validateChapterId(id);

  const { data, error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Chapter not found or could not be deleted.");
  }
}