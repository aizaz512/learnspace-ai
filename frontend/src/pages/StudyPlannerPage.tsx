
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  ClipboardList,
  Plus,
  Search,
  Target,
  Trash2,
  X,
  AlertCircle,
  BookOpen,
  ListTodo,
  TrendingUp,
} from "lucide-react";

import type { Subject } from "../types/subject";


// ============================================
// TYPES
// ============================================

type Priority = "low" | "medium" | "high";

type PlannerFilter =
  | "all"
  | "today"
  | "upcoming"
  | "overdue"
  | "completed";

interface PlannerTask {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  dueTime: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
}


// ============================================
// PROPS
// ============================================

interface StudyPlannerPageProps {
  subjects: Subject[];
}


// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = "learnspace-ai-study-planner-v1";


function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function loadTasks(): PlannerTask[] {
  try {
    const stored = window.localStorage.getItem(
      STORAGE_KEY
    );

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (task): task is PlannerTask =>
        typeof task === "object" &&
        task !== null &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.subject === "string" &&
        typeof task.dueDate === "string" &&
        typeof task.completed === "boolean"
    );

  } catch {
    console.warn(
      "Unable to load saved study planner tasks."
    );

    return [];
  }
}


// ============================================
// DATE HELPERS
// ============================================

function formatDate(dateString: string): string {
  if (!dateString) return "No due date";

  const date = new Date(
    `${dateString}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


function formatTime(timeString: string): string {
  if (!timeString) return "";

  const [hours, minutes] = timeString.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}


function getDateLabel(dateString: string): string {
  const today = getTodayDate();

  const tomorrowDate = new Date(
    `${today}T12:00:00`
  );

  tomorrowDate.setDate(
    tomorrowDate.getDate() + 1
  );

  const tomorrow = [
    tomorrowDate.getFullYear(),
    String(tomorrowDate.getMonth() + 1).padStart(2, "0"),
    String(tomorrowDate.getDate()).padStart(2, "0"),
  ].join("-");

  if (dateString === today) {
    return "Today";
  }

  if (dateString === tomorrow) {
    return "Tomorrow";
  }

  if (dateString < today) {
    return "Overdue";
  }

  return formatDate(dateString);
}


// ============================================
// PRIORITY STYLES
// ============================================

function getPriorityStyles(priority: Priority): string {
  switch (priority) {
    case "high":
      return "bg-rose-50 text-rose-700 border-rose-100";

    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "low":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
}


// ============================================
// MAIN PAGE
// ============================================

export default function StudyPlannerPage({
  subjects,
}: StudyPlannerPageProps) {

  // ==========================================
  // TASK STATE
  // ==========================================

  const [tasks, setTasks] = useState<PlannerTask[]>(
    loadTasks
  );


  // ==========================================
  // FORM STATE
  // ==========================================

  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [selectedSubject, setSelectedSubject] =
    useState(subjects[0]?.name ?? "General Study");

  const [dueDate, setDueDate] =
    useState(getTodayDate);

  const [dueTime, setDueTime] =
    useState("17:00");

  const [priority, setPriority] =
    useState<Priority>("medium");


  // ==========================================
  // FILTER STATE
  // ==========================================

  const [activeFilter, setActiveFilter] =
    useState<PlannerFilter>("all");

  const [subjectFilter, setSubjectFilter] =
    useState("all");

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");

  const [saveError, setSaveError] = useState("");


  // ==========================================
  // SAVE TASKS
  // ==========================================

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
      );

      setSaveError("");

    } catch {
      setSaveError(
        "Your browser could not save the latest planner changes."
      );
    }
  }, [tasks]);


  // ==========================================
  // STATISTICS
  // ==========================================

  const today = getTodayDate();

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = tasks.filter(
    (task) => !task.completed
  ).length;

  const overdueTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate < today
  ).length;

  const todayTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate === today
  ).length;

  const completionRate =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0;


  // ==========================================
  // FILTER TASKS
  // ==========================================

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Status filter.
    switch (activeFilter) {
      case "today":
        filtered = filtered.filter(
          (task) =>
            !task.completed &&
            task.dueDate === today
        );
        break;

      case "upcoming":
        filtered = filtered.filter(
          (task) =>
            !task.completed &&
            task.dueDate > today
        );
        break;

      case "overdue":
        filtered = filtered.filter(
          (task) =>
            !task.completed &&
            task.dueDate < today
        );
        break;

      case "completed":
        filtered = filtered.filter(
          (task) => task.completed
        );
        break;

      default:
        break;
    }

    // Subject filter.
    if (subjectFilter !== "all") {
      filtered = filtered.filter(
        (task) => task.subject === subjectFilter
      );
    }

    // Text search.
    if (search.trim()) {
      const term = search.toLowerCase().trim();

      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          task.description.toLowerCase().includes(term) ||
          task.subject.toLowerCase().includes(term)
      );
    }

    // Sort by date, then time.
    filtered.sort((a, b) => {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }

      return a.dueTime.localeCompare(b.dueTime);
    });

    return filtered;

  }, [
    tasks,
    activeFilter,
    subjectFilter,
    search,
    today,
  ]);


  // ==========================================
  // ADD TASK
  // ==========================================

  function handleAddTask(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    if (!dueDate) {
      setError("Please select a due date.");
      return;
    }

    const newTask: PlannerTask = {
      id:
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `task-${Date.now()}-${Math.random()}`,

      title: title.trim(),

      description: description.trim(),

      subject: selectedSubject || "General Study",

      dueDate,

      dueTime,

      priority,

      completed: false,

      createdAt: new Date().toISOString(),
    };

    setTasks((current) => [
      newTask,
      ...current,
    ]);

    // Reset the form.
    setTitle("");
    setDescription("");
    setDueDate(getTodayDate());
    setDueTime("17:00");
    setPriority("medium");
    setError("");
    setShowForm(false);
    setActiveFilter("all");
    setSubjectFilter("all");
    setSearch("");
  }


  // ==========================================
  // TOGGLE COMPLETION
  // ==========================================

  function handleToggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    );
  }


  // ==========================================
  // DELETE TASK
  // ==========================================

  function handleDeleteTask(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    setTasks((current) =>
      current.filter(
        (task) => task.id !== id
      )
    );
  }


  // ==========================================
  // CLEAR COMPLETED TASKS
  // ==========================================

  function handleClearCompleted() {
    const hasCompletedTasks = tasks.some(
      (task) => task.completed
    );

    if (!hasCompletedTasks) return;

    const confirmed = window.confirm(
      "Remove all completed tasks from your planner?"
    );

    if (!confirmed) return;

    setTasks((current) =>
      current.filter(
        (task) => !task.completed
      )
    );
  }


  // ==========================================
  // FILTER COUNTS
  // ==========================================

  const filterOptions: {
    value: PlannerFilter;
    label: string;
    count: number;
  }[] = [
    {
      value: "all",
      label: "All tasks",
      count: totalTasks,
    },
    {
      value: "today",
      label: "Today",
      count: todayTasks,
    },
    {
      value: "upcoming",
      label: "Upcoming",
      count: tasks.filter(
        (task) =>
          !task.completed &&
          task.dueDate > today
      ).length,
    },
    {
      value: "overdue",
      label: "Overdue",
      count: overdueTasks,
    },
    {
      value: "completed",
      label: "Completed",
      count: completedTasks,
    },
  ];


  // ==========================================
  // PAGE RETURN
  // ==========================================

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <CalendarDays size={20} />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-indigo-600">
              Personal productivity
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Study Planner
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Organize your university work, set deadlines,
            manage priorities, and track your study progress.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm((current) => !current);
            setError("");
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700"
        >
          {showForm ? (
            <>
              <X size={16} />
              Close form
            </>
          ) : (
            <>
              <Plus size={16} />
              Add study task
            </>
          )}
        </button>

      </div>


      {/* SAVE WARNING */}

      {saveError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertCircle size={16} />
          {saveError}
        </div>
      )}


      {/* STATISTICS */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Total tasks
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ClipboardList size={18} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {totalTasks}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            All your study activities
          </p>
        </div>


        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Completed
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {completedTasks}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Tasks successfully finished
          </p>
        </div>


        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Due today
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 size={18} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {todayTasks}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Tasks requiring attention
          </p>
        </div>


        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Overdue
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle size={18} />
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {overdueTasks}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Pending past-deadline tasks
          </p>
        </div>

      </section>


      {/* COMPLETION PROGRESS */}

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>
            <div className="flex items-center gap-2">
              <TrendingUp
                size={18}
                className="text-indigo-600"
              />

              <h2 className="text-sm font-bold text-slate-900">
                Your task completion
              </h2>
            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              Overall progress across your study tasks
            </p>
          </div>

          <span className="text-xl font-bold text-indigo-600">
            {completionRate}%
          </span>

        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{
              width: `${completionRate}%`,
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
          <span>{completedTasks} completed</span>
          <span>{pendingTasks} remaining</span>
        </div>

      </section>


      {/* ADD TASK FORM */}

      {showForm && (
        <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create a study task
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Add an activity and set its deadline.
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Plus size={20} />
            </div>
          </div>


          <form
            onSubmit={handleAddTask}
            className="space-y-5"
          >

            {/* TITLE */}

            <div>
              <label
                htmlFor="planner-title"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Task title *
              </label>

              <input
                id="planner-title"
                type="text"
                required
                maxLength={150}
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Example: Complete Machine Learning assignment"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />
            </div>


            {/* DESCRIPTION */}

            <div>
              <label
                htmlFor="planner-description"
                className="mb-2 block text-xs font-semibold text-slate-600"
              >
                Description
              </label>

              <textarea
                id="planner-description"
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Add details about what you need to study..."
                className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />
            </div>


            {/* SUBJECT AND PRIORITY */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="planner-subject"
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  Subject
                </label>

                <select
                  id="planner-subject"
                  value={selectedSubject}
                  onChange={(event) =>
                    setSelectedSubject(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="General Study">
                    General Study
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.name}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>


              <div>
                <label
                  htmlFor="planner-priority"
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  Priority
                </label>

                <select
                  id="planner-priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value as Priority
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>
              </div>

            </div>


            {/* DUE DATE AND TIME */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="planner-date"
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  Due date *
                </label>

                <input
                  id="planner-date"
                  type="date"
                  required
                  min={getTodayDate()}
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div>
                <label
                  htmlFor="planner-time"
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  Due time
                </label>

                <input
                  id="planner-time"
                  type="time"
                  value={dueTime}
                  onChange={(event) =>
                    setDueTime(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

            </div>


            {/* VALIDATION ERROR */}

            {error && (
              <p className="flex items-center gap-2 text-xs text-rose-600">
                <AlertCircle size={15} />
                {error}
              </p>
            )}


            {/* FORM ACTIONS */}

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                <Plus size={15} />
                Save task
              </button>

            </div>

          </form>

        </section>
      )}


      {/* TASK MANAGEMENT */}

      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">

        {/* TASK HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Your study tasks
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Manage deadlines and monitor your progress.
            </p>
          </div>

          {completedTasks > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-[11px] font-semibold text-rose-600 transition hover:text-rose-800"
            >
              Clear completed
            </button>
          )}

        </div>


        {/* FILTERS */}

        <div className="space-y-4 border-b border-slate-100 p-5">

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter.value}
                onClick={() =>
                  setActiveFilter(filter.value)
                }
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold transition ${
                  activeFilter === filter.value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label}

                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    activeFilter === filter.value
                      ? "bg-white/20 text-white"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>


          {/* SEARCH AND SUBJECT FILTER */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search tasks..."
                className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />
            </div>


            <select
              value={subjectFilter}
              onChange={(event) =>
                setSubjectFilter(event.target.value)
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            >
              <option value="all">All subjects</option>

              <option value="General Study">
                General Study
              </option>

              {subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.name}
                >
                  {subject.name}
                </option>
              ))}
            </select>

          </div>

        </div>


        {/* TASK LIST */}

        <div className="divide-y divide-slate-100">

          {filteredTasks.length === 0 ? (

            <div className="px-5 py-14 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                <ListTodo size={26} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-800">
                {tasks.length === 0
                  ? "Your planner is empty"
                  : "No tasks found"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">
                {tasks.length === 0
                  ? "Create your first study task to organize assignments, revisions, and exam preparation."
                  : "Try a different filter or search term to find your study tasks."}
              </p>

              {tasks.length === 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus size={15} />
                  Create your first task
                </button>
              )}

            </div>

          ) : (

            filteredTasks.map((task) => {

              const isOverdue =
                !task.completed &&
                task.dueDate < today;

              const dateLabel =
                getDateLabel(task.dueDate);

              return (
                <article
                  key={task.id}
                  className="flex flex-wrap items-start gap-3 p-5 transition hover:bg-slate-50/60 sm:items-center"
                >

                  {/* COMPLETION */}

                  <button
                    onClick={() =>
                      handleToggleTask(task.id)
                    }
                    aria-label={
                      task.completed
                        ? "Mark task incomplete"
                        : "Complete task"
                    }
                    title={
                      task.completed
                        ? "Mark incomplete"
                        : "Mark complete"
                    }
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition sm:mt-0 ${
                      task.completed
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 text-transparent hover:border-indigo-500"
                    }`}
                  >
                    {task.completed ? (
                      <Check size={14} />
                    ) : (
                      <Circle size={14} />
                    )}
                  </button>


                  {/* TASK DETAILS */}

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3
                        className={`text-sm font-semibold ${
                          task.completed
                            ? "text-slate-400 line-through"
                            : "text-slate-800"
                        }`}
                      >
                        {task.title}
                      </h3>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold capitalize ${getPriorityStyles(task.priority)}`}
                      >
                        {task.priority}
                      </span>

                    </div>

                    {task.description && (
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">

                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <BookOpen size={12} />
                        {task.subject}
                      </span>

                      <span
                        className={`flex items-center gap-1 text-[10px] font-medium ${
                          isOverdue
                            ? "text-rose-600"
                            : "text-slate-400"
                        }`}
                      >
                        <CalendarDays size={12} />
                        {dateLabel}
                      </span>

                      {task.dueTime && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock3 size={12} />
                          {formatTime(task.dueTime)}
                        </span>
                      )}

                    </div>

                  </div>


                  {/* STATUS AND DELETE */}

                  <div className="ml-9 flex shrink-0 items-center gap-3 sm:ml-0">

                    {task.completed ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">
                        Completed
                      </span>
                    ) : isOverdue ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[9px] font-semibold text-rose-700">
                        Overdue
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-semibold text-blue-700">
                        Pending
                      </span>
                    )}

                    <button
                      onClick={() =>
                        handleDeleteTask(task.id)
                      }
                      aria-label="Delete task"
                      title="Delete task"
                      className="rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </article>
              );
            })

          )}

        </div>

        {/* TASK FOOTER */}

        {filteredTasks.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-[10px] text-slate-400">
              Showing {filteredTasks.length} of {totalTasks} tasks
            </p>
          </div>
        )}

      </section>


      {/* STUDY TIP */}

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600">
            <Target size={18} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">
              A practical study strategy
            </h3>

            <p className="mt-1 text-xs leading-6 text-slate-600">
              Break large assignments into smaller tasks. Give
              important deadlines a high priority, and mark each
              task complete as soon as you finish it.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}
