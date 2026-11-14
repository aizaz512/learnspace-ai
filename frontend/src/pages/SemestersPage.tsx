
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  CalendarDays,
  Plus,
  Search,
  Trash2,
  X,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import type { Semester } from "../types/semester";
import type { Subject } from "../types/subject";

interface SemestersPageProps {
  semesters: Semester[];
  subjects: Subject[];

  onAddSemester: (
    name: string,
    academicYear: string,
    startDate: string,
    endDate: string
  ) => void;

  onDeleteSemester: (id: number) => void;
  onSetCurrentSemester: (id: number) => void;
}

export default function SemestersPage({
  semesters,
  subjects,
  onAddSemester,
  onDeleteSemester,
  onSetCurrentSemester,
}: SemestersPageProps) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const currentSemester = semesters.find(
    (semester) => semester.isCurrent
  );

  const filteredSemesters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return semesters.filter(
      (semester) =>
        semester.name.toLowerCase().includes(query) ||
        semester.academicYear.toLowerCase().includes(query)
    );
  }, [semesters, search]);

  function getSubjectCount(semesterId: number) {
    return subjects.filter(
      (subject) => subject.semesterId === semesterId
    ).length;
  }

  function formatDate(value: string) {
    if (!value) return "Not specified";

    return new Date(`${value}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !academicYear.trim()) return;

    if (
      startDate &&
      endDate &&
      new Date(startDate) > new Date(endDate)
    ) {
      window.alert("The end date must be after the start date.");
      return;
    }

    onAddSemester(
      name.trim(),
      academicYear.trim(),
      startDate,
      endDate
    );

    setName("");
    setAcademicYear("2026-2027");
    setStartDate("");
    setEndDate("");
    setShowForm(false);
  }

  function handleDelete(semester: Semester) {
    const count = getSubjectCount(semester.id);

    if (count > 0) {
      window.alert(
        `This semester contains ${count} subject(s). Remove or move those subjects before deleting the semester.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${semester.name}"?`
    );

    if (confirmed) {
      onDeleteSemester(semester.id);
    }
  }

  return (
    <div>
      {/* PAGE HEADER */}

      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Semesters
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Organize your academic years, semesters and subjects.
          </p>
        </div>

        <button
          onClick={() => setShowForm((current) => !current)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Close form" : "Add semester"}
        </button>
      </div>

      {/* ADD SEMESTER FORM */}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-7 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-5 text-base font-bold text-slate-900">
            Create a new semester
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Semester name *
              </label>

              <input
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Fall Semester"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Academic year *
              </label>

              <input
                required
                maxLength={30}
                value={academicYear}
                onChange={(event) =>
                  setAcademicYear(event.target.value)
                }
                placeholder="2026-2027"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Start date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                End date
              </label>

              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Create semester
            </button>
          </div>
        </form>
      )}

      {/* STATISTICS */}

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarDays size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {semesters.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Total semesters
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <BookOpen size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {subjects.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Total subjects
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={19} />
          </div>

          <p className="truncate text-lg font-bold text-slate-900">
            {currentSemester?.name || "Not selected"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Current semester
          </p>
        </div>
      </div>

      {/* SEARCH */}

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3">
        <Search size={17} className="text-slate-400" />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search semesters or academic years..."
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* SEMESTER CARDS */}

      {filteredSemesters.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSemesters.map((semester) => {
            const subjectCount = getSubjectCount(semester.id);

            return (
              <div
                key={semester.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <GraduationCap size={24} />
                  </div>

                  <div className="flex items-center gap-2">
                    {semester.isCurrent && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                        CURRENT
                      </span>
                    )}

                    <button
                      onClick={() => handleDelete(semester)}
                      aria-label={`Delete ${semester.name}`}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {semester.name}
                </h3>

                <p className="mt-1 text-xs font-medium text-indigo-600">
                  Academic year {semester.academicYear}
                </p>

                <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Clock3 size={15} />
                      Start date
                    </span>

                    <span className="font-medium text-slate-700">
                      {formatDate(semester.startDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-500">
                      <CalendarDays size={15} />
                      End date
                    </span>

                    <span className="font-medium text-slate-700">
                      {formatDate(semester.endDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-500">
                      <BookOpen size={15} />
                      Subjects
                    </span>

                    <span className="font-bold text-slate-800">
                      {subjectCount}
                    </span>
                  </div>
                </div>

                {!semester.isCurrent && (
                  <button
                    onClick={() =>
                      onSetCurrentSemester(semester.id)
                    }
                    className="mt-5 w-full rounded-xl border border-indigo-100 bg-indigo-50 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Make current semester
                  </button>
                )}

                {semester.isCurrent && (
                  <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={15} />
                    Active learning semester
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-14 text-center">
          <CalendarDays
            size={32}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 text-base font-bold text-slate-800">
            {semesters.length === 0
              ? "No semesters created"
              : "No matching semesters"}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {semesters.length === 0
              ? "Create your first semester to organize your academic subjects."
              : "Try another search term."}
          </p>
        </div>
      )}
    </div>
  );
}
