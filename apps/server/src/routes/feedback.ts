import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { AuthVariables } from "../types";

const feedback = new Hono<{ Variables: AuthVariables }>();

// Optional auth so anyone logged in can submit
feedback.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, subject, message } = body;

    if (!message || !message.trim()) {
      return c.json({ error: "Message is required" }, 400);
    }

    console.log(`\n======================================================`);
    console.log(`📬 [NEW USER FEEDBACK RECEIVED]`);
    console.log(`From: ${name || "Anonymous"} <${email || "no-email"}>`);
    console.log(`Subject: ${subject || "General"}`);
    console.log(`Message:`);
    console.log(message.trim());
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`======================================================\n`);

    return c.json({
      success: true,
      message: "Thank you! Your feedback has been received and logged.",
    });
  } catch (err: any) {
    console.error("Error saving feedback:", err);
    return c.json({ error: err.message || "Failed to submit feedback" }, 500);
  }
});

export default feedback;
