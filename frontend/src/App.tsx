
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
  ArrowUpRight,
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
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import HelpSupportPage from "./pages/HelpSupportPage";

const NotesPage = lazy(
  () => import("./pages/NotesPage.tsx")
);

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
// NOTE SAVE STATUS
// ============================================

type NoteSaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error";


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
    <div className="flex h-full flex-col bg-[#263653] text-white">

      {/* BRAND */}

      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#526B91] text-white">
            <GraduationCap size={20} />
          </div>

          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-white">
              LearnSpace <span className="text-[#B6C3D8]">AI</span>
            </h1>

            <p className="mt-0.5 text-[9px] font-medium tracking-[0.12em] text-[#AEB9C9]">
              YOUR SMART LEARNING SPACE
            </p>
          </div>

        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#C4CCD8] transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}

      </div>


      {/* NAVIGATION */}

      <div className="flex-1 overflow-y-auto px-3 py-5">

        {navigation.map((group) => (
          <div className="mb-6" key={group.heading}>

            <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.15em] text-[#8998AF]">
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
                    type="button"
                    onClick={() => {
                      onNavigate(item.label);
                      onClose?.();
                    }}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] font-medium transition ${
                      selected
                        ? "bg-[#526B91] text-white shadow-sm"
                        : "text-[#C4CCD8] hover:bg-white/10 hover:text-white"
                    }`}
                  >

                    <Icon
                      size={16}
                      strokeWidth={selected ? 2.2 : 1.8}
                      className={
                        selected
                          ? "text-white"
                          : "text-[#AEB9C9] group-hover:text-white"
                      }
                    />

                    <span className="flex-1">
                      {item.label}
                    </span>

                    {item.label === "AI Assistant" && (
                      <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold bg-[#756185] text-white">
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


      {/* SIDEBAR BOTTOM AREA */}

      <div className="shrink-0 space-y-3 border-t border-white/10 px-3 pb-4 pt-3">

        {/* COMPACT AI ASSISTANT SHORTCUT */}

        <button
          type="button"
          onClick={() => {
            onNavigate("AI Assistant");
            onClose?.();
          }}
          className="group flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-[#344766] px-2.5 py-2.5 text-left transition hover:border-[#8399BC]/50 hover:bg-[#3B506F]"
        >

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#756185] text-white">
            <Sparkles size={15} />
          </div>

          <div className="min-w-0 flex-1">

            <p className="text-[11px] font-semibold text-white">
              AI study partner
            </p>

            <p className="mt-0.5 truncate text-[9px] text-[#BFC9D8]">
              Ask about your courses
            </p>

          </div>

          <ArrowUpRight
            size={14}
            className="shrink-0 text-[#BFC9D8] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />

        </button>


        {/* SUPPORT LINKS */}

        <div className="space-y-0.5">

          <button
            type="button"
            onClick={() => {
              onNavigate("Help & Support");
              onClose?.();
            }}
            aria-current={active === "Help & Support" ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[11px] font-medium transition ${
              active === "Help & Support"
                ? "bg-white/10 text-white"
                : "text-[#BEC6D3] hover:bg-white/10 hover:text-white"
            }`}
          >
            <HelpCircle size={15} />
            Help & Support
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate("Settings");
              onClose?.();
            }}
            aria-current={active === "Settings" ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[11px] font-medium transition ${
              active === "Settings"
                ? "bg-white/10 text-white"
                : "text-[#BEC6D3] hover:bg-white/10 hover:text-white"
            }`}
          >
            <Settings size={15} />
            Settings
          </button>

        </div>


        {/* USER PROFILE */}

        <button
          type="button"
          onClick={() => {
            onOpenProfile();
            onClose?.();
          }}
          className="flex w-full items-center gap-2.5 border-t border-white/10 px-2 pt-3 text-left transition hover:bg-white/5"
        >

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#526B91] text-xs font-semibold text-white">
            {avatarLetter}
          </div>

          <div className="min-w-0 flex-1">

            <p className="truncate text-[11px] font-semibold text-white">
              {userName}
            </p>

            <p className="mt-0.5 truncate text-[9px] text-[#AEB9C9]">
              {userEmail || "University Student"}
            </p>

          </div>

          <ChevronDown
            size={14}
            className="shrink-0 text-[#AEB9C9]"
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


  const [selectedSubjectId, setSelectedSubjectId] =
    useState<number | null>(null);

  const [selectedChapterId, setSelectedChapterId] =
    useState<number | null>(null);

  const [notesReturnNav, setNotesReturnNav] =
    useState<
      "Chapters" | "My Notebooks" | "Overview"
    >("Chapters");


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
  // LOAD SEMESTERS
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
  // LOAD SUBJECTS
  // ==========================================

  useEffect(() => {
    let active = true;

    const userId = authSession?.user.id ?? null;

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
  // LOAD CHAPTERS
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
  // LOAD NOTES
  // ==========================================

  useEffect(() => {
    let active = true;

    const userId = authSession?.user.id ?? null;

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
    [chapters, selectedSubject]
  );


  const selectedChapterNotes = useMemo(
    () =>
      selectedChapter
        ? notes.filter(
            (note) =>
              note.chapterId === selectedChapter.id
          )
        : [],
    [notes, selectedChapter]
  );


  const selectedChapterDocuments = useMemo(
    () =>
      selectedChapter
        ? pdfDocuments.filter(
            (document) =>
              document.chapterId === selectedChapter.id
          )
        : [],
    [pdfDocuments, selectedChapter]
  );


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
  // AUTHENTICATION LOADING
  // ==========================================

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F1ED]">

        <div className="flex flex-col items-center gap-3">

          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#DCE4EF] border-t-[#526B91]" />

          <p className="text-xs font-medium text-[#777C87]">
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
    <div className="min-h-screen bg-[#F3F1ED] text-[#252D3D]">

      {/* MOBILE OVERLAY */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}


      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[250px] transform border-r border-white/10 transition-transform duration-300 ${
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


      {/* MAIN CONTENT */}

      <main className="min-h-screen lg:pl-[250px]">


        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E2DED8] bg-[#FDFCFA]/95 px-5 backdrop-blur-md sm:px-8">

          <div className="flex min-w-0 items-center gap-3">

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-[#526B91] transition hover:bg-[#E8EDF4] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">

              <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#92939C]">
                LEARNING WORKSPACE
              </p>

              <h2 className="truncate text-sm font-semibold text-[#263653]">
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

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            <div className="relative hidden sm:block">

              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92939C]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search subjects..."
                className="h-9 w-48 rounded-lg border border-[#E2DED8] bg-[#F5F3F0] pl-9 pr-3 text-[11px] text-[#252D3D] outline-none transition focus:border-[#526B91] focus:bg-white focus:ring-2 focus:ring-[#526B91]/10 sm:w-56"
              />

            </div>


            <button
              type="button"
              className="relative rounded-lg p-2 text-[#777C87] transition hover:bg-[#F0EEEB] hover:text-[#263653]"
              aria-label="Notifications"
            >
              <Bell size={17} />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#756185]" />

            </button>


            {/* SIGN OUT */}

            <button
              type="button"
              onClick={() => void handleSignOut()}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-lg p-2 text-[#777C87] transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={17} />
            </button>


            <div className="hidden h-7 w-px bg-[#E2DED8] sm:block" />


            {/* USER PROFILE */}

            <button
              type="button"
              onClick={() => setActiveNav("My Profile")}
              className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-[#F0EEEB]"
              title={authUserEmail || "Student account"}
            >

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8EDF4] text-[11px] font-bold text-[#263653]">
                {authUserName.charAt(0).toUpperCase() || "S"}
              </div>

              <ChevronDown
                size={14}
                className="text-[#92939C]"
              />

            </button>

          </div>

        </header>


        {/* =====================================
            PAGE CONTENT
        ====================================== */}

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">


          {/* OVERVIEW */}

          {isOverview ? (

            <DashboardPage
              userName={authUserName}
              currentSemesterName={
                currentSemester?.name ?? null
              }
              subjects={subjects}
              chapters={chapters}
              notes={notes}
              search={search}
              isLoading={
                subjectsLoading ||
                chaptersLoading ||
                notesLoading
              }
              onNavigate={(page) => {
                setActiveNav(page);
                setSearch("");
              }}
              onOpenSubject={handleOpenSubject}
              onOpenNote={(chapter) => {
                setNotesReturnNav("Overview");
                setSelectedSubjectId(chapter.subjectId);
                setSelectedChapterId(chapter.id);
                setActiveNav("Notes");
              }}
            />


          ) : activeNav === "My Semesters" ? (

            semestersLoading ? (

              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#DCE4EF] border-t-[#526B91]" />
                  <p className="text-xs font-medium text-[#777C87]">
                    Loading your semesters...
                  </p>
                </div>
              </div>

            ) : semestersError ? (

              <div className="rounded-xl border border-rose-100 bg-white p-8 text-center shadow-sm">

                <h2 className="text-sm font-bold text-[#263653]">
                  We couldn't load your semesters.
                </h2>

                <p className="mt-2 text-xs text-[#777C87]">
                  {semestersError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSemesterReloadToken((current) => current + 1)
                  }
                  className="mt-5 rounded-lg bg-[#263653] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1E2A41]"
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
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#DCE4EF] border-t-[#526B91]" />

                    <p className="text-xs font-medium text-[#777C87]">
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
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#DCE4EF] border-t-[#526B91]" />

                  <p className="text-xs font-medium text-[#777C87]">
                    Loading your subjects...
                  </p>
                </div>
              </div>

            ) : (subjectsError || semestersError) ? (

              <div className="rounded-xl border border-rose-100 bg-white p-8 text-center shadow-sm">

                <h2 className="text-sm font-bold text-[#263653]">
                  We couldn't load your learning data.
                </h2>

                <p className="mt-2 text-xs text-[#777C87]">
                  {subjectsError || semestersError}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSubjectReloadToken((current) => current + 1);
                    setSemesterReloadToken((current) => current + 1);
                  }}
                  className="mt-5 rounded-lg bg-[#263653] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1E2A41]"
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
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#DCE4EF] border-t-[#526B91]" />

                  <p className="text-xs font-medium text-[#777C87]">
                    Loading your chapters...
                  </p>
                </div>
              </div>

            ) : chaptersError ? (

              <div className="rounded-xl border border-rose-100 bg-white p-8 text-center shadow-sm">

                <h2 className="text-sm font-bold text-[#263653]">
                  We couldn't load your chapters.
                </h2>

                <p className="mt-2 text-xs text-[#777C87]">
                  {chaptersError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setChapterReloadToken((current) => current + 1)
                  }
                  className="mt-5 rounded-lg bg-[#263653] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1E2A41]"
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
                <div className="flex min-h-[400px] items-center justify-center text-xs text-[#777C87]">
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


          ) : activeNav === "Settings" ? (

            <SettingsPage
              onNavigate={(page) => {
                setActiveNav(page);
                setSearch("");
              }}
            />


          ) : activeNav === "Help & Support" ? (

            <HelpSupportPage
              onNavigate={(page) => {
                setActiveNav(page);
                setSearch("");
              }}
            />


          ) : (

            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-[#E2DED8] bg-[#FDFCFA] px-6 text-center">

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EDF4] text-[#526B91]">

                <FileText size={22} />

              </div>

              <h1 className="text-lg font-semibold text-[#263653]">
                {activeNav}
              </h1>

              <p className="mt-2 max-w-md text-xs leading-6 text-[#777C87]">
                This section is part of the LearnSpace AI roadmap.
                We'll build it step by step and connect it to your
                learning workspace.
              </p>

              <button
                type="button"
                onClick={() => setActiveNav("Overview")}
                className="mt-5 rounded-lg bg-[#263653] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1E2A41]"
              >
                Return to dashboard
              </button>

            </section>

          )}


          {/* FOOTER */}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2DED8] pt-5 text-[9px] text-[#92939C]">

            <span>
              © 2026 LearnSpace AI
            </span>

            <span>
              Your academic workspace
            </span>

          </footer>

        </div>

      </main>

    </div>
  );
}

export default App;
