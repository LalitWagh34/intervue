import Groq from "groq-sdk";
import { db } from "@intervue/db";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function evaluateInterview(interviewId: string) {
  const interview = await db.interview.findUnique({
    where: { id: interviewId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!interview || interview.messages.length === 0) {
    return null;
  }

  // Mark as processing
  await db.evaluation.upsert({
    where: { interviewId },
    update: { status: "processing" },
    create: { interviewId, status: "processing" },
  });

  const transcript = interview.messages
    .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are an expert technical interview evaluator. Below is a transcript of a ${interview.difficulty} level interview for a ${interview.role} position.

TRANSCRIPT:
${transcript}

Evaluate the candidate's performance and respond with ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "score": <number 1-10>,
  "feedback": "<2-3 sentence overall summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "dimensionScores": {
    "technical": <number 1-10>,
    "communication": <number 1-10>,
    "problemSolving": <number 1-10>
  }
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?|```/g, "").trim();
    const result = JSON.parse(cleaned);

    await db.evaluation.update({
      where: { interviewId },
      data: {
        status: "completed",
        score: result.score,
        feedback: result.feedback,
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        dimensionScores: result.dimensionScores || {},
        completedAt: new Date(),
      },
    });

    await db.interview.update({
      where: { id: interviewId },
      data: { score: result.score },
    });

    return result;
  } catch (err) {
    console.error("Evaluation failed:", err);
    await db.evaluation.update({
      where: { interviewId },
      data: { status: "failed" },
    });
    return null;
  }
}