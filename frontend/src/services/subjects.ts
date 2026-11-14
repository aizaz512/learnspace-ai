
import {
  BookOpen,
  BrainCircuit,
  Code2,
  GraduationCap,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { Subject } from "../types/subject";

import { supabase } from "../lib/supabase";

export interface CreateSubjectInput {
  semesterId: number;
  name: string;
  description: string;
}

export interface UpdateSubjectStatsInput {
  id: number;
  chapters: number;
  completed: number;
  progress: number;
}

interface SubjectRow {
  id: number;
  semester_id: number;
  name: string;
  description: string;
  progress: number;
  chapters: number;
  completed: number;
  icon: string;
  color: string;
  background: string;
}

// Keep this as a string literal so Supabase can infer the selected columns.
const SUBJECT_COLUMNS =
  "id, semester_id, name, description, progress, chapters, completed, icon, color, background";

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  BrainCircuit,
  Code2,
  GraduationCap,
};

function mapSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    semesterId: row.semester_id,
    name: row.name,
    description: row.description ?? "",
    progress: row.progress,
    chapters: row.chapters,
    completed: row.completed,
    icon: SUBJECT_ICONS[row.icon] ?? BookOpen,
    color: row.color || "text-indigo-600",
    background: row.background || "bg-indigo-50",
  };
}

export async function getMySubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select(SUBJECT_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    mapSubject(row as SubjectRow)
  );
}

export async function createSubject(
  input: CreateSubjectInput
): Promise<Subject> {
  if (!input.name.trim()) {
    throw new Error("Subject name is required.");
  }

  const { data, error } = await supabase
    .from("subjects")
    .insert({
      semester_id: input.semesterId,
      name: input.name.trim(),
      description: input.description.trim(),
      progress: 0,
      chapters: 0,
      completed: 0,
      icon: "BookOpen",
      color: "text-indigo-600",
      background: "bg-indigo-50",
    })
    .select(SUBJECT_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSubject(data as SubjectRow);
}

export async function updateSubjectStats(
  input: UpdateSubjectStatsInput
): Promise<void> {
  const chapters = Math.max(
    0,
    Math.floor(input.chapters)
  );

  const completed = Math.max(
    0,
    Math.min(chapters, Math.floor(input.completed))
  );

  const progress =
    chapters > 0
      ? Math.round((completed / chapters) * 100)
      : 0;

  const { data, error } = await supabase
    .from("subjects")
    .update({
      chapters,
      completed,
      progress,
    })
    .eq("id", input.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Subject was not found or could not be updated."
    );
  }
}

export async function deleteSubject(
  id: number
): Promise<void> {
  const { data, error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Subject was not found or could not be deleted."
    );
  }
}
