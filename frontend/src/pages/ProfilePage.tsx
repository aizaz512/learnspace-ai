
import { useEffect, useState } from "react";

import {
  User,
  Mail,
  CalendarDays,
  ShieldCheck,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import {
  getMyProfile,
  updateMyProfile,
} from "../services/profile";

import type {
  StudentProfile,
} from "../services/profile";


// ============================================
// DATE FORMATTER
// ============================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


// ============================================
// PROFILE PAGE
// ============================================

export default function ProfilePage() {

  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [fullName, setFullName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================
  // LOAD PROFILE
  // ==========================================

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const data = await getMyProfile();

      setProfile(data);
      setFullName(data?.full_name ?? "");

      if (!data) {
        setError(
          "Your student profile was not found. Check that the profile creation trigger was installed successfully."
        );
      }

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const data = await getMyProfile();

        if (!mounted) return;

        setProfile(data);
        setFullName(data?.full_name ?? "");

        if (!data) {
          setError(
            "Your student profile was not found. Check your Supabase profile trigger."
          );
        }

      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your profile."
        );

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      mounted = false;
    };
  }, []);


  // ==========================================
  // SAVE PROFILE
  // ==========================================

  async function handleSaveProfile(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setSaving(true);

    try {
      const updatedProfile = await updateMyProfile({
        full_name: fullName,
      });

      setProfile(updatedProfile);

      setFullName(
        updatedProfile.full_name ?? ""
      );

      setSuccess(
        "Your student profile has been updated successfully."
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile."
      );

    } finally {
      setSaving(false);
    }
  }


  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">

        <div className="flex flex-col items-center gap-3">

          <Loader2
            size={30}
            className="animate-spin text-indigo-600"
          />

          <p className="text-sm text-slate-500">
            Loading your student profile...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="mx-auto max-w-4xl space-y-7">

      {/* PAGE HEADER */}

      <div>

        <div className="mb-2 flex items-center gap-2">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <User size={20} />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-indigo-600">
            Account management
          </span>

        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Manage your personal information and view your
          LearnSpace AI account details.
        </p>

      </div>


      {/* PROFILE CARD */}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        {/* PROFILE BANNER */}

        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-700" />

        <div className="px-5 pb-6 sm:px-8">

          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">

            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-indigo-100 text-3xl font-bold text-indigo-700 shadow-sm">
              {fullName.trim().charAt(0).toUpperCase() || "S"}
            </div>

            <div className="mb-1 flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700">

              <ShieldCheck size={15} />

              Authenticated student

            </div>

          </div>


          <div className="mt-4">

            <h2 className="text-xl font-bold text-slate-900">
              {fullName || "Student Account"}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {profile?.email ?? "Email unavailable"}
            </p>

          </div>

        </div>

      </section>


      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs leading-6 text-rose-700"
        >
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />

          {error}
        </div>
      )}


      {/* SUCCESS */}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-6 text-emerald-700"
        >
          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0"
          />

          {success}
        </div>
      )}


      {/* EDIT PROFILE */}

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">

        <div className="mb-6">

          <h2 className="text-base font-bold text-slate-900">
            Personal information
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Update your student account information.
          </p>

        </div>


        <form
          onSubmit={handleSaveProfile}
          className="space-y-5"
        >

          {/* FULL NAME */}

          <div>

            <label
              htmlFor="profile-full-name"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Full name
            </label>

            <div className="relative">

              <User
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="profile-full-name"
                type="text"
                required
                minLength={1}
                maxLength={100}
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setSuccess("");
                }}
                placeholder="Enter your full name"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />

            </div>

          </div>


          {/* EMAIL */}

          <div>

            <label
              htmlFor="profile-email"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Email address
            </label>

            <div className="relative">

              <Mail
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="profile-email"
                type="email"
                value={profile?.email ?? ""}
                readOnly
                className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-500 outline-none"
              />

            </div>

            <p className="mt-2 text-[10px] text-slate-400">
              Your registered email is managed by Supabase Authentication.
            </p>

          </div>


          {/* SAVE BUTTON */}

          <div className="flex justify-end border-t border-slate-100 pt-5">

            <button
              type="submit"
              disabled={saving || !profile}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />

                  Save changes
                </>
              )}

            </button>

          </div>

        </form>

      </section>


      {/* ACCOUNT DETAILS */}

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">

        <div className="mb-5 flex items-center justify-between gap-3">

          <div>

            <h2 className="text-base font-bold text-slate-900">
              Account information
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Information associated with your student account.
            </p>

          </div>

          <button
            type="button"
            onClick={() => void loadProfile()}
            disabled={loading}
            title="Refresh profile"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50"
          >

            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />

          </button>

        </div>


        <div className="space-y-4">

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
              <User size={18} />
            </div>

            <div>
              <p className="text-[10px] text-slate-400">
                Student account ID
              </p>

              <p className="mt-1 break-all text-xs font-semibold text-slate-700">
                {profile?.id ?? "Not available"}
              </p>
            </div>

          </div>


          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
              <CalendarDays size={18} />
            </div>

            <div>
              <p className="text-[10px] text-slate-400">
                Account created
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-700">
                {profile?.created_at
                  ? formatDate(profile.created_at)
                  : "Not available"}
              </p>
            </div>

          </div>


          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
              <ShieldCheck size={18} />
            </div>

            <div>
              <p className="text-[10px] text-slate-400">
                Account status
              </p>

              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Authenticated
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* INFORMATION */}

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">

        <div className="flex items-start gap-3">

          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-indigo-600"
          />

          <p className="text-xs leading-6 text-indigo-800">
            Your profile information is stored in your Supabase
            PostgreSQL database and protected by Row Level Security.
            Only your authenticated account can access its profile.
          </p>

        </div>

      </div>

    </div>
  );
}
