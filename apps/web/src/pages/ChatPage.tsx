import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useChats, useChat } from "@/hooks/useChats";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Sparkles,
  Bot,
  User,
  Zap,
  Code2,
  Cpu,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const MENTOR_SUGGESTIONS = [
  {
    icon: Code2,
    title: "Algorithm Trade-offs",
    prompt: "Can you explain how to implement an LRU Cache with O(1) get and put, and compare HashMap + DoublyLinkedList vs OrderedDict?",
  },
  {
    icon: Cpu,
    title: "System Design Patterns",
    prompt: "How should I design a distributed rate limiter for a multi-region API? Compare Token Bucket vs Sliding Window Counter.",
  },
  {
    icon: Layers,
    title: "Behavioral STAR Method",
    prompt: "Help me structure an answer using the STAR method for: 'Tell me about a time when you disagreed with a senior engineer on architecture.'",
  },
  {
    icon: Zap,
    title: "Full-Stack Concurrency",
    prompt: "Explain how Node.js handles asynchronous I/O with libuv and the difference between microtasks and macrotasks in the event loop.",
  },
];

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: chats } = useChats();
  const { data: chat } = useChat(id);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chat?.messages) {
      setMessages(chat.messages.map((m: any) => ({ role: m.role, content: m.content })));
    } else if (!id) {
      setMessages([]);
    }
  }, [chat, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  async function createNewChat() {
    try {
      setIsHistoryOpen(false);
      const res = await api.post("/chats");
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      navigate(`/chat/${res.data.chat.id}`);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  }

  async function deleteChat(chatId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.delete(`/chats/${chatId}`);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      if (id === chatId) {
        navigate("/chat");
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  }

  async function sendMessage(textToSend?: string) {
    const promptText = (textToSend || input).trim();
    if (!promptText || isStreaming) return;

    let chatId = id;
    if (!chatId) {
      try {
        const res = await api.post("/chats");
        chatId = res.data.chat.id;
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        navigate(`/chat/${chatId}`, { replace: true });
      } catch (err) {
        console.error("Failed to initialize chat:", err);
        return;
      }
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: promptText }]);
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    try {
      const res = await fetch(`${baseURL}/chats/${chatId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: promptText }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader stream");

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
    } catch (err) {
      console.error("Chat streaming error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I ran into an error connecting with the mentor engine. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#08090C] text-white overflow-hidden relative">
      {/* Mobile Discussions Backdrop Overlay */}
      {isHistoryOpen && (
        <div
          onClick={() => setIsHistoryOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Chats Left Sidebar (Responsive drawer on mobile, static on desktop) */}
      <aside
        className={cn(
          "border-r border-[#181A20] bg-[#0D0E12] p-4 flex flex-col shrink-0 transition-transform duration-300 z-40",
          "md:relative md:w-64 lg:w-72 md:translate-x-0 md:flex",
          "fixed inset-y-0 left-0 w-[280px] max-w-[85vw]",
          isHistoryOpen ? "translate-x-0 flex" : "-translate-x-full hidden md:flex"
        )}
      >
        {/* Mobile Header with Close button */}
        <div className="flex items-center justify-between md:hidden pb-3 border-b border-[#181A20] mb-3">
          <span className="text-xs font-bold text-white">Discussion History</span>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#181A20]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <Button
          type="button"
          onClick={createNewChat}
          className="w-full bg-[#327CF6] hover:bg-[#2563EB] text-white font-semibold text-xs py-2.5 rounded-xl shadow-md shadow-[#327CF6]/20 transition-all cursor-pointer flex items-center justify-center gap-2 mb-4"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion</span>
        </Button>

        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-[11px] font-bold text-[#7A808C] uppercase tracking-wider">
            Discussion History
          </span>
          <span className="text-[11px] font-mono text-zinc-500">{chats?.length || 0}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {(!chats || chats.length === 0) && (
            <div className="p-4 rounded-xl bg-[#08090C] border border-[#181A20] text-center space-y-1">
              <p className="text-xs text-zinc-300 font-medium">No discussions yet</p>
              <p className="text-[10px] text-[#7A808C]">Start a conversation with your AI Mentor.</p>
            </div>
          )}

          {chats?.map((c: any) => (
            <div
              key={c.id}
              onClick={() => {
                navigate(`/chat/${c.id}`);
                setIsHistoryOpen(false);
              }}
              className={cn(
                "group w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 border transition-all cursor-pointer",
                id === c.id
                  ? "bg-[#327CF6]/10 border-[#327CF6]/40 text-white font-medium"
                  : "bg-[#08090C] border-[#181A20] text-[#8B92A0] hover:text-white hover:border-[#262933] hover:bg-[#12141A]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MessageSquare
                  className={cn(
                    "w-3.5 h-3.5 shrink-0",
                    id === c.id ? "text-[#327CF6]" : "text-[#7A808C] group-hover:text-zinc-300"
                  )}
                />
                <span className="truncate">{c.title || "New Discussion"}</span>
              </div>

              <button
                type="button"
                onClick={(e) => deleteChat(c.id, e)}
                title="Delete discussion"
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Mentor Chat Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#08090C]">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#181A20] bg-[#0D0E12]/80 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">AI Technical Mentor</h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-[10px] font-mono shrink-0">
                  24/7 Active
                </span>
              </div>
              <p className="text-[11px] text-[#7A808C] truncate">
                Ask coding concepts, system design trade-offs, and behavioral answer strategies.
              </p>
            </div>
          </div>

          {/* Mobile Discussion History Drawer Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs font-semibold text-zinc-300 hover:text-white shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#327CF6]" />
            <span>History ({chats?.length || 0})</span>
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full space-y-5">
          {messages.length === 0 && (
            <div className="py-8 space-y-8 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/10">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  What would you like to master today?
                </h2>
                <p className="text-xs text-[#8B92A0]">
                  Get instant deep-dives, code refactoring advice, architecture diagrams, and mock interview critique.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MENTOR_SUGGESTIONS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessage(item.prompt)}
                      className="p-4 rounded-2xl bg-[#0D0E12] border border-[#181A20] hover:border-[#327CF6]/40 hover:bg-[#12141C] text-left transition-all cursor-pointer group space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-[#327CF6] transition-colors">
                        <Icon className="w-4 h-4 text-[#7A808C] group-hover:text-[#327CF6]" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-[#7A808C] line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={i}
                className={cn("flex items-start gap-3", isUser ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border",
                    isUser
                      ? "bg-[#327CF6] border-[#327CF6]/50 text-white"
                      : "bg-[#0D0E12] border-[#181A20] text-purple-400"
                  )}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={cn(
                    "max-w-[82%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm",
                    isUser
                      ? "bg-[#327CF6] text-white rounded-tr-none font-medium whitespace-pre-wrap"
                      : "bg-[#0D0E12] border border-[#181A20] text-zinc-200 rounded-tl-none"
                  )}
                >
                  {isUser ? (
                    msg.content
                  ) : msg.content ? (
                    <div className="space-y-2 [&_p]:leading-relaxed [&_strong]:text-white [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:text-zinc-300 [&_code]:bg-[#181A20] [&_code]:text-purple-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : isStreaming && i === messages.length - 1 ? (
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      <span>Mentor is responding...</span>
                    </span>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Composer Footer */}
        <div className="border-t border-[#181A20] bg-[#0D0E12] p-3 sm:p-4">
          <div className="max-w-4xl mx-auto flex items-end gap-2.5">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask anything about coding, system design, or interview prep... (Press Enter to send)"
              disabled={isStreaming}
              className="flex-1 bg-[#08090C] border border-[#181A20] focus:border-[#327CF6] rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-colors resize-none max-h-32 min-h-[42px]"
            />

            <Button
              type="button"
              onClick={() => sendMessage()}
              disabled={isStreaming || !input.trim()}
              className="h-[42px] px-4 rounded-xl bg-[#327CF6] hover:bg-[#2563EB] disabled:bg-[#181A20] disabled:text-zinc-600 text-white font-semibold text-xs shadow-md shadow-[#327CF6]/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}