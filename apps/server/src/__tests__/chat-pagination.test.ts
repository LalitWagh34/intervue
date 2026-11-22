import { beforeEach, describe, expect, it, mock } from "bun:test";
import { db } from "@intervue/db";
import { auth } from "../lib/auth";
import chatRoutes, { buildBoundedChatHistory, CHAT_CONTEXT_CHAR_BUDGET } from "../routes/chat";

describe("Phase 2D.1: bounded chat history", () => {
  const user = { id: "chat-user", name: "Chat User", email: "chat@example.com" };

  beforeEach(() => {
    mock.restore();
    (db as any).chat ??= {};
    (db as any).chatMessage ??= {};
    auth.api.getSession = mock(async () => ({
      user,
      session: { id: "chat-session", userId: user.id },
    } as any));
  });

  it("keeps the newest model context within the character budget", () => {
    const messages = Array.from({ length: 20 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content: `${index}:` + "x".repeat(2_000),
    }));

    const bounded = buildBoundedChatHistory(messages);
    const totalChars = bounded.reduce((sum, message) => sum + message.content.length, 0);

    expect(totalChars).toBeLessThanOrEqual(CHAT_CONTEXT_CHAR_BUDGET);
    expect(bounded.at(-1)?.content).toBe(messages.at(-1)?.content);
    expect(bounded.length).toBeLessThan(messages.length);
  });

  it("paginates the chat list with a bounded cursor query", async () => {
    const rows = Array.from({ length: 4 }, (_, index) => ({
      id: `chat-${index + 1}`,
      userId: user.id,
      title: `Chat ${index + 1}`,
      createdAt: new Date(),
    }));
    db.chat.findMany = mock(async () => rows as any);

    const response = await chatRoutes.request("/?limit=3&cursor=previous-chat");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.chats).toHaveLength(3);
    expect(body.pageInfo).toEqual({ hasMore: true, nextCursor: "chat-3" });
    expect(db.chat.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: user.id },
      take: 4,
      cursor: { id: "previous-chat" },
      skip: 1,
    }));
  });

  it("returns the latest message page in chronological display order", async () => {
    db.chat.findFirst = mock(async () => ({
      id: "chat-1",
      userId: user.id,
      title: "Bounded chat",
      createdAt: new Date(),
    } as any));
    db.chatMessage.findMany = mock(async () => [
      { id: "m4", chatId: "chat-1", role: "assistant", content: "fourth", createdAt: new Date(4) },
      { id: "m3", chatId: "chat-1", role: "user", content: "third", createdAt: new Date(3) },
      { id: "m2", chatId: "chat-1", role: "assistant", content: "second", createdAt: new Date(2) },
    ] as any);

    const response = await chatRoutes.request("/chat-1?limit=2");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.chat.messages.map((message: any) => message.id)).toEqual(["m3", "m4"]);
    expect(body.pageInfo).toEqual({ hasMore: true, nextCursor: "m3" });
    expect(db.chatMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 3 }));
  });

  it("rejects oversized user messages before database or provider work", async () => {
    let chatLookupCalled = false;
    db.chat.findFirst = mock(async () => {
      chatLookupCalled = true;
      return null as any;
    });

    const response = await chatRoutes.request("/chat-1/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "x".repeat(8_001) }),
    });

    expect(response.status).toBe(400);
    expect(chatLookupCalled).toBe(false);
  });
});
