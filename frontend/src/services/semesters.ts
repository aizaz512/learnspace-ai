
import { supabase } from "../lib/supabase";
import type { Semester } from "../types/semester";

export interface CreateSemesterInput {
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
}

interface SemesterRow {
  id: number;
  name: string;
  academic_year: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
}

const SEMESTER_COLUMNS =
  "id, name, academic_year, start_date, end_date, is_current";

function mapSemester(row: SemesterRow): Semester {
  return {
    id: row.id,
    name: row.name,
    academicYear: row.academic_year,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    isCurrent: row.is_current,
  };
}

export async function getMySemesters(): Promise<Semester[]> {
  const { data, error } = await supabase
    .from("semesters")
    .select(SEMESTER_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    mapSemester(row as SemesterRow)
  );
}

export async function createSemester(
  input: CreateSemesterInput
): Promise<Semester> {
  const { data: current, error: currentError } =
    await supabase
      .from("semesters")
      .select("id")
      .eq("is_current", true)
      .limit(1)
      .maybeSingle();

  if (currentError) {
    throw new Error(currentError.message);
  }

  const { data, error } = await supabase
    .from("semesters")
    .insert({
      name: input.name.trim(),
      academic_year: input.academicYear.trim(),
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      is_current: !current,
    })
    .select(SEMESTER_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSemester(data as SemesterRow);
}

export async function deleteSemester(
  id: number
): Promise<void> {
  const { data: deleted, error } = await supabase
    .from("semesters")
    .delete()
    .eq("id", id)
    .select("id, is_current")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!deleted) {
    throw new Error(
      "Semester was not found or could not be deleted."
    );
  }

  if (deleted.is_current) {
    const { data: nextSemester, error: nextError } =
      await supabase
        .from("semesters")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (nextError) {
      throw new Error(nextError.message);
    }

    if (nextSemester) {
      const { error: updateError } = await supabase
        .from("semesters")
        .update({ is_current: true })
        .eq("id", nextSemester.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  }
}

export async function setCurrentSemester(
  id: number
): Promise<void> {
  const { data: target, error: targetError } =
    await supabase
      .from("semesters")
      .select("id")
      .eq("id", id)
      .maybeSingle();

  if (targetError) {
    throw new Error(targetError.message);
  }

  if (!target) {
    throw new Error("Semester not found.");
  }

  const { error: clearError } = await supabase
    .from("semesters")
    .update({ is_current: false })
    .eq("is_current", true);

  if (clearError) {
    throw new Error(clearError.message);
  }

  const { error: updateError } = await supabase
    .from("semesters")
    .update({ is_current: true })
    .eq("id", id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
