import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { aiReviewLimiter } from "../middleware/rateLimiter";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { groq, GROQ_CHAT_MODEL } from "../lib/groq";

const app = new Hono<{ Variables: AuthVariables }>();

// Get all chats for current user
app.get("/", requireAuth, async (c) => {
  const user = c.get("user");

  const chats = await db.chat.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ chats });
});

// Create new chat
app.post("/", requireAuth, async (c) => {
  const user = c.get("user");

  const chat = await db.chat.create({
    data: {
      userId: user.id,
      title: "New Chat",
    },
  });

  return c.json({ chat });
});

// Get single chat with messages
app.get("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id")!;

  const chat = await db.chat.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!chat) {
    return c.json({ error: "Chat not found" }, 404);
  }

  return c.json({ chat });
});

// Send message — SSE streaming response
app.post("/:id/message", requireAuth, aiReviewLimiter, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id")!;
  const body = await c.req.json();

  const chat = await db.chat.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!chat) {
    return c.json({ error: "Chat not found" }, 404);
  }

  await db.chatMessage.create({
    data: {
      chatId: id,
      role: "user",
      content: body.message,
    },
  });

  const history = chat.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  history.push({ role: "user", content: body.message });

  const stream = await groq.chat.completions.create({
    model: GROQ_CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an elite Senior Staff Engineer and Interview Mentor at Intervue.
Your goal is to coach candidates to speak and think like top-tier engineers in technical rounds (FAANG & top tech).

STRICT RESPONSE GUIDELINES:
1. BE PUNCHY & CONCISE (150-250 words max): NEVER generate exhaustive textbook dumps, massive tables, multi-week study schedules, or academic syllabi unless the user explicitly asks for one.
2. THE 60-SECOND INTERVIEW FORMULA:
   - The Clean Mental Model: A crisp, confident definition in 1-2 sentences.
   - The 2-3 Core Pillars: The essential components that matter in real production systems.
   - The Real-World Trade-Off: What senior interviewers actually grill candidates on (e.g., latency vs throughput, stateful vs stateless, CAP theorem trade-offs).
3. PRACTICAL ENGINEERING: Mention realistic engineering examples (e.g., video streaming over UDP, payment webhooks, database connection pooling) over dry theory.
4. INTERACTIVE COACHING: Always end with ONE sharp, actionable follow-up question or practical interview scenario to keep the session engaging.
5. CLEAN SCANNABILITY: Use short paragraphs and bold keywords. No endless walls of text.`,
      },
      ...history,
    ],
    stream: true,
    max_tokens: 700,
    temperature: 0.6,
  });

  let fullResponse = "";

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          fullResponse += text;
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        }

        await db.chatMessage.create({
          data: {
            chatId: id,
            role: "assistant",
            content: fullResponse,
          },
        });

        if (chat.messages.length === 0) {
          await db.chat.update({
            where: { id },
            data: { title: body.message.slice(0, 50) },
          });
        }

        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
});

// Delete chat
app.delete("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id")!;

  await db.chat.delete({
    where: { id, userId: user.id },
  });

  return c.json({ success: true });
});

export default app;