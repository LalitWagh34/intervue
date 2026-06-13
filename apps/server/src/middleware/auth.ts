import { auth } from "../lib/auth";
import type { Context, Next } from "hono";
import type { AuthVariables } from "../types";

export async function requireAuth(
  c: Context<{ Variables: AuthVariables }>,
  next: Next
) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
}