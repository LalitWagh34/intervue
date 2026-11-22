import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { aiReviewLimiter } from "../middleware/rateLimiter";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { groq, GROQ_CHAT_MODEL } from "../lib/groq";
import { checkInputGuardrails, buildChatSystemPrompt } from "../lib/guardrails";

const app = new Hono<{ Variables: AuthVariables }>();

const DEFAULT_CHAT_PAGE_SIZE = 30;
const DEFAULT_MESSAGE_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 100;
const MAX_USER_MESSAGE_CHARS = 8_000;
const CHAT_CONTEXT_MESSAGE_LIMIT = 60;
export const CHAT_CONTEXT_CHAR_BUDGET = 24_000;

function parsePageSize(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export function buildBoundedChatHistory(
  messages: Array<{ role: string; content: string }>,
  charBudget = CHAT_CONTEXT_CHAR_BUDGET
): Array<{ role: "user" | "assistant"; content: string }> {
  const selected: Array<{ role: "user" | "assistant"; content: string }> = [];
  let remaining = Math.max(0, charBudget);

  for (let index = messages.length - 1; index >= 0 && remaining > 0; index--) {
    const message = messages[index];
    if (message.role !== "user" && message.role !== "assistant") continue;
    const content = message.content || "";
    if (!content) continue;

    if (content.length <= remaining) {
      selected.push({ role: message.role, content });
      remaining -= content.length;
      continue;
    }

    // Preserve the newest part of an oversized legacy message without exceeding the provider budget.
    selected.push({ role: message.role, content: content.slice(-remaining) });
    remaining = 0;
  }

  return selected.reverse();
}

// Get all chats for current user
app.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const limit = parsePageSize(c.req.query("limit"), DEFAULT_CHAT_PAGE_SIZE);
  const cursor = c.req.query("cursor");

  const chats = await db.chat.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = chats.length > limit;
  const page = hasMore ? chats.slice(0, limit) : chats;
  return c.json({
    chats: page,
    pageInfo: {
      hasMore,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    },
  });
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
  const limit = parsePageSize(c.req.query("limit"), DEFAULT_MESSAGE_PAGE_SIZE);
  const cursor = c.req.query("cursor");

  const chat = await db.chat.findFirst({
    where: { id, userId: user.id },
  });

  if (!chat) {
    return c.json({ error: "Chat not found" }, 404);
  }

  const newestFirst = await db.chatMessage.findMany({
    where: { chatId: id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = newestFirst.length > limit;
  const pageNewestFirst = hasMore ? newestFirst.slice(0, limit) : newestFirst;
  const messages = [...pageNewestFirst].reverse();

  return c.json({
    chat: { ...chat, messages },
    pageInfo: {
      hasMore,
      nextCursor: hasMore ? pageNewestFirst[pageNewestFirst.length - 1]?.id ?? null : null,
    },
  });
});

// Send message — SSE streaming response
app.post("/:id/message", requireAuth, aiReviewLimiter, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id")!;
  const body = await c.req.json().catch(() => ({}));
  const userMessage = typeof body.message === "string" ? body.message.trim() : "";

  if (!userMessage) {
    return c.json({ error: "Message text is required" }, 400);
  }
  if (userMessage.length > MAX_USER_MESSAGE_CHARS) {
    return c.json({ error: `Message must be ${MAX_USER_MESSAGE_CHARS} characters or fewer` }, 400);
  }

  const chat = await db.chat.findFirst({
    where: { id, userId: user.id },
    include: { _count: { select: { messages: true } } },
  });

  if (!chat) {
    return c.json({ error: "Chat not found" }, 404);
  }

  // ─── Fast Guardrail Pre-Check (Blocks jailbreaks & off-topic queries) ───
  const guardrail = checkInputGuardrails(userMessage, "CHAT");
  if (guardrail.isBlocked) {
    await db.chatMessage.create({
      data: {
        chatId: id,
        role: "user",
        content: userMessage,
      },
    });
    await db.chatMessage.create({
      data: {
        chatId: id,
        role: "assistant",
        content: guardrail.refusalMessage!,
      },
    });

    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text: guardrail.refusalMessage })}\n\n`)
          );
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
  }

  await db.chatMessage.create({
    data: {
      chatId: id,
      role: "user",
      content: userMessage,
    },
  });

  const recentMessages = await db.chatMessage.findMany({
    where: { chatId: id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: CHAT_CONTEXT_MESSAGE_LIMIT,
    select: { role: true, content: true },
  });
  const history = buildBoundedChatHistory([...recentMessages].reverse());

  let stream;
  try {
    stream = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: buildChatSystemPrompt(),
        },
        ...history,
      ],
      stream: true,
      max_tokens: 700,
      temperature: 0.6,
    });
  } catch (error: any) {
    console.error("Groq primary model error in chat, attempting fallback:", error);
    try {
      stream = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: buildChatSystemPrompt(),
          },
          ...history,
        ],
        stream: true,
        max_tokens: 700,
        temperature: 0.6,
      });
    } catch (fallbackErr: any) {
      console.error("Groq fallback model error:", fallbackErr);
      return c.json(
        { error: "AI Mentor is temporarily overloaded. Please try again in a few moments." },
        503
      );
    }
  }

  let fullResponse = "";

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            fullResponse += text;
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }

          if (fullResponse.trim()) {
            await db.chatMessage.create({
              data: {
                chatId: id,
                role: "assistant",
                content: fullResponse,
              },
            });
          }

          if (chat._count.messages === 0) {
            await db.chat.update({
              where: { id },
              data: { title: userMessage.slice(0, 50) },
            });
          }
        } catch (streamErr: any) {
          console.error("Error during streaming chat response:", streamErr);
          const errNotice = "\n\n*[Connection interrupted while generating answer. Please try again.]*";
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text: errNotice })}\n\n`)
          );
        } finally {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        }
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
