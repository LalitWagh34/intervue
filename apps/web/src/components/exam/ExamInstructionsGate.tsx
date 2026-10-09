import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Layout,
  Code2,
  Terminal,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Maximize2,
  HelpCircle,
  FileText,
  User,
  ArrowRight,
  LogOut,
  Sliders,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface ExamInstructionsGateProps {
  room: {
    title: string;
    code: string;
    type?: string;
    duration: number;
    questions?: any[];
    host?: { name?: string };
  };
  candidateName?: string;
  candidateEmail?: string;
  onAcceptAndEnter: () => void;
  onCancel?: () => void;
  isModalView?: boolean;
}

export function ExamInstructionsGate({
  room,
  candidateName = "Candidate",
  candidateEmail = "",
  onAcceptAndEnter,
  onCancel,
  isModalView = false,
}: ExamInstructionsGateProps) {
  // 4 mandatory checkboxes
  const [agreedLayout, setAgreedLayout] = useState(false);
  const [agreedAntiCheat, setAgreedAntiCheat] = useState(false);
  const [agreedSpectator, setAgreedSpectator] = useState(false);
  const [agreedHonorCode, setAgreedHonorCode] = useState(false);

  const allAgreed = agreedLayout && agreedAntiCheat && agreedSpectator && agreedHonorCode;

  const handleSelectAll = () => {
    const nextState = !allAgreed;
    setAgreedLayout(nextState);
    setAgreedAntiCheat(nextState);
    setAgreedSpectator(nextState);
    setAgreedHonorCode(nextState);
  };

  const totalQuestions = room.questions?.length || 0;

  return (
    <div className={`w-full ${isModalView ? "p-0" : "min-h-screen bg-[#07080B] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-600/30"}`}>
      <div className={`max-w-4xl mx-auto space-y-6 ${isModalView ? "" : "animate-in fade-in duration-300"}`}>
        
        {/* Top Header Card */}
        <div className="bg-[#0C0E14] border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono text-[11px] uppercase tracking-wider px-2 py-0.5">
                  Proctored Examination
                </Badge>
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400 font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Anti-Cheat Active
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {room.title || "Competitive Assessment & Examination"}
              </h1>
              <p className="text-xs text-zinc-400">
                Please review the examination layout, proctoring disclaimers, and candidate code of conduct carefully before commencing.
              </p>
            </div>

            {/* Candidate & Exam Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-black/50 border border-zinc-800/80 rounded-xl p-3 shrink-0 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Candidate</span>
                <span className="font-semibold text-white truncate max-w-[120px] block" title={candidateName}>
                  {candidateName}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Duration</span>
                <span className="font-mono font-semibold text-amber-400">{room.duration} Mins</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Questions</span>
                <span className="font-mono font-semibold text-blue-400">{totalQuestions} Problems</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Where Everything is Located (Exam Interface Layout) */}
        <div className="bg-[#0C0E14] border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
            <Layout className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                1. Examination Workspace & Layout Guide
              </h2>
              <p className="text-xs text-zinc-400">
                Understand where problems, editor, test cases, and contest tools are positioned.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <div className="bg-[#11141D] border border-zinc-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                <FileText className="w-4 h-4" />
                <span>Problem Statement (Left Panel)</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Contains full problem descriptions, input/output formats, constraints, and sample test cases with line-by-line explanations. If the question is an MCQ, options are rendered here with instant selection saving.
              </p>
            </div>

            <div className="bg-[#11141D] border border-zinc-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                <Code2 className="w-4 h-4" />
                <span>Multi-Language Code Editor (Right Panel)</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Integrated Monaco Editor supporting <strong>C++, Java, Python, JavaScript, and TypeScript</strong>. Features automatic indentation, syntax highlighting, and auto-sync.
              </p>
            </div>

            <div className="bg-[#11141D] border border-zinc-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <Terminal className="w-4 h-4" />
                <span>Testcase Console & Execution (Bottom Panel)</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Click <strong>"Run Code"</strong> to validate against public and custom input testcases. Click <strong>"Submit Code"</strong> to evaluate against the hidden judge test suite and register official points.
              </p>
            </div>

            <div className="bg-[#11141D] border border-zinc-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <Clock className="w-4 h-4" />
                <span>Top HUD, Palette & Authoritative Timer</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The top bar tracks the <strong>server countdown clock</strong>, <strong>Questions drawer</strong> (switch between problems at any time), <strong>Proctor Strike Status</strong>, and the <strong>Finish Assessment</strong> button.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Strict Anti-Cheat, Disclaimers & Focus-Exit Penalties */}
        <div className="bg-[#0C0E14] border border-red-500/20 rounded-2xl p-6 sm:p-7 shadow-lg space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                2. Strict Anti-Cheat & Focus-Exit Disclaimers
                <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400 text-[10px] uppercase font-mono">
                  Penalty Policy
                </Badge>
              </h2>
              <p className="text-xs text-zinc-400">
                Any attempt to navigate away or use external aids will incur automated penalty strikes.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 text-xs">
              <div className="p-1 rounded bg-red-500/20 text-red-400 mt-0.5 shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-red-300 block">
                  Tab-Switching & Window-Blur Penalty (Strict 3-Strike Rule)
                </span>
                <p className="text-zinc-300 leading-relaxed">
                  Switching browser tabs, minimizing the test window, or losing window focus (e.g. opening inspect element, third-party apps, or desktop windows) will <strong>immediately register an Anti-Cheat Strike</strong> accompanied by an audible warning chime.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-red-400">
                  <span>● Strike 1: Warning Logged</span>
                  <span>● Strike 2: Final Warning</span>
                  <span className="font-bold underline">● Strike 3: AUTOMATIC DISQUALIFICATION & TERMINATION</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                <span className="font-semibold text-zinc-200 block flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-blue-400" /> Fullscreen Enforcement
                </span>
                <p className="text-zinc-400 leading-relaxed">
                  You are required to take the examination in Fullscreen mode. Exiting fullscreen prompts a focus infraction alert.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                <span className="font-semibold text-zinc-200 block flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" /> Clipboard Monitoring
                </span>
                <p className="text-zinc-400 leading-relaxed">
                  Pasting large blocks of foreign code (&gt;120 characters) from external sources triggers a suspicious paste violation. All code must be typed organically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Spectator Mode & Contest Features */}
        <div className="bg-[#0C0E14] border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
            <Eye className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                3. Live Leaderboard & Spectator Surveillance
              </h2>
              <p className="text-xs text-zinc-400">
                Transparency and peer competition mechanics in this arena.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-zinc-300 pt-1">
            <div className="bg-purple-950/10 border border-purple-900/30 rounded-xl p-4 space-y-1.5">
              <span className="font-semibold text-purple-300 block">Spectating Others & Live Standings</span>
              <p className="text-zinc-400 leading-relaxed">
                You can toggle <strong>Live Standings</strong> at any moment to see room ranks. In <strong>Spectator Mode</strong> (or after submitting your test), you can view peers' live code streams, submissions, and testcase pass rates.
              </p>
            </div>

            <div className="bg-purple-950/10 border border-purple-900/30 rounded-xl p-4 space-y-1.5">
              <span className="font-semibold text-purple-300 block">Scoring & Penalty Calculations</span>
              <p className="text-zinc-400 leading-relaxed">
                Rankings are calculated dynamically based on score and completion time. Failed submissions to the judge incur penalty minutes against your final tie-break standing.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Mandatory Candidate Agreement & Declaration */}
        <div className="bg-[#0C0E14] border border-emerald-500/30 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  4. Candidate Declaration & Terms Agreement
                </h2>
                <p className="text-xs text-zinc-400">
                  You must confirm all {4} conditions below before entering the examination arena.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-4 self-start sm:self-auto cursor-pointer"
            >
              {allAgreed ? "Deselect All" : "Acknowledge & Select All"}
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {/* Condition 1 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-black/40 cursor-pointer transition-colors select-none">
              <input
                type="checkbox"
                checked={agreedLayout}
                onChange={(e) => setAgreedLayout(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-700 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900 cursor-pointer accent-blue-600"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-semibold text-white block">
                  Workspace Layout & Controls Acknowledgment
                </span>
                <span className="text-zinc-400 leading-relaxed block">
                  I have read the layout guide and know where problem descriptions, code editor, testcase runner, and the question navigation palette are located.
                </span>
              </div>
            </label>

            {/* Condition 2 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-950/10 cursor-pointer transition-colors select-none">
              <input
                type="checkbox"
                checked={agreedAntiCheat}
                onChange={(e) => setAgreedAntiCheat(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900 cursor-pointer accent-red-600"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-semibold text-red-300 block">
                  Focus-Exit & Proctoring Penalty Agreement
                </span>
                <span className="text-zinc-400 leading-relaxed block">
                  I agree that switching tabs, exiting fullscreen, or minimizing the exam window will incur automated strikes. I accept that 3 strikes will lead to immediate disqualification.
                </span>
              </div>
            </label>

            {/* Condition 3 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-black/40 cursor-pointer transition-colors select-none">
              <input
                type="checkbox"
                checked={agreedSpectator}
                onChange={(e) => setAgreedSpectator(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-700 text-purple-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900 cursor-pointer accent-purple-600"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-semibold text-white block">
                  Spectator Mode & Public Standings Consent
                </span>
                <span className="text-zinc-400 leading-relaxed block">
                  I understand that contest standings are visible to room members and that spectator mode allows inspection of submissions and live code feeds.
                </span>
              </div>
            </label>

            {/* Condition 4 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-black/40 cursor-pointer transition-colors select-none">
              <input
                type="checkbox"
                checked={agreedHonorCode}
                onChange={(e) => setAgreedHonorCode(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-700 text-emerald-600 focus:ring-0 focus:ring-offset-0 bg-zinc-900 cursor-pointer accent-emerald-600"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-semibold text-white block">
                  Academic Honesty & Independent Execution
                </span>
                <span className="text-zinc-400 leading-relaxed block">
                  I certify that I am the registered candidate and will complete this assessment independently without external assistance, unauthorized AI generators, or pre-written snippets.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto border-zinc-800 bg-[#0C0E14] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl px-5 h-11 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Return to Lobby
            </Button>
          ) : (
            <div />
          )}

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
            {!allAgreed && (
              <span className="text-xs font-mono text-amber-400/90 text-center sm:text-right">
                ⚠️ Agree to all conditions above to unlock entry
              </span>
            )}
            <Button
              type="button"
              disabled={!allAgreed}
              onClick={onAcceptAndEnter}
              className={`w-full sm:w-auto px-7 h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
                allAgreed
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] cursor-pointer"
                  : "bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Agree & Enter Examination</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
export default ExamInstructionsGate;
