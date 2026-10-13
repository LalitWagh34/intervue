import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { aiReviewLimiter } from "../middleware/rateLimiter";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { groq, GROQ_CHAT_MODEL } from "../lib/groq";
import { checkInputGuardrails, buildChatSystemPrompt } from "../lib/guardrails";

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
  const body = await c.req.json().catch(() => ({}));
  const userMessage = typeof body.message === "string" ? body.message.trim() : "";

  if (!userMessage) {
    return c.json({ error: "Message text is required" }, 400);
  }

  const chat = await db.chat.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
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

  const history = chat.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  history.push({ role: "user", content: userMessage });

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

          if (chat.messages.length === 0) {
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