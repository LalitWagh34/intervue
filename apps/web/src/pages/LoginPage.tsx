import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { signIn, signUp, useSession } from "@/lib/auth";
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
  Mic,
  Swords,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

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

  // Auth Tab Mode: "signin" | "signup"
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Referral code persistence
  useEffect(() => {
    if (refParam) {
      try {
        localStorage.setItem("intervue_referral_code", refParam);
      } catch {}
    }
  }, [refParam]);

  // Handle OAuth state mismatch error
  useEffect(() => {
    if (errorParam === "state_mismatch") {
      toast.error("Sign-in session expired. Please click below to try again.", {
        description: "Google verification state mismatched. Avoid double clicking the sign-in button.",
      });
    }
  }, [errorParam]);

  // Email & Password Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === "signup") {
        // Sign Up with Email and Password
        const result = await signUp.email({
          email: email.trim(),
          password: password,
          name: name.trim() || email.split("@")[0],
          callbackURL: "http://localhost:5173/dashboard",
        });

        if (result.error) {
          throw new Error(result.error.message || "Failed to create account");
        }

        toast.success("Account created successfully!", {
          description: "Welcome to Intervue! Redirecting to your dashboard...",
        });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 600);
      } else {
        // Sign In with Email and Password
        const result = await signIn.email({
          email: email.trim(),
          password: password,
          callbackURL: "http://localhost:5173/dashboard",
        });

        if (result.error) {
          throw new Error(result.error.message || "Invalid email or password");
        }

        toast.success("Welcome back!", {
          description: "Signed in successfully. Redirecting...",
        });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 600);
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      toast.error(err?.message || "Authentication failed. Please check your credentials.");
      setIsSubmitting(false);
    }
  };

  // Google 1-Click Sign-In
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "http://localhost:5173/dashboard",
      });
    } catch (err: any) {
      console.error("Google sign in initiation failed:", err);
      setIsGoogleLoading(false);
      toast.error("Failed to initiate Google sign-in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#060709] text-white flex flex-col justify-between selection:bg-blue-500/20 selection:text-blue-400 relative overflow-hidden">
      {/* Background Ambient Glow Meshes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-40 right-[-10%] w-[600px] h-[600px] bg-blue-500/5 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-purple-600/5 blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <span className="text-white font-black text-base tracking-wider font-mono">I</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xl tracking-tight">Intervue</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
              v2.0
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Container: Split View on Desktop */}
      <main className="w-full max-w-7xl mx-auto px-6 py-6 lg:py-12 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full max-w-5xl">
          {/* Left Column: Platform Showcase (Visible on lg screens) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col space-y-8 pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Next-Gen Engineering Interview Suite</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
                Crack top-tier tech interviews with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
                  real confidence
                </span>
                .
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                Curated daily POTD matching Google & Amazon, conversational AI voice mock sessions, and live
                peer arena battles — built for modern engineers.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 gap-3.5 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 backdrop-blur-sm hover:border-zinc-700/70 transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">Target Company Curated Kits</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                    Daily authentic LeetCode problems matching Google, Amazon, Meta & Microsoft.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 backdrop-blur-sm hover:border-zinc-700/70 transition-all">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Mic className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">AI Voice Mock Interviews</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                    Conversational technical & behavioral rounds with instant scoring rubrics.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 backdrop-blur-sm hover:border-zinc-700/70 transition-all">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Swords className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">1v1 Competitive Battle Arena</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                    Race against peers in real-time timed DSA contests with live scoreboards.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 backdrop-blur-sm hover:border-zinc-700/70 transition-all">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">Readiness Radar Analytics</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                    Track data structures mastery, speed percentiles, and interview preparedness.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Trust Proof */}
            <div className="flex items-center gap-3 pt-2 text-xs text-zinc-400">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-[#060709] flex items-center justify-center text-[10px] font-bold text-white">
                  G
                </div>
                <div className="w-7 h-7 rounded-full bg-amber-600 border-2 border-[#060709] flex items-center justify-center text-[10px] font-bold text-white">
                  A
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-[#060709] flex items-center justify-center text-[10px] font-bold text-white">
                  M
                </div>
                <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-[#060709] flex items-center justify-center text-[10px] font-bold text-white">
                  U
                </div>
              </div>
              <span>
                Joined by <strong className="text-white font-medium">10,000+ candidates</strong> prepping
                globally
              </span>
            </div>
          </div>

          {/* Right Column: Clean Email & Password Authentication Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="relative rounded-2xl bg-[#0c0d12]/95 border border-zinc-800/80 shadow-2xl shadow-black/80 backdrop-blur-2xl p-6 sm:p-8 overflow-hidden">
              {/* Subtle Card Glow */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

              {/* Header inside Card */}
              <div className="space-y-1.5 mb-6 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 lg:hidden">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm font-mono">I</span>
                  </div>
                  <span className="text-white font-bold text-lg">Intervue</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {authMode === "signin" ? "Welcome back" : "Create an account"}
                </h2>
                <p className="text-xs text-zinc-400">
                  {authMode === "signin"
                    ? "Enter your email and password to access your account"
                    : "Enter your email and choose a password to get started"}
                </p>
              </div>

              {/* Referral Banner if present */}
              {refParam && (
                <div className="mb-5 p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 flex items-center gap-2.5 text-xs text-blue-300">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Referral code <strong className="font-mono text-white">{refParam}</strong> applied! You'll
                    receive bonus interview tokens.
                  </span>
                </div>
              )}

              {/* OAuth state mismatch error warning */}
              {errorParam === "state_mismatch" && (
                <div className="mb-5 p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Previous OAuth session expired. Please click below to try again.</span>
                </div>
              )}

              {/* Sign In vs Sign Up Tab Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === "signin"
                      ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === "signup"
                      ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name field in Sign Up mode */}
                {authMode === "signup" && (
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-xs font-medium text-zinc-300">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        autoComplete="name"
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-zinc-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoComplete="email"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-medium text-zinc-300">
                      Password
                    </label>
                    {authMode === "signin" && (
                      <button
                        type="button"
                        onClick={() =>
                          toast.info("Password reset link will be sent to your email upon request.")
                        }
                        className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-zinc-800 bg-zinc-900/90 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {authMode === "signup" && (
                    <p className="text-[11px] text-zinc-500">Must be at least 6 characters</p>
                  )}
                </div>

                {/* Submit Action Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{authMode === "signin" ? "Signing In..." : "Creating Account..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{authMode === "signin" ? "Sign In" : "Create Account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-zinc-500">
                  <span className="bg-[#0c0d12] px-3">or continue with</span>
                </div>
              </div>

              {/* Google 1-Click Button */}
              <Button
                type="button"
                className="w-full bg-white hover:bg-zinc-100 text-zinc-900 h-11 font-semibold rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-white/5 active:scale-[0.99]"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>{isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
              </Button>

              {/* Bottom Toggle Text */}
              <div className="mt-5 text-center text-xs text-zinc-400">
                {authMode === "signin" ? (
                  <span>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition-colors"
                    >
                      Sign up
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition-colors"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>

              {/* Footer Notice */}
              <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center space-y-2">
                <p className="text-[11px] text-zinc-500 leading-normal">
                  By continuing, you agree to Intervue's{" "}
                  <Link to="/" className="text-zinc-400 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/" className="text-zinc-400 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                  <span>256-Bit SSL Encrypted • Session tokens stored securely</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 z-10">
        <div>© {new Date().getFullYear()} Intervue Inc. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-zinc-300 transition-colors">
            Features
          </Link>
          <Link to="/" className="hover:text-zinc-300 transition-colors">
            Target Companies
          </Link>
          <Link to="/" className="hover:text-zinc-300 transition-colors">
            Security
          </Link>
          <Link to="/" className="hover:text-zinc-300 transition-colors">
            Help Center
          </Link>
        </div>
      </footer>
    </div>
  );
}