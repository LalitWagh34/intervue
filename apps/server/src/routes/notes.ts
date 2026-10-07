import { Hono } from "hono";
import { db } from "@intervue/db";
import { requireAuth } from "../middleware/auth";
import type { AuthVariables } from "../types";

const notes = new Hono<{ Variables: AuthVariables }>();

notes.use("*", requireAuth);

// GET /api/notes - list all notes for current user
notes.get("/", async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const allNotes = await db.userQuestionNote.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return c.json({ notes: allNotes });
  } catch (err: any) {
    console.error("Error fetching notes:", err);
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/notes/:slug - get note for a specific problem
notes.get("/:slug", async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { slug } = c.req.param();

    const note = await db.userQuestionNote.findUnique({
      where: { userId_problemSlug: { userId: user.id, problemSlug: slug } },
    });

    return c.json({ note: note || null });
  } catch (err: any) {
    console.error("Error fetching note:", err);
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/notes/:slug - upsert (create or update) a note
notes.post("/:slug", async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { slug } = c.req.param();
    const body = await c.req.json();
    const { content, problemTitle } = body;

    if (content === undefined) return c.json({ error: "content is required" }, 400);

    const note = await db.userQuestionNote.upsert({
      where: { userId_problemSlug: { userId: user.id, problemSlug: slug } },
      update: { content, problemTitle: problemTitle || slug },
      create: {
        userId: user.id,
        problemSlug: slug,
        problemTitle: problemTitle || slug,
        content,
      },
    });

    return c.json({ note });
  } catch (err: any) {
    console.error("Error upserting note:", err);
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/notes/:slug - delete a note
notes.delete("/:slug", async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { slug } = c.req.param();

    await db.userQuestionNote.deleteMany({
      where: { userId: user.id, problemSlug: slug },
    });

    return c.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting note:", err);
    return c.json({ error: err.message }, 500);
  }
});

export default notes;