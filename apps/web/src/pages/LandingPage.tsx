import React from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  Swords,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Target,
  Shield,
  MessageSquare,
  NotebookPen,
  Trophy,
  ChevronRight,
  Clock,
  Flame,
  Award,
  Layers,
  HelpCircle,
  MessageSquareHeart,
  ExternalLink,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandIcon } from "@/components/shared/BrandLogo";

export default function LandingPage() {
  return (
    <div className="w-full bg-[#060709] text-[#F3F4F6] min-h-screen selection:bg-[#327CF6]/30 font-sans">
      {/* ─── Top Navigation Header ─────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#060709]/80 backdrop-blur-xl border-b border-[#181A20]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#141A29] via-[#0E131F] to-[#0A0D14] border border-[#327CF6]/40 flex items-center justify-center shadow-md shadow-[#327CF6]/20 group-hover:border-[#327CF6]/70 group-hover:scale-105 transition-all">
                <BrandIcon className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                Intervue
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-[#8B92A0]">
              <a
                href="#features"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#12141B] transition-colors"
              >
                Features
              </a>
              <a
                href="#companies"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#12141B] transition-colors"
              >
                Company Kits
              </a>
              <a
                href="#arena"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#12141B] transition-colors"
              >
                Battle Arena
              </a>
              <a
                href="#scorecards"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#12141B] transition-colors"
              >
                Scorecards
              </a>
              <Link
                to="/help"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#12141B] transition-colors"
              >
                Help Center
              </Link>
              <Link
                to="/feedback"
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#12141B] transition-colors"
              >
                Feedback
              </Link>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-[#8B92A0] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#327CF6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white text-xs font-semibold shadow-md shadow-[#327CF6]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────── */}
      <main className="w-full pt-20">
        {/* ─── Hero Section ──────────────────────────────────────────── */}
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 flex flex-col items-center text-center overflow-hidden">
          {/* Ambient Background Glows */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[320px] bg-[#327CF6]/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-28 left-1/3 -translate-x-1/2 w-64 h-64 bg-[#8B5CF6]/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Hero Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D0E12] border border-[#181A20] text-xs font-mono text-zinc-300 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#327CF6] font-semibold">AI Technical Mock Cockpit</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">FAANG Placement Ready</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6">
            Practice like it's the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#327CF6] via-[#60A5FA] to-[#A78BFA]">
              real interview.
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-base sm:text-lg text-[#8B92A0] max-w-2xl mx-auto leading-relaxed mb-8">
            Adaptive AI technical interviews, curated FAANG company prep kits, real-time 1v1 coding battle arenas, and granular diagnostic scorecards.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-5">
            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#327CF6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white text-sm font-semibold shadow-xl shadow-[#327CF6]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Practicing Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#features"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0D0E12] hover:bg-[#13161F] border border-[#181A20] hover:border-[#327CF6]/40 text-zinc-300 hover:text-white text-sm font-semibold transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#327CF6]" />
              <span>Explore Features</span>
            </a>
          </div>

          {/* Social Proof Pill */}
          <p className="text-xs text-[#8B92A0] flex items-center justify-center gap-2 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            Free practice tier · No credit card required · Instant session launch
          </p>

          {/* ─── Hero Product Mockup Terminal ────────────────────────── */}
          <div className="w-full mt-14 rounded-2xl border border-[#181A20] bg-[#0A0C10] shadow-2xl overflow-hidden text-left">
            {/* Window Topbar */}
            <div className="bg-[#0D0E14] px-5 py-3 border-b border-[#181A20] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
                </div>
                <div className="h-4 w-px bg-[#181A20]" />
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#327CF6]" />
                  <span className="text-xs font-semibold text-white">Intervue AI Simulation</span>
                  <span className="text-xs text-zinc-600">/</span>
                  <span className="text-xs text-[#8B92A0]">Backend Systems & Scale</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] font-mono text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                  <span>24:18 REMAINING</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#181A20] text-amber-400 font-mono text-[10px] font-bold uppercase">
                  Medium
                </span>
                <span className="px-2 py-0.5 rounded bg-[#181A20] text-zinc-400 font-mono text-[10px] font-bold uppercase">
                  Turn 03 of 08
                </span>
              </div>
            </div>

            {/* Split Simulation Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#181A20]">
              {/* Left Column: AI Dialogue */}
              <div className="lg:col-span-7 p-6 flex flex-col gap-4 bg-[#0A0C10]">
                {/* AI Prompt Bubble */}
                <div className="p-4 rounded-xl bg-[#0D0E14] border border-[#181A20] flex gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#327CF6]/15 border border-[#327CF6]/30 flex items-center justify-center shrink-0 text-[#327CF6]">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Intervue AI (Staff Evaluator)</span>
                      <span className="text-[10px] font-mono text-zinc-500">14:02:18</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      "Design a distributed URL shortener that sustains <span className="font-mono text-[#327CF6] font-semibold">10M writes/day</span> with sub-50ms p99 read latency. How do you structure key generation, and where do you introduce your caching hierarchy to handle hotspot keys?"
                    </p>
                  </div>
                </div>

                {/* Candidate Solution Workspace */}
                <div className="p-4 rounded-xl bg-[#060709] border border-[#181A20] space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-zinc-500 pb-1 border-b border-[#181A20]/60">
                    <span className="text-zinc-400 font-semibold">architecture_spec.py</span>
                    <span className="text-[10px] text-emerald-400">● Synced</span>
                  </div>
                  <pre className="text-zinc-300 overflow-x-auto leading-relaxed">
                    <span className="text-zinc-600">1 </span><span className="text-[#8B5CF6]">class</span> <span className="text-blue-400">URLCompressorCluster</span>:{"\n"}
                    <span className="text-zinc-600">2 </span>  cache_layer = init_distributed_cache(replicas=<span className="text-amber-400">3</span>){"\n"}
                    <span className="text-zinc-600">3 </span>  db_shards = init_sharded_storage(key=<span className="text-emerald-400">"short_hash[0:2]"</span>){"\n"}
                    <span className="text-zinc-600">4 </span>{"\n"}
                    <span className="text-zinc-600">5 </span>  <span className="text-[#8B5CF6]">async def</span> <span className="text-blue-400">resolve_url</span>(self, short_code: str) -&gt; str:{"\n"}
                    <span className="text-zinc-600">6 </span>    <span className="text-[#8B5CF6]">if</span> cached := <span className="text-[#8B5CF6]">await</span> self.cache_layer.get(short_code):{"\n"}
                    <span className="text-zinc-600">7 </span>      <span className="text-[#8B5CF6]">return</span> cached  <span className="text-zinc-500"># &lt;5ms p99 latency via read replicas</span>{"\n"}
                    <span className="text-zinc-600">8 </span>    target = <span className="text-[#8B5CF6]">await</span> self.db_shards.query_by_hash(short_code){"\n"}
                    <span className="text-zinc-600">9 </span>    <span className="text-[#8B5CF6]">return</span> target
                  </pre>
                </div>
              </div>

              {/* Right Column: Live Telemetry */}
              <div className="lg:col-span-5 p-6 bg-[#0D0E14] flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Live Evaluation Telemetry</h4>
                      <p className="text-[11px] text-[#8B92A0]">Adaptive assessment in progress</p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-[#327CF6]/15 border border-[#327CF6]/30 text-[#327CF6] font-mono font-bold text-xs">
                      SCORE 84/100
                    </span>
                  </div>

                  {/* Criteria Gauges */}
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-zinc-400">Technical Knowledge</span>
                        <span className="font-mono text-white font-bold">85 / 100</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#181A20] rounded-full overflow-hidden">
                        <div className="h-full bg-[#327CF6] rounded-full w-[85%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-zinc-400">System Decomposition</span>
                        <span className="font-mono text-white font-bold">82 / 100</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#181A20] rounded-full overflow-hidden">
                        <div className="h-full bg-[#8B5CF6] rounded-full w-[82%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-zinc-400">Trade-off Articulation</span>
                        <span className="font-mono text-white font-bold">86 / 100</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#181A20] rounded-full overflow-hidden">
                        <div className="h-full bg-[#10B981] rounded-full w-[86%]" />
                      </div>
                    </div>
                  </div>

                  {/* Detected System Concepts */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      Detected Architecture Concepts
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono text-[10px]">
                        ✓ Redis Multi-Zone
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono text-[10px]">
                        ✓ Database Sharding
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono text-[10px]">
                        ⏳ Hotspot Key Invalidation
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="w-full py-2 px-3 rounded-xl bg-[#181A20] hover:bg-[#327CF6] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Launch Practice Simulation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Highlights Numbers Strip ──────────────────────────────── */}
        <section className="w-full border-y border-[#181A20] bg-[#0A0C10] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-[#0D0E12] border border-[#181A20]">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#327CF6]">
                Adaptive
              </span>
              <p className="text-xs font-bold text-white mt-0.5">AI Interview Evaluator</p>
              <p className="text-[11px] text-[#8B92A0]">Adjusts difficulty dynamically per turn</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0E12] border border-[#181A20]">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#8B5CF6]">
                6+ Pillars
              </span>
              <p className="text-xs font-bold text-white mt-0.5">Technical Domains</p>
              <p className="text-[11px] text-[#8B92A0]">DSA, System Design, OS, DBMS, Networks</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0E12] border border-[#181A20]">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#F59E0B]">
                FAANG
              </span>
              <p className="text-xs font-bold text-white mt-0.5">Company Prep Kits</p>
              <p className="text-[11px] text-[#8B92A0]">Google, Amazon, Meta & Microsoft rounds</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0E12] border border-[#181A20]">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#10B981]">
                Real-Time
              </span>
              <p className="text-xs font-bold text-white mt-0.5">1v1 Battle Arena</p>
              <p className="text-[11px] text-[#8B92A0]">Multiplayer coding faceoffs with live lobbies</p>
            </div>
          </div>
        </section>

        {/* ─── Core Features Ecosystem ──────────────────────────────── */}
        <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#327CF6]/10 border border-[#327CF6]/20 text-[11px] font-mono text-[#327CF6] font-semibold uppercase">
              Comprehensive Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              One platform. Your entire placement readiness.
            </h2>
            <p className="text-sm text-[#8B92A0] leading-relaxed">
              Replace disorganized spreadsheets and generic YouTube prep with an integrated telemetry-driven interview cockpit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#0A0C10] border border-[#181A20] hover:border-[#327CF6]/40 transition-all flex flex-col justify-between gap-5 group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#327CF6]/10 border border-[#327CF6]/20 flex items-center justify-center text-[#327CF6] group-hover:scale-105 transition-transform">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors">
                  AI Technical Interviews
                </h3>
                <p className="text-xs text-[#8B92A0] leading-relaxed">
                  Multi-turn dialogues that challenge your architecture, probe edge cases, and evaluate algorithmic efficiency in real-time.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>&gt; adaptive_depth: true</span>
                <span className="text-[#327CF6] font-semibold">Active</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#0A0C10] border border-[#181A20] hover:border-[#F59E0B]/40 transition-all flex flex-col justify-between gap-5 group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#F59E0B] transition-colors">
                  Target Company Prep Kits
                </h3>
                <p className="text-xs text-[#8B92A0] leading-relaxed">
                  Tailored question banks for Google, Amazon, Meta, and Microsoft categorized by company frequency and difficulty.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>FAANG / Top Tier</span>
                <span className="text-[#F59E0B] font-semibold">Updated</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#0A0C10] border border-[#181A20] hover:border-red-500/40 transition-all flex flex-col justify-between gap-5 group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                  <Swords className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                  Live 1v1 Battle Arena
                </h3>
                <p className="text-xs text-[#8B92A0] leading-relaxed">
                  Join real-time coding showdowns against peers with room lobbies, shared timers, and live winner evaluation.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Multiplayer Lobby</span>
                <span className="text-red-400 font-semibold">Live</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-[#0A0C10] border border-[#181A20] hover:border-[#10B981]/40 transition-all flex flex-col justify-between gap-5 group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981] group-hover:scale-105 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#10B981] transition-colors">
                  Diagnostic Scorecards
                </h3>
                <p className="text-xs text-[#8B92A0] leading-relaxed">
                  Granular post-interview assessments with category percentages, pinpointed weak spots, and targeted drill recommendations.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Overall Readiness</span>
                <span className="text-[#10B981] font-semibold">Instant</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-[#0A0C10] border border-[#181A20] hover:border-[#8B5CF6]/40 transition-all flex flex-col justify-between gap-5 group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#8B5CF6] transition-colors">
                  AI Tech Mentor
                </h3>
                <p className="text-xs text-[#8B92A0] leading-relaxed">
                  Stuck on algorithmic trade-offs? Ask for subtle conceptual hints, complexity explanations, and alternative approaches.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>24/7 Mentor</span>
                <span className="text-[#8B5CF6] font-semibold">Available</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-[#0A0C10] border border-[#181A20] hover:border-amber-400/40 transition-all flex flex-col justify-between gap-5 group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <NotebookPen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  Notes & Hint Vault
                </h3>
                <p className="text-xs text-[#8B92A0] leading-relaxed">
                  Save personal code snippets, architectural notes, and bookmark key interview questions for quick revision before your rounds.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs font-mono text-zinc-400 flex items-center justify-between">
                <span>Encrypted Storage</span>
                <span className="text-amber-400 font-semibold">Synced</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Company Tracks Section ────────────────────────────────── */}
        <section id="companies" className="w-full bg-[#0A0C10] border-y border-[#181A20] py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[11px] font-mono text-[#F59E0B] font-semibold uppercase">
                  Target Company Tracks
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Prepare for the companies you target.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#8B92A0] max-w-md">
                Structured kits mapped to company interview patterns, favorite problem archetypes, and difficulty distributions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  code: "AMZN",
                  name: "Amazon Prep Kit",
                  tag: "High Frequency",
                  desc: "Leadership principles, distributed caching, and trees/graphs optimization.",
                  topics: ["Leadership Principles", "LRU Cache", "Topological Sort"],
                },
                {
                  code: "GOOG",
                  name: "Google Prep Kit",
                  tag: "Algorithms: Hard",
                  desc: "Unconventional graph traversal, dynamic programming, and scale pipelines.",
                  topics: ["Graph Traversal", "Segment Trees", "Shortest Path"],
                },
                {
                  code: "MSFT",
                  name: "Microsoft Prep Kit",
                  tag: "Object Design & DSA",
                  desc: "Clean object-oriented principles, trees/linked lists, and concurrency safety.",
                  topics: ["OOP Design", "Binary Trees", "Concurrency Primitives"],
                },
                {
                  code: "META",
                  name: "Meta Prep Kit",
                  tag: "Speed & Accuracy",
                  desc: "High-speed multi-problem sessions with deep social graph and sliding window drills.",
                  topics: ["Sliding Window", "Graph Search", "Binary Search"],
                },
                {
                  code: "UBER",
                  name: "Uber Prep Kit",
                  tag: "Real-time & Arrays",
                  desc: "Geospatial indexing algorithms, interval scheduling, and high availability systems.",
                  topics: ["Interval Scheduling", "Heap Queues", "Geohashing"],
                },
                {
                  code: "AAPL",
                  name: "Apple Prep Kit",
                  tag: "Core Systems & DSA",
                  desc: "Memory management, low-level OS fundamentals, and robust array algorithms.",
                  topics: ["Bit Manipulation", "Pointers", "Two Pointers"],
                },
              ].map((comp) => (
                <div
                  key={comp.code}
                  className="p-6 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 transition-all flex flex-col justify-between gap-5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-12 h-12 rounded-xl bg-[#181A20] flex items-center justify-center font-mono font-bold text-sm text-white group-hover:text-[#327CF6] transition-colors">
                        {comp.code}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181A20] text-zinc-400">
                        {comp.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#327CF6] transition-colors">
                      {comp.name}
                    </h3>
                    <p className="text-xs text-[#8B92A0] leading-relaxed">
                      {comp.desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {comp.topics.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#181A20] text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/login"
                    className="text-xs font-semibold text-[#327CF6] hover:text-[#5B95F8] flex items-center gap-1 transition-colors"
                  >
                    <span>Practice this track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Battle Arena Spotlight ───────────────────────────────── */}
        <section id="arena" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="rounded-3xl bg-gradient-to-br from-[#0D0E14] via-[#0A0C10] to-[#120B16] border border-[#181A20] p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden">
            <div className="space-y-4 max-w-xl text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[11px] font-mono text-red-400 font-semibold uppercase">
                <Swords className="w-3.5 h-3.5" />
                Live Battle Arena
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Challenge fellow engineers in real-time 1v1 battles.
              </h2>
              <p className="text-sm text-[#8B92A0] leading-relaxed">
                Test your problem-solving speed under real competitive pressure. Create private lobby codes, set round duration, and race to pass all test cases first.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02]"
                >
                  <Swords className="w-4 h-4" />
                  <span>Enter Arena Lobby</span>
                </Link>
              </div>
            </div>

            {/* Arena Preview Card */}
            <div className="w-full lg:w-96 rounded-2xl bg-[#060709] border border-[#181A20] p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#181A20] pb-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-white font-bold">ROOM #BATTLE-981</span>
                </div>
                <span className="text-[11px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                  2/2 Joined
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D0E12] border border-[#181A20]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold font-mono">
                      Y
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">You</p>
                      <p className="text-[10px] text-zinc-500 font-mono">Solved 2/3</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#10B981]">08:14</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D0E12] border border-[#181A20]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold font-mono">
                      O
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Opponent</p>
                      <p className="text-[10px] text-zinc-500 font-mono">Solved 1/3</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-400">11:42</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-center text-zinc-500 pt-1">
                Synchronized timer · Automated judge evaluation
              </div>
            </div>
          </div>
        </section>

        {/* ─── Diagnostic Scorecard Showcase ────────────────────────── */}
        <section id="scorecards" className="w-full bg-[#0A0C10] border-t border-[#181A20] py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[11px] font-mono text-[#10B981] font-semibold uppercase">
                Actionable Post-Mortem
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Don't just practice. Understand your score.
              </h2>
              <p className="text-sm text-[#8B92A0]">
                Every mock session yields actionable, quote-attributed assessments rather than generic feedback.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0D0E12] border border-[#181A20] p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Scorecard Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#181A20]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#060709] border border-[#181A20] flex flex-col items-center justify-center">
                    <span className="text-2xl font-black font-mono text-white">82</span>
                    <span className="text-[10px] font-mono text-zinc-500">/ 100</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">
                        Senior Backend Systems Simulation
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                        Strong Hire
                      </span>
                    </div>
                    <p className="text-xs text-[#8B92A0] font-mono mt-0.5">
                      Session #IV-9481 • Completed in 38 mins
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-[#060709] border border-[#181A20]">
                    <span className="text-sm font-bold font-mono text-[#327CF6]">84%</span>
                    <p className="text-[10px] text-zinc-500">Problem Solving</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#060709] border border-[#181A20]">
                    <span className="text-sm font-bold font-mono text-[#8B5CF6]">82%</span>
                    <p className="text-[10px] text-zinc-500">System Depth</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#060709] border border-[#181A20]">
                    <span className="text-sm font-bold font-mono text-[#10B981]">88%</span>
                    <p className="text-[10px] text-zinc-500">Communication</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#060709] border border-[#181A20]">
                    <span className="text-sm font-bold font-mono text-[#F59E0B]">78%</span>
                    <p className="text-[10px] text-zinc-500">Trade-offs</p>
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#060709] border border-[#181A20] space-y-2.5">
                  <span className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Demonstrated Strengths
                  </span>
                  <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
                    <li>• Clear identification of hot partition bottlenecks and write-heavy workloads.</li>
                    <li>• Proactive formulation of multi-region replication and failover constraints.</li>
                    <li>• Confident explanation of time complexity tradeoffs between hash vs range sharding.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#060709] border border-[#181A20] space-y-2.5">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5" />
                    Target Improvement Areas
                  </span>
                  <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
                    <li>• Consider write-through cache eviction mechanisms rather than relying solely on TTL.</li>
                    <li>• Address circuit breaker degradation patterns when downstream services experience throttling.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Bottom CTA Banner ─────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="rounded-3xl bg-gradient-to-tr from-[#0D0E12] via-[#0A0C10] to-[#121626] border border-[#181A20] p-10 sm:p-16 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#0B0D13] border border-[#1F2430] flex items-center justify-center mx-auto shadow-md shadow-[#007BFA]/20">
              <BrandIcon className="w-7 h-7" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
              Ready to ace your next technical round?
            </h2>

            <p className="text-sm text-[#8B92A0] max-w-lg mx-auto leading-relaxed">
              Join candidates using Intervue to master system design, solve curated company problem kits, and simulate real interview pressure.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/login"
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#327CF6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white text-sm font-semibold shadow-lg shadow-[#327CF6]/30 transition-all hover:scale-[1.02]"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-xs font-mono text-zinc-500 pt-2">
              No download required · Runs in any browser · Instant start
            </p>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-[#181A20] bg-[#060709] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#8B92A0]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-b from-[#141A29] to-[#0A0D14] border border-[#327CF6]/40 flex items-center justify-center text-white shadow-sm shadow-[#327CF6]/20">
              <BrandIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-white">Intervue</span>
            <span>— Tech Interview & Placement Cockpit</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#companies" className="hover:text-white transition-colors">
              Company Kits
            </a>
            <Link to="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <Link to="/feedback" className="hover:text-white transition-colors">
              Feedback
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>

          <div className="text-[11px] font-mono text-zinc-600">
            © {new Date().getFullYear()} Intervue. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
