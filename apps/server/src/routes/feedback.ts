import { Hono } from "hono";
import { config } from "dotenv";
import { rateLimiter } from "../middleware/rateLimiter";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { auth } from "../lib/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";

const feedback = new Hono<{ Variables: AuthVariables }>();

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const feedbackLimiter = rateLimiter({
  windowMs: 5 * 60_000,
  max: 5,
  message: "Too many feedback submissions. Please wait a few minutes before sending again.",
});

// POST /api/feedback - submit user feedback
feedback.post("/", feedbackLimiter, async (c) => {
  try {
    // Reload dotenv dynamically so any updates to .env take effect immediately
    config({ override: true });

    const body = await c.req.json();
    const { name, email, subject, message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return c.json({ error: "Message is required" }, 400);
    }

    if (message.length > 5000) {
      return c.json({ error: "Message must be under 5,000 characters" }, 400);
    }

    // Validate email format if provided
    let safeEmail: string | undefined = undefined;
    if (email && typeof email === "string" && email.trim()) {
      const trimmedEmail = email.trim();
      if (trimmedEmail.length > 150) {
        return c.json({ error: "Email must be under 150 characters" }, 400);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return c.json({ error: "Invalid email address format" }, 400);
      }
      safeEmail = trimmedEmail;
    }

    const safeName = name && typeof name === "string" ? name.trim().slice(0, 100) : null;
    const safeSubject = subject && typeof subject === "string" ? subject.trim().slice(0, 200) : "General";
    const trimmedMessage = message.trim();

    // Attempt to identify user if logged in
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch (_) {}

    // 1. Persist feedback securely to PostgreSQL first
    const saved = await db.feedback.create({
      data: {
        name: safeName,
        email: safeEmail || null,
        subject: safeSubject,
        message: trimmedMessage,
        emailed: false,
        userId,
      },
    });

    let emailDelivered = false;
    const targetAdminEmail = process.env.ADMIN_EMAIL || "lalitwagh2804@gmail.com";
    const resendApiKey = process.env.RESEND_API_KEY;

    // 2. Send Email via Resend with strict HTML escaping
    if (resendApiKey) {
      try {
        const escapedName = escapeHtml(safeName || "User");
        const escapedSubject = escapeHtml(safeSubject);
        const escapedEmail = safeEmail ? escapeHtml(safeEmail) : null;
        const escapedMessage = escapeHtml(trimmedMessage);

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: [targetAdminEmail.trim()],
            reply_to: safeEmail,
            subject: `[Intervue Feedback] ${escapedSubject}: from ${escapedName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                <h2 style="color: #2563EB; margin-top: 0;">New User Feedback Received</h2>
                <hr style="border: 0; border-top: 1px solid #eaeaea;" />
                <p><strong>Name:</strong> ${escapedName}</p>
                <p><strong>Email:</strong> ${escapedEmail ? `<a href="mailto:${escapedEmail}">${escapedEmail}</a>` : "Not provided"}</p>
                <p><strong>Subject:</strong> ${escapedSubject}</p>
                <p><strong>Received At:</strong> ${new Date().toLocaleString()}</p>
                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563EB; border-radius: 4px; margin: 15px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #334155;">Message:</h4>
                  <p style="margin: 0; white-space: pre-wrap; color: #1e293b;">${escapedMessage}</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #eaeaea;" />
                <p style="font-size: 11px; color: #888;">Intervue Automated Notification</p>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          emailDelivered = true;
          await db.feedback.update({
            where: { id: saved.id },
            data: { emailed: true },
          }).catch(() => {});
          console.log(`[Email Dispatcher] Feedback email successfully sent via Resend.`);
        } else {
          const errText = await emailResponse.text();
          console.error("[Email Dispatcher] Resend API error:", errText);
        }
      } catch (mailErr) {
        console.error("[Email Dispatcher] Failed to dispatch email via Resend:", mailErr);
      }
    }

    // 3. Dispatch to Discord / Slack webhook if configured
    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `**New Feedback Received on Intervue!**\n**From:** ${safeName || "Anonymous"} (${safeEmail || "N/A"})\n**Subject:** ${safeSubject}\n**Message:**\n> ${trimmedMessage.replace(/\n/g, "\n> ")}`,
          }),
        });
      } catch (err) {
        console.error("[Webhook Dispatcher] Failed calling webhook:", err);
      }
    }

    // 4. Safe Server Log without raw PII exposure
    console.log(`[Feedback] Saved feedback id=${saved.id}, subject="${saved.subject}", userId=${userId || "guest"}, emailed=${emailDelivered}`);

    return c.json({
      success: true,
      message: emailDelivered
        ? "Thank you! Your feedback has been received and emailed to our team."
        : "Thank you! Your feedback has been securely saved.",
      emailed: emailDelivered,
    });
  } catch (err: any) {
    console.error("Error saving feedback:", err);
    return c.json({ error: "Failed to submit feedback. Please try again later." }, 500);
  }
});

// GET /api/feedback - list all stored feedbacks (strictly admin-only access)
feedback.get("/", requireAuth, requireAdmin, async (c) => {
  try {
    const feedbacks = await db.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    return c.json({ feedbacks });
  } catch (err: any) {
    console.error("[Feedback Admin Error]", err);
    return c.json({ error: "Failed to retrieve feedback list" }, 500);
  }
});

export default feedback;
