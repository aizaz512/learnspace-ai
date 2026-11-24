
import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Info,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

interface StudyPreferences {
  focusDuration: number;
  dailyStudyGoal: number;
  breakDuration: number;
}

const STORAGE_KEY = "learnspace-ai-study-preferences-v1";

const DEFAULT_PREFERENCES: StudyPreferences = {
  focusDuration: 25,
  dailyStudyGoal: 120,
  breakDuration: 5,
};

function readPreferences(): StudyPreferences {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(saved) as Partial<StudyPreferences>;

    const focusDuration = Number(parsed.focusDuration);
    const dailyStudyGoal = Number(parsed.dailyStudyGoal);
    const breakDuration = Number(parsed.breakDuration);

    return {
      focusDuration: [25, 45, 60, 90].includes(focusDuration)
        ? focusDuration
        : DEFAULT_PREFERENCES.focusDuration,

      dailyStudyGoal: [60, 90, 120, 180, 240].includes(dailyStudyGoal)
        ? dailyStudyGoal
        : DEFAULT_PREFERENCES.dailyStudyGoal,

      breakDuration: [5, 10, 15].includes(breakDuration)
        ? breakDuration
        : DEFAULT_PREFERENCES.breakDuration,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export default function SettingsPage({
  onNavigate,
}: SettingsPageProps) {
  const [preferences, setPreferences] =
    useState<StudyPreferences>(DEFAULT_PREFERENCES);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreferences(readPreferences());
  }, []);

  function updatePreference<K extends keyof StudyPreferences>(
    key: K,
    value: StudyPreferences[K]
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
    setError("");
  }

  function handleSave() {
    setError("");
    setSaved(false);

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(preferences)
      );

      setSaved(true);
    } catch {
      setError(
        "Your browser could not save these preferences. Check your browser storage settings."
      );
    }
  }

  function handleReset() {
    setPreferences(DEFAULT_PREFERENCES);
    setSaved(false);
    setError("");

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_PREFERENCES)
      );

      setSaved(true);
    } catch {
      setError("Unable to reset your preferences.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">

      {/* PAGE HEADER */}

      <header>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <SlidersHorizontal size={19} />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-[1.4px] text-green-700">
            Workspace preferences
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Manage your account access and personal study preferences.
        </p>
      </header>


      {/* ACCOUNT */}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <UserRound size={19} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Account and profile
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Update your personal information and view your
                registered account details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("My Profile")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-800"
          >
            Manage profile
            <ChevronRight size={15} />
          </button>

        </div>
      </section>


      {/* STUDY PREFERENCES */}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <BookOpen size={19} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Study preferences
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Choose your preferred study session targets.
            </p>
          </div>
        </div>


        <div className="grid gap-4 sm:grid-cols-3">

          {/* FOCUS DURATION */}

          <div>
            <label
              htmlFor="focus-duration"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Focus session
            </label>

            <select
              id="focus-duration"
              value={preferences.focusDuration}
              onChange={(event) =>
                updatePreference(
                  "focusDuration",
                  Number(event.target.value)
                )
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value={25}>25 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>

            <p className="mt-1.5 text-[10px] text-slate-400">
              Your preferred focus session length.
            </p>
          </div>


          {/* DAILY GOAL */}

          <div>
            <label
              htmlFor="daily-study-goal"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Daily study goal
            </label>

            <select
              id="daily-study-goal"
              value={preferences.dailyStudyGoal}
              onChange={(event) =>
                updatePreference(
                  "dailyStudyGoal",
                  Number(event.target.value)
                )
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
              <option value={240}>4 hours</option>
            </select>

            <p className="mt-1.5 text-[10px] text-slate-400">
              Your personal daily target.
            </p>
          </div>


          {/* BREAK DURATION */}

          <div>
            <label
              htmlFor="break-duration"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Break duration
            </label>

            <select
              id="break-duration"
              value={preferences.breakDuration}
              onChange={(event) =>
                updatePreference(
                  "breakDuration",
                  Number(event.target.value)
                )
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
            </select>

            <p className="mt-1.5 text-[10px] text-slate-400">
              Your preferred break length.
            </p>
          </div>

        </div>


        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <RotateCcw size={14} />
            Reset defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-800"
          >
            <Save size={15} />
            Save preferences
          </button>

        </div>


        {saved && (
          <p
            role="status"
            className="mt-3 flex items-center gap-2 text-xs font-medium text-green-700"
          >
            <CheckCircle2 size={15} />
            Your study preferences have been saved on this device.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 text-xs font-medium text-red-600"
          >
            {error}
          </p>
        )}

      </section>


      {/* APPEARANCE AND NOTIFICATIONS */}

      <div className="grid gap-4 md:grid-cols-2">

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Appearance
              </h2>

              <p className="text-[10px] text-slate-500">
                Current application theme
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">

            <div>
              <p className="text-xs font-semibold text-slate-800">
                Forest & Alabaster
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Soft background with forest-green accents
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[9px] font-semibold text-green-800">
              Active
            </span>

          </div>

          <p className="mt-3 text-[10px] leading-5 text-slate-400">
            This is the current LearnSpace AI brand theme. Additional
            theme choices are not available yet.
          </p>

        </section>


        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Clock3 size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Notifications
              </h2>

              <p className="text-[10px] text-slate-500">
                Study reminders and alerts
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-800">
              Notification delivery is not connected yet.
            </p>

            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              Email, push notifications and automatic study reminders
              are not currently configured.
            </p>
          </div>

        </section>

      </div>


      {/* PRIVACY INFORMATION */}

      <section className="rounded-xl border border-green-100 bg-green-50 p-4">

        <div className="flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-green-700"
          />

          <div>
            <h2 className="text-xs font-bold text-green-900">
              Account and preference information
            </h2>

            <p className="mt-1 text-[11px] leading-5 text-green-800">
              Study preferences on this page are saved in this
              browser only. They are not synchronized between devices
              or stored in your student profile. Manage your account
              information from My Profile.
            </p>
          </div>
        </div>

      </section>


      {/* HELP LINK */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Info size={15} className="text-slate-400" />
          Need help using LearnSpace AI?
        </div>

        <button
          type="button"
          onClick={() => onNavigate("Help & Support")}
          className="text-xs font-semibold text-green-700 transition hover:text-green-900"
        >
          Visit Help & Support
        </button>

      </div>

    </div>
  );
}
