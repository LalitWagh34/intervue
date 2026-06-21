import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Send, Square } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export default function InterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "Full Stack Engineer";
  const difficulty = searchParams.get("difficulty") || "mid";

  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function startInterview() {
      const res = await api.post("/interviews", {
        mode: "text",
        role,
        difficulty,
      });
      setInterviewId(res.data.interview.id);
      setIsStarting(false);
    }
    startInterview();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

async function sendMessage() {
  if (!input.trim() || !interviewId || isStreaming) return;

  const userMsg = input;
  setInput("");
  setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
  setIsStreaming(true);
  setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

  const res = await fetch(
    `http://localhost:3000/api/interviews/${interviewId}/message`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: userMsg }),
    }
  );

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n\n").filter(Boolean);

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        accumulated += parsed.text;
        const finalText = accumulated;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: finalText };
          return updated;
        });
      } catch {}
    }
  }

  setIsStreaming(false);
}

  async function endInterview() {
    if (!interviewId) return;
    await api.put(`/interviews/${interviewId}/end`);
    navigate(`/results/${interviewId}`);
  }

  if (isStarting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
        Starting interview...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">{role}</p>
          <p className="text-zinc-500 text-xs capitalize">{difficulty} level · Text interview</p>
        </div>
        <Button
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:text-white"
          onClick={endInterview}
        >
          <Square className="w-3.5 h-3.5 mr-2" /> End interview
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-4">
        {messages.length === 0 && (
          <p className="text-zinc-500 text-sm text-center mt-10">
            Send a message to begin the interview.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-200 border border-zinc-800"
              }`}
            >
              {msg.content || (isStreaming && i === messages.length - 1 ? "..." : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your answer..."
            disabled={isStreaming}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-zinc-600"
          />
          <Button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="bg-white text-black hover:bg-zinc-200"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}