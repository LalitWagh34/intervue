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
          : "min-h-screen w-full bg-[var(--canvas)] text-[var(--text-primary)] flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 overflow-y-auto"
      }`}
    >
      <div
        className="w-full max-w-4xl bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 sm:p-6 flex flex-col gap-4 shadow-xl my-auto"
      >
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-subtle)] gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-primary)] font-semibold border border-[var(--border-control)]">
                Official Examination
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                Code: {room.code}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
              {room.title || "Contest Arena Examination"}
            </h1>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-3 text-xs bg-[var(--surface-muted)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 shrink-0">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono block">Candidate</span>
              <span className="font-medium text-[var(--text-primary)] truncate max-w-[120px] block" title={candidateName}>
                {candidateName}
              </span>
            </div>
            <div className="h-6 w-px bg-[var(--border-subtle)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono block">Duration</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">{room.duration} mins</span>
            </div>
            <div className="h-6 w-px bg-[var(--border-subtle)]" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono block">Questions</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">{totalQuestions} Problems</span>
            </div>
          </div>
        </div>

        {/* 2-Column Compact Layout (No Long Scrolling) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left Column: Layout & Environment Guide */}
          <div className="bg-[var(--surface-muted)]/60 border border-[var(--border-subtle)] rounded-lg p-4 space-y-3">
            <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2">
              <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              1. Workspace Layout
            </h2>

            <div className="space-y-2 text-[var(--text-secondary)] text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="font-mono text-[var(--text-primary)] font-bold shrink-0">Left:</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Problem Statement & MCQs.</strong> Full problem description, constraints, input/output formats, and sample test cases.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-[var(--text-primary)] font-bold shrink-0">Right:</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Code Editor.</strong> Monaco editor supporting C++, Java, Python, JavaScript, and TypeScript.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-[var(--text-primary)] font-bold shrink-0">Bottom:</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Test Runner Console.</strong> "Run Code" tests public/custom cases; "Submit Code" evaluates against hidden test suites.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-[var(--text-primary)] font-bold shrink-0">Top:</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Contest HUD.</strong> Questions drawer (switch problems anytime), authoritative timer, and finish assessment.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Strict Rules & Anti-Cheat Penalties */}
          <div className="bg-[var(--surface-muted)]/60 border border-[var(--border-subtle)] rounded-lg p-4 space-y-3">
            <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              2. Proctoring Rules & Penalties
            </h2>

            <div className="space-y-2 text-[var(--text-secondary)] text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="font-mono text-[var(--text-primary)] font-bold shrink-0">Focus:</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Focus-Exit & Tab-Switch Penalty.</strong> Leaving fullscreen, switching browser tabs, or losing window focus incurs an immediate infraction strike.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-[var(--text-primary)] font-bold shrink-0">Strikes:</span>
                <span>
                  <strong className="text-[var(--text-primary)]">3 Strikes Max.</strong> Strike 1: Warning logged. Strike 2: Final alert. Strike 3: <strong className="text-[var(--text-primary)]">Automatic disqualification and termination</strong>.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-[var(--text-primary)] font-bold shrink-0">Clipboard:</span>
                <span>
                  <strong className="text-[var(--text-primary)]">No External Pasting.</strong> Pasting foreign code blocks (&gt;120 chars) triggers a suspicious paste violation.
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono text-[var(--text-primary)] font-bold shrink-0">Live:</span>
                <span>
                  <strong className="text-[var(--text-primary)]">Leaderboard & Spectator Mode.</strong> Standings are live. After submitting, participants can spectate code and peer activity feeds.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Mandatory Agreement Checkboxes */}
        <div className="bg-[var(--surface-muted)]/70 border border-[var(--border-subtle)] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              3. Candidate Agreement & Declaration
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline cursor-pointer"
            >
              {allAgreed ? "Deselect All" : "Check All"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-start gap-2.5 p-2 rounded border border-[var(--border-subtle)] hover:border-[var(--border-control)] bg-[var(--surface)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={c1}
                onChange={(e) => setC1(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[var(--border-control)] bg-[var(--surface)] text-[var(--action-primary)] focus:ring-0 cursor-pointer accent-[var(--action-primary)]"
              />
              <span className="text-[var(--text-secondary)] text-[11px] leading-snug">
                I know where the question statement, code editor, test runner, and question palette are located.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded border border-[var(--border-subtle)] hover:border-[var(--border-control)] bg-[var(--surface)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={c2}
                onChange={(e) => setC2(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[var(--border-control)] bg-[var(--surface)] text-[var(--action-primary)] focus:ring-0 cursor-pointer accent-[var(--action-primary)]"
              />
              <span className="text-[var(--text-secondary)] text-[11px] leading-snug">
                I understand that switching tabs, minimizing, or exiting fullscreen incurs penalty strikes, and 3 strikes will result in disqualification.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded border border-[var(--border-subtle)] hover:border-[var(--border-control)] bg-[var(--surface)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={c3}
                onChange={(e) => setC3(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[var(--border-control)] bg-[var(--surface)] text-[var(--action-primary)] focus:ring-0 cursor-pointer accent-[var(--action-primary)]"
              />
              <span className="text-[var(--text-secondary)] text-[11px] leading-snug">
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
              className="w-full sm:w-auto border-[var(--border-control)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg h-9 px-4 text-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Return to Lobby
            </Button>
          ) : (
            <div />
          )}

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
            {!allAgreed && (
              <span className="text-[11px] font-mono text-[var(--text-muted)] text-center sm:text-right">
                Check all 3 conditions above to unlock entry
              </span>
            )}
            <Button
              type="button"
              disabled={!allAgreed}
              onClick={onAcceptAndEnter}
              className={`w-full sm:w-auto px-6 h-9 rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all ${
                allAgreed
                  ? "bg-[var(--action-primary)] text-[var(--on-primary)] hover:bg-[var(--action-primary-hover)] cursor-pointer shadow-sm"
                  : "bg-[var(--surface-muted)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-subtle)]"
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
