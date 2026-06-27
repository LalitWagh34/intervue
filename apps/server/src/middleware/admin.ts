import type { Context, Next } from "hono";
import type { AuthVariables } from "../types";
import { db } from "@intervue/db";

export async function requireAdmin(
  c: Context<{ Variables: AuthVariables }>,
  next: Next
) {
  const user = c.get("user");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "admin") {
    return c.json({ error: "Forbidden — admin access only" }, 403);
  }

  await next();
}