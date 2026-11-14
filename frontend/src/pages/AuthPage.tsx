
import { useState } from "react";

import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
  User,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isSignup = mode === "signup";


  // ==========================================
  // RESET FORM MESSAGES
  // ==========================================

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }


  // ==========================================
  // SUBMIT AUTHENTICATION FORM
  // ==========================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (isSignup && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (
      isSignup &&
      password !== confirmPassword
    ) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const { data, error: signupError } =
          await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
              emailRedirectTo: window.location.origin,
            },
          });

        if (signupError) {
          throw signupError;
        }

        if (data.session) {
          // Supabase session listener in App.tsx
          // will automatically open the dashboard.
          setMessage("Your account has been created.");
        } else {
          setMessage(
            "Registration successful! Please check your email and click the verification link. Then return here and sign in."
          );

          setMode("signin");
          setPassword("");
          setConfirmPassword("");
        }

      } else {
        const { error: signinError } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (signinError) {
          throw signinError;
        }

        // App.tsx observes the authenticated session
        // and automatically displays the dashboard.
      }

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }


  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fc] px-4 py-10">

      {/* BACKGROUND DECORATION */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-indigo-100/70 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-100/70 blur-3xl" />


      {/* AUTH CARD */}

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-2">


        {/* LEFT BRAND PANEL */}

        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-800 p-10 text-white lg:flex">

          <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full border border-white/10" />

          <div className="absolute -bottom-36 -left-28 h-96 w-96 rounded-full border border-white/10" />

          <div className="relative z-10">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <GraduationCap size={25} />
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  LearnSpace AI
                </h1>

                <p className="text-[10px] tracking-widest text-indigo-200">
                  INTELLIGENT DIGITAL LEARNING
                </p>
              </div>

            </div>


            <div className="mt-24">

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles size={29} />
              </div>

              <h2 className="max-w-sm text-4xl font-bold leading-tight">
                Your journey to smarter learning starts here.
              </h2>

              <p className="mt-5 max-w-sm text-sm leading-7 text-indigo-100">
                Organize your university subjects, understand
                difficult concepts, generate quizzes, and build
                better study habits with your AI learning partner.
              </p>

            </div>

          </div>


          <div className="relative z-10 grid grid-cols-2 gap-3">

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <BookOpen size={19} />

              <p className="mt-3 text-xs font-semibold">
                Smart notebooks
              </p>

              <p className="mt-1 text-[10px] text-indigo-200">
                Organize your learning
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <Sparkles size={19} />

              <p className="mt-3 text-xs font-semibold">
                AI study tools
              </p>

              <p className="mt-1 text-[10px] text-indigo-200">
                Learn more effectively
              </p>
            </div>

          </div>

        </section>


        {/* RIGHT AUTH PANEL */}

        <section className="p-6 sm:p-10 lg:p-12">

          {/* MOBILE BRAND */}

          <div className="mb-10 flex items-center gap-3 lg:hidden">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap size={24} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                LearnSpace<span className="text-indigo-600"> AI</span>
              </h1>

              <p className="text-[9px] font-medium tracking-wider text-slate-400">
                INTELLIGENT DIGITAL LEARNING
              </p>
            </div>

          </div>


          {/* FORM HEADER */}

          <div className="mb-8">

            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              {isSignup ? (
                <User size={22} />
              ) : (
                <LockKeyhole size={22} />
              )}
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {isSignup
                ? "Create your account"
                : "Welcome back"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isSignup
                ? "Create your student account and start organizing your learning."
                : "Sign in to continue your learning journey."}
            </p>

          </div>


          {/* MODE SWITCH */}

          <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">

            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`rounded-lg py-2.5 text-xs font-semibold transition ${
                !isSignup
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg py-2.5 text-xs font-semibold transition ${
                isSignup
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create account
            </button>

          </div>


          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* FULL NAME */}

            {isSignup && (
              <div>

                <label
                  htmlFor="auth-name"
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
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    placeholder="Enter your full name"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />

                </div>

              </div>
            )}


            {/* EMAIL */}

            <div>

              <label
                htmlFor="auth-email"
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
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div>

              <label
                htmlFor="auth-password"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">

                <LockKeyhole
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isSignup
                      ? "new-password"
                      : "current-password"
                  }
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 8 characters"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            {isSignup && (
              <div>

                <label
                  htmlFor="auth-confirm-password"
                  className="mb-2 block text-xs font-semibold text-slate-700"
                >
                  Confirm password
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="auth-confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Enter your password again"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />

                </div>

              </div>
            )}


            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700"
              >
                {error}
              </div>
            )}


            {/* SUCCESS MESSAGE */}

            {message && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-6 text-emerald-800"
              >
                {message}
              </div>
            )}


            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Please wait...
                </>
              ) : (
                <>
                  {isSignup
                    ? "Create student account"
                    : "Sign in to LearnSpace AI"}

                  <ArrowRight size={17} />
                </>
              )}

            </button>

          </form>


          {/* FOOTER */}

          <p className="mt-7 text-center text-[10px] leading-5 text-slate-400">
            By continuing, you agree to use LearnSpace AI
            responsibly for your academic learning.
          </p>

          <div className="mt-8 border-t border-slate-100 pt-5 text-center">

            <p className="text-[10px] text-slate-400">
              © 2026 LearnSpace AI. Built for better learning.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}
