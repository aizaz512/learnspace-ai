
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Sparkles,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Settings,
  HelpCircle,
  Search,
  Bell,
  ChevronDown,
  Plus,
  ArrowUpRight,
  Clock3,
  Flame,
  Target,
  CheckCircle2,
  FileText,
  GraduationCap,
  Menu,
  X,
  BrainCircuit,
  LogOut,
} from "lucide-react";

import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";

import {
  createSemester as createSemesterInSupabase,
  deleteSemester as deleteSemesterFromSupabase,
  getMySemesters,
  setCurrentSemester as setCurrentSemesterInSupabase,
} from "./services/semesters";

import {
  createSubject as createSubjectInSupabase,
  deleteSubject as deleteSubjectFromSupabase,
  getMySubjects,
  updateSubjectStats as updateSubjectStatsInSupabase,
} from "./services/subjects";

import {
  createChapter as createChapterInSupabase,
  deleteChapter as deleteChapterFromSupabase,
  getMyChapters,
  updateChapter as updateChapterInSupabase,
  updateChapterCompletion as updateChapterCompletionInSupabase,
} from "./services/chapters";

import {
  createNote as createNoteInSupabase,
  deleteNote as deleteNoteFromSupabase,
  getMyNotes,
  updateNote as updateNoteInSupabase,
} from "./services/notes";

import type { Subject } from "./types/subject";
import type { Semester } from "./types/semester";
import type { Chapter } from "./types/chapter";
import type { Note } from "./types/note";
import type { PdfDocument } from "./types/pdf-document";

import SubjectsPage from "./pages/SubjectsPage";
import SemestersPage from "./pages/SemestersPage";
import ChaptersPage from "./pages/ChaptersPage";
import PdfLibraryPage from "./pages/PdfLibraryPage";
import AssistantPage from "./pages/AssistantPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import QuizzesPage from "./pages/QuizzesPage";
import StudyPlannerPage from "./pages/StudyPlannerPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";

const NotesPage = lazy(() => import("./pages/NotesPage.tsx"));

const MyNotebooksPage = lazy(
  () => import("./pages/MyNotebooksPage.tsx")
);


// ============================================
// NAVIGATION
// ============================================

const navigation = [
  {
    heading: "LEARN",
    items: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "My Semesters", icon: CalendarDays },
      { label: "My Notebooks", icon: BookOpen },
      { label: "My Subjects", icon: Layers },
    ],
  },
  {
    heading: "STUDY TOOLS",
    items: [
      { label: "AI Assistant", icon: Sparkles },
      { label: "Flashcards", icon: ClipboardList },
      { label: "Quizzes", icon: BrainCircuit },
      { label: "Study Planner", icon: CalendarDays },
    ],
  },
  {
    heading: "INSIGHTS",
    items: [
      { label: "Analytics", icon: BarChart3 },
    ],
  },
];


// ============================================
// STUDY TASK TYPE
// ============================================

type StudyTask = {
  id: number;
  title: string;
  subject: string;
  due: string;
  done: boolean;
};

type NoteSaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error";


// ============================================
// INITIAL TASKS
// ============================================

const initialTasks: StudyTask[] = [
  {
    id: 1,
    title: "Complete Neural Networks assignment",
    subject: "Machine Learning",
    due: "Today · 8:00 PM",
    done: false,
  },
  {
    id: 2,
    title: "Revise Image Classification",
    subject: "Computer Vision",
    due: "Tomorrow · 10:00 AM",
    done: false,
  },
  {
    id: 3,
    title: "Practice Binary Trees",
    subject: "Data Structures",
    due: "Nov 6 · 2:00 PM",
    done: false,
  },
];


// ============================================
// SIDEBAR PROPS
// ============================================

type SidebarProps = {
  active: string;
  onNavigate: (label: string) => void;
  onClose?: () => void;
  userName: string;
  userEmail: string;
  onOpenProfile: () => void;
};


// ============================================
// SIDEBAR COMPONENT
// ============================================

function Sidebar({
  active,
  onNavigate,
  onClose,
  userName,
  userEmail,
  onOpenProfile,
}: SidebarProps) {
  const avatarLetter =
    userName.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="flex h-full flex-col bg-white">

      {/* BRAND */}

      <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <GraduationCap size={23} />
          </div>

          <div>
            <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
              LearnSpace<span className="text-indigo-600"> AI</span>
            </h1>

            <p className="text-[10px] font-medium tracking-wide text-slate-400">
              YOUR SMART LEARNING SPACE
            </p>
          </div>

        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        )}

      </div>


      {/* NAVIGATION */}

      <div className="flex-1 overflow-y-auto px-4 py-6">

        {navigation.map((group) => (
          <div className="mb-7" key={group.heading}>

            <p className="mb-3 px-3 text-[10px] font-bold tracking-[1.5px] text-slate-400">
              {group.heading}
            </p>

            <div className="space-y-1">

              {group.items.map((item) => {
                const Icon = item.icon;

                const selected =
                  active === item.label ||
                  (
                    (
                      active === "Chapters" ||
                      active === "Notes" ||
                      active === "PDF Library"
                    ) &&
                    item.label === "My Subjects"
                  );

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      onNavigate(item.label);
                      onClose?.();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                      selected
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={selected ? 2.3 : 1.8}
                    />

                    {item.label}

                    {item.label === "AI Assistant" && (
                      <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-700">
                        AI
                      </span>
                    )}
                  </button>
                );
              })}

            </div>
          </div>
        ))}

      </div>


      {/* AI CARD */}

      <div className="px-4 pb-4">

        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white">

          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Sparkles size={18} />
          </div>

          <p className="text-sm font-semibold">
            Your AI study partner
          </p>

          <p className="mt-1 text-[11px] leading-5 text-indigo-100">
            Understand difficult topics and learn at your own pace.
          </p>

          <button
            onClick={() => onNavigate("AI Assistant")}
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-white hover:text-indigo-100"
          >
            Explore AI Assistant
            <ArrowUpRight size={14} />
          </button>

        </div>


        {/* SUPPORT */}

        <div className="mt-4 space-y-1">

          <button
            onClick={() => onNavigate("Help & Support")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            <HelpCircle size={18} />
            Help & Support
          </button>

          <button
            onClick={() => onNavigate("Settings")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            <Settings size={18} />
            Settings
          </button>

        </div>


        {/* AUTHENTICATED USER PROFILE */}

        <button
          type="button"
          onClick={onOpenProfile}
          className="mt-4 flex w-full items-center gap-3 border-t border-slate-100 px-2 pt-4 text-left transition hover:bg-slate-50"
        >

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {avatarLetter}
          </div>

          <div className="min-w-0 flex-1">

            <p className="truncate text-xs font-semibold text-slate-800">
              {userName}
            </p>

            <p className="truncate text-[10px] text-slate-400">
              {userEmail || "University Student"}
            </p>

          </div>

          <ChevronDown
            size={16}
            className="text-slate-400"
          />

        </button>

      </div>

    </div>
  );
}


// ============================================
// MAIN APP
// ============================================

function App() {

  // ==========================================
  // AUTHENTICATION STATE
  // ==========================================

  const [authSession, setAuthSession] =
    useState<Session | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);


  // ==========================================
  // APPLICATION STATE
  // ==========================================

  const [activeNav, setActiveNav] =
    useState("Overview");

  const [search, setSearch] =
    useState("");

  const [mobileOpen, setMobileOpen] =
    useState(false);


  const [semesters, setSemesters] =
    useState<Semester[]>([]);

  const [semestersLoading, setSemestersLoading] =
    useState(true);

  const [semestersError, setSemestersError] =
    useState<string | null>(null);

  const [semesterReloadToken, setSemesterReloadToken] =
    useState(0);


  const [subjects, setSubjects] =
    useState<Subject[]>([]);

  const [subjectsLoading, setSubjectsLoading] =
    useState(true);

  const [subjectsError, setSubjectsError] =
    useState<string | null>(null);

  const [subjectReloadToken, setSubjectReloadToken] =
    useState(0);

  const previousSubjectsUserId =
    useRef<string | null>(null);


  const [chapters, setChapters] =
    useState<Chapter[]>([]);

  const [chaptersLoading, setChaptersLoading] =
    useState(true);

  const [chaptersError, setChaptersError] =
    useState<string | null>(null);

  const [chapterReloadToken, setChapterReloadToken] =
    useState(0);


  const [notes, setNotes] = useState<Note[]>([]);

  const [notesLoading, setNotesLoading] =
    useState(true);

  const [notesError, setNotesError] =
    useState<string | null>(null);

  const [notesReloadToken, setNotesReloadToken] =
    useState(0);

  const [noteSaveStatuses, setNoteSaveStatuses] =
    useState<Record<number, NoteSaveStatus>>({});

  const previousNotesUserId =
    useRef<string | null>(null);

  const notesRef = useRef<Note[]>([]);

  const noteSaveTimers =
    useRef<Map<number, number>>(new Map());

  const noteSaveQueues =
    useRef<Map<number, Promise<void>>>(new Map());

  const noteSaveVersions =
    useRef<Map<number, number>>(new Map());


  const [pdfDocuments, setPdfDocuments] =
    useState<PdfDocument[]>([]);

  const [tasks, setTasks] =
    useState<StudyTask[]>(initialTasks);


  const [selectedSubjectId, setSelectedSubjectId] =
    useState<number | null>(null);

  const [selectedChapterId, setSelectedChapterId] =
    useState<number | null>(null);

  // Remember which page opened the Notes editor.
  const [notesReturnNav, setNotesReturnNav] =
    useState<"Chapters" | "My Notebooks">("Chapters");


  // ==========================================
  // AUTHENTICATION LISTENER
  // ==========================================

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setAuthSession(session);
          setAuthLoading(false);
        }
      }
    );

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error(
            "Could not load authentication session:",
            error.message
          );
        }

        setAuthSession(data.session);
        setAuthLoading(false);
      })
      .catch((error: unknown) => {
        if (!mounted) return;

        console.error(
          "Authentication initialization failed:",
          error
        );

        setAuthLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  // ==========================================
  // LOAD SEMESTERS FOR SIGNED-IN USER
  // ==========================================

  useEffect(() => {
    let active = true;

    const userId = authSession?.user.id;

    if (!userId) {
      setSemesters([]);
      setSemestersLoading(false);
      setSemestersError(null);

      return () => {
        active = false;
      };
    }

    setSemestersLoading(true);
    setSemestersError(null);

    void getMySemesters()
      .then((records) => {
        if (!active) return;

        setSemesters(records);
      })
      .catch((error: unknown) => {
        if (!active) return;

        console.error("Unable to load semesters:", error);

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load your semesters.";

        setSemesters([]);
        setSemestersError(message);
      })
      .finally(() => {
        if (active) {
          setSemestersLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authSession?.user.id, semesterReloadToken]);


  // ==========================================
  // LOAD SUBJECTS FOR SIGNED-IN USER
  // ==========================================

  useEffect(() => {
    let active = true;

    const userId = authSession?.user.id ?? null;

    // Clear account-specific in-memory data when the user changes.
    if (previousSubjectsUserId.current !== userId) {
      previousSubjectsUserId.current = userId;

      setSubjects([]);
      setChapters([]);
      setSelectedSubjectId(null);
      setSelectedChapterId(null);
      setActiveNav("Overview");
    }

    setSubjectsError(null);

    if (!userId) {
      setSubjects([]);
      setSubjectsLoading(false);

      return () => {
        active = false;
      };
    }

    setSubjectsLoading(true);

    void getMySubjects()
      .then((records) => {
        if (!active) return;

        setSubjects(records);
      })
      .catch((error: unknown) => {
        if (!active) return;

        console.error("Unable to load subjects:", error);

        setSubjectsError(
          error instanceof Error
            ? error.message
            : "Unable to load your subjects."
        );
      })
      .finally(() => {
        if (active) {
          setSubjectsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authSession?.user.id, subjectReloadToken]);


  // ==========================================
  // LOAD CHAPTERS FOR SIGNED-IN USER
  // ==========================================

  useEffect(() => {
    let active = true;

    const userId = authSession?.user.id;

    if (!userId) {
      setChapters([]);
      setChaptersLoading(false);
      setChaptersError(null);

      return () => {
        active = false;
      };
    }

    setChaptersLoading(true);
    setChaptersError(null);

    void getMyChapters()
      .then((records) => {
        if (!active) return;

        setChapters(records);
      })
      .catch((error: unknown) => {
        if (!active) return;

        console.error("Unable to load chapters:", error);

        setChaptersError(
          error instanceof Error
            ? error.message
            : "Unable to load your chapters."
        );
      })
      .finally(() => {
        if (active) {
          setChaptersLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authSession?.user.id, chapterReloadToken]);


  // ==========================================
  // KEEP NOTES REF IN SYNC
  // ==========================================

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);


  // ==========================================
  // LOAD NOTES FROM SUPABASE
  // ==========================================

  useEffect(() => {
    let active = true;

    const userId = authSession?.user.id ?? null;

    // Clear account-specific note data when the signed-in user changes.
    if (previousNotesUserId.current !== userId) {
      previousNotesUserId.current = userId;

      for (const timer of noteSaveTimers.current.values()) {
        window.clearTimeout(timer);
      }

      noteSaveTimers.current.clear();
      noteSaveQueues.current.clear();
      noteSaveVersions.current.clear();

      notesRef.current = [];
      setNotes([]);
      setNoteSaveStatuses({});
    }

    if (!userId) {
      notesRef.current = [];
      setNotes([]);
      setNotesLoading(false);
      setNotesError(null);

      return () => {
        active = false;
      };
    }

    setNotesLoading(true);
    setNotesError(null);

    void getMyNotes()
      .then((records) => {
        if (!active) return;

        notesRef.current = records;
        setNotes(records);
      })
      .catch((error: unknown) => {
        if (!active) return;

        console.error("Unable to load notes:", error);

        notesRef.current = [];
        setNotes([]);
        setNotesError(
          error instanceof Error
            ? error.message
            : "Unable to load your notes."
        );
      })
      .finally(() => {
        if (active) {
          setNotesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authSession?.user.id, notesReloadToken]);


  // ==========================================
  // DERIVED DATA
  // ==========================================

  const currentSemester =
    semesters.find(
      (semester) => semester.isCurrent
    ) ?? null;

  const selectedSubject =
    subjects.find(
      (subject) => subject.id === selectedSubjectId
    ) ?? null;

  const selectedChapter =
    chapters.find(
      (chapter) => chapter.id === selectedChapterId
    ) ?? null;


  const selectedSubjectChapters = useMemo(
    () =>
      selectedSubject
        ? chapters
            .filter(
              (chapter) =>
                chapter.subjectId === selectedSubject.id
            )
            .sort(
              (a, b) => a.position - b.position
            )
        : [],
    [
      chapters,
      selectedSubject,
    ]
  );


  const selectedChapterNotes = useMemo(
    () =>
      selectedChapter
        ? notes.filter(
            (note) =>
              note.chapterId === selectedChapter.id
          )
        : [],
    [
      notes,
      selectedChapter,
    ]
  );


  const selectedChapterDocuments = useMemo(
    () =>
      selectedChapter
        ? pdfDocuments.filter(
            (document) =>
              document.chapterId === selectedChapter.id
          )
        : [],
    [
      pdfDocuments,
      selectedChapter,
    ]
  );


  const filteredSubjects = useMemo(
    () =>
      subjects.filter((subject) =>
        subject.name
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [
      subjects,
      search,
    ]
  );


  const completedTasks = tasks.filter(
    (task) => task.done
  ).length;


  // ==========================================
  // UPDATE SUBJECT PROGRESS
  // ==========================================

  function updateSubjectChapterStats(
    subjectId: number,
    allChapters: Chapter[]
  ) {
    const relatedChapters = allChapters.filter(
      (chapter) =>
        chapter.subjectId === subjectId
    );

    const total = relatedChapters.length;

    const completed = relatedChapters.filter(
      (chapter) => chapter.isCompleted
    ).length;

    const progress =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    setSubjects((current) =>
      current.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              chapters: total,
              completed,
              progress,
            }
          : subject
      )
    );

    void updateSubjectStatsInSupabase({
      id: subjectId,
      chapters: total,
      completed,
      progress,
    }).catch((error: unknown) => {
      console.error("Unable to save subject progress:", error);

      window.alert(
        "Your chapter changes were made locally, but the subject progress could not be saved to the cloud. Please check your connection and reload your subjects."
      );

      setSubjectReloadToken((current) => current + 1);
    });
  }


  // ==========================================
  // SEMESTER MANAGEMENT
  // ==========================================

  async function handleAddSemester(
    name: string,
    academicYear: string,
    startDate: string,
    endDate: string
  ) {
    try {
      const createdSemester = await createSemesterInSupabase({
        name,
        academicYear,
        startDate,
        endDate,
      });

      setSemesters((current) => [
        ...current.map((semester) => ({
          ...semester,
          isCurrent: createdSemester.isCurrent
            ? false
            : semester.isCurrent,
        })),
        createdSemester,
      ]);

      setSemestersError(null);
    } catch (error: unknown) {
      console.error("Unable to create semester:", error);

      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      window.alert(`Unable to create semester: ${message}`);
    }
  }


  async function handleDeleteSemester(id: number) {
    if (
      subjects.some(
        (subject) => subject.semesterId === id
      )
    ) {
      window.alert(
        "This semester still contains subjects. Delete or move those subjects first."
      );

      return;
    }

    try {
      await deleteSemesterFromSupabase(id);

      const updatedSemesters = await getMySemesters();

      setSemesters(updatedSemesters);
      setSemestersError(null);
    } catch (error: unknown) {
      console.error("Unable to delete semester:", error);

      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      window.alert(`Unable to delete semester: ${message}`);

      setSemesterReloadToken((current) => current + 1);
    }
  }


  async function handleSetCurrentSemester(id: number) {
    try {
      await setCurrentSemesterInSupabase(id);

      setSemesters((current) =>
        current.map((semester) => ({
          ...semester,
          isCurrent: semester.id === id,
        }))
      );

      setSemestersError(null);
    } catch (error: unknown) {
      console.error("Unable to update current semester:", error);

      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      window.alert(
        `Unable to change current semester: ${message}`
      );

      setSemesterReloadToken((current) => current + 1);
    }
  }


  // ==========================================
  // SUBJECT MANAGEMENT
  // ==========================================

  async function handleAddSubject(
    name: string,
    description: string
  ) {
    const semester =
      semesters.find(
        (item) => item.isCurrent
      ) ?? semesters[0];

    if (!semester) {
      window.alert(
        "Please create a semester first."
      );

      setActiveNav("My Semesters");

      return;
    }

    try {
      const newSubject = await createSubjectInSupabase({
        semesterId: semester.id,
        name,
        description,
      });

      setSubjects((current) => [
        ...current,
        newSubject,
      ]);

      setSubjectsError(null);
    } catch (error: unknown) {
      console.error("Unable to create subject:", error);

      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      window.alert(`Unable to create subject: ${message}`);
    }
  }


  async function handleDeleteSubject(id: number) {
    try {
      await deleteSubjectFromSupabase(id);
    } catch (error: unknown) {
      console.error("Unable to delete subject:", error);

      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      window.alert(`Unable to delete subject: ${message}`);

      setSubjectReloadToken((current) => current + 1);
      return;
    }

    const associatedChapterIds = chapters
      .filter(
        (chapter) => chapter.subjectId === id
      )
      .map(
        (chapter) => chapter.id
      );

    const documentsToDelete = pdfDocuments.filter(
      (document) =>
        associatedChapterIds.includes(document.chapterId)
    );

    documentsToDelete.forEach((document) =>
      URL.revokeObjectURL(document.url)
    );

    setPdfDocuments((current) =>
      current.filter(
        (document) =>
          !associatedChapterIds.includes(document.chapterId)
      )
    );

    removeNotesFromChapters(associatedChapterIds);

    setChapters((current) =>
      current.filter(
        (chapter) => chapter.subjectId !== id
      )
    );

    setSubjects((current) =>
      current.filter(
        (subject) => subject.id !== id
      )
    );

    if (selectedSubjectId === id) {
      setSelectedSubjectId(null);
      setSelectedChapterId(null);
      setActiveNav("My Subjects");
    }
  }


  function handleOpenSubject(subject: Subject) {
    setSelectedSubjectId(subject.id);
    setSelectedChapterId(null);
    setSearch("");
    setActiveNav("Chapters");
  }


  // ==========================================
  // CHAPTER MANAGEMENT
  // ==========================================

  async function handleAddChapter(
    subjectId: number,
    title: string,
    description: string
  ) {
    const subjectChapters = chapters.filter(
      (chapter) => chapter.subjectId === subjectId
    );

    const nextPosition =
      subjectChapters.length > 0
        ? Math.max(
            ...subjectChapters.map(
              (chapter) => chapter.position
            )
          ) + 1
        : 1;

    try {
      const newChapter = await createChapterInSupabase({
        subjectId,
        title,
        description,
        position: nextPosition,
      });

      const nextChapters = [...chapters, newChapter];

      setChapters(nextChapters);

      updateSubjectChapterStats(
        subjectId,
        nextChapters
      );
    } catch (error: unknown) {
      console.error("Unable to create chapter:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to create chapter."
      );
    }
  }


  // ==========================================
  // NOTEBOOK MANAGEMENT
  // ==========================================

  async function handleCreateNotebook(
    subjectId: number,
    title: string,
    description: string
  ): Promise<void> {
    const subject = subjects.find(
      (item) => item.id === subjectId
    );

    if (!subject) {
      throw new Error(
        "The selected subject could not be found."
      );
    }

    const subjectChapters = chapters.filter(
      (chapter) => chapter.subjectId === subjectId
    );

    const nextPosition =
      subjectChapters.length > 0
        ? Math.max(
            ...subjectChapters.map(
              (chapter) => chapter.position
            )
          ) + 1
        : 1;

    const newChapter = await createChapterInSupabase({
      subjectId,
      title,
      description,
      position: nextPosition,
    });

    const nextChapters = [...chapters, newChapter];

    setChapters(nextChapters);

    updateSubjectChapterStats(
      subjectId,
      nextChapters
    );
  }


  async function handleUpdateChapter(
    id: number,
    title: string,
    description: string
  ) {
    try {
      await updateChapterInSupabase(id, title, description);

      setChapters((current) =>
        current.map((chapter) =>
          chapter.id === id
            ? {
                ...chapter,
                title,
                description,
              }
            : chapter
        )
      );
    } catch (error: unknown) {
      console.error("Unable to update chapter:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to update chapter."
      );
    }
  }


  async function handleDeleteChapter(id: number) {
    const chapter = chapters.find(
      (item) => item.id === id
    );

    if (!chapter) return;

    try {
      await deleteChapterFromSupabase(id);
    } catch (error: unknown) {
      console.error("Unable to delete chapter:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to delete chapter."
      );

      return;
    }

    const documentsToDelete = pdfDocuments.filter(
      (document) => document.chapterId === id
    );

    documentsToDelete.forEach((document) =>
      URL.revokeObjectURL(document.url)
    );

    setPdfDocuments((current) =>
      current.filter(
        (document) => document.chapterId !== id
      )
    );

    removeNotesFromChapters([id]);

    const nextChapters = chapters.filter(
      (item) => item.id !== id
    );

    setChapters(nextChapters);

    updateSubjectChapterStats(
      chapter.subjectId,
      nextChapters
    );

    if (selectedChapterId === id) {
      setSelectedChapterId(null);
      setActiveNav("Chapters");
    }
  }


  async function handleToggleChapter(id: number) {
    const chapter = chapters.find(
      (item) => item.id === id
    );

    if (!chapter) return;

    const nextCompleted = !chapter.isCompleted;

    try {
      await updateChapterCompletionInSupabase(
        id,
        nextCompleted
      );

      const nextChapters = chapters.map((item) =>
        item.id === id
          ? {
              ...item,
              isCompleted: nextCompleted,
            }
          : item
      );

      setChapters(nextChapters);

      updateSubjectChapterStats(
        chapter.subjectId,
        nextChapters
      );
    } catch (error: unknown) {
      console.error("Unable to update chapter status:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to update chapter status."
      );
    }
  }


  function handleOpenNotes(chapter: Chapter) {
    setNotesReturnNav("Chapters");
    setSelectedChapterId(chapter.id);
    setActiveNav("Notes");
  }


  function handleOpenPdfs(chapter: Chapter) {
    setSelectedChapterId(chapter.id);
    setActiveNav("PDF Library");
  }


  // ==========================================
  // PDF DOCUMENT MANAGEMENT
  // ==========================================

  function handleAddPdfFiles(
    chapterId: number,
    files: File[]
  ) {
    const newDocuments: PdfDocument[] = files.map(
      (file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        chapterId,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(file),
      })
    );

    setPdfDocuments((current) => [
      ...current,
      ...newDocuments,
    ]);
  }


  function handleDeletePdfDocument(id: string) {
    const document = pdfDocuments.find(
      (item) => item.id === id
    );

    if (document) {
      URL.revokeObjectURL(document.url);
    }

    setPdfDocuments((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );
  }


  // ==========================================
  // NOTE MANAGEMENT
  // ==========================================

  // CREATE NOTE IN SUPABASE

  async function handleAddNote(chapterId: number): Promise<Note> {
    try {
      const newNote = await createNoteInSupabase(chapterId);

      const nextNotes = [newNote, ...notesRef.current];
      notesRef.current = nextNotes;
      setNotes(nextNotes);

      setNoteSaveStatuses((current) => ({
        ...current,
        [newNote.id]: "saved",
      }));

      return newNote;
    } catch (error) {
      console.error("Unable to create note:", error);
      throw error;
    }
  }


  // UPDATE NOTE WITH DEBOUNCED CLOUD AUTOSAVE

  function handleUpdateNote(
    id: number,
    updates: Partial<Pick<Note, "title" | "content">>
  ): void {
    const existingNote = notesRef.current.find(
      (note) => note.id === id
    );

    if (!existingNote) return;

    const updatedNote: Note = {
      ...existingNote,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const nextNotes = notesRef.current.map((note) =>
      note.id === id ? updatedNote : note
    );

    notesRef.current = nextNotes;
    setNotes(nextNotes);

    const version =
      (noteSaveVersions.current.get(id) ?? 0) + 1;

    noteSaveVersions.current.set(id, version);

    setNoteSaveStatuses((current) => ({
      ...current,
      [id]: "saving",
    }));

    const previousTimer = noteSaveTimers.current.get(id);

    if (previousTimer !== undefined) {
      window.clearTimeout(previousTimer);
    }

    const timer = window.setTimeout(() => {
      noteSaveTimers.current.delete(id);

      const previousSave =
        noteSaveQueues.current.get(id) ?? Promise.resolve();

      const savePromise = previousSave
        .catch(() => undefined)
        .then(() =>
          updateNoteInSupabase(id, {
            title: updatedNote.title,
            content: updatedNote.content,
          })
        );

      noteSaveQueues.current.set(id, savePromise);

      void savePromise
        .then(() => {
          if (noteSaveVersions.current.get(id) !== version) {
            return;
          }

          setNoteSaveStatuses((current) => ({
            ...current,
            [id]: "saved",
          }));
        })
        .catch((error: unknown) => {
          console.error("Unable to save note:", error);

          if (noteSaveVersions.current.get(id) !== version) {
            return;
          }

          setNoteSaveStatuses((current) => ({
            ...current,
            [id]: "error",
          }));
        });
    }, 700);

    noteSaveTimers.current.set(id, timer);
  }


  // KEEP LOCAL NOTE STATE CONSISTENT AFTER CHAPTER DELETION

  function removeNotesFromChapters(chapterIds: number[]): void {
    const chapterIdSet = new Set(chapterIds);

    const removedNotes = notesRef.current.filter((note) =>
      chapterIdSet.has(note.chapterId)
    );

    removedNotes.forEach((note) => {
      const timer = noteSaveTimers.current.get(note.id);

      if (timer !== undefined) {
        window.clearTimeout(timer);
      }

      noteSaveTimers.current.delete(note.id);
      noteSaveVersions.current.set(
        note.id,
        (noteSaveVersions.current.get(note.id) ?? 0) + 1
      );
    });

    const nextNotes = notesRef.current.filter(
      (note) => !chapterIdSet.has(note.chapterId)
    );

    notesRef.current = nextNotes;
    setNotes(nextNotes);

    setNoteSaveStatuses((current) => {
      const next = { ...current };

      removedNotes.forEach((note) => {
        delete next[note.id];
      });

      return next;
    });
  }


  // DELETE NOTE FROM SUPABASE

  async function handleDeleteNote(id: number): Promise<void> {
    const timer = noteSaveTimers.current.get(id);

    if (timer !== undefined) {
      window.clearTimeout(timer);
    }

    noteSaveTimers.current.delete(id);
    noteSaveVersions.current.set(
      id,
      (noteSaveVersions.current.get(id) ?? 0) + 1
    );

    try {
      const pendingSave = noteSaveQueues.current.get(id);

      if (pendingSave) {
        await pendingSave.catch(() => undefined);
      }

      await deleteNoteFromSupabase(id);

      const nextNotes = notesRef.current.filter(
        (note) => note.id !== id
      );

      notesRef.current = nextNotes;
      setNotes(nextNotes);

      setNoteSaveStatuses((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      noteSaveQueues.current.delete(id);
      noteSaveVersions.current.delete(id);
    } catch (error) {
      console.error("Unable to delete note:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to delete your note."
      );

      throw error;
    }
  }


  // ==========================================
  // TASK MANAGEMENT
  // ==========================================

  function toggleTask(id: number) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              done: !task.done,
            }
          : task
      )
    );
  }


  // ==========================================
  // AUTHENTICATION: SIGN OUT
  // ==========================================

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert(
        `Unable to sign out: ${error.message}`
      );
    }
  }


  // ==========================================
  // AUTHENTICATION LOADING SCREEN
  // ==========================================

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">

        <div className="flex flex-col items-center gap-3">

          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

          <p className="text-sm font-medium text-slate-500">
            Loading LearnSpace AI...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================
  // AUTHENTICATION GATE
  // ==========================================

  if (!authSession) {
    return <AuthPage />;
  }


  // ==========================================
  // AUTHENTICATED USER INFORMATION
  // ==========================================

  const authUserName =
    (
      authSession.user.user_metadata?.full_name as
        | string
        | undefined
    )?.trim() || "Student Account";

  const authUserEmail =
    authSession.user.email ?? "";


  // ==========================================
  // PAGE CONTROL
  // ==========================================

  const isOverview = activeNav === "Overview";


  // ==========================================
  // MAIN RETURN
  // ==========================================

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">

      {/* MOBILE OVERLAY */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}


      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] transform border-r border-slate-100 transition-transform duration-200 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <Sidebar
          active={activeNav}
          onNavigate={(label) => {
            setActiveNav(label);
            setSearch("");
          }}
          onClose={() => setMobileOpen(false)}
          onOpenProfile={() => {
            setActiveNav("My Profile");
            setMobileOpen(false);
          }}
          userName={authUserName}
          userEmail={authUserEmail}
        />
      </aside>


      {/* MAIN */}

      <main className="min-h-screen lg:pl-[260px]">


        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-100 bg-white/95 px-5 backdrop-blur-md sm:px-8">

          <div className="flex items-center gap-3">

            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div>

              <p className="text-[11px] text-slate-400">
                LEARNING WORKSPACE
              </p>

              <h2 className="text-sm font-semibold text-slate-800">
                {activeNav === "Chapters" && selectedSubject
                  ? selectedSubject.name
                  : activeNav === "Notes" && selectedChapter
                    ? selectedChapter.title
                    : activeNav === "PDF Library" && selectedChapter
                      ? selectedChapter.title
                      : activeNav}
              </h2>

            </div>

          </div>


          {/* HEADER ACTIONS */}

          <div className="flex items-center gap-2 sm:gap-4">

            <div className="relative hidden sm:block">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search your subjects..."
                className="h-10 w-56 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />

            </div>


            <button
              className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell size={19} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />

            </button>


            {/* SIGN OUT */}

            <button
              onClick={() => void handleSignOut()}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={19} />
            </button>


            <div className="hidden h-8 w-px bg-slate-200 sm:block" />


            {/* USER PROFILE */}

            <button
              onClick={() => setActiveNav("My Profile")}
              className="flex items-center gap-2"
              title={authUserEmail || "Student account"}
            >

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {authUserName.charAt(0).toUpperCase() || "S"}
              </div>

              <ChevronDown
                size={15}
                className="text-slate-400"
              />

            </button>

          </div>

        </header>


        {/* PAGE CONTENT */}

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">


          {/* DASHBOARD */}

          {isOverview ? (

            <>

              {/* WELCOME */}

              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

                <div>

                  <p className="mb-1 text-sm text-slate-500">
                    Your learning workspace
                  </p>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                    Welcome back, {authUserName} 👋
                  </h1>

                  <p className="mt-1.5 text-sm text-slate-500">
                    Ready to make today a productive learning day?
                  </p>

                  {currentSemester && (
                    <p className="mt-2 text-xs font-medium text-indigo-600">
                      Current semester: {currentSemester.name}
                    </p>
                  )}

                </div>


                <button
                  onClick={() => setActiveNav("My Notebooks")}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  New note
                </button>

              </div>


              {/* STATISTICS */}

              <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {[
                  {
                    label: "Study streak",
                    value: "6 days",
                    caption: "Keep your momentum",
                    icon: Flame,
                    color: "text-orange-600",
                    bg: "bg-orange-50",
                  },
                  {
                    label: "Study time",
                    value: "12.5 hrs",
                    caption: "This week's activity",
                    icon: Clock3,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    label: "Chapters completed",
                    value: `${chapters.filter((chapter) => chapter.isCompleted).length} / ${chapters.length}`,
                    caption: "Across all subjects",
                    icon: BookOpen,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                  },
                  {
                    label: "Average quiz score",
                    value: "86%",
                    caption: "Your practice results",
                    icon: Target,
                    color: "text-violet-600",
                    bg: "bg-violet-50",
                  },
                ].map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-100/60"
                    >

                      <div className="flex items-center justify-between">

                        <span className="text-xs font-medium text-slate-500">
                          {stat.label}
                        </span>

                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
                        >
                          <Icon size={18} />
                        </div>

                      </div>

                      <p className="mt-3 text-[26px] font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {stat.caption}
                      </p>

                    </div>
                  );
                })}

              </section>


              {/* LEARNING AND STUDY GOAL */}

              <section className="mb-7 grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]">


                {/* CONTINUE LEARNING */}

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-100/60 sm:p-6">

                  <div className="mb-5 flex items-center justify-between gap-3">

                    <div>

                      <h3 className="text-base font-bold text-slate-900">
                        Continue learning
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Pick up where you left off
                      </p>

                    </div>

                    <button
                      onClick={() => setActiveNav("My Subjects")}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View subjects
                    </button>

                  </div>


                  <div className="space-y-3">

                    {filteredSubjects.map((subject) => {
                      const Icon = subject.icon;

                      return (
                        <div
                          key={subject.id}
                          className="rounded-xl border border-slate-100 p-4 transition hover:border-indigo-100 hover:bg-slate-50/50"
                        >

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${subject.background} ${subject.color}`}
                            >
                              <Icon size={21} />
                            </div>

                            <div className="min-w-0 flex-1">

                              <h4 className="truncate text-sm font-semibold text-slate-800">
                                {subject.name}
                              </h4>

                              <p className="mt-1 truncate text-[11px] text-slate-400">
                                {subject.description}
                              </p>

                            </div>

                            <span className="text-xs font-bold text-slate-600">
                              {subject.progress}%
                            </span>

                          </div>


                          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-indigo-500 transition-all"
                              style={{
                                width: `${subject.progress}%`,
                              }}
                            />

                          </div>


                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">

                            <span>
                              {subject.completed} of {subject.chapters} chapters completed
                            </span>

                            <button
                              onClick={() =>
                                handleOpenSubject(subject)
                              }
                              className="font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              Open subject →
                            </button>

                          </div>

                        </div>
                      );
                    })}


                    {filteredSubjects.length === 0 && (
                      <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                        No subjects match your search.
                      </p>
                    )}

                  </div>

                </div>


                {/* STUDY GOAL */}

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-100/60 sm:p-6">

                  <div className="mb-5 flex items-center justify-between">

                    <div>

                      <h3 className="text-base font-bold text-slate-900">
                        Your study goal
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Weekly learning target
                      </p>

                    </div>

                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                      <Target size={18} />
                    </div>

                  </div>


                  <div className="flex flex-col items-center py-5">

                    <div
                      className="relative flex h-36 w-36 items-center justify-center rounded-full"
                      style={{
                        background:
                          "conic-gradient(#6366f1 0deg 230deg, #eef0f7 230deg 360deg)",
                      }}
                    >

                      <div className="flex h-[116px] w-[116px] flex-col items-center justify-center rounded-full bg-white">

                        <span className="text-3xl font-bold text-slate-900">
                          64%
                        </span>

                        <span className="text-[10px] text-slate-400">
                          Completed
                        </span>

                      </div>

                    </div>


                    <p className="mt-4 text-sm font-semibold text-slate-800">
                      Great progress!
                    </p>

                    <p className="mt-1 text-center text-xs leading-5 text-slate-400">
                      You've studied 6.4 of your 10 weekly target hours.
                    </p>

                  </div>


                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">

                    <span className="text-slate-500">
                      Weekly target
                    </span>

                    <span className="font-bold text-slate-800">
                      10 hours
                    </span>

                  </div>

                </div>

              </section>


              {/* TASKS AND LEARNING TIP */}

              <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">


                {/* UPCOMING TASKS */}

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-100/60 sm:p-6">

                  <div className="mb-5 flex items-center justify-between">

                    <div>

                      <h3 className="text-base font-bold text-slate-900">
                        Upcoming tasks
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Keep track of your academic work
                      </p>

                    </div>

                    <button
                      onClick={() => setActiveNav("Study Planner")}
                      className="text-xs font-semibold text-indigo-600"
                    >
                      View planner
                    </button>

                  </div>


                  <div className="space-y-2">

                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                      >

                        <button
                          onClick={() => toggleTask(task.id)}
                          aria-label={
                            task.done
                              ? "Mark task incomplete"
                              : "Complete task"
                          }
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                            task.done
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 text-transparent hover:border-indigo-500"
                          }`}
                        >
                          <CheckCircle2 size={15} />
                        </button>


                        <div className="min-w-0 flex-1">

                          <p
                            className={`truncate text-xs font-semibold ${
                              task.done
                                ? "text-slate-400 line-through"
                                : "text-slate-800"
                            }`}
                          >
                            {task.title}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {task.subject}
                          </p>

                        </div>


                        <span className="shrink-0 text-[10px] text-slate-400">
                          {task.done ? "Completed" : task.due}
                        </span>

                      </div>
                    ))}

                  </div>


                  <p className="mt-4 text-[11px] text-slate-400">
                    {completedTasks} of {tasks.length} tasks completed
                  </p>

                </div>


                {/* LEARNING TIP */}

                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 sm:p-6">

                  <div className="mb-4 flex items-center justify-between">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                      <Sparkles size={20} />
                    </div>

                    <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold text-indigo-600">
                      LEARNING TIP
                    </span>

                  </div>


                  <h3 className="text-lg font-bold text-slate-900">
                    Learn smarter, not just longer.
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    Try active recall. After studying a chapter, close
                    your notes and explain the main concepts in your own
                    words. Then use flashcards to check what you remember.
                  </p>

                  <button
                    onClick={() => setActiveNav("Flashcards")}
                    className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Practice flashcards
                    <ArrowUpRight size={15} />
                  </button>

                </div>

              </section>

            </>


          ) : activeNav === "My Semesters" ? (

            semestersLoading ? (

              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                  <p className="text-sm font-medium text-slate-500">
                    Loading your semesters...
                  </p>
                </div>
              </div>

            ) : semestersError ? (

              <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
                <h2 className="text-base font-bold text-slate-800">
                  We couldn't load your semesters.
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {semestersError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSemesterReloadToken((current) => current + 1)
                  }
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Try again
                </button>
              </div>

            ) : (

              <SemestersPage
                semesters={semesters}
                subjects={subjects}
                onAddSemester={handleAddSemester}
                onDeleteSemester={handleDeleteSemester}
                onSetCurrentSemester={handleSetCurrentSemester}
              />

            )


          ) : activeNav === "My Notebooks" ? (

            <Suspense
              fallback={
                <div className="flex min-h-[400px] items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

                    <p className="text-sm font-medium text-slate-500">
                      Loading your notebooks...
                    </p>
                  </div>
                </div>
              }
            >
              <MyNotebooksPage
                subjects={subjects}
                chapters={chapters}
                notes={notes}
                isLoading={
                  subjectsLoading ||
                  chaptersLoading ||
                  notesLoading
                }
                loadError={
                  subjectsError ||
                  chaptersError ||
                  notesError
                }
                onRetryLoad={() => {
                  setSubjectReloadToken((current) => current + 1);
                  setChapterReloadToken((current) => current + 1);
                  setNotesReloadToken((current) => current + 1);
                }}
                onOpenNotebook={(chapter) => {
                  setNotesReturnNav("My Notebooks");
                  setSelectedSubjectId(chapter.subjectId);
                  setSelectedChapterId(chapter.id);
                  setActiveNav("Notes");
                }}
                onCreateNotebook={handleCreateNotebook}
              />
            </Suspense>


          ) : activeNav === "My Subjects" ? (

            (semestersLoading || subjectsLoading) ? (

              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                  <p className="text-sm font-medium text-slate-500">
                    Loading your subjects...
                  </p>
                </div>
              </div>

            ) : (subjectsError || semestersError) ? (

              <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
                <h2 className="text-base font-bold text-slate-800">
                  We couldn't load your learning data.
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {subjectsError || semestersError}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSubjectReloadToken((current) => current + 1);
                    setSemesterReloadToken((current) => current + 1);
                  }}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Try again
                </button>
              </div>

            ) : (

              <SubjectsPage
                subjects={subjects}
                semesters={semesters}
                currentSemesterName={
                  currentSemester?.name ?? null
                }
                onAddSubject={handleAddSubject}
                onDeleteSubject={handleDeleteSubject}
                onOpenSubject={handleOpenSubject}
              />

            )


          ) : activeNav === "Chapters" && selectedSubject ? (

            chaptersLoading ? (

              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                  <p className="text-sm font-medium text-slate-500">
                    Loading your chapters...
                  </p>
                </div>
              </div>

            ) : chaptersError ? (

              <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
                <h2 className="text-base font-bold text-slate-800">
                  We couldn't load your chapters.
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {chaptersError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setChapterReloadToken((current) => current + 1)
                  }
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Try again
                </button>
              </div>

            ) : (

              <ChaptersPage
                subject={selectedSubject}
                chapters={selectedSubjectChapters}
                onBack={() => {
                  setActiveNav("My Subjects");
                  setSelectedSubjectId(null);
                  setSelectedChapterId(null);
                }}
                onAddChapter={(title, description) =>
                  handleAddChapter(
                    selectedSubject.id,
                    title,
                    description
                  )
                }
                onUpdateChapter={handleUpdateChapter}
                onDeleteChapter={handleDeleteChapter}
                onToggleChapter={handleToggleChapter}
                onOpenNotes={handleOpenNotes}
                onOpenPdfs={handleOpenPdfs}
              />

            )


          ) : activeNav === "PDF Library" && selectedChapter ? (

            <PdfLibraryPage
              key={selectedChapter.id}
              chapter={selectedChapter}
              documents={selectedChapterDocuments}
              onBack={() => setActiveNav("Chapters")}
              onUploadFiles={(files) =>
                handleAddPdfFiles(
                  selectedChapter.id,
                  files
                )
              }
              onDeleteDocument={handleDeletePdfDocument}
            />


          ) : activeNav === "Notes" && selectedChapter ? (

            <Suspense
              fallback={
                <div className="flex min-h-[400px] items-center justify-center text-sm text-slate-500">
                  Loading notes editor...
                </div>
              }
            >
              <NotesPage
                chapter={selectedChapter}
                notes={selectedChapterNotes}
                onBack={() => setActiveNav(notesReturnNav)}
                onAddNote={() =>
                  handleAddNote(selectedChapter.id)
                }
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                isLoading={notesLoading}
                loadError={notesError}
                onRetryLoad={() =>
                  setNotesReloadToken((current) => current + 1)
                }
                saveStatuses={noteSaveStatuses}
              />
            </Suspense>


          ) : activeNav === "AI Assistant" ? (

            <AssistantPage
              chapters={chapters}
              subjects={subjects}
              initialChapterId={selectedChapterId}
              onOpenPdfLibrary={(chapterId) => {
                setSelectedChapterId(chapterId);
                setActiveNav("PDF Library");
              }}
            />


          ) : activeNav === "Flashcards" ? (

            <FlashcardsPage
              chapters={chapters}
              subjects={subjects}
              initialChapterId={selectedChapterId}
              onOpenPdfLibrary={(chapterId) => {
                setSelectedChapterId(chapterId);
                setActiveNav("PDF Library");
              }}
            />


          ) : activeNav === "Study Planner" ? (

            <StudyPlannerPage
              subjects={subjects}
            />


          ) : activeNav === "Analytics" ? (

            <AnalyticsPage
              subjects={subjects}
              chapters={chapters}
              notes={notes}
            />


          ) : activeNav === "My Profile" ? (

            <ProfilePage />

          ) : activeNav === "Quizzes" ? (

            <QuizzesPage
              chapters={chapters}
              subjects={subjects}
              initialChapterId={selectedChapterId}
              onOpenPdfLibrary={(chapterId) => {
                setSelectedChapterId(chapterId);
                setActiveNav("PDF Library");
              }}
            />


          ) : (

            <section className="flex min-h-[450px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 text-center shadow-sm">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">

                {activeNav === "AI Assistant" ? (
                  <Sparkles size={25} />
                ) : (
                  <FileText size={25} />
                )}

              </div>


              <h1 className="text-xl font-bold text-slate-900">
                {activeNav}
              </h1>


              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                This section is part of the LearnSpace AI roadmap.
                We'll build it step by step and connect it to your
                learning workspace.
              </p>


              <button
                onClick={() => setActiveNav("Overview")}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Return to dashboard
              </button>

            </section>

          )}


          {/* FOOTER */}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] text-slate-400">

            <span>
              © 2026 LearnSpace AI. Your intelligent learning space.
            </span>

            <span>
              Built for better learning.
            </span>

          </footer>

        </div>

      </main>

    </div>
  );
}

export default App;
