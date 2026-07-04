import { Link } from "react-router-dom";
import { useSession } from "@/lib/auth";
import { ArrowRight, Mic, Code2, MessageSquare, Trophy, Zap, Shield, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice interviews",
    desc: "Practice speaking naturally with an AI interviewer that adapts to your answers in real time.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: MessageSquare,
    title: "Text interviews",
    desc: "Chat-style interview sessions with streaming AI responses. Perfect for async practice.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: Code2,
    title: "Coding practice",
    desc: "Solve real problems in a live editor with AI feedback on your approach and complexity.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: Brain,
    title: "AI evaluation",
    desc: "Every session is scored across technical depth, communication, and problem solving.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Zap,
    title: "Instant feedback",
    desc: "Get detailed scorecards with strengths, improvements, and dimension scores after each session.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Trophy,
    title: "Track progress",
    desc: "Dashboard with streaks, score history, and session analytics to measure improvement over time.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
];

const ROLES = ["Frontend Engineer", "Backend Engineer", "Full Stack Engineer", "DevOps Engineer", "Data Scientist"];

const STATS = [
  { value: "4", label: "Practice modes" },
  { value: "10+", label: "Job roles" },
  { value: "AI", label: "Powered evaluation" },
  { value: "Free", label: "To get started" },
];

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-xs">I</span>
            </div>
            <span className="font-semibold">Intervue</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Link
                to="/dashboard"
                className="bg-white text-black text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
              >
                Go to dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-white text-black text-sm px-4 py-1.5 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
              >
                Get started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-orange-500/15 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-400 text-xs font-medium">AI-powered interview practice</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-6 leading-tight">
            Practice interviews.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Get hired faster.
            </span>
          </h1>

          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Intervue gives you a real interview experience — voice, text, and coding —
            with instant AI feedback and scoring. Built for engineers serious about landing their next role.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              to={session ? "/practice" : "/login"}
              className="bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2"
            >
              Start practicing free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="border border-zinc-800 text-zinc-300 px-6 py-2.5 rounded-lg font-medium hover:border-zinc-700 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Role tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {ROLES.map((role) => (
              <span key={role} className="text-xs text-zinc-500 border border-zinc-800 px-3 py-1 rounded-full">
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-900 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-semibold text-white mb-1">{s.value}</p>
              <p className="text-zinc-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-3">Everything you need to prepare</h2>
            <p className="text-zinc-400">Four practice modes, one platform.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 hover:border-zinc-800 transition-colors"
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", f.bg)}>
                  <f.icon className={cn("w-5 h-5", f.color)} />
                </div>
                <p className="text-white font-medium mb-2">{f.title}</p>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-3">How it works</h2>
            <p className="text-zinc-400">From zero to interview-ready in minutes.</p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              { step: "01", title: "Set up your profile", desc: "Add your target role, experience level, GitHub, and skills. The AI uses this to personalize every session." },
              { step: "02", title: "Pick a practice mode", desc: "Choose voice, text, or coding. Select your role and difficulty. Start immediately — no scheduling needed." },
              { step: "03", title: "Get scored instantly", desc: "After each session, receive a detailed scorecard with dimension scores, strengths, and areas to improve." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <p className="text-5xl font-bold text-zinc-900 mb-4">{item.step}</p>
                <p className="text-white font-medium mb-2">{item.title}</p>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-zinc-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-4xl font-semibold mb-4">Ready to start practicing?</h2>
          <p className="text-zinc-400 mb-8">Free to use. No credit card. Just sign in with Google and start.</p>
          <Link
            to={session ? "/practice" : "/login"}
            className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors inline-flex items-center gap-2"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
              <span className="text-black font-bold text-[10px]">I</span>
            </div>
            <span className="text-zinc-500 text-sm">Intervue</span>
          </div>
          <p className="text-zinc-600 text-xs">Built with Bun, React, Groq AI</p>
        </div>
      </footer>

    </div>
  );
}