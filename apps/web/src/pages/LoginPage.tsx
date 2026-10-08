import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { signIn, useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  Phone,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  RefreshCw,
  Building2,
  Mic,
  Swords,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";

interface CountryCode {
  code: string;
  name: string;
  flag: string;
  placeholder: string;
}

const COUNTRIES: CountryCode[] = [
  { code: "+91", name: "India", flag: "🇮🇳", placeholder: "98765 43210" },
  { code: "+1", name: "USA / Canada", flag: "🇺🇸", placeholder: "(555) 000-0000" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧", placeholder: "7911 123456" },
  { code: "+65", name: "Singapore", flag: "🇸🇬", placeholder: "8123 4567" },
  { code: "+971", name: "UAE", flag: "🇦🇪", placeholder: "50 123 4567" },
  { code: "+49", name: "Germany", flag: "🇩🇪", placeholder: "151 23456789" },
  { code: "+61", name: "Australia", flag: "🇦🇺", placeholder: "412 345 678" },
];

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

  // Auth Mode: "google" | "phone"
  const [authMode, setAuthMode] = useState<"google" | "phone">("google");

  // Google sign in loading state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Phone Auth State
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpStep, setOtpStep] = useState<"enter-phone" | "enter-otp">("enter-phone");
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Resend timer countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Trigger Google sign in
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

  // Trigger OTP Send
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = phoneNumber.replace(/\D/g, "");
    if (cleanDigits.length < 8) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const fullPhoneNumber = `${selectedCountry.code}${cleanDigits}`;
    setIsSendingOtp(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhoneNumber }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setOtpStep("enter-otp");
      setResendCountdown(60);

      if (data.provider === "console") {
        toast.success(`Verification code generated for ${fullPhoneNumber}!`, {
          description: "Check your server terminal for the real OTP, or enter 123456.",
        });
      } else {
        toast.success(`SMS verification code delivered to ${fullPhoneNumber}!`);
      }

      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    // Auto advance
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpValues(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const enteredCode = otpValues.join("");
    if (enteredCode.length < 6) {
      toast.error("Please enter all 6 digits of your verification code.");
      return;
    }

    const cleanDigits = phoneNumber.replace(/\D/g, "");
    const fullPhoneNumber = `${selectedCountry.code}${cleanDigits}`;

    setIsVerifyingOtp(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          code: enteredCode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      toast.success("Mobile phone verified successfully!", {
        description: "Session established. Redirecting to your dashboard...",
      });

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } catch (err: any) {
      toast.error(err?.message || "Verification failed. Please check the code.");
      setIsVerifyingOtp(false);
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
                Deterministic daily POTD from Google & Amazon, real-time AI voice mock sessions, and live
                peer arena battles — tailored for your dream offer.
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
                    Conversational behavioral & technical rounds with instant scoring rubrics.
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

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="relative rounded-2xl bg-[#0c0d12]/95 border border-zinc-800/80 shadow-2xl shadow-black/80 backdrop-blur-2xl p-6 sm:p-8 overflow-hidden">
              {/* Subtle Card Accent Glow */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

              {/* Header inside Card */}
              <div className="space-y-1.5 mb-6 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 lg:hidden">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm font-mono">I</span>
                  </div>
                  <span className="text-white font-bold text-lg">Intervue</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
                <p className="text-xs text-zinc-400">
                  Sign in to your account to continue your interview & coding journey
                </p>
              </div>

              {/* Referral Code Banner if present */}
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
                  <span>Previous OAuth session expired. Please click below once to start fresh.</span>
                </div>
              )}

              {/* Auth Mode Tabs: Google vs Mobile OTP */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMode("google")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === "google"
                      ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
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
                  <span>Google (1-Click)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode("phone")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === "phone"
                      ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Mobile OTP</span>
                </button>
              </div>

              {/* TAB 1: GOOGLE 1-CLICK */}
              {authMode === "google" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed">
                    <p className="flex items-center gap-1.5 text-zinc-300 font-medium mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Instant & Secure Access
                    </p>
                    One-click login with your Google account. Automatically syncs your name, profile photo,
                    and progress across all sessions.
                  </div>

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

                  <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-zinc-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>No password needed • Free forever tier included</span>
                  </div>
                </div>
              )}

              {/* TAB 2: MOBILE NUMBER + OTP */}
              {authMode === "phone" && (
                <div className="space-y-4">
                  {otpStep === "enter-phone" ? (
                    /* Step A: Enter Phone Number */
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-300">Mobile Phone Number</label>
                        <div className="relative flex rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-blue-500/80 transition-colors">
                          {/* Country Selector Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                              className="h-11 px-3 flex items-center gap-1.5 border-r border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-l-xl transition-colors cursor-pointer"
                            >
                              <span>{selectedCountry.flag}</span>
                              <span className="font-mono text-zinc-200">{selectedCountry.code}</span>
                              <ChevronDown className="w-3 h-3 text-zinc-500" />
                            </button>

                            {isCountryDropdownOpen && (
                              <div className="absolute top-12 left-0 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-30 max-h-56 overflow-y-auto">
                                {COUNTRIES.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(c);
                                      setIsCountryDropdownOpen(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                  >
                                    <span>{c.flag}</span>
                                    <span className="flex-1 font-medium">{c.name}</span>
                                    <span className="font-mono text-zinc-500">{c.code}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Mobile Number Input */}
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder={selectedCountry.placeholder}
                            className="flex-1 h-11 px-3.5 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none font-mono"
                            autoFocus
                          />
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          We will send a 6-digit one-time verification password via SMS.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSendingOtp || !phoneNumber.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50"
                      >
                        {isSendingOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Sending SMS Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>

                      {/* Info on SMS Gateway Requirement */}
                      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-300">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          <span>Direct Telecom SMS Gateway</span>
                        </div>
                        <p className="leading-relaxed text-zinc-500">
                          Dispatches one-time verification code via Fast2SMS / Twilio. Code valid for 5 minutes.
                        </p>
                      </div>
                    </form>
                  ) : (
                    /* Step B: Enter 6-digit OTP */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">
                          Code sent to{" "}
                          <strong className="text-white font-mono">
                            {selectedCountry.code} {phoneNumber}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep("enter-phone");
                            setOtpValues(["", "", "", "", "", ""]);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium cursor-pointer"
                        >
                          Change number
                        </button>
                      </div>

                      {/* 6 Digit OTP Input Boxes */}
                      <div className="flex items-center justify-between gap-2">
                        {otpValues.map((val, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={val}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onPaste={handleOtpPaste}
                            className={`w-11 h-12 text-center text-lg font-bold font-mono rounded-xl border bg-zinc-900 text-white transition-all focus:outline-none ${
                              val
                                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5"
                                : "border-zinc-800 focus:border-blue-500/60"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        {resendCountdown > 0 ? (
                          <span>Resend SMS code in {resendCountdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendOtp()}
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Resend Code</span>
                          </button>
                        )}
                        <span className="text-zinc-500 text-[11px]">Expires in 5m</span>
                      </div>

                      <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otpValues.join("").length < 6}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Verifying Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify & Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Security / Terms Footer */}
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