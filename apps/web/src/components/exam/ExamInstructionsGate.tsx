import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Maximize2,
  Terminal,
  FileText,
  Code2,
  Eye,
} from "lucide-react";
import { Button } from "../ui/button";

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
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);

  const allAgreed = c1 && c2 && c3;

  const handleSelectAll = () => {
    const next = !allAgreed;
    setC1(next);
    setC2(next);
    setC3(next);
  };

  const totalQuestions = room.questions?.length || 0;

  return (
    <div
      className={`w-full ${
        isModalView
          ? "p-0"
          : "min-h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 overflow-y-auto"
      }`}
    >
      <div
        className="w-full max-w-4xl bg-[#101014] border border-zinc-800 rounded-xl p-4 sm:p-6 flex flex-col gap-4 shadow-2xl my-auto"
      >
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                Official Examination
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                Code: {room.code}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {room.title || "Contest Arena Examination"}
            </h1>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-3 text-xs bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2 shrink-0">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Candidate</span>
              <span className="font-medium text-white truncate max-w-[120px] block" title={candidateName}>
                {candidateName}
              </span>
            </div>
            <div className="h-6 w-px bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Duration</span>
              <span className="font-mono font-semibold text-white">{room.duration} mins</span>
            </div>
            <div className="h-6 w-px bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Questions</span>
              <span className="font-mono font-semibold text-white">{totalQuestions} Problems</span>
            </div>
          </div>
        </div>

        {/* 2-Column Compact Layout (No Long Scrolling) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left Column: Layout & Environment Guide */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4 space-y-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/60 pb-2">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              1. Workspace Layout
            </h2>

            <div className="space-y-2 text-zinc-300 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="font-mono text-zinc-400 font-bold shrink-0">Left:</span>
                <span>
                  <strong>Problem Statement & MCQs.</strong> Full problem description, constraints, input/output formats, and sample test cases.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-zinc-400 font-bold shrink-0">Right:</span>
                <span>
                  <strong>Code Editor.</strong> Monaco editor supporting C++, Java, Python, JavaScript, and TypeScript.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-zinc-400 font-bold shrink-0">Bottom:</span>
                <span>
                  <strong>Test Runner Console.</strong> "Run Code" tests public/custom cases; "Submit Code" evaluates against hidden test suites.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-zinc-400 font-bold shrink-0">Top:</span>
                <span>
                  <strong>Contest HUD.</strong> Questions drawer (switch problems anytime), authoritative timer, and finish assessment.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Strict Rules & Anti-Cheat Penalties */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4 space-y-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/60 pb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
              2. Proctoring Rules & Penalties
            </h2>

            <div className="space-y-2 text-zinc-300 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="font-mono text-zinc-400 font-bold shrink-0">Focus:</span>
                <span>
                  <strong>Focus-Exit & Tab-Switch Penalty.</strong> Leaving fullscreen, switching browser tabs, or losing window focus incurs an immediate infraction strike.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-zinc-400 font-bold shrink-0">Strikes:</span>
                <span>
                  <strong>3 Strikes Max.</strong> Strike 1: Warning logged. Strike 2: Final alert. Strike 3: <strong>Automatic disqualification and termination</strong>.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-zinc-400 font-bold shrink-0">Clipboard:</span>
                <span>
                  <strong>No External Pasting.</strong> Pasting foreign code blocks (&gt;120 chars) triggers a suspicious paste violation.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-zinc-400 font-bold shrink-0">Live:</span>
                <span>
                  <strong>Leaderboard & Spectator Mode.</strong> Standings are live. After submitting, participants can spectate code and peer activity feeds.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Mandatory Agreement Checkboxes */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              3. Candidate Agreement & Declaration
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-mono text-zinc-400 hover:text-white underline cursor-pointer"
            >
              {allAgreed ? "Deselect All" : "Check All"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-start gap-2.5 p-2 rounded border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/40 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={c1}
                onChange={(e) => setC1(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-white focus:ring-0 cursor-pointer accent-white"
              />
              <span className="text-zinc-300 text-[11px] leading-snug">
                I know where the question statement, code editor, test runner, and question palette are located.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/40 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={c2}
                onChange={(e) => setC2(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-white focus:ring-0 cursor-pointer accent-white"
              />
              <span className="text-zinc-300 text-[11px] leading-snug">
                I understand that switching tabs, minimizing, or exiting fullscreen incurs penalty strikes, and 3 strikes will result in disqualification.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/40 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={c3}
                onChange={(e) => setC3(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-white focus:ring-0 cursor-pointer accent-white"
              />
              <span className="text-zinc-300 text-[11px] leading-snug">
                I acknowledge the live scoreboard, spectator rules, and certify that I will complete this assessment independently.
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg h-9 px-4 text-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Return to Lobby
            </Button>
          ) : (
            <div />
          )}

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
            {!allAgreed && (
              <span className="text-[11px] font-mono text-zinc-500 text-center sm:text-right">
                Check all 3 conditions above to unlock entry
              </span>
            )}
            <Button
              type="button"
              disabled={!allAgreed}
              onClick={onAcceptAndEnter}
              className={`w-full sm:w-auto px-6 h-9 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all ${
                allAgreed
                  ? "bg-white text-zinc-950 hover:bg-zinc-200 cursor-pointer shadow-sm"
                  : "bg-zinc-800/70 text-zinc-500 cursor-not-allowed border border-zinc-800"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>I Agree & Enter Exam</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamInstructionsGate;
