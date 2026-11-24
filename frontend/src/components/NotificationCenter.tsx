
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  FileText,
  Inbox,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type NotificationType =
  | "semester"
  | "subject"
  | "notebook"
  | "note"
  | "completion"
  | "pdf";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionPage?: string;
}

interface SemesterItem {
  id: number;
  name: string;
}

interface SubjectItem {
  id: number;
  name: string;
}

interface ChapterItem {
  id: number;
  title: string;
  isCompleted: boolean;
}

interface NoteItem {
  id: number;
  title: string;
}

interface PdfItem {
  id: string;
  name: string;
}

interface NotificationCenterProps {
  userId: string;
  ready: boolean;
  semesters: SemesterItem[];
  subjects: SubjectItem[];
  chapters: ChapterItem[];
  notes: NoteItem[];
  pdfDocuments: PdfItem[];
  onNavigate: (page: string) => void;
}

interface ActivitySnapshot {
  semesters: Map<string, string>;
  subjects: Map<string, string>;
  chapters: Map<string, ChapterItem>;
  notes: Map<string, string>;
  pdfs: Map<string, string>;
}

const MAX_NOTIFICATIONS = 50;
const STORAGE_PREFIX = "learnspace-ai-notifications-v1";

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function isNotificationType(
  value: unknown
): value is NotificationType {
  return [
    "semester",
    "subject",
    "notebook",
    "note",
    "completion",
    "pdf",
  ].includes(String(value));
}

function isNotificationItem(
  value: unknown
): value is NotificationItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    isNotificationType(item.type) &&
    typeof item.title === "string" &&
    typeof item.message === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.read === "boolean" &&
    (
      item.actionPage === undefined ||
      typeof item.actionPage === "string"
    )
  );
}

function readNotifications(userId: string): NotificationItem[] {
  try {
    const raw = window.localStorage.getItem(
      getStorageKey(userId)
    );

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
          .filter(isNotificationItem)
          .slice(0, MAX_NOTIFICATIONS)
      : [];
  } catch {
    return [];
  }
}

function writeNotifications(
  userId: string,
  items: NotificationItem[]
): boolean {
  try {
    window.localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify(items.slice(0, MAX_NOTIFICATIONS))
    );

    return true;
  } catch (error) {
    console.error("Unable to save notifications:", error);
    return false;
  }
}

function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  actionPage: string
): NotificationItem {
  const randomId =
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 12);

  return {
    id: `${Date.now()}-${randomId}`,
    type,
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false,
    actionPage,
  };
}

function buildSnapshot(
  semesters: SemesterItem[],
  subjects: SubjectItem[],
  chapters: ChapterItem[],
  notes: NoteItem[],
  pdfDocuments: PdfItem[]
): ActivitySnapshot {
  return {
    semesters: new Map(
      semesters.map((item) => [
        String(item.id),
        item.name,
      ])
    ),

    subjects: new Map(
      subjects.map((item) => [
        String(item.id),
        item.name,
      ])
    ),

    chapters: new Map(
      chapters.map((item) => [
        String(item.id),
        {
          id: item.id,
          title: item.title,
          isCompleted: item.isCompleted,
        },
      ])
    ),

    notes: new Map(
      notes.map((item) => [
        String(item.id),
        item.title?.trim() || "Untitled note",
      ])
    ),

    pdfs: new Map(
      pdfDocuments.map((item) => [
        String(item.id),
        item.name,
      ])
    ),
  };
}

function getRelativeTime(dateString: string): string {
  const timestamp = new Date(dateString).getTime();

  if (Number.isNaN(timestamp)) {
    return "Recently";
  }

  const elapsed = Math.max(
    0,
    Date.now() - timestamp
  );

  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return new Date(dateString).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function NotificationIcon({
  type,
}: {
  type: NotificationType;
}) {
  const common = "h-[17px] w-[17px]";

  switch (type) {
    case "semester":
      return (
        <CalendarDays
          className={`${common} text-green-700`}
        />
      );

    case "subject":
      return (
        <BookOpen
          className={`${common} text-blue-700`}
        />
      );

    case "notebook":
      return (
        <FileText
          className={`${common} text-green-700`}
        />
      );

    case "note":
      return (
        <FileText
          className={`${common} text-blue-700`}
        />
      );

    case "completion":
      return (
        <CircleCheck
          className={`${common} text-green-700`}
        />
      );

    case "pdf":
      return (
        <Sparkles
          className={`${common} text-violet-700`}
        />
      );

    default:
      return (
        <Bell
          className={`${common} text-slate-500`}
        />
      );
  }
}

export default function NotificationCenter({
  userId,
  ready,
  semesters,
  subjects,
  chapters,
  notes,
  pdfDocuments,
  onNavigate,
}: NotificationCenterProps) {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [isOpen, setIsOpen] = useState(false);

  const [storageWarning, setStorageWarning] =
    useState(false);

  const [hydratedUserId, setHydratedUserId] =
    useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const previousSnapshotRef = useRef<{
    userId: string;
    snapshot: ActivitySnapshot;
  } | null>(null);


  // ==========================================
  // LOAD ACCOUNT NOTIFICATIONS
  // ==========================================

  useEffect(() => {
    setIsOpen(false);
    setStorageWarning(false);

    setNotifications(readNotifications(userId));
    setHydratedUserId(userId);

    // Existing records become the initial baseline.
    previousSnapshotRef.current = null;
  }, [userId]);


  // ==========================================
  // SAVE NOTIFICATIONS
  // ==========================================

  useEffect(() => {
    if (!userId || hydratedUserId !== userId) {
      return;
    }

    const saved = writeNotifications(
      userId,
      notifications
    );

    setStorageWarning(!saved);
  }, [
    notifications,
    userId,
    hydratedUserId,
  ]);


  // ==========================================
  // SYNC BETWEEN BROWSER TABS
  // ==========================================

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== getStorageKey(userId)) {
        return;
      }

      if (!event.newValue) {
        setNotifications([]);
        return;
      }

      try {
        const parsed: unknown = JSON.parse(
          event.newValue
        );

        setNotifications(
          Array.isArray(parsed)
            ? parsed
                .filter(isNotificationItem)
                .slice(0, MAX_NOTIFICATIONS)
            : []
        );
      } catch {
        setNotifications([]);
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [userId]);


  // ==========================================
  // DETECT STUDENT ACTIVITY
  // ==========================================

  useEffect(() => {
    if (!userId || !ready) {
      previousSnapshotRef.current = null;
      return;
    }

    const current = buildSnapshot(
      semesters,
      subjects,
      chapters,
      notes,
      pdfDocuments
    );

    const previous = previousSnapshotRef.current;

    // The first successful load is the baseline.
    // Existing records do not create false notifications.

    if (!previous || previous.userId !== userId) {
      previousSnapshotRef.current = {
        userId,
        snapshot: current,
      };

      return;
    }

    const oldSnapshot = previous.snapshot;

    const newNotifications: NotificationItem[] = [];


    // NEW SEMESTERS

    for (const [id, name] of current.semesters) {
      if (!oldSnapshot.semesters.has(id)) {
        newNotifications.push(
          createNotification(
            "semester",
            "Semester created",
            `${name} has been added to your academic workspace.`,
            "My Semesters"
          )
        );
      }
    }


    // NEW SUBJECTS

    for (const [id, name] of current.subjects) {
      if (!oldSnapshot.subjects.has(id)) {
        newNotifications.push(
          createNotification(
            "subject",
            "New subject added",
            `${name} is now part of your learning workspace.`,
            "My Subjects"
          )
        );
      }
    }


    // NEW NOTEBOOKS / CHAPTERS

    for (const [id, chapter] of current.chapters) {
      if (!oldSnapshot.chapters.has(id)) {
        newNotifications.push(
          createNotification(
            "notebook",
            "Notebook created",
            `${chapter.title} has been added to your workspace.`,
            "My Notebooks"
          )
        );
      }
    }


    // COMPLETED CHAPTERS

    for (const [id, chapter] of current.chapters) {
      const oldChapter =
        oldSnapshot.chapters.get(id);

      if (
        oldChapter &&
        !oldChapter.isCompleted &&
        chapter.isCompleted
      ) {
        newNotifications.push(
          createNotification(
            "completion",
            "Chapter completed",
            `Great work! You completed ${chapter.title}.`,
            "My Notebooks"
          )
        );
      }
    }


    // NEW NOTES

    for (const [id, title] of current.notes) {
      if (!oldSnapshot.notes.has(id)) {
        newNotifications.push(
          createNotification(
            "note",
            "New note created",
            `${title} has been added to your notes.`,
            "My Notebooks"
          )
        );
      }
    }


    // NEW PDF DOCUMENTS

    for (const [id, name] of current.pdfs) {
      if (!oldSnapshot.pdfs.has(id)) {
        newNotifications.push(
          createNotification(
            "pdf",
            "PDF added",
            `${name} has been added to your current PDF workspace.`,
            "My Subjects"
          )
        );
      }
    }


    // UPDATE SNAPSHOT

    previousSnapshotRef.current = {
      userId,
      snapshot: current,
    };


    if (newNotifications.length > 0) {
      setNotifications((currentNotifications) =>
        [
          ...newNotifications.reverse(),
          ...currentNotifications,
        ].slice(0, MAX_NOTIFICATIONS)
      );
    }
  }, [
    userId,
    ready,
    semesters,
    subjects,
    chapters,
    notes,
    pdfDocuments,
  ]);


  // ==========================================
  // CLOSE ON OUTSIDE CLICK / ESCAPE
  // ==========================================

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen]);


  // ==========================================
  // NOTIFICATION ACTIONS
  // ==========================================

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  function markAsRead(id: string) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, read: true }
          : item
      )
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      }))
    );
  }

  function clearAll() {
    setNotifications([]);
  }

  function handleNotificationClick(
    item: NotificationItem
  ) {
    markAsRead(item.id);
    setIsOpen(false);

    if (item.actionPage) {
      onNavigate(item.actionPage);
    }
  }


  // ==========================================
  // NOTIFICATION UI
  // ==========================================

  return (
    <div
      ref={containerRef}
      className="relative"
    >

      {/* BELL BUTTON */}

      <button
        type="button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-controls="learnspace-notification-panel"
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition ${
          isOpen
            ? "bg-green-50 text-green-800"
            : "text-slate-500 hover:bg-slate-100 hover:text-green-800"
        }`}
      >
        <Bell
          size={18}
          strokeWidth={1.9}
        />

        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-green-700 px-1 text-[8px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>


      {/* DROPDOWN PANEL */}

      {isOpen && (
        <section
          id="learnspace-notification-panel"
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-[60] mt-2 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
        >

          {/* PANEL HEADER */}

          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Notifications
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "You're up to date"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={16} />
            </button>

          </div>


          {/* TOOLBAR */}

          {notifications.length > 0 && (
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2">

              <button
                type="button"
                disabled={unreadCount === 0}
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-green-700 transition hover:text-green-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCheck size={13} />
                Mark all as read
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500 transition hover:text-red-600"
              >
                <Trash2 size={12} />
                Clear all
              </button>

            </div>
          )}


          {/* NOTIFICATION LIST */}

          <div className="max-h-[min(65vh,420px)] overflow-y-auto">

            {notifications.length === 0 ? (

              <div className="flex flex-col items-center px-5 py-10 text-center">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                  <Inbox size={23} />
                </div>

                <h3 className="mt-3 text-xs font-bold text-slate-800">
                  You're all caught up
                </h3>

                <p className="mt-1 max-w-[220px] text-[10px] leading-5 text-slate-500">
                  New learning activity and completed chapters will appear here.
                </p>

              </div>

            ) : (

              <div className="divide-y divide-slate-100">

                {notifications.map((item) => (

                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleNotificationClick(item)
                    }
                    className={`group flex w-full gap-3 px-4 py-3 text-left transition hover:bg-green-50/60 ${
                      item.read
                        ? "bg-white"
                        : "bg-green-50/30"
                    }`}
                  >

                    {/* ICON */}

                    <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm">

                      <NotificationIcon type={item.type} />

                      {!item.read && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-green-600" />
                      )}

                    </div>


                    {/* TEXT */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-2">

                        <p
                          className={`text-[11px] leading-5 ${
                            item.read
                              ? "font-medium text-slate-700"
                              : "font-bold text-slate-900"
                          }`}
                        >
                          {item.title}
                        </p>

                        <span className="shrink-0 pt-0.5 text-[9px] text-slate-400">
                          {getRelativeTime(item.createdAt)}
                        </span>

                      </div>

                      <p className="mt-0.5 text-[10px] leading-5 text-slate-500">
                        {item.message}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between">

                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-green-700">
                          View activity
                          <ChevronRight size={11} />
                        </span>

                        {item.read && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-slate-400">
                            <Check size={10} />
                            Read
                          </span>
                        )}

                      </div>

                    </div>

                  </button>

                ))}

              </div>

            )}

          </div>


          {/* STORAGE WARNING */}

          {storageWarning && (
            <div
              role="alert"
              className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-[10px] leading-5 text-amber-800"
            >
              Browser storage is unavailable. Notifications may not remain after closing this browser.
            </div>
          )}


          {/* PANEL FOOTER */}

          <div className="flex items-center justify-center border-t border-slate-100 px-4 py-2.5">
            <p className="text-[9px] text-slate-400">
              LearnSpace AI · Student activity
            </p>
          </div>

        </section>
      )}

    </div>
  );
}
