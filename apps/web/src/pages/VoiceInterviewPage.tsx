import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };
type Status = "idle" | "listening" | "processing" | "speaking";

export default function VoiceInterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "Full Stack Engineer";
  const difficulty = searchParams.get("difficulty") || "mid";

  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interimText, setInterimText] = useState("");

  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function createSession() {
      const res = await api.post("/interviews", {
        mode: "voice",
        role,
        difficulty,
      });
      setInterviewId(res.data.interview.id);
    }
    createSession();
  }, []);

  async function startInterview(id: string) {
    setIsLoading(true);
    setStatus("speaking");

    try {
      const res = await fetch(
        `http://localhost:3000/api/interviews/${id}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: "[START_INTERVIEW]", isVoice: true }),
        }
      );
      const data = await res.json();
      if (data.text) {
        setMessages([{ role: "assistant", content: data.text }]);
        await speakText(data.text);
      }
    } catch (err) {
      console.error(err);
    }

    setIsLoading(false);
    setIsStarted(true);
    startListening(id);
  }

  function startListening(id: string) {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimText(interim);
      if (final) handleUserSpeech(final, id);
    };

    recognition.onend = () => {
    if (!isProcessingRef.current) {
        try {
        recognition.start();
        } catch {}
    }
    };

    recognition.onerror = (e: any) => {
    if (e.error !== "no-speech" && e.error !== "aborted") {
        console.error("Speech error:", e.error);
    }
    if (!isProcessingRef.current && e.error !== "aborted") {
        try {
        recognition.start();
        } catch {}
    }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus("listening");
  }

  async function handleUserSpeech(text: string, id: string) {
    if (isProcessingRef.current || !text.trim()) return;
    isProcessingRef.current = true;

    recognitionRef.current?.stop();
    setInterimText("");
    setStatus("processing");
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch(
        `http://localhost:3000/api/interviews/${id}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: text, isVoice: true }),
        }
      );
      const data = await res.json();
      if (data.text) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
        setStatus("speaking");
        await speakText(data.text);
      }
    } catch (err) {
      console.error(err);
    }

    isProcessingRef.current = false;
    setStatus("listening");
    recognitionRef.current?.start();
  }

  async function speakText(text: string) {
    try {
      const res = await api.post("/voice/tts", { text }, { responseType: "arraybuffer" });
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(res.data);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
      await new Promise((resolve) => { source.onended = resolve; });
    } catch (err) {
      // Fallback to browser TTS if Groq TTS fails
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
      await new Promise((resolve) => {
        utterance.onend = resolve;
      });
    }
  }

  async function stopInterview() {
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    if (interviewId) {
      await api.put(`/interviews/${interviewId}/end`);
      navigate(`/results/${interviewId}`);
    }
  }

  const statusConfig: Record<Status, { label: string; color: string }> = {
    idle: { label: "Click to start", color: "bg-zinc-700" },
    listening: { label: "Listening...", color: "bg-green-500 animate-pulse" },
    processing: { label: "Processing...", color: "bg-amber-500 animate-pulse" },
    speaking: { label: "AI is speaking...", color: "bg-blue-500 animate-pulse" },
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="border-b border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">{role}</p>
          <p className="text-zinc-500 text-xs capitalize">{difficulty} level · Voice interview</p>
        </div>
        <Button
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:text-white"
          onClick={stopInterview}
        >
          <Square className="w-3.5 h-3.5 mr-2" /> End interview
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-4">
        {messages.length === 0 && !isStarted && (
          <div className="text-center mt-20">
            <p className="text-zinc-400 text-sm">Click the mic to start your voice interview</p>
            <p className="text-zinc-600 text-xs mt-1">Make sure you're using Chrome</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={cn(
              "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
              msg.role === "user"
                ? "bg-white text-black"
                : "bg-zinc-900 text-zinc-200 border border-zinc-800"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {interimText && (
          <div className="flex justify-end">
            <div className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm bg-zinc-800 text-zinc-500 italic">
              {interimText}...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-zinc-800 p-8 flex flex-col items-center gap-4">
        <div className={cn("w-3 h-3 rounded-full", statusConfig[status].color)} />
        <p className="text-zinc-500 text-sm">{statusConfig[status].label}</p>

        {!isStarted ? (
          <button
            onClick={() => interviewId && startInterview(interviewId)}
            disabled={isLoading || !interviewId}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        ) : (
          <button
            onClick={() => {
              if (status === "listening") {
                recognitionRef.current?.stop();
                setStatus("idle");
              } else if (status === "idle") {
                recognitionRef.current?.start();
                setStatus("listening");
              }
            }}
            disabled={status === "processing" || status === "speaking"}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-colors disabled:opacity-50",
              status === "listening" ? "bg-green-500 hover:bg-green-600" : "bg-zinc-800 hover:bg-zinc-700"
            )}
          >
            {status === "listening" ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-zinc-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}