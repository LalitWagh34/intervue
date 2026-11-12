import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useChats, useChat } from "@/hooks/useChats";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import remarkGfm from "remark-gfm";

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

  const isStreamingRef = useRef(false);
  const activeChatIdRef = useRef(id);

  // Synchronize active chat ID changes (e.g. user clicks another chat in the sidebar)
  useEffect(() => {
    if (activeChatIdRef.current !== id) {
      activeChatIdRef.current = id;
      // Only clear/reset messages if we are NOT in the middle of streaming a newly created chat
      if (!isStreamingRef.current) {
        if (!id) {
          setMessages([]);
        }
      }
    }
  }, [id]);

  // Sync messages from cache when chat data loads (guarded against overriding active streams)
  useEffect(() => {
    if (isStreamingRef.current) return;

    if (chat?.messages && chat.id === id) {
      setMessages(chat.messages.map((m: any) => ({ role: m.role, content: m.content })));
    } else if (!id && !isStreamingRef.current) {
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
    } catch (err: any) {
      console.error("Failed to create chat:", err);
      toast.error(err?.response?.data?.error || "Failed to start a new discussion");
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
    } catch (err: any) {
      console.error("Failed to delete chat:", err);
      toast.error(err?.response?.data?.error || "Failed to delete discussion");
    }
  }

  async function sendMessage(textToSend?: string) {
    const promptText = (textToSend || input).trim();
    if (!promptText || isStreamingRef.current) return;

    setInput("");

    // Optimistically show user question and assistant placeholder IMMEDIATELY
    // This prevents the starter hero screen from ever flashing
    setMessages((prev) => [
      ...prev,
      { role: "user", content: promptText },
      { role: "assistant", content: "" },
    ]);
    setIsStreaming(true);
    isStreamingRef.current = true;

    let chatId = id;
    if (!chatId) {
      try {
        const res = await api.post("/chats");
        chatId = res.data.chat.id;
        activeChatIdRef.current = chatId;
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        navigate(`/chat/${chatId}`, { replace: true });
      } catch (err: any) {
        console.error("Failed to initialize chat:", err);
        setIsStreaming(false);
        isStreamingRef.current = false;
        setMessages((prev) => prev.slice(0, -2));
        toast.error(err?.response?.data?.error || "Failed to create discussion session");
        return;
      }
    }

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const token = localStorage.getItem("intervue_session_token");
    try {
      const res = await fetch(`${baseURL}/chats/${chatId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ message: promptText }),
      });

      if (!res.ok) {
        let errMessage = `Error ${res.status}: Failed to reach AI mentor`;
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch { }
        throw new Error(errMessage);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader stream available");

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
              if (updated.length > 0) {
                updated[updated.length - 1] = { role: "assistant", content: finalText };
              }
              return updated;
            });
          } catch { }
        }
      }
    } catch (err: any) {
      console.error("Chat streaming error:", err);
      const isAuthError = err?.message?.toLowerCase().includes("unauthorized") || err?.message?.includes("401");
      const errorMsg = isAuthError
        ? "Please sign in to chat with the AI Mentor."
        : err?.message || "Sorry, I ran into an error connecting with the mentor engine. Please try again.";

      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            role: "assistant",
            content: `⚠️ ${errorMsg}`,
          };
        }
        return updated;
      });
      toast.error(errorMsg);
    } finally {
      setIsStreaming(false);
      isStreamingRef.current = false;
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div className="flex flex-1 min-h-0 h-full bg-[var(--canvas)] text-[var(--text-primary)] overflow-hidden relative">
      {/* Mobile Discussions Backdrop Overlay */}
      {isHistoryOpen && (
        <div
          onClick={() => setIsHistoryOpen(false)}
          className="fixed inset-0 bg-[var(--overlay-scrim)] backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Chats Left Sidebar (Responsive drawer on mobile, static on desktop) */}
      <aside
        className={cn(
          "border-r border-[var(--border-subtle)] bg-[var(--surface)] p-4 flex flex-col shrink-0 transition-transform duration-300 z-40",
          "md:relative md:w-64 lg:w-72 md:translate-x-0 md:flex",
          "fixed inset-y-0 left-0 w-[280px] max-w-[85vw]",
          isHistoryOpen ? "translate-x-0 flex" : "-translate-x-full hidden md:flex"
        )}
      >
        {/* Mobile Header with Close button */}
        <div className="flex items-center justify-between md:hidden pb-3 border-b border-[var(--border-subtle)] mb-3">
          <span className="text-xs font-bold text-[var(--text-primary)]">Discussion History</span>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(false)}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <Button
          type="button"
          onClick={createNewChat}
          className="w-full bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-[var(--on-primary)] font-semibold text-xs py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 mb-4"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion</span>
        </Button>

        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Discussion History
          </span>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">{chats?.length || 0}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {(!chats || chats.length === 0) && (
            <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-center space-y-1">
              <p className="text-xs text-[var(--text-primary)] font-medium">No discussions yet</p>
              <p className="text-[10px] text-[var(--text-muted)]">Start a conversation with your AI Mentor.</p>
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
                  ? "bg-[var(--surface-selected)] border-[var(--action-primary)] text-[var(--text-primary)] font-medium"
                  : "bg-[var(--surface-muted)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-control)] hover:bg-[var(--surface-hover)]"
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MessageSquare
                  className={cn(
                    "w-3.5 h-3.5 shrink-0",
                    id === c.id ? "text-[var(--accent-text)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                  )}
                />
                <span className="truncate">{c.title || "New Discussion"}</span>
              </div>

              <button
                type="button"
                onClick={(e) => deleteChat(c.id, e)}
                title="Delete discussion"
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-[var(--status-danger-subtle)] text-[var(--text-muted)] hover:text-[var(--status-danger)] transition-all shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Mentor Chat Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--canvas)]">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface)]/90 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">AI Technical Mentor</h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-600 dark:text-purple-400 text-[10px] font-mono shrink-0">
                  24/7 Active
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                Ask coding concepts, system design trade-offs, and behavioral answer strategies.
              </p>
            </div>
          </div>

          {/* Mobile Discussion History Drawer Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-control)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-text)]" />
            <span>History ({chats?.length || 0})</span>
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full space-y-5">
          {messages.length === 0 && (
            <div className="py-8 space-y-8 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-purple-500 dark:text-purple-400 flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                  What would you like to master today?
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
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
                      className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--action-primary)] hover:bg-[var(--surface-hover)] text-left transition-all cursor-pointer group space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors">
                        <Icon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-text)]" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
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
                      ? "bg-[var(--action-primary)] border-[var(--action-primary)] text-[var(--on-primary)]"
                      : "bg-[var(--surface)] border-[var(--border-subtle)] text-purple-500 dark:text-purple-400"
                  )}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={cn(
                    "max-w-[82%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm",
                    isUser
                      ? "bg-[var(--action-primary)] text-[var(--on-primary)] rounded-tr-none font-medium whitespace-pre-wrap"
                      : "bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-none"
                  )}
                >
                  {isUser ? (
                    msg.content
                  ) : msg.content ? (
                    <div className="space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-3 mb-2 border-b border-[var(--border-subtle)] pb-1">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-3 mb-1.5 flex items-center gap-1.5">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-300 mt-2.5 mb-1 tracking-wide uppercase">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed mb-2 last:mb-0">
                              {children}
                            </p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-[var(--text-primary)]">
                              {children}
                            </strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-5 space-y-1 mb-2 text-[var(--text-secondary)]">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-5 space-y-1 mb-2 text-[var(--text-secondary)]">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="leading-relaxed">
                              {children}
                            </li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-purple-500/50 pl-3 py-1 my-2 text-[var(--text-secondary)] italic bg-purple-500/5 rounded-r">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]">
                              <table className="w-full text-left text-xs text-[var(--text-secondary)] border-collapse">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-[var(--surface)] border-b border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold">
                              {children}
                            </thead>
                          ),
                          tbody: ({ children }) => (
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                              {children}
                            </tbody>
                          ),
                          tr: ({ children }) => (
                            <tr className="hover:bg-[var(--surface-hover)] transition-colors">
                              {children}
                            </tr>
                          ),
                          th: ({ children }) => (
                            <th className="px-3.5 py-2.5 font-bold text-[var(--text-primary)] text-xs">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3.5 py-2 text-[var(--text-secondary)] text-xs">
                              {children}
                            </td>
                          ),
                          code: ({ className, children }) => {
                            const isInline = !className && typeof children === "string" && !children.includes("\n");
                            if (isInline) {
                              return (
                                <code className="bg-[var(--surface-muted)] text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded font-mono text-xs border border-[var(--border-subtle)]">
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <pre className="bg-[var(--surface-muted)] border border-[var(--border-subtle)] rounded-xl p-3 my-2 overflow-x-auto text-xs font-mono text-[var(--text-primary)]">
                                <code>{children}</code>
                              </pre>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {isStreaming && i === messages.length - 1 && (
                        <span className="inline-block w-1.5 h-3.5 bg-purple-500 dark:bg-purple-400 ml-1 animate-pulse align-middle" />
                      )}
                    </div>
                  ) : isStreaming && i === messages.length - 1 ? (
                    <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-ping" />
                      <span>Mentor is formulating advice...</span>
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
        <div className="border-t border-[var(--border-subtle)] bg-[var(--surface)] p-3 sm:p-4">
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
              className="flex-1 bg-[var(--surface-muted)] border border-[var(--border-control)] focus:border-[var(--action-primary)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs sm:text-sm outline-none transition-colors resize-none max-h-32 min-h-[42px]"
            />

            <Button
              type="button"
              onClick={() => sendMessage()}
              disabled={isStreaming || !input.trim()}
              className="h-[42px] px-4 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-muted)] text-[var(--on-primary)] font-semibold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}