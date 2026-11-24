
import { useState } from "react";
import type { FormEvent } from "react";

import {
  ArrowRight,
  Check,
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
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

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;


  // ==========================================
  // SWITCH BETWEEN SIGN IN AND SIGN UP
  // ==========================================

  function switchMode(nextMode: AuthMode) {
    if (loading) return;

    setMode(nextMode);
    setError("");
    setMessage("");

    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }


  // ==========================================
  // SUPABASE AUTHENTICATION
  // ==========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (isSignup && !cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (isSignup && cleanName.length < 2) {
      setError("Please enter a valid full name.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (isSignup && password !== confirmPassword) {
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
                full_name: cleanName,
              },
              emailRedirectTo: window.location.origin,
            },
          });

        if (signupError) {
          throw signupError;
        }

        if (data.session) {
          setMessage(
            "Your account has been created successfully."
          );
        } else {
          setMessage(
            "Registration successful. Check your email and verify your address before signing in."
          );

          setMode("signin");
          setPassword("");
          setConfirmPassword("");
          setShowPassword(false);
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

        // App.tsx detects the Supabase session
        // and opens the student dashboard.
      }

    } catch (err) {
      console.error("Authentication failed:", err);

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
    <main className="flex min-h-screen items-center justify-center bg-[#f3f4f6] px-3 py-5 sm:px-6 sm:py-8">

      {/* MAIN AUTHENTICATION LAYOUT */}

      <div className="grid min-h-[640px] w-full max-w-[1120px] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.09)] md:grid-cols-[0.95fr_1.05fr]">


        {/* =====================================
            LEFT VISUAL PANEL
        ====================================== */}

        <section className="relative hidden min-h-[640px] overflow-hidden bg-[#101923] md:block">

          {/* REAL STUDENT PHOTOGRAPH */}

          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=85"
            alt="University students studying together"
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />

          {/* DARK IMAGE OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#07111d]/95 via-[#07111d]/50 to-[#07111d]/15" />


          {/* BRAND */}

          <div className="absolute left-9 top-9 z-10 flex items-center gap-3 lg:left-11 lg:top-10">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              <GraduationCap size={25} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                LearnSpace <span className="text-sky-300">AI</span>
              </h1>

              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.15em] text-white/65">
                University learning platform
              </p>
            </div>

          </div>


          {/* IMAGE CONTENT */}

          <div className="absolute bottom-0 left-0 z-10 w-full p-9 lg:p-11">

            <div className="mb-5 h-px w-12 bg-sky-400" />

            <h2 className="max-w-md text-4xl font-semibold leading-[1.2] tracking-tight text-white lg:text-[42px]">
              Make learning
              <br />
              <span className="font-normal text-white/75">
                more organized.
              </span>
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/75">
              Your university subjects, study notes
              and learning tools — together in one place.
            </p>


            {/* MINIMAL FEATURE LINE */}

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/20 pt-5">

              <span className="text-[10px] font-medium text-white/80">
                Subjects
              </span>

              <span className="h-1 w-1 rounded-full bg-sky-400" />

              <span className="text-[10px] font-medium text-white/80">
                Notes
              </span>

              <span className="h-1 w-1 rounded-full bg-sky-400" />

              <span className="text-[10px] font-medium text-white/80">
                AI study tools
              </span>

            </div>

          </div>

        </section>


        {/* =====================================
            RIGHT FORM PANEL
        ====================================== */}

        <section className="flex min-h-[640px] items-center justify-center bg-white px-6 py-10 sm:px-12 lg:px-[76px]">

          <div className="w-full max-w-[380px]">


            {/* MOBILE BRAND */}

            <div className="mb-12 flex items-center gap-3 md:hidden">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173d69] text-white">
                <GraduationCap size={23} />
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  LearnSpace <span className="text-blue-600">AI</span>
                </h1>

                <p className="text-[9px] uppercase tracking-wider text-slate-400">
                  University learning platform
                </p>
              </div>

            </div>


            {/* FORM HEADING */}

            <div className="mb-9">

              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                {isSignup ? "GET STARTED" : "STUDENT ACCOUNT"}
              </p>

              <h2 className="text-[32px] font-semibold tracking-tight text-[#111827] sm:text-[36px]">
                {isSignup ? "Create account" : "Sign in"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {isSignup
                  ? "Create your account to get started."
                  : "Welcome back. Continue your learning journey."}
              </p>

            </div>


            {/* AUTHENTICATION FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >


              {/* FULL NAME */}

              {isSignup && (
                <div>

                  <label
                    htmlFor="auth-full-name"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Full name
                  </label>

                  <div className="relative">

                    <User
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="auth-full-name"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={100}
                      value={fullName}
                      onChange={(event) =>
                        setFullName(event.target.value)
                      }
                      disabled={loading}
                      placeholder="Enter your full name"
                      className="h-[50px] w-full rounded-full border border-slate-200 bg-white pl-11 pr-5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                    />

                  </div>

                </div>
              )}


              {/* EMAIL */}

              <div>

                <label
                  htmlFor="auth-email"
                  className="mb-2 block text-xs font-medium text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    disabled={loading}
                    placeholder="Enter your email"
                    className="h-[50px] w-full rounded-full border border-slate-200 bg-white pl-11 pr-5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div>

                <label
                  htmlFor="auth-password"
                  className="mb-2 block text-xs font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                    disabled={loading}
                    placeholder="Enter your password"
                    className="h-[50px] w-full rounded-full border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                </div>

              </div>


              {/* CONFIRM PASSWORD */}

              {isSignup && (
                <div>

                  <label
                    htmlFor="auth-confirm-password"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Confirm password
                  </label>

                  <div className="relative">

                    <LockKeyhole
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
                      disabled={loading}
                      placeholder="Confirm your password"
                      className={`h-[50px] w-full rounded-full border bg-white pl-11 pr-12 text-sm text-slate-800 outline-none transition focus:ring-4 disabled:bg-slate-50 ${
                        confirmPassword.length === 0
                          ? "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                          : passwordsMatch
                            ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                            : "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                      }`}
                    />

                    {passwordsMatch && (
                      <Check
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600"
                      />
                    )}

                  </div>

                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1.5 text-[10px] text-rose-600">
                      Passwords do not match.
                    </p>
                  )}

                  {passwordsMatch && (
                    <p className="mt-1.5 text-[10px] text-emerald-600">
                      Passwords match.
                    </p>
                  )}

                </div>
              )}


              {/* ERROR */}

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700"
                >
                  {error}
                </div>
              )}


              {/* SUCCESS */}

              {message && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800"
                >
                  {message}
                </div>
              )}


              {/* SUBMIT BUTTON */}

              <button
                type="submit"
                disabled={
                  loading ||
                  (isSignup &&
                    confirmPassword.length > 0 &&
                    !passwordsMatch)
                }
                className="group mt-2 flex h-[51px] w-full items-center justify-center gap-2 rounded-full bg-[#1769c2] px-5 text-sm font-semibold text-white transition duration-200 hover:bg-[#1257a5] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    {isSignup
                      ? "Creating account..."
                      : "Signing in..."}
                  </>
                ) : (
                  <>
                    {isSignup ? "Create account" : "Sign in"}

                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}

              </button>

            </form>


            {/* ACCOUNT SWITCH */}

            <div className="mt-7 text-center">

              {isSignup ? (
                <p className="text-xs text-slate-500">
                  Already have an account?{" "}

                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    disabled={loading}
                    className="font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Don't have an account?{" "}

                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    disabled={loading}
                    className="font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Create account
                  </button>
                </p>
              )}

            </div>


            {/* FOOTER */}

            <div className="mt-12 flex items-center justify-center gap-2 border-t border-slate-100 pt-5">

              <LockKeyhole
                size={12}
                className="text-slate-400"
              />

              <span className="text-[10px] text-slate-400">
                Secure student account access
              </span>

            </div>

            <p className="mt-4 text-center text-[10px] text-slate-400">
              © 2026 LearnSpace AI
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}
