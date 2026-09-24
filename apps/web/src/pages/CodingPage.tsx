import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProblems, useProblem, useSubmissions } from "@/hooks/useProblems";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Editor, { type OnMount } from "@monaco-editor/react";
import { toast } from "sonner";

type MonacoEditor = Parameters<OnMount>[0];

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Play,
  Lightbulb,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Cpu,
  Sparkles,
  Terminal,
  X,
  RotateCcw,
  Maximize2,
  Minimize2,
  Check,
  Code2,
  History,
  FileCode2,
  Lock,
  Zap,
  Copy,
  TrendingUp,
} from "lucide-react";


// ============================================================
// LANGUAGE CONFIG & METADATA
// ============================================================

type Language =
  | "JAVASCRIPT"
  | "PYTHON"
  | "CPP"
  | "JAVA"
  | "TYPESCRIPT";

const LANGUAGE_MAP: Record<string, number> = {
  JAVASCRIPT: 63,
  PYTHON: 71,
  CPP: 54,
  JAVA: 62,
  TYPESCRIPT: 74,
};

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
  PYTHON: "python",
  CPP: "cpp",
  JAVA: "java",
};

const LANGUAGE_META: Record<Language, { label: string; icon: string; badge: string }> = {
  CPP: { label: "C++", icon: "⚙️", badge: "C++" },
  PYTHON: { label: "Python", icon: "🐍", badge: "Py" },
  JAVASCRIPT: { label: "JavaScript", icon: "🟡", badge: "JS" },
  TYPESCRIPT: { label: "TypeScript", icon: "🔵", badge: "TS" },
  JAVA: { label: "Java", icon: "☕", badge: "Java" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "text-[#22C55E] border-[#22C55E]/25 bg-[#22C55E]/10",
  MEDIUM: "text-[#F59E0B] border-[#F59E0B]/25 bg-[#F59E0B]/10",
  HARD: "text-[#EF4444] border-[#EF4444]/25 bg-[#EF4444]/10",
};

const formatMemory = (kb: number | null | undefined) => {
  if (kb == null) return "N/A";
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${kb} KB`;
};

const getVerdictConfig = (verdict: string) => {
  switch (verdict) {
    case "ACCEPTED":
      return {
        label: "Accepted",
        icon: CheckCircle2,
        color: "text-emerald-400",
        badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    case "WRONG_ANSWER":
      return {
        label: "Wrong Answer",
        icon: XCircle,
        color: "text-rose-400",
        badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      };
    case "COMPILATION_ERROR":
      return {
        label: "Compilation Error",
        icon: AlertTriangle,
        color: "text-rose-400",
        badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      };
    case "TLE":
      return {
        label: "Time Limit Exceeded",
        icon: Clock,
        color: "text-amber-400",
        badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    case "MLE":
      return {
        label: "Memory Limit Exceeded",
        icon: AlertTriangle,
        color: "text-amber-400",
        badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    case "RUNTIME_ERROR":
      return {
        label: "Runtime Error",
        icon: XCircle,
        color: "text-rose-400",
        badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      };
    default:
      return {
        label: verdict || "Judge Error",
        icon: AlertTriangle,
        color: "text-zinc-400",
        badgeBg: "bg-zinc-800 text-zinc-400 border-zinc-700",
      };
  }
};

type ActiveTab =
  | "description"
  | "submissions"
  | "hints";

type CodeByLanguage = Record<string, string>;

const DEFAULT_STARTER_CODE: Record<Language, string> = {
  CPP: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    int target;
    cin >> target;

    // Write your code here

    return 0;
}`,
  PYTHON: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    nums = [int(x) for x in input_data[1:1+n]]
    target = int(input_data[1+n])

    # Write your code here


if __name__ == '__main__':
    solve()`,
  JAVASCRIPT: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, 1 + n).map(Number);
    const target = parseInt(input[1 + n], 10);

    // Write your code here

}

solve();`,
  TYPESCRIPT: `import * as fs from 'fs';

function solve(): void {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, 1 + n).map(Number);
    const target = parseInt(input[1 + n], 10);

    // Write your code here

}

solve();`,
  JAVA: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }
        int target = sc.nextInt();

        // Write your code here

    }
}`,
};


// ============================================================
// COMPONENT
// ============================================================

export default function CodingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: problems } = useProblems();
  const { data: problem, isLoading } = useProblem(slug);
  const { data: submissions, isLoading: isSubmissionsLoading } = useSubmissions(slug);

  // ----------------------------------------------------------
  // Editor & Workspace State
  // ----------------------------------------------------------

  const [language, setLanguage] = useState<Language>("JAVASCRIPT");
  const [code, setCode] = useState("");
  const [codeByLanguage, setCodeByLanguage] = useState<CodeByLanguage>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>("description");
  const [results, setResults] = useState<any>(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  // UI enhancement states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<"result" | "testcases">("testcases");
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [selectedResultCaseIdx, setSelectedResultCaseIdx] = useState(0);
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [previewSubmission, setPreviewSubmission] = useState<any | null>(null);

  // ----------------------------------------------------------
  // Resizable split states
  // ----------------------------------------------------------

  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("intervue_split_width");
        if (saved) {
          const num = parseFloat(saved);
          if (!isNaN(num) && num >= 20 && num <= 75) return num;
        }
      } catch (e) {
        // ignore
      }
    }
    return 42; // default 42%
  });

  const [bottomHeightPx, setBottomHeightPx] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("intervue_bottom_height");
        if (saved) {
          const num = parseInt(saved, 10);
          if (!isNaN(num) && num >= 150 && num <= 600) return num;
        }
      } catch (e) {
        // ignore
      }
    }
    return 320; // default 320px
  });

  // References
  const editorRef = useRef<MonacoEditor | null>(null);
  const initializedProblemRef = useRef<string | null>(null);
  const saveDraftTimeoutRef = useRef<any>(null);
  const previousCodeRef = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);

  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);

  // ----------------------------------------------------------
  // Horizontal Resizing (Left Panel vs Right Editor)
  // ----------------------------------------------------------

  const startHorizontalDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingH(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPercent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(20, Math.min(75, newPercent));
      setLeftWidthPercent(clamped);
      try {
        localStorage.setItem("intervue_split_width", String(clamped));
      } catch (err) {
        // ignore
      }
    };

    const onPointerUp = () => {
      setIsDraggingH(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // ----------------------------------------------------------
  // Vertical Resizing (Editor vs Bottom Drawer)
  // ----------------------------------------------------------

  const startVerticalDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingV(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!editorAreaRef.current) return;
      const rect = editorAreaRef.current.getBoundingClientRect();
      const newHeight = rect.bottom - moveEvent.clientY;
      const maxHeight = rect.height * 0.75;
      const clamped = Math.max(160, Math.min(maxHeight, newHeight));
      setBottomHeightPx(clamped);
      try {
        localStorage.setItem("intervue_bottom_height", String(clamped));
      } catch (err) {
        // ignore
      }
    };

    const onPointerUp = () => {
      setIsDraggingV(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // ----------------------------------------------------------
  // Keyboard shortcut listener (Esc for fullscreen)
  // ----------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);


  // ==========================================================
  // AVAILABLE LANGUAGES
  // ==========================================================

  const availableLanguages: Language[] = useMemo(() => {
    if (problem?.templates && problem.templates.length > 0) {
      return problem.templates.map((t: any) => t.language as Language);
    }
    return Object.keys(LANGUAGE_MAP) as Language[];
  }, [problem]);


  // ==========================================================
  // STARTER CODE & LOCAL DRAFTS
  // ==========================================================

  const getStarterCode = (selectedLanguage: Language = language) => {
    const template = problem?.templates?.find(
      (t: any) => t.language === selectedLanguage
    );
    return template?.code ?? DEFAULT_STARTER_CODE[selectedLanguage] ?? "";
  };

  const getInitialCodeForLanguage = (targetLang: Language) => {
    if (slug) {
      try {
        const savedDraft = localStorage.getItem(`intervue_draft_${slug}_${targetLang}`);
        if (savedDraft != null && savedDraft.trim().length > 0) {
          return savedDraft;
        }
      } catch (e) {
        console.error("Failed to read draft from localStorage", e);
      }
    }
    return getStarterCode(targetLang);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setCodeByLanguage((prev) => ({
      ...prev,
      [language]: newCode,
    }));

    // Debounce write to localStorage
    if (slug) {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
      }
      saveDraftTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(`intervue_draft_${slug}_${language}`, newCode);
        } catch (e) {
          console.error("Failed to save draft to localStorage", e);
        }
      }, 400);
    }
  };


  // ==========================================================
  // MONACO LANGUAGE
  // ==========================================================

  const monacoLanguage = useMemo(() => {
    return MONACO_LANGUAGE_MAP[language] ?? "plaintext";
  }, [language]);


  // ==========================================================
  // INITIALIZE CODE WHEN PROBLEM LOADS
  // ==========================================================

  useEffect(() => {
    if (!problem) return;

    if (initializedProblemRef.current === problem.slug) {
      return;
    }

    initializedProblemRef.current = problem.slug;

    const availableLangs =
      problem.templates?.map((t: any) => t.language as Language) ?? [];

    const initialLanguage: Language =
      availableLangs.length > 0 && !availableLangs.includes(language)
        ? availableLangs[0]
        : language;

    if (initialLanguage !== language) {
      setLanguage(initialLanguage);
    }

    const initialCode = getInitialCodeForLanguage(initialLanguage);

    setCodeByLanguage({
      [initialLanguage]: initialCode,
    });

    setCode(initialCode);
    setResults(null);
    setAiFeedback("");
    setShowFeedback(false);
  }, [problem]);


  // ==========================================================
  // LANGUAGE CHANGE
  // ==========================================================

  const handleLanguageChange = (newLanguage: Language) => {
    if (newLanguage === language) return;

    // Save current editor contents in memory
    setCodeByLanguage((prev) => ({
      ...prev,
      [language]: code,
    }));

    setLanguage(newLanguage);

    // If already in memory for this session, restore
    const existingCode = codeByLanguage[newLanguage];
    if (existingCode !== undefined) {
      setCode(existingCode);
      return;
    }

    // Check draft or fallback to starter template
    const loadedCode = getInitialCodeForLanguage(newLanguage);
    setCode(loadedCode);
    setCodeByLanguage((prev) => ({
      ...prev,
      [newLanguage]: loadedCode,
    }));
  };


  // ==========================================================
  // RESET CODE
  // ==========================================================

  const handleResetCode = () => {
    previousCodeRef.current = code;
    const defaultCode = getStarterCode(language);

    if (slug) {
      try {
        localStorage.removeItem(`intervue_draft_${slug}_${language}`);
      } catch (e) {
        console.error("Failed to remove draft from localStorage", e);
      }
    }

    setCode(defaultCode);
    setCodeByLanguage((prev) => ({
      ...prev,
      [language]: defaultCode,
    }));
    setIsResetDialogOpen(false);

    toast.success(`Reset ${LANGUAGE_META[language].label} code to starter template`, {
      action: {
        label: "Undo",
        onClick: () => {
          const restored = previousCodeRef.current;
          setCode(restored);
          setCodeByLanguage((prev) => ({
            ...prev,
            [language]: restored,
          }));
          if (slug) {
            try {
              localStorage.setItem(`intervue_draft_${slug}_${language}`, restored);
            } catch (e) {
              console.error(e);
            }
          }
          toast.info("Restored previous code");
        },
      },
    });
  };


  // ==========================================================
  // RESTORE SUBMISSION CODE
  // ==========================================================

  const handleRestoreSubmissionCode = (sub: any) => {
    const subLang = sub.language as Language;
    if (subLang in LANGUAGE_MAP) {
      setLanguage(subLang);
    }
    setCode(sub.sourceCode);
    setCodeByLanguage((prev) => ({
      ...prev,
      [subLang]: sub.sourceCode,
    }));

    if (slug) {
      try {
        localStorage.setItem(`intervue_draft_${slug}_${subLang}`, sub.sourceCode);
      } catch (e) {
        console.error(e);
      }
    }

    setPreviewSubmission(null);
    toast.success(`Loaded submission #${sub.id} into editor`);
  };


  // ==========================================================
  // EDITOR MOUNT & SHORTCUTS
  // ==========================================================

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();

    // Ctrl + Enter / Cmd + Enter triggers official submission
    editor.addCommand(2048 + 3, () => {
      if (!submitMutation.isPending && !runMutation.isPending && problem) {
        submitMutation.mutate();
      }
    });

    // Ctrl + ' / Cmd + ' triggers sample run
    editor.addCommand(2048 + 84, () => {
      if (!runMutation.isPending && !submitMutation.isPending && problem) {
        runMutation.mutate();
      }
    });
  };


  // ==========================================================
  // RUN SAMPLE MUTATION
  // ==========================================================

  const runMutation = useMutation({
    mutationFn: async () => {
      if (!problem) throw new Error("Problem not loaded");

      const res = await api.post("/code/run", {
        sourceCode: code,
        language,
        languageId: LANGUAGE_MAP[language],
        problemId: problem.id,
        problemSlug: slug,
      });

      return res.data;
    },

    onSuccess: (data) => {
      setResults(data);
      setShowBottomPanel(true);
      setBottomTab("result");
      setSelectedResultCaseIdx(0);
      setAiFeedback("");
      setShowFeedback(false);

      if (data.verdict === "ACCEPTED") {
        toast.success("Sample Tests Passed!", {
          description: `All ${data.totalTestCases} sample test cases passed in ${data.runtime} ms`,
        });
      } else {
        toast.error(`Sample Run: ${data.verdict}`, {
          description: `${data.passedCount}/${data.totalTestCases} sample test cases passed`,
        });
      }
    },

    onError: (error: any) => {
      console.error("Sample execution failed:", error);
      setResults({
        verdict: "JUDGE_ERROR",
        mode: "run",
        stderr:
          error?.response?.data?.error ??
          error?.message ??
          "Failed to execute sample test cases",
      });
      setShowBottomPanel(true);
      setBottomTab("result");
    },
  });


  // ==========================================================
  // AUTHORITATIVE SUBMISSION MUTATION
  // ==========================================================

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!problem) throw new Error("Problem not loaded");

      const res = await api.post("/code/submit", {
        sourceCode: code,
        language,
        languageId: LANGUAGE_MAP[language],
        problemId: problem.id,
        problemSlug: slug,
      });

      return res.data;
    },

    onSuccess: (data) => {
      setResults(data);
      setShowBottomPanel(true);
      setBottomTab("result");
      setSelectedResultCaseIdx(0);

      // Invalidate submissions query so new submission appears in Submissions tab
      queryClient.invalidateQueries({ queryKey: ["submissions", slug] });

      setAiFeedback("");
      setShowFeedback(false);

      if (data.verdict === "ACCEPTED") {
        toast.success("Accepted!", {
          description: `All ${data.totalTestCases} test cases passed! Runtime: ${data.runtime} ms`,
        });
      } else {
        toast.error(`Verdict: ${data.verdict}`, {
          description: `${data.passedCount}/${data.totalTestCases} test cases passed`,
        });
      }
    },

    onError: (error: any) => {
      console.error("Code submission failed:", error);
      setResults({
        verdict: "JUDGE_ERROR",
        mode: "submit",
        stderr:
          error?.response?.data?.error ??
          error?.message ??
          "Failed to evaluate submission",
      });
      setShowBottomPanel(true);
      setBottomTab("result");
    },
  });


  // ==========================================================
  // AI FEEDBACK MUTATION
  // ==========================================================

  const aiFeedbackMutation = useMutation({
    mutationFn: async () => {
      if (!problem) throw new Error("Problem not loaded");

      const res = await api.post("/code/evaluate", {
        sourceCode: code,
        language,
        problemTitle: problem.title,
        problemDescription: problem.description,
        verdict: results?.verdict,
      });

      return res.data;
    },

    onSuccess: (data) => {
      setAiFeedback(data.feedback);
      setShowFeedback(true);
    },

    onError: (error) => {
      console.error("AI feedback failed:", error);
      toast.error("Failed to generate AI feedback");
    },
  });


  // Sample test cases for bottom drawer
  const visibleCases = useMemo(() => {
    if (problem?.examples && problem.examples.length > 0) {
      return problem.examples;
    }
    if (problem?.testCases && problem.testCases.length > 0) {
      return problem.testCases.map((tc: any) => ({
        input: tc.input,
        output: tc.expectedOutput,
      }));
    }
    return [];
  }, [problem]);


  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading problem...</span>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-zinc-400">
        <p className="text-lg font-medium text-white mb-2">Problem not found</p>
        <Link to="/coding" className="text-sm text-green-400 hover:underline">
          Browse available problems
        </Link>
      </div>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="flex flex-col h-screen bg-[#0B0C0F] text-[#F5F7FA] select-none overflow-hidden font-sans">

      {/* ==================================================== */}
      {/* TOP BAR */}
      {/* ==================================================== */}

      <div className="h-12 border-b border-[#1E2229] px-4 flex items-center justify-between bg-[#101216] shrink-0">
        
        {/* Left — Navigation & Problem Info */}
        <div className="flex items-center gap-3">
          <Link
            to="/coding"
            className="text-[#A1A7B3] hover:text-[#F5F7FA] transition-colors p-1 -ml-1 rounded-md hover:bg-[#191C22]"
            title="Back to Problems"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>

          <span className="font-semibold text-sm text-[#F5F7FA]">
            {problem.title}
          </span>

          <Badge
            variant="outline"
            className={cn("text-[11px] px-2 py-0.5 font-semibold", DIFFICULTY_COLORS[problem.difficulty])}
          >
            {problem.difficulty}
          </Badge>
        </div>

        {/* Right — Actions & Controls */}
        <div className="flex items-center gap-2">

          {/* Reset Code Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsResetDialogOpen(true)}
            className="border-[#272B33] hover:bg-[#191C22] text-[#A1A7B3] hover:text-[#F5F7FA] h-8 px-2.5 text-xs gap-1.5"
            title="Reset code to default starter template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          {/* Better Custom Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="bg-[#14161B] border-[#272B33] hover:bg-[#191C22] text-[#F5F7FA] h-8 px-3 text-xs gap-2 font-mono"
              >
                <span>{LANGUAGE_META[language].icon}</span>
                <span>{LANGUAGE_META[language].label}</span>
                <ChevronDown className="w-3 h-3 text-[#A1A7B3] opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#14161B] border-[#272B33] text-[#F5F7FA] w-44 p-1"
            >
              {availableLanguages.map((lang) => {
                const meta = LANGUAGE_META[lang];
                const isSelected = lang === language;
                return (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={cn(
                      "flex items-center justify-between text-xs py-2 px-2.5 rounded-md cursor-pointer",
                      isSelected
                        ? "bg-[#2F80ED]/15 text-[#3B9CFF] font-medium"
                        : "text-[#A1A7B3] hover:bg-[#191C22] hover:text-[#F5F7FA]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{meta.icon}</span>
                      <span>{meta.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#3B9CFF]" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen Mode Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="border-[#272B33] hover:bg-[#191C22] text-[#A1A7B3] hover:text-[#F5F7FA] h-8 w-8 p-0"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Editor"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>

          {/* Dual Action: Run & Submit Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending || submitMutation.isPending}
              className="border-[#272B33] bg-[#16181D] hover:bg-[#1E2128] text-zinc-200 hover:text-white text-xs h-8 px-3 gap-1.5 font-medium cursor-pointer transition-all"
              title="Run sample test cases (Ctrl + ')"
            >
              <Play className={cn("w-3.5 h-3.5 text-zinc-300 fill-current", runMutation.isPending && "animate-pulse")} />
              <span>{runMutation.isPending ? "Running..." : "Run"}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => submitMutation.mutate()}
              disabled={runMutation.isPending || submitMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-4 gap-1.5 font-semibold shadow-md shadow-emerald-950/40 cursor-pointer transition-all active:scale-[0.98]"
              title="Submit solution to all test cases (Ctrl + Enter)"
            >
              <CheckCircle2 className={cn("w-3.5 h-3.5", submitMutation.isPending && "animate-spin")} />
              <span>{submitMutation.isPending ? "Submitting..." : "Submit"}</span>
            </Button>
          </div>

        </div>
      </div>


      {/* ==================================================== */}
      {/* MAIN SPLIT WORKSPACE WITH RESIZABLE DIVIDER */}
      {/* ==================================================== */}

      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-hidden relative flex",
          isFullscreen && "fixed inset-0 z-50 bg-zinc-950"
        )}
      >

        {/* Floating exit fullscreen banner */}
        {isFullscreen && (
          <div className="absolute top-3 right-4 z-50 flex items-center gap-2 bg-zinc-900/90 border border-zinc-700 px-3 py-1.5 rounded-lg shadow-xl backdrop-blur">
            <span className="text-xs text-zinc-400">Focus Mode</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(false)}
              className="h-6 text-[11px] px-2 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            >
              Exit (Esc)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending || submitMutation.isPending}
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-[11px] h-6 px-2.5 gap-1"
            >
              <Play className="w-3 h-3 fill-current" />
              {runMutation.isPending ? "Running..." : "Run"}
            </Button>
            <Button
              size="sm"
              onClick={() => submitMutation.mutate()}
              disabled={runMutation.isPending || submitMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-6 px-3 gap-1 font-semibold"
            >
              <CheckCircle2 className="w-3 h-3" />
              {submitMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </div>
        )}

        {/* Global drag capture overlay so Monaco editor never swallows pointer events */}
        {(isDraggingH || isDraggingV) && (
          <div
            className="fixed inset-0 z-50 select-none"
            style={{
              cursor: isDraggingH ? "col-resize" : "row-resize",
            }}
          />
        )}

        {/* ================================================ */}
        {/* LEFT PANEL — PROBLEM / HINTS / SUBMISSIONS */}
        {/* ================================================ */}

        {!isFullscreen && (
          <>
            <div
              style={{
                width: `${leftWidthPercent}%`,
                minWidth: "300px",
                maxWidth: "calc(100% - 350px)",
              }}
              className="flex flex-col bg-zinc-950 overflow-hidden shrink-0 border-r border-zinc-800/80"
            >
              {/* Tabs */}
              <div className="flex border-b border-zinc-800/80 shrink-0 bg-zinc-900/30 px-2">
                {(
                  [
                    { id: "description" as const, label: "Description", count: undefined },
                    { id: "hints" as const, label: "Hints", count: undefined },
                    {
                      id: "submissions" as const,
                      label: "Submissions",
                      count: submissions?.length,
                    },
                  ]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-2.5 text-xs font-medium transition-colors relative flex items-center gap-1.5",
                      activeTab === tab.id
                        ? "text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                        {tab.count}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Problem Tab Content */}
              <div className="flex-1 overflow-y-auto p-5 select-text space-y-6">

                {/* TAB 1: DESCRIPTION */}
                {activeTab === "description" && (
                  <div className="space-y-6">
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {problem.description}
                    </p>

                    {/* Examples */}
                    {problem.examples?.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-white font-medium text-xs uppercase tracking-wider text-zinc-400">
                          Examples
                        </p>
                        {problem.examples.map((example: any, index: number) => (
                          <div
                            key={index}
                            className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-3.5 text-xs font-mono space-y-1.5"
                          >
                            <div className="flex gap-2">
                              <span className="text-zinc-400 select-none">Input:</span>
                              <span className="text-zinc-200 whitespace-pre-wrap">{example.input}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-zinc-400 select-none">Output:</span>
                              <span className="text-zinc-200 whitespace-pre-wrap">{example.output}</span>
                            </div>
                            {example.explanation && (
                              <p className="text-zinc-500 font-sans text-[11px] pt-1 border-t border-zinc-800/50">
                                Explanation: {example.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Constraints */}
                    {problem.constraints && (
                      <div className="space-y-2">
                        <p className="text-white font-medium text-xs uppercase tracking-wider text-zinc-400">
                          Constraints
                        </p>
                        <pre className="text-zinc-400 text-xs font-mono bg-zinc-900/50 border border-zinc-800/60 p-3 rounded-lg whitespace-pre-wrap">
                          {problem.constraints}
                        </pre>
                      </div>
                    )}

                    {/* Tags */}
                    {problem.tags?.length > 0 && (
                      <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                        {problem.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: HINTS */}
                {activeTab === "hints" && (
                  <div className="space-y-3">
                    {problem.hints?.length > 0 ? (
                      problem.hints.map((hint: string, index: number) => (
                        <div
                          key={index}
                          className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3.5 text-xs space-y-1"
                        >
                          <p className="text-amber-400 font-medium flex items-center gap-1.5 text-xs">
                            <Lightbulb className="w-3.5 h-3.5" />
                            Hint {index + 1}
                          </p>
                          <p className="text-zinc-300 leading-relaxed font-sans">{hint}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500 text-xs italic">No hints available for this problem.</p>
                    )}
                  </div>
                )}

                {/* TAB 3: SUBMISSIONS HISTORY */}
                {activeTab === "submissions" && (
                  <div className="space-y-3">
                    {isSubmissionsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-zinc-900/50 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : submissions && submissions.length > 0 ? (
                      submissions.map((sub) => {
                        const config = getVerdictConfig(sub.verdict);
                        const Icon = config.icon;
                        const formattedDate = new Date(sub.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={sub.id}
                            className="bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-3 text-xs flex flex-col gap-2 hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={cn("w-4 h-4", config.color)} />
                                <span className={cn("font-medium", config.color)}>
                                  {config.label}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                                  {LANGUAGE_META[sub.language as Language]?.label || sub.language}
                                </span>
                              </div>
                              <span className="text-[11px] text-zinc-500 font-mono">{formattedDate}</span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/50">
                              <div className="flex items-center gap-3 font-mono">
                                {sub.runtime != null && <span>{sub.runtime}ms</span>}
                                {sub.memory != null && <span>{formatMemory(sub.memory)}</span>}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setPreviewSubmission(sub)}
                                  className="h-6 text-[11px] px-2 text-zinc-400 hover:text-white"
                                >
                                  View Code
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRestoreSubmissionCode(sub)}
                                  className="h-6 text-[11px] px-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                >
                                  Load Code
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-zinc-500 space-y-2">
                        <History className="w-8 h-8 mx-auto stroke-[1.5] text-zinc-600" />
                        <p className="text-xs">No submissions yet for this problem.</p>
                        <p className="text-[11px] text-zinc-600">Click &quot;Run code&quot; to test your solution!</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Horizontal Resize Separator */}
            <div
              onPointerDown={startHorizontalDrag}
              onDoubleClick={() => {
                setLeftWidthPercent(42);
                try {
                  localStorage.setItem("intervue_split_width", "42");
                } catch (err) {}
              }}
              className={cn(
                "relative w-2 group cursor-col-resize shrink-0 flex items-center justify-center transition-colors select-none z-30",
                isDraggingH ? "bg-emerald-500" : "bg-zinc-900 hover:bg-zinc-800"
              )}
              title="Drag to resize problem panel (Double-click to reset)"
            >
              {/* Expanded invisible hit area (18px wide) */}
              <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize z-10" />

              {/* Visual grip bar */}
              <div
                className={cn(
                  "w-0.5 h-8 rounded-full transition-colors",
                  isDraggingH ? "bg-white" : "bg-zinc-600 group-hover:bg-zinc-300"
                )}
              />
            </div>
          </>
        )}


        {/* ================================================ */}
        {/* RIGHT PANEL — EDITOR & DRAWER */}
        {/* ================================================ */}

        <div
          ref={editorAreaRef}
          className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#1e1e1e]"
        >
          
          {/* TOP: MONACO EDITOR */}
          <div className="flex-1 min-h-0 flex flex-col relative">
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={monacoLanguage}
                value={code}
                onChange={(value) => handleCodeChange(value ?? "")}
                onMount={handleEditorMount}
                theme="vs-dark"
                loading={
                  <div className="h-full bg-[#1e1e1e] flex items-center justify-center text-zinc-500 text-sm">
                    Loading editor...
                  </div>
                }
                options={{
                  fontSize: 14,
                  fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
                  fontLigatures: true,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  lineNumbers: "on",
                  folding: true,
                  foldingHighlight: true,
                  bracketPairColorization: { enabled: true },
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  tabSize: 2,
                  insertSpaces: true,
                  wordWrap: "off",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  renderWhitespace: "selection",
                  guides: { indentation: true },
                  minimap: { enabled: false },
                  selectionHighlight: true,
                  contextmenu: true,
                  roundedSelection: false,
                }}
              />
            </div>

            {/* Editor Footer Bar */}
            <div className="h-8 border-t border-zinc-800/80 bg-zinc-900/60 px-3 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowBottomPanel(!showBottomPanel);
                    if (!showBottomPanel && !results) {
                      setBottomTab("testcases");
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded text-zinc-400 hover:text-white transition-colors",
                    (showBottomPanel || results) && "bg-zinc-800 text-zinc-200"
                  )}
                >
                  <Terminal className="w-3 h-3" />
                  <span>Console & Test Cases</span>
                </button>
              </div>

              <div className="flex items-center gap-3 font-mono text-[10px]">
                <span>Spaces: 2</span>
                <span>UTF-8</span>
                <span>{LANGUAGE_META[language].label}</span>
              </div>
            </div>
          </div>


          {/* VERTICAL SEPARATOR (When bottom panel open) */}
          {(showBottomPanel || results) && (
            <div
              onPointerDown={startVerticalDrag}
              onDoubleClick={() => {
                setBottomHeightPx(320);
                try {
                  localStorage.setItem("intervue_bottom_height", "320");
                } catch (err) {}
              }}
              className={cn(
                "relative h-2 group cursor-row-resize shrink-0 flex items-center justify-center transition-colors select-none z-30",
                isDraggingV ? "bg-emerald-500" : "bg-zinc-900 hover:bg-zinc-800"
              )}
              title="Drag to resize test cases drawer (Double-click to reset)"
            >
              {/* Expanded invisible hit area (18px tall) */}
              <div className="absolute inset-x-0 -top-2 -bottom-2 cursor-row-resize z-10" />

              {/* Visual grip bar */}
              <div
                className={cn(
                  "h-0.5 w-8 rounded-full transition-colors",
                  isDraggingV ? "bg-white" : "bg-zinc-600 group-hover:bg-zinc-300"
                )}
              />
            </div>
          )}


          {/* BOTTOM: TEST CASES & RESULT DRAWER */}
          {(showBottomPanel || results) && (
            <div
              style={{
                height: `${bottomHeightPx}px`,
                minHeight: "160px",
                maxHeight: "75%",
              }}
              className="flex flex-col bg-zinc-950 overflow-hidden shrink-0 border-t border-zinc-800/80"
            >
              
              {/* Drawer Tabs */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 bg-zinc-900/40 shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBottomTab("testcases")}
                    className={cn(
                      "px-3 py-2 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors",
                      bottomTab === "testcases"
                        ? "text-white border-emerald-500"
                        : "text-zinc-400 border-transparent hover:text-zinc-200"
                    )}
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>Test Cases</span>
                  </button>

                  {results && (
                    <button
                      onClick={() => setBottomTab("result")}
                      className={cn(
                        "px-3 py-2 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors",
                        bottomTab === "result"
                          ? "text-white border-emerald-500"
                          : "text-zinc-400 border-transparent hover:text-zinc-200"
                      )}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Result</span>
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          results.verdict === "ACCEPTED" ? "bg-emerald-400" : "bg-rose-400"
                        )}
                      />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowBottomPanel(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1"
                  title="Collapse Drawer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>


              {/* Drawer Content Area */}
              <div className="flex-1 overflow-y-auto p-4 select-text">
                
                {/* TAB: TEST CASES */}
                {bottomTab === "testcases" && (
                  <div className="space-y-4">
                    {visibleCases.length > 0 ? (
                      <>
                        {/* Case selector tabs */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {visibleCases.map((_: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedCaseIndex(idx)}
                              className={cn(
                                "px-3 py-1 rounded text-xs font-mono transition-colors",
                                selectedCaseIndex === idx
                                  ? "bg-zinc-800 text-white font-medium"
                                  : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                              )}
                            >
                              Case {idx + 1}
                            </button>
                          ))}
                        </div>

                        {/* Case details */}
                        {visibleCases[selectedCaseIndex] && (
                          <div className="space-y-3">
                            <div>
                              <p className="text-[11px] font-medium text-zinc-400 mb-1">Input</p>
                              <pre className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-lg text-xs font-mono text-zinc-200 whitespace-pre-wrap">
                                {visibleCases[selectedCaseIndex].input}
                              </pre>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-zinc-400 mb-1">Expected Output</p>
                              <pre className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-lg text-xs font-mono text-zinc-200 whitespace-pre-wrap">
                                {visibleCases[selectedCaseIndex].output}
                              </pre>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-zinc-500">No test cases found.</p>
                    )}
                  </div>
                )}


                {/* TAB: RESULT */}
                {bottomTab === "result" && results && (() => {
                  const config = getVerdictConfig(results.verdict);
                  const VerdictIcon = config.icon;
                  const executedTestCases = results.results || [];
                  const totalCount = results.totalTestCases || executedTestCases.length;
                  const passedCount = results.passedCount ?? executedTestCases.filter((tc: any) => tc.verdict === "ACCEPTED").length;
                  const isAccepted = results.verdict === "ACCEPTED";
                  const isCompilationError = results.verdict === "COMPILATION_ERROR";
                  const isTLE = results.verdict === "TLE";
                  const isMLE = results.verdict === "MLE";
                  const isRuntimeError = results.verdict === "RUNTIME_ERROR";
                  const isJudgeError = results.verdict === "JUDGE_ERROR";

                  // Active test case for inspection
                  const activeCase = executedTestCases[selectedResultCaseIdx] || executedTestCases[0];

                  return (
                    <div className="space-y-4">
                      {/* Result Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <VerdictIcon className={cn("w-5 h-5 shrink-0", config.color)} />
                          <span className={cn("text-base font-bold", config.color)}>
                            {config.label}
                          </span>

                          {/* Mode Badge */}
                          {results.mode === "run" ? (
                            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono uppercase tracking-wider">
                              Sample Run
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
                              Official Submission
                            </Badge>
                          )}

                          {totalCount > 0 && !isCompilationError && !isJudgeError && (
                            <span className="text-xs text-zinc-400 font-mono">
                              ({passedCount}/{totalCount} test cases passed)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 text-xs h-7 gap-1.5"
                            onClick={() => aiFeedbackMutation.mutate()}
                            disabled={aiFeedbackMutation.isPending}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            {aiFeedbackMutation.isPending ? "Analyzing..." : "Get AI feedback"}
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {totalCount > 0 && !isCompilationError && !isJudgeError && (
                        <div className="space-y-1">
                          <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-500 rounded-full",
                                isAccepted
                                  ? "bg-emerald-500"
                                  : passedCount > 0
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              )}
                              style={{ width: `${Math.max(5, Math.round((passedCount / totalCount) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Compilation Error Output */}
                      {isCompilationError && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
                            <Terminal className="w-3.5 h-3.5" />
                            <span>Compilation Diagnostic</span>
                          </div>
                          <pre className="p-3 bg-zinc-950 border border-rose-900/40 rounded-lg text-xs font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap max-h-56">
                            {results.compileOutput || results.stderr || "Compilation failed with unknown error."}
                          </pre>
                        </div>
                      )}

                      {/* Judge Error Output */}
                      {isJudgeError && (
                        <div className="p-3.5 bg-zinc-900/80 border border-amber-900/40 rounded-lg text-xs space-y-2">
                          <div className="flex items-center gap-2 text-amber-400 font-semibold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Execution Engine Notice</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed">
                            {results.stderr || "The remote Judge0 execution engine did not respond in time. Please verify that Judge0 Docker container is active on port 2358."}
                          </p>
                        </div>
                      )}

                      {/* Time Limit Exceeded Note */}
                      {isTLE && (
                        <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-xs flex items-center justify-between">
                          <span className="text-amber-300">
                            Your solution exceeded the allowed execution time limit. Check for infinite loops, suboptimal complexity, or recursive depth.
                          </span>
                          <span className="font-mono text-amber-400 shrink-0 ml-3 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                            Time limit: {problem?.timeLimit ?? 1000} ms
                          </span>
                        </div>
                      )}

                      {/* Memory Limit Exceeded Note */}
                      {isMLE && (
                        <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-xs flex items-center justify-between">
                          <span className="text-amber-300">
                            Your solution exceeded the memory ceiling. Check for unbounded data structures or recursive call stacks.
                          </span>
                          <span className="font-mono text-amber-400 shrink-0 ml-3 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                            Memory limit: {problem?.memoryLimit ?? 256} MB
                          </span>
                        </div>
                      )}

                      {/* Runtime Error Stderr */}
                      {isRuntimeError && (
                        <div className="space-y-1.5">
                          <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-lg text-xs text-rose-300">
                            Your solution encountered an unhandled runtime error (e.g. segmentation fault, null reference, or index out of bounds).
                          </div>
                          {results.stderr && (
                            <pre className="p-3 bg-zinc-950 border border-rose-900/40 rounded-lg text-xs font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap max-h-40">
                              {results.stderr}
                            </pre>
                          )}
                        </div>
                      )}

                      {/* Runtime & Memory Summary Cards with Percentiles */}
                      {(results.runtime != null || results.memory != null) && !isCompilationError && !isJudgeError && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Runtime Card */}
                          <div className="bg-[#0E1015] border border-zinc-800/90 rounded-xl p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Zap className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                                  Runtime
                                </div>
                                <div className="text-base font-bold font-mono text-zinc-100">
                                  {results.runtime != null ? `${results.runtime} ms` : "N/A"}
                                </div>
                              </div>
                            </div>
                            {results.runtimePercentile != null && (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                                  <TrendingUp className="w-3 h-3" />
                                  Beats {results.runtimePercentile}%
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Memory Card */}
                          <div className="bg-[#0E1015] border border-zinc-800/90 rounded-xl p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <Cpu className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                                  Memory
                                </div>
                                <div className="text-base font-bold font-mono text-zinc-100">
                                  {formatMemory(results.memory)}
                                </div>
                              </div>
                            </div>
                            {results.memoryPercentile != null && (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                                  <TrendingUp className="w-3 h-3" />
                                  Beats {results.memoryPercentile}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Multi-Testcase Selector Tabs & Diff Viewer */}
                      {!isCompilationError && executedTestCases.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                              Test Cases Evaluation
                            </p>
                            <span className="text-[11px] text-zinc-500">
                              Click any testcase to inspect I/O & diff
                            </span>
                          </div>

                          {/* Testcase Pills */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {executedTestCases.map((tc: any, index: number) => {
                              const tcPassed = tc.verdict === "ACCEPTED";
                              const isSelected = selectedResultCaseIdx === index;

                              return (
                                <button
                                  key={tc.testCaseId ?? index}
                                  onClick={() => setSelectedResultCaseIdx(index)}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono shrink-0 transition-all cursor-pointer",
                                    isSelected
                                      ? "bg-[#16181D] border-zinc-600 text-white shadow-sm ring-1 ring-zinc-500/30"
                                      : "bg-[#0D0F12] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-[#13151A]"
                                  )}
                                >
                                  {tcPassed ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  )}
                                  <span>
                                    Case {index + 1}
                                  </span>
                                  {tc.isHidden && (
                                    <Lock className="w-3 h-3 text-zinc-500 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Selected Test Case Detail & Diff Card */}
                          {activeCase && (
                            <div className="bg-[#090A0D] border border-zinc-800/90 rounded-xl p-4 space-y-3.5">
                              {/* Case status bar */}
                              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-zinc-200">
                                    Case {selectedResultCaseIdx + 1}
                                  </span>
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold",
                                      activeCase.verdict === "ACCEPTED"
                                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                                        : "bg-rose-950/60 text-rose-400 border border-rose-800/50"
                                    )}
                                  >
                                    {activeCase.verdict}
                                  </span>
                                  {activeCase.isHidden && (
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      [Hidden Test Case]
                                    </span>
                                  )}
                                </div>

                                {activeCase.timeMs != null && (
                                  <span className="text-zinc-500 font-mono text-[11px]">
                                    Time: {activeCase.timeMs} ms
                                  </span>
                                )}
                              </div>

                              {/* Input Section */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                                  <span>Input</span>
                                  {!activeCase.isHidden && activeCase.input && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(activeCase.input);
                                        toast.success("Input copied to clipboard");
                                      }}
                                      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
                                    >
                                      <Copy className="w-3 h-3" />
                                      Copy
                                    </button>
                                  )}
                                </div>
                                <pre className="p-3 bg-[#050608] border border-zinc-800/80 rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                                  {activeCase.input || "(Empty Input)"}
                                </pre>
                              </div>

                              {/* Hidden Test Case Notice */}
                              {activeCase.isHidden ? (
                                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs flex items-center gap-2.5 text-zinc-400">
                                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span>
                                    Private test case: Expected output and stdout are confidential to prevent hardcoded solutions.
                                  </span>
                                </div>
                              ) : (
                                /* Diff: Expected Output vs Actual Output */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  {/* Expected Output */}
                                  <div className="space-y-1.5">
                                    <span className="text-[11px] font-semibold text-zinc-400">
                                      Expected Output
                                    </span>
                                    <pre className="p-3 bg-[#050608] border border-zinc-800/80 rounded-lg text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre-wrap">
                                      {activeCase.expectedOutput || "(Empty Output)"}
                                    </pre>
                                  </div>

                                  {/* Your Code Output */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-semibold text-zinc-400">
                                        Your Output
                                      </span>
                                      <span
                                        className={cn(
                                          "text-[10px] font-mono",
                                          activeCase.verdict === "ACCEPTED" ? "text-emerald-400" : "text-rose-400"
                                        )}
                                      >
                                        {activeCase.verdict === "ACCEPTED" ? "Matches Expected" : "Difference Detected"}
                                      </span>
                                    </div>
                                    <pre
                                      className={cn(
                                        "p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap border",
                                        activeCase.verdict === "ACCEPTED"
                                          ? "bg-emerald-950/15 border-emerald-800/40 text-emerald-300"
                                          : "bg-rose-950/15 border-rose-800/40 text-rose-300"
                                      )}
                                    >
                                      {activeCase.actualOutput || "<no output produced>"}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* Error / Stderr for this specific test case */}
                              {activeCase.stderr && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[11px] font-semibold text-rose-400">
                                    Standard Error Output
                                  </span>
                                  <pre className="p-3 bg-zinc-950 border border-rose-900/40 rounded-lg text-xs font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">
                                    {activeCase.stderr}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Feedback Box */}
                      {showFeedback && aiFeedback && (
                        <div className="p-3.5 bg-gradient-to-r from-amber-950/20 to-zinc-900/80 border border-amber-900/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5 text-amber-400 text-xs font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Feedback</span>
                          </div>
                          <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                            {aiFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

        </div>

      </div>


      {/* ==================================================== */}
      {/* DIALOG: RESET CODE CONFIRMATION */}
      {/* ==================================================== */}

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Reset Code for {LANGUAGE_META[language].label}?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 pt-1">
              This will restore the editor back to the default starter template.
              Any unsubmitted edits in this language will be cleared (you can still undo right after).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetDialogOpen(false)}
              className="border-zinc-700 text-zinc-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetCode}
              className="text-xs bg-rose-600 hover:bg-rose-500 text-white"
            >
              Reset Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ==================================================== */}
      {/* DIALOG: PREVIEW SUBMISSION CODE */}
      {/* ==================================================== */}

      <Dialog open={!!previewSubmission} onOpenChange={(open) => !open && setPreviewSubmission(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>Submission #{previewSubmission?.id}</span>
                {previewSubmission && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded font-mono",
                    getVerdictConfig(previewSubmission.verdict).badgeBg
                  )}>
                    {previewSubmission.verdict}
                  </span>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 font-mono">
              Language: {previewSubmission?.language} • Runtime: {previewSubmission?.runtime ?? "N/A"}ms • Memory: {formatMemory(previewSubmission?.memory)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden mt-2">
            <pre className="p-4 text-xs font-mono text-zinc-200 overflow-auto max-h-96 whitespace-pre-wrap select-text">
              {previewSubmission?.sourceCode}
            </pre>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewSubmission(null)}
              className="border-zinc-700 text-zinc-300 text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => handleRestoreSubmissionCode(previewSubmission)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5" />
              Load into Editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}