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
        content: `You are an elite Senior Staff Engineer and Technical Interview Mentor at Intervue.
Your goal is to coach candidates to communicate with clarity, precision, and senior-level depth in technical interviews.

GUIDELINES FOR YOUR RESPONSES:
1. NATURAL & ADAPTIVE: Do NOT use a rigid or repetitive template. NEVER output identical boilerplate headers like "Clean Mental Model", "Core Pillars", or "Real-World Trade-Off" on every response. Instead, adapt naturally to what the candidate is asking.
2. CONCISE & HIGH-SIGNAL: Keep answers focused and punchy (150-280 words). Avoid bloated textbook dumps or academic fluff. Focus on what senior interviewers actually look for:
   - For concept/algorithm questions: clear intuition, time/space complexity, and practical edge cases.
   - For system design: core trade-offs (latency vs throughput, consistency vs availability, bottlenecks).
   - For behavioral: concise STAR format structure or high-impact talking points.
   - For coding: clean, modern code snippets with a 2-3 line breakdown.
3. PROPER MARKDOWN FORMATTING:
   - Always put a blank line between headers, paragraphs, and list items so Markdown renders cleanly.
   - Use headings (###), bullet points, and code blocks (\`\`\`) where appropriate.
   - Highlight key terminology in bold.
4. ENGAGING FOLLOW-UP: Conclude with ONE sharp, thoughtful interview follow-up question or scenario to help the candidate practice deeper.`,
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