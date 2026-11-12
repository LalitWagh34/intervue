import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { signIn, signUp, useSession, setSessionToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  Building2,
  MessageSquare,
  Swords,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { BrandIcon } from "@/components/shared/BrandLogo";

export default function LoginPage() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");
  const refParam = searchParams.get("ref");

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate]);

  // Auth Mode: "signin" | "signup"
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "email" | "password", string>>>({});
  const [formError, setFormError] = useState("");

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const switchAuthMode = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setFieldErrors({});
    setFormError("");
  };

  const validateForm = () => {
    const errors: Partial<Record<"name" | "email" | "password", string>> = {};
    if (authMode === "signup" && !name.trim()) errors.name = "Enter your full name.";
    if (!email.trim()) {
      errors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Enter your password.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Referral code persistence
  useEffect(() => {
    if (refParam) {
      try {
        localStorage.setItem("intervue_referral_code", refParam);
      } catch {}
    }
  }, [refParam]);

  // Handle OAuth error params
  useEffect(() => {
    if (!errorParam) return;

    if (errorParam === "state_mismatch") {
      toast.error("Sign-in session expired. Please click below to try again.", {
        description: "Google verification state mismatched. Avoid double clicking the sign-in button.",
      });
    } else if (errorParam === "account_not_linked") {
      toast.error("Account already exists with this email.", {
        description: "Please sign in with your email & password or link your Google account.",
      });
    } else if (errorParam === "access_denied") {
      toast.info("Google sign-in was cancelled.", {
        description: "You chose not to complete the Google authentication.",
      });
    } else {
      toast.error("Google sign-in failed.", {
        description: `Authentication error: ${errorParam.replace(/_/g, " ")}. Please try again.`,
      });
    }
  }, [errorParam]);

  // Email & Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError("");
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (authMode === "signup") {
        const result = await signUp.email({
          email: email.trim(),
          password: password,
          name: name.trim() || email.split("@")[0],
        });

        if (result.error) {
          throw new Error(result.error.message || "Failed to create account");
        }

        const sessionToken =
          (result.data as any)?.token ||
          (result.data as any)?.session?.token ||
          (result.data as any)?.sessionToken ||
          (result as any)?.token;
        if (sessionToken) {
          setSessionToken(sessionToken);
        }

        toast.success("Account created successfully!", {
          description: "Welcome to Intervue! Redirecting to your dashboard...",
        });
        window.location.replace("/dashboard");
      } else {
        const result = await signIn.email({
          email: email.trim(),
          password: password,
        });

        if (result.error) {
          throw new Error(result.error.message || "Invalid email or password");
        }

        const sessionToken =
          (result.data as any)?.token ||
          (result.data as any)?.session?.token ||
          (result.data as any)?.sessionToken ||
          (result as any)?.token;
        if (sessionToken) {
          setSessionToken(sessionToken);
        }

        toast.success("Welcome back!", {
          description: "Signed in successfully. Redirecting...",
        });
        window.location.replace("/dashboard");
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      const message = err?.message || "Authentication failed. Please check your credentials.";
      setFormError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  // Google 1-Click Sign-In
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      const res = await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
        newUserCallbackURL: `${window.location.origin}/dashboard`,
        errorCallbackURL: `${window.location.origin}/login`,
      });
      if (res?.error) {
        console.error("Google sign in response error:", res.error);
        setIsGoogleLoading(false);
        toast.error(res.error.message || "Failed to initiate Google sign-in.");
      }
    } catch (err: any) {
      console.error("Google sign in initiation failed:", err);
      setIsGoogleLoading(false);
      toast.error(err?.message || "Failed to initiate Google sign-in. Please try again.");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full min-w-0 bg-[var(--canvas)] text-[var(--text-primary)] flex flex-col justify-between overflow-x-clip overflow-y-auto lg:overflow-hidden px-4 sm:px-8 py-3 lg:py-4 relative selection:bg-[var(--surface-selected)] selection:text-[var(--accent-text)]">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between shrink-0 py-1 z-10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--border-control)] flex items-center justify-center shadow-sm group-hover:border-[var(--action-primary)]/60 group-hover:scale-105 transition-all duration-200">
            <BrandIcon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-primary)] font-bold text-lg tracking-tight font-sans">
              Intervue
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors py-1 px-3 rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border-subtle)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Dual-Column Showcase Container */}
      <main className="w-full max-w-6xl mx-auto my-auto py-2 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Left Column: Platform Showcase (Visible on desktop) */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-4 pr-2">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--action-primary)]/25 text-[var(--accent-text)] text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                <span>Next-Gen Engineering Interview Suite</span>
              </div>
              <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-[1.2] text-[var(--text-primary)]">
                Crack top-tier tech interviews with{" "}
                <span className="text-[var(--accent-text)]">
                  real confidence
                </span>
                .
              </h1>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed max-w-lg">
                Curated daily POTD matching Google & Amazon, interactive AI technical mock interviews, and live
                peer arena battles — tailored for your dream offer.
              </p>
            </div>

            {/* 4 Feature Highlights in Compact 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-all">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] border border-[var(--action-primary)]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-[var(--text-primary)]">Target Company Kits</h2>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-normal">
                    Daily problems matching Google, Amazon & Meta.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-all">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] border border-[var(--action-primary)]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-[var(--text-primary)]">AI Mock Sessions</h2>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-normal">
                    Technical rounds with instant rubric evaluation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-all">
                <div className="w-7 h-7 rounded-lg bg-[var(--status-success-soft)] border border-[var(--status-success)]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Swords className="w-3.5 h-3.5 text-[var(--status-success)]" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-[var(--text-primary)]">1v1 Battle Arena</h2>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-normal">
                    Live head-to-head coding battles with peers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-control)] transition-all">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] border border-[var(--action-primary)]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-[var(--text-primary)]">Readiness Radar</h2>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-normal">
                    Mastery percentiles and interview preparedness.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Trust Proof */}
         
          </div>

          {/* Right Column: Sleek Auth Card (Optimized Height) */}
          <div className="lg:col-span-5 w-full max-w-[400px] mx-auto">
            <div className="relative rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] shadow-xl p-5 sm:p-6 overflow-hidden">
              {/* Card Title & Subtitle */}
              <div className="space-y-1 mb-3.5 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-2 lg:hidden">
                  <div className="w-8 h-8 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-control)] flex items-center justify-center shadow-sm shrink-0">
                    <BrandIcon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-primary)] font-bold text-base tracking-tight font-sans">
                      Intervue
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {authMode === "signin" ? "Welcome back" : "Create an account"}
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {authMode === "signin"
                    ? "Enter your credentials to continue your practice"
                    : "Enter your email and choose a password to get started"}
                </p>
              </div>

              {/* Referral Banner if present */}
              {refParam && (
                <div className="mb-3 p-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--action-primary)]/30 flex items-center gap-2 text-xs text-[var(--accent-text)]">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
                  <span className="truncate">
                    Referral code <strong className="font-mono text-[var(--text-primary)]">{refParam}</strong> applied!
                  </span>
                </div>
              )}

              {/* OAuth state mismatch error warning */}
              {errorParam === "state_mismatch" && (
                <div className="mb-3 p-2 rounded-xl bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 text-xs text-[var(--status-warning)] flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--status-warning)] shrink-0 mt-0.5" />
                  <span>Session expired. Please click below to try again.</span>
                </div>
              )}

              {/* Segmented Mode Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)] mb-3.5">
                <button
                  type="button"
                  onClick={() => switchAuthMode("signin")}
                  className={`min-h-11 sm:min-h-0 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === "signin"
                      ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-control)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode("signup")}
                  className={`min-h-11 sm:min-h-0 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === "signup"
                      ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-control)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
                {formError && (
                  <div id="auth-form-error" role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 p-2.5 text-xs text-[var(--status-danger)]">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {/* Full Name in Sign Up Mode */}
                {authMode === "signup" && (
                  <div className="space-y-1">
                    <label htmlFor="name" className="block text-[11px] font-medium text-[var(--text-secondary)]">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (fieldErrors.name) setFieldErrors((current) => ({ ...current, name: undefined }));
                        }}
                        placeholder="John Doe"
                        autoComplete="name"
                        aria-invalid={Boolean(fieldErrors.name)}
                        aria-describedby={fieldErrors.name ? "name-error" : undefined}
                        className={`w-full h-11 sm:h-9.5 pl-9 pr-3 rounded-xl border bg-[var(--surface-muted)] text-base sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]/40 transition-colors ${fieldErrors.name ? "border-[var(--status-danger)]" : "border-[var(--border-control)]"}`}
                      />
                    </div>
                    {fieldErrors.name && <p id="name-error" className="text-xs text-[var(--status-danger)]">{fieldErrors.name}</p>}
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-[11px] font-medium text-[var(--text-secondary)]">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
                      }}
                      placeholder="name@example.com"
                      autoComplete="email"
                      inputMode="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      className={`w-full h-11 sm:h-9.5 pl-9 pr-3 rounded-xl border bg-[var(--surface-muted)] text-base sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]/40 transition-colors ${fieldErrors.email ? "border-[var(--status-danger)]" : "border-[var(--border-control)]"}`}
                    />
                  </div>
                  {fieldErrors.email && <p id="email-error" className="text-xs text-[var(--status-danger)]">{fieldErrors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-[11px] font-medium text-[var(--text-secondary)]">
                      Password
                    </label>
                    {authMode === "signin" && (
                      <Link
                        to="/help"
                        className="min-h-11 sm:min-h-0 inline-flex items-center text-xs sm:text-[10px] text-[var(--accent-text)] hover:underline transition-colors"
                      >
                        Sign-in help
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
                      }}
                      placeholder="••••••••"
                      autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? "password-error" : undefined}
                      className={`w-full h-11 sm:h-9.5 pl-9 pr-11 rounded-xl border bg-[var(--surface-muted)] text-base sm:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]/40 transition-colors ${fieldErrors.password ? "border-[var(--status-danger)]" : "border-[var(--border-control)]"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p id="password-error" className="text-xs text-[var(--status-danger)]">{fieldErrors.password}</p>}
                </div>

                {/* Primary Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  aria-describedby={formError ? "auth-form-error" : undefined}
                  className="w-full bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] h-11 sm:h-9.5 text-sm sm:text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50 mt-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--on-primary)]" />
                      <span>{authMode === "signin" ? "Signing In..." : "Creating Account..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{authMode === "signin" ? "Sign In" : "Create Account"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-subtle)]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <span className="bg-[var(--surface)] px-2.5">or continue with</span>
                </div>
              </div>

              {/* Google 1-Click Button */}
              <Button
                type="button"
                className="w-full bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-control)] h-11 sm:h-9.5 text-sm sm:text-xs font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99]"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-primary)]" />
                ) : (
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span>{isGoogleLoading ? "Connecting..." : "Continue with Google"}</span>
              </Button>

              {/* Bottom Toggle */}
              <div className="mt-3 text-center text-[11px] text-[var(--text-secondary)]">
                {authMode === "signin" ? (
                  <span>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchAuthMode("signup")}
                      className="text-[var(--accent-text)] hover:underline font-semibold cursor-pointer transition-colors"
                    >
                      Sign up
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchAuthMode("signin")}
                      className="text-[var(--accent-text)] hover:underline font-semibold cursor-pointer transition-colors"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>

              {/* Compact Security Footer */}
              <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] text-center">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <ShieldCheck className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>256-Bit SSL Encrypted • Secure session tokens</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer: Single Compact Line */}
      <footer className="w-full max-w-6xl mx-auto flex items-center justify-between text-[11px] text-[var(--text-muted)] shrink-0 py-1 border-t border-[var(--border-subtle)]">
        <div>© {new Date().getFullYear()} Intervue Inc. All rights reserved.</div>
        <div className="flex items-center gap-3">
          <Link to="/" className="hover:text-[var(--text-secondary)] transition-colors">
            Terms
          </Link>
          <span>•</span>
          <Link to="/" className="hover:text-[var(--text-secondary)] transition-colors">
            Privacy
          </Link>
          <span>•</span>
          <Link to="/" className="hover:text-[var(--text-secondary)] transition-colors">
            Help
          </Link>
        </div>
      </footer>
    </div>
  );
}
