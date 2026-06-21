import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useChats, useChat } from "@/hooks/useChats";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Send, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: chats } = useChats();
  const { data: chat } = useChat(id);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat?.messages) {
      setMessages(chat.messages.map((m: any) => ({ role: m.role, content: m.content })));
    } else if (!id) {
      setMessages([]);
    }
  }, [chat, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function createNewChat() {
    const res = await api.post("/chats");
    queryClient.invalidateQueries({ queryKey: ["chats"] });
    navigate(`/chat/${res.data.chat.id}`);
  }

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    let chatId = id;
    if (!chatId) {
      const res = await api.post("/chats");
      chatId = res.data.chat.id;
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      navigate(`/chat/${chatId}`, { replace: true });
    }

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const res = await fetch(`http://localhost:3000/api/chats/${chatId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: userMsg }),
    });

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
    queryClient.invalidateQueries({ queryKey: ["chats"] });
  }

  return (
    <div className="flex h-screen">
      {/* Chat list sidebar */}
      <div className="w-64 border-r border-zinc-800 p-4 flex flex-col">
        <Button
          onClick={createNewChat}
          className="bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800 justify-start mb-4"
        >
          <Plus className="w-4 h-4 mr-2" /> New chat
        </Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {chats?.map((c: any) => (
            <button
              key={c.id}
              onClick={() => navigate(`/chat/${c.id}`)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm truncate flex items-center gap-2",
                id === c.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-4">
          {messages.length === 0 && (
            <div className="text-center mt-20">
              <p className="text-white text-lg mb-1">AI Prep Chat</p>
              <p className="text-zinc-500 text-sm">Ask anything about interview prep, coding, or career advice</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
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

        <div className="border-t border-zinc-800 p-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything..."
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
    </div>
  );
}