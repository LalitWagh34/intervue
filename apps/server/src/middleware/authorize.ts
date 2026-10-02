import type { Context, Next } from "hono";
import { db } from "@intervue/db";
import { ForbiddenError, NotFoundError } from "../lib/errors";

/**
 * Object-Level Authorization Middleware for Contest Rooms (BOLA / IDOR Defense)
 * Guarantees that only participants who enrolled in the room or the room host can access room resources.
 * Caches the fetched room in `c.set("authorizedRoom", room)` to eliminate N+1 DB queries in route handlers.
 */
export async function requireRoomMember(c: Context, next: Next) {
  const user = (c as any).get?.("user");
  const code = (c.req.param("code") || "").toUpperCase();

  if (!code) {
    throw new NotFoundError("Room code is required");
  }

  const room = await db.room.findUnique({
    where: { code },
    include: {
      participants: { select: { id: true, userId: true, role: true } },
    },
  });

  if (!room) {
    throw new NotFoundError(`Contest room with code ${code} was not found`);
  }

  const isHost = room.hostId === user?.id;
  const isParticipant = room.participants.some((p) => p.userId === user?.id);

  if (!isHost && !isParticipant) {
    throw new ForbiddenError(
      "Access Denied (BOLA Defense): You must be an authorized participant or host of this room."
    );
  }

  (c as any).set("authorizedRoom", room);
  await next();
}

/**
 * Strict Host-Only Authorization Middleware
 * Enforces that only the designated room creator/host can execute privileged administrative operations (e.g. force-end).
 */
export async function requireRoomHost(c: Context, next: Next) {
  const user = (c as any).get?.("user");
  const code = (c.req.param("code") || "").toUpperCase();

  if (!code) {
    throw new NotFoundError("Room code is required");
  }

  const room = (c as any).get?.("authorizedRoom") || (await db.room.findUnique({ where: { code } }));

  if (!room) {
    throw new NotFoundError(`Contest room with code ${code} was not found`);
  }

  if (room.hostId !== user?.id) {
    throw new ForbiddenError(
      "Access Denied: Only the room host is authorized to perform this operation."
    );
  }

  (c as any).set("authorizedRoom", room);
  await next();
}
