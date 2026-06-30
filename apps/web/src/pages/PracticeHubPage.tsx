import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, Code2, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "text", label: "Text interview", desc: "Chat-style Q&A", icon: MessageSquare, available: true },
  { id: "voice", label: "Voice interview", desc: "Speak with AI", icon: Mic, available: true },
  { id: "coding", label: "Coding practice", desc: "Solve problems live", icon: Code2, available: false },
  { id: "system_design", label: "System design", desc: "Whiteboard + critique", icon: LayoutTemplate, available: false },
];

const ROLES = ["Frontend Engineer", "Backend Engineer", "Full Stack Engineer", "DevOps Engineer", "Data Scientist"];
const LEVELS = ["junior", "mid", "senior"];

export default function PracticeHubPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("text");
  const [role, setRole] = useState("Backend Engineer");
  const [difficulty, setDifficulty] = useState("mid");

  function startInterview() {
    if (mode === "voice") {
      navigate(`/voice-interview?role=${encodeURIComponent(role)}&difficulty=${difficulty}`);
    } else {
      navigate(`/interview?role=${encodeURIComponent(role)}&difficulty=${difficulty}&mode=${mode}`);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Start a practice session</h1>
        <p className="text-zinc-400 text-sm mt-1">Choose your mode, role, and difficulty</p>
      </div>

      {/* Mode selection */}
      <h2 className="text-white font-medium mb-3">Mode</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {MODES.map((m) => (
          <Card
            key={m.id}
            onClick={() => m.available && setMode(m.id)}
            className={cn(
              "bg-zinc-900 border-zinc-800 transition-colors",
              m.available ? "cursor-pointer hover:border-zinc-700" : "opacity-40 cursor-not-allowed",
              mode === m.id && m.available && "border-white"
            )}
          >
            <CardContent className="pt-6">
              <m.icon className="w-5 h-5 text-zinc-300 mb-3" />
              <p className="text-white font-medium text-sm">{m.label}</p>
              <p className="text-zinc-500 text-xs mt-1">{m.desc}</p>
              {!m.available && (
                <p className="text-amber-500 text-[10px] mt-2 uppercase tracking-wide">Coming soon</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role selection */}
      <h2 className="text-white font-medium mb-3">Role</h2>
      <div className="flex flex-wrap gap-2 mb-8">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm border transition-colors",
              role === r
                ? "bg-white text-black border-white"
                : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Difficulty selection */}
      <h2 className="text-white font-medium mb-3">Difficulty</h2>
      <div className="flex gap-2 mb-10">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setDifficulty(l)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm border capitalize transition-colors",
              difficulty === l
                ? "bg-white text-black border-white"
                : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <Button
        onClick={startInterview}
        className="bg-white text-black hover:bg-zinc-200"
        size="lg"
      >
        Start interview
      </Button>
    </div>
  );
}