
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  X,
  Layers,
  BookMarked,
  CalendarDays,
  ArrowRight,
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

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      const semester = semesters.find(
        (item) => item.id === subject.semesterId
      );

      return (
        subject.name.toLowerCase().includes(query) ||
        subject.description.toLowerCase().includes(query) ||
        (semester?.name.toLowerCase().includes(query) ?? false)
      );
    });
  }, [subjects, semesters, search]);

  const totalChapters = subjects.reduce(
    (total, subject) => total + subject.chapters,
    0
  );

  const averageProgress =
    subjects.length > 0
      ? Math.round(
          subjects.reduce(
            (total, subject) => total + subject.progress,
            0
          ) / subjects.length
        )
      : 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) return;

    if (!currentSemesterName) {
      window.alert(
        "Please create or select a current semester before adding subjects."
      );
      return;
    }

    onAddSubject(name.trim(), description.trim());

    setName("");
    setDescription("");
    setShowForm(false);
  }

  function handleDelete(subject: Subject) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subject.name}" and its chapters?`
    );

    if (confirmed) {
      onDeleteSubject(subject.id);
    }
  }

  return (
    <div>
      {/* PAGE HEADER */}

      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Subjects
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Organize your courses and track your learning progress.
          </p>
        </div>

        <button
          onClick={() => setShowForm((current) => !current)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}

          {showForm ? "Close form" : "Add subject"}
        </button>
      </div>

      {/* ADD SUBJECT FORM */}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-7 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">
              Create a new subject
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              New subjects will be assigned to:{" "}
              <span className="font-semibold text-indigo-600">
                {currentSemesterName || "No current semester"}
              </span>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="subject-name"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Subject name *
              </label>

              <input
                id="subject-name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Artificial Intelligence"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="subject-description"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Description
              </label>

              <input
                id="subject-description"
                maxLength={180}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="What will you study?"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
              disabled={!currentSemesterName}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create subject
            </button>
          </div>
        </form>
      )}

      {/* STATISTICS */}

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Layers size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {subjects.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Total subjects
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <BookMarked size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {totalChapters}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Total chapters
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BookOpen size={19} />
          </div>

          <p className="text-2xl font-bold text-slate-900">
            {averageProgress}%
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Average chapter completion
          </p>
        </div>
      </div>

      {/* SEARCH */}

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3">
        <Search size={17} className="text-slate-400" />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search subjects or semesters..."
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* SUBJECT CARDS */}

      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSubjects.map((subject) => {
            const Icon = subject.icon;

            const semester = semesters.find(
              (item) => item.id === subject.semesterId
            );

            return (
              <div
                key={subject.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${subject.background} ${subject.color}`}
                  >
                    <Icon size={23} />
                  </div>

                  <button
                    onClick={() => handleDelete(subject)}
                    aria-label={`Delete ${subject.name}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {subject.name}
                </h3>

                <p className="mt-1 min-h-10 text-xs leading-5 text-slate-400">
                  {subject.description || "No description added yet."}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <CalendarDays
                    size={13}
                    className="text-indigo-500"
                  />

                  <span className="text-[11px] font-medium text-slate-500">
                    {semester?.name || "Semester not assigned"}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {subject.completed} / {subject.chapters} chapters
                  </span>

                  <span className="text-xs font-bold text-indigo-600">
                    {subject.progress}%
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{
                      width: `${subject.progress}%`,
                    }}
                  />
                </div>

                <button
                  onClick={() => onOpenSubject(subject)}
                  className="mt-5 flex w-full items-center justify-between border-t border-slate-100 pt-4 text-left text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  Open subject and chapters
                  <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-14 text-center">
          <BookOpen
            size={30}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 text-base font-bold text-slate-800">
            {subjects.length === 0
              ? "No subjects yet"
              : "No matching subjects"}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {subjects.length === 0
              ? "Create your first subject to organize your learning."
              : "Try searching with another subject name."}
          </p>
        </div>
      )}
    </div>
  );
}
