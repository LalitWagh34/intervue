import { Hono } from "hono";
import { db } from "@intervue/db";

const app = new Hono();

app.get("/", async (c) => {
  const query = c.req.query("q") || "";
  
  if (!query || query.length < 2) {
    return c.json({ problems: [], sheets: [] });
  }

  try {
    // Parallel search queries
    const [problems, sheets] = await Promise.all([
      db.problem.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { tags: { hasSome: [query.toLowerCase()] } },
            { company: { hasSome: [query] } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: true,
        },
        take: 5,
      }),
      db.dsaSheet.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          slug: true,
          title: true,
          subjectId: true,
        },
        take: 3,
      }),
    ]);

    return c.json({ problems, sheets });
  } catch (error) {
    console.error("Global search error:", error);
    return c.json({ error: "Failed to perform search" }, 500);
  }
});

export { app as searchRouter };
