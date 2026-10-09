import { Hono } from "hono";
import { promises as fs } from "fs";
import path from "path";
import { config } from "dotenv";

const feedback = new Hono();
const DATA_FILE = path.resolve(process.cwd(), "data", "feedbacks.json");

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  emailed: boolean;
}

// POST /api/feedback - submit user feedback
feedback.post("/", async (c) => {
  try {
    // Reload dotenv dynamically so any updates to .env take effect immediately
    config({ override: true });

    const body = await c.req.json();
    const { name, email, subject, message } = body;

    if (!message || !message.trim()) {
      return c.json({ error: "Message is required" }, 400);
    }

    const timestamp = new Date().toISOString();
    const targetAdminEmail = process.env.ADMIN_EMAIL || "lalitwagh2804@gmail.com";
    const resendApiKey = process.env.RESEND_API_KEY;

    let emailDelivered = false;

    // 1. Send Email via Resend if API key is provided
    if (resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: [targetAdminEmail.trim()],
            reply_to: email ? email.trim() : undefined,
            subject: `[Intervue Feedback] ${subject || "General"}: from ${name || "User"}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                <h2 style="color: #2563EB; margin-top: 0;">New User Feedback Received</h2>
                <hr style="border: 0; border-top: 1px solid #eaeaea;" />
                <p><strong>Name:</strong> ${name || "Anonymous"}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email || "Not provided"}</a></p>
                <p><strong>Subject:</strong> ${subject || "General Feedback"}</p>
                <p><strong>Received At:</strong> ${new Date().toLocaleString()}</p>
                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563EB; border-radius: 4px; margin: 15px 0;">
                  <h4 style="margin: 0 0 10px 0; color: #334155;">Message:</h4>
                  <p style="margin: 0; white-space: pre-wrap; color: #1e293b;">${message.trim()}</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #eaeaea;" />
                <p style="font-size: 11px; color: #888;">Intervue Automated Notification</p>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          emailDelivered = true;
          console.log(`[Email Dispatcher] Feedback email successfully sent to ${targetAdminEmail} via Resend!`);
        } else {
          const errText = await emailResponse.text();
          console.error("[Email Dispatcher] Resend API error:", errText);
        }
      } catch (mailErr) {
        console.error("[Email Dispatcher] Failed to dispatch email via Resend:", mailErr);
      }
    }

    // 2. Dispatch to Discord / Slack webhook if configured
    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `**New Feedback Received on Intervue!**\n**From:** ${name || "Anonymous"} (${email})\n**Subject:** ${subject}\n**Message:**\n> ${message.trim().replace(/\n/g, "\n> ")}`,
          }),
        });
      } catch (err) {
        console.error("[Webhook Dispatcher] Failed calling webhook:", err);
      }
    }

    // 3. Persist feedback to local file storage so it is NEVER lost
    const item: FeedbackItem = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name || "Anonymous",
      email: email || "",
      subject: subject || "General",
      message: message.trim(),
      createdAt: timestamp,
      emailed: emailDelivered,
    };

    try {
      let existingList: FeedbackItem[] = [];
      try {
        const fileContent = await fs.readFile(DATA_FILE, "utf-8");
        existingList = JSON.parse(fileContent);
      } catch {
        existingList = [];
      }
      existingList.unshift(item);
      await fs.writeFile(DATA_FILE, JSON.stringify(existingList, null, 2), "utf-8");
    } catch (saveErr) {
      console.error("[Feedback Storage] Failed writing to feedbacks.json:", saveErr);
    }

    // 4. Server Console Notification
    console.log(`\n======================================================`);
    console.log(`📬 [NEW USER FEEDBACK RECEIVED]`);
    console.log(`From: ${item.name} <${item.email}>`);
    console.log(`Subject: ${item.subject}`);
    console.log(`Message:`);
    console.log(item.message);
    console.log(`Email dispatched: ${emailDelivered ? `YES (Sent to ${targetAdminEmail})` : "NO (Add RESEND_API_KEY in .env to receive direct emails)"}`);
    console.log(`======================================================\n`);

    return c.json({
      success: true,
      message: emailDelivered
        ? "Thank you! Your feedback has been received and emailed to our team."
        : "Thank you! Your feedback has been saved and logged.",
      emailed: emailDelivered,
    });
  } catch (err: any) {
    console.error("Error saving feedback:", err);
    return c.json({ error: err.message || "Failed to submit feedback" }, 500);
  }
});

// GET /api/feedback - list all stored feedbacks (for admin review)
feedback.get("/", async (c) => {
  try {
    let existingList: FeedbackItem[] = [];
    try {
      const fileContent = await fs.readFile(DATA_FILE, "utf-8");
      existingList = JSON.parse(fileContent);
    } catch {
      existingList = [];
    }
    return c.json({ feedbacks: existingList });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default feedback;
