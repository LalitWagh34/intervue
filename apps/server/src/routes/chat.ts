import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import Groq from "groq-sdk";

const app = new Hono<{ Variables: AuthVariables }>();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
app.post("/:id/message", requireAuth, async (c) => {
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
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are an expert interview coach helping candidates prepare for technical interviews. 
        Give concise, actionable advice. Help with interview questions, coding concepts, system design, 
        and behavioral questions.`,
      },
      ...history,
    ],
    stream: true,
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