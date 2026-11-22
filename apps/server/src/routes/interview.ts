import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { aiReviewLimiter } from "../middleware/rateLimiter";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { evaluateInterview } from "../services/evaluation";
import { groq, GROQ_CHAT_MODEL } from "../lib/groq";
import { checkInputGuardrails, buildInterviewSystemPrompt } from "../lib/guardrails";

const app = new Hono<{Variables:AuthVariables}>();

const MAX_RESUME_FILE_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_JSON_BYTES = 64 * 1024;
const MAX_RESUME_EXTRACTED_CHARACTERS = 20_000;
const MAX_RESUME_MODEL_CHARACTERS = 4_000;
const RESUME_MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const RESUME_ANALYSIS_TIMEOUT_MS = 30_000;
const DEFAULT_INTERVIEW_PAGE_SIZE = 30;
const MAX_INTERVIEW_PAGE_SIZE = 100;
const DEFAULT_TRANSCRIPT_PAGE_SIZE = 100;
const MAX_TRANSCRIPT_PAGE_SIZE = 100;

function parseInterviewPageSize(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_INTERVIEW_PAGE_SIZE;
  return Math.min(parsed, MAX_INTERVIEW_PAGE_SIZE);
}

function parseTranscriptPageSize(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_TRANSCRIPT_PAGE_SIZE;
  return Math.min(parsed, MAX_TRANSCRIPT_PAGE_SIZE);
}

const evaluationPublicSelect = {
    id: true,
    status: true,
    attemptCount: true,
    nextAttemptAt: true,
    score: true,
    feedback: true,
    strengths: true,
    improvements: true,
    dimensionScores: true,
    rubric: true,
    createdAt: true,
    completedAt: true,
} as const;

app.post("/parse-resume", requireAuth, aiReviewLimiter, async (c) => {
  try {
    const contentType = (c.req.header("content-type") || "").toLowerCase();
    const contentLength = Number(c.req.header("content-length"));
    let rawText = "";
    let fileName = "Uploaded Resume";

    if (contentType.includes("multipart/form-data")) {
      if (
        Number.isFinite(contentLength) &&
        contentLength > MAX_RESUME_FILE_BYTES + RESUME_MULTIPART_OVERHEAD_BYTES
      ) {
        return c.json({ error: "Resume file must be 5 MB or smaller" }, 413);
      }

      const formData = await c.req.formData().catch(() => null);
      if (!formData) {
        return c.json({ error: "Invalid multipart resume upload" }, 400);
      }

      const file = formData.get("file");
      if (!(file instanceof File)) {
        return c.json({ error: "No file provided" }, 400);
      }

      if (file.size === 0) {
        return c.json({ error: "Resume file is empty" }, 400);
      }
      if (file.size > MAX_RESUME_FILE_BYTES) {
        return c.json({ error: "Resume file must be 5 MB or smaller" }, 413);
      }

      fileName = file.name || "resume.pdf";
      const normalizedName = fileName.toLowerCase();
      const mimeType = file.type.toLowerCase().split(";")[0]?.trim();
      const isPdf = normalizedName.endsWith(".pdf") && mimeType === "application/pdf";
      const isText = normalizedName.endsWith(".txt") && mimeType === "text/plain";
      if (!isPdf && !isText) {
        return c.json({ error: "Only PDF and plain-text resume files are supported" }, 415);
      }

      // Upload bytes remain request-scoped and are never persisted by this endpoint.
      const buffer = new Uint8Array(await file.arrayBuffer());

      if (isPdf) {
        const pdfSignature = new TextDecoder("ascii").decode(buffer.slice(0, 5));
        if (pdfSignature !== "%PDF-") {
          return c.json({ error: "The PDF resume is malformed" }, 400);
        }
        // Dynamically import unpdf only when processing a PDF to keep base memory low
        try {
          const { extractText } = await import("unpdf");
          const result = await extractText(buffer);
          rawText = Array.isArray(result.text) ? result.text.join("\n") : (result.text || "");
        } catch {
          return c.json({ error: "The PDF resume could not be read" }, 400);
        }
      } else {
        try {
          rawText = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
        } catch {
          return c.json({ error: "The text resume is not valid UTF-8" }, 400);
        }
      }
    } else if (contentType.includes("application/json")) {
      if (Number.isFinite(contentLength) && contentLength > MAX_RESUME_JSON_BYTES) {
        return c.json({ error: "Resume text payload is too large" }, 413);
      }
      const json = await c.req.json().catch(() => null);
      if (!json || typeof json.text !== "string") {
        return c.json({ error: "Resume text is required" }, 400);
      }
      rawText = json.text;
      fileName = typeof json.fileName === "string" && json.fileName.trim()
        ? json.fileName.trim().slice(0, 255)
        : "Imported Profile";
    } else {
      return c.json({ error: "Use multipart/form-data or application/json" }, 415);
    }

    if (!rawText || rawText.trim().length < 20) {
      return c.json({ error: "Could not extract readable text from the file" }, 400);
    }

    // Clean up whitespace & non-printable characters
    const cleanText = rawText.replace(/[^\x20-\x7E\t\n\r]/g, " ").replace(/\s+/g, " ").trim();
    if (cleanText.length > MAX_RESUME_EXTRACTED_CHARACTERS) {
      return c.json({ error: "Extracted resume text is too long" }, 413);
    }
    const truncated = cleanText.slice(0, MAX_RESUME_MODEL_CHARACTERS);

    // AI summarizer using Groq Llama to extract clean structured dossier
    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: GROQ_CHAT_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert technical resume analyzer. Extract key engineering details from the candidate's resume text into JSON:
{
  "projects": ["Project Name: 1-sentence description of architecture or key achievements (max 3 standout projects)"],
  "stack": ["Key technologies, languages, databases, or frameworks (max 8)"],
  "summary": "1-2 sentence executive summary of the candidate's engineering background"
}
Output ONLY valid JSON.`,
          },
          {
            role: "user",
            content: truncated,
          },
        ],
        response_format: { type: "json_object" },
      }, { signal: AbortSignal.timeout(RESUME_ANALYSIS_TIMEOUT_MS) });
    } catch (error: any) {
      if (error?.name === "AbortError" || error?.name === "TimeoutError") {
        return c.json({ error: "Resume analysis timed out. Please try again." }, 504);
      }
      console.error("[Resume Parser] Analysis failed", { status: error?.status, name: error?.name });
      return c.json({ error: "Resume analysis is temporarily unavailable" }, 502);
    }

    let dossier: { projects?: string[]; stack?: string[]; summary?: string } = { projects: [], stack: [], summary: "" };
    try {
      dossier = JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch {
      // Fallback
    }

    return c.json({
      success: true,
      fileName,
      extractedText: truncated,
      dossier: {
        projects: dossier.projects || [],
        stack: dossier.stack || [],
        summary: dossier.summary || "",
      },
    });
  } catch (err: any) {
    console.error("[Resume Parser] Unexpected failure", { name: err?.name });
    return c.json({ error: "Failed to parse resume" }, 500);
  }
});

app.post("/" , requireAuth ,async(c)=>{
    const user = c.get("user")
    const body = await c.req.json();
    
    // Resume context: from request payload or existing user profile
    let resumeText = body.resumeText;
    if (!resumeText) {
      const profile = await db.profile.findUnique({
        where: { userId: user.id },
        select: { resumeText: true, bio: true, skills: true },
      });
      if (profile?.resumeText) {
        resumeText = profile.resumeText;
      } else if (profile?.bio && profile.skills?.length > 0) {
        resumeText = `Candidate Bio: ${profile.bio}\nKey Skills: ${profile.skills.join(", ")}`;
      }
    }

    const interview= await db.interview.create({
        data:{
            userId:user.id,
            mode:body.mode,
            role:body.role,
            difficulty:body.difficulty|| "mid",
            focus:body.focus || "comprehensive",
            status:"active",
            resumeText: resumeText || null,
        },
    });

    return c.json({interview})
})

app.get("/" , requireAuth, async(c) =>{
    const user = c.get("user")
    const limit = parseInterviewPageSize(c.req.query("limit"));
    const cursor = c.req.query("cursor");
    const interviews = await db.interview.findMany({
        where:{
            userId:user.id
        },
        orderBy:[
            { createdAt:"desc" },
            { id:"desc" }
        ],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include:{
            evaluation: { select: evaluationPublicSelect }
        },

    })
    const hasMore = interviews.length > limit;
    const page = hasMore ? interviews.slice(0, limit) : interviews;
    return c.json({
        interviews: page,
        pageInfo: {
            hasMore,
            nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
        },
    });
})

app.get("/:id" , requireAuth,async(c)=>{
    const user =c.get("user");
    const id =c.req.param("id")!;
    const limit = parseTranscriptPageSize(c.req.query("limit"));
    const cursor = c.req.query("cursor");

    const interview=await db.interview.findFirst({
        where:{
            id, 
            userId:user.id
        },
        include:{
            evaluation: { select: evaluationPublicSelect }
        },
    })

    if(!interview){
        return c.json({error:"Interview Not found"} , 404);
    }

    const newestFirst = await db.message.findMany({
        where: { interviewId: id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = newestFirst.length > limit;
    const pageNewestFirst = hasMore ? newestFirst.slice(0, limit) : newestFirst;
    const messages = [...pageNewestFirst].reverse();

    return c.json({
        interview: { ...interview, messages },
        pageInfo: {
            hasMore,
            nextCursor: hasMore ? pageNewestFirst[pageNewestFirst.length - 1]?.id ?? null : null,
        },
    });
})

app.put("/:id/end" , requireAuth ,async(c)=>{
    const user =c.get("user");
    const id =c.req.param("id")!;

    const { interview, shouldEvaluate } = await db.$transaction(async (tx) => {
        const endedAt = new Date();
        const transition = await tx.interview.updateMany({
            where: {
                id,
                userId: user.id,
                status: { in: ["active", "in_progress"] },
            },
            data: {
                status: "completed",
                endedAt,
            },
        });

        const interview = await tx.interview.findFirst({
            where: { id, userId: user.id },
        });
        if (!interview) return { interview: null, shouldEvaluate: false };

        if (transition.count === 1) {
            await tx.evaluation.upsert({
                where: { interviewId: id },
                update: {},
                create: { interviewId: id, status: "pending" },
            });
        }

        return { interview, shouldEvaluate: transition.count === 1 };
    });

    if (!interview) return c.json({ error: "Interview Not found" }, 404);

    if (shouldEvaluate) {
        evaluateInterview(id).catch((err)=>console.error("Eval error:" , err));
    }
    return c.json({interview})
})

app.put("/:id/abandon" , requireAuth ,async(c)=>{
    const user =c.get("user");
    const id = c.req.param("id")!;

    const interview = await db.interview.update({
        where:{
            id,
            userId:user.id
        },
        data:{
            status:"abandoned",
            
        }
    })

    return c.json({interview})
})

app.post("/:id/evaluation/retry", requireAuth, aiReviewLimiter, async (c) => {
    const user = c.get("user");
    const id = c.req.param("id")!;

    const interview = await db.interview.findFirst({
        where: { id, userId: user.id },
        include: { evaluation: true },
    });

    if (!interview) return c.json({ error: "Interview Not found" }, 404);
    if (!interview.evaluation) {
        return c.json({ error: "Evaluation has not been created" }, 409);
    }
    if (interview.evaluation.status !== "failed") {
        return c.json({ error: "Only failed evaluations can be retried" }, 409);
    }

    const reset = await db.evaluation.updateMany({
        where: { interviewId: id, status: "failed" },
        data: {
            status: "pending",
            attemptCount: 0,
            lastAttemptAt: null,
            nextAttemptAt: null,
            lastError: null,
        },
    });

    if (reset.count !== 1) {
        return c.json({ error: "Evaluation is already being retried" }, 409);
    }

    evaluateInterview(id).catch((err) => console.error("Eval retry error:", err));
    return c.json({ evaluation: { status: "pending" } }, 202);
})

app.post("/:id/message", requireAuth, aiReviewLimiter, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const isVoice = body.isVoice === true;

  const interview = await db.interview.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!interview) {
    return c.json({ error: "Interview not found" }, 404);
  }

  const profile = await db.profile.findUnique({ where: { userId: user.id } });

  // ─── Handle interview start signal (initial prompt) ───
  if (body.message === "[START_INTERVIEW]") {
    const systemPrompt = buildInterviewSystemPrompt({
      role: interview.role,
      difficulty: interview.difficulty,
      focus: interview.focus || "comprehensive",
      skills: profile?.skills?.join(", "),
      experienceLevel: profile?.experienceLevel,
      resumeText: interview.resumeText,
      isVoice,
    });

    const completion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Hello, I am ready to begin the technical interview." },
      ],
    });

    const text = completion.choices[0]?.message?.content || "";
    await db.message.create({
      data: { interviewId: id, role: "assistant", content: text },
    });
    return c.json({ text });
  }

  // ─── Fast Guardrail Pre-Check (Blocks jailbreaks & off-topic questions) ───
  const guardrail = checkInputGuardrails(body.message, "INTERVIEW", interview.role);
  if (guardrail.isBlocked) {
    await db.message.create({
      data: { interviewId: id, role: "user", content: body.message },
    });
    await db.message.create({
      data: { interviewId: id, role: "assistant", content: guardrail.refusalMessage! },
    });

    if (isVoice) {
      return c.json({ text: guardrail.refusalMessage });
    }

    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text: guardrail.refusalMessage })}\n\n`)
          );
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  // ─── Voice mode — return JSON not SSE ───
  if (isVoice) {
    await db.message.create({
      data: { interviewId: id, role: "user", content: body.message },
    });

    const history = interview.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    history.push({ role: "user", content: body.message });

    const systemPrompt = buildInterviewSystemPrompt({
      role: interview.role,
      difficulty: interview.difficulty,
      focus: interview.focus || "comprehensive",
      skills: profile?.skills?.join(", "),
      experienceLevel: profile?.experienceLevel,
      resumeText: interview.resumeText,
      isVoice: true,
    });

    const completion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...history],
    });

    const text = completion.choices[0]?.message?.content || "";
    await db.message.create({
      data: { interviewId: id, role: "assistant", content: text },
    });
    return c.json({ text });
  }

  // ─── Text mode — SSE streaming ───
  await db.message.create({
    data: { interviewId: id, role: "user", content: body.message },
  });

  const history = interview.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  history.push({ role: "user", content: body.message });

  const systemPrompt = buildInterviewSystemPrompt({
    role: interview.role,
    difficulty: interview.difficulty,
    focus: interview.focus || "comprehensive",
    skills: profile?.skills?.join(", "),
    experienceLevel: profile?.experienceLevel,
    resumeText: interview.resumeText,
    isVoice: false,
  });

  const stream = await groq.chat.completions.create({
    model: GROQ_CHAT_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...history],
    stream: true,
  });

  let fullResponse = "";

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          fullResponse += text;
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        }

        await db.message.create({
          data: { interviewId: id, role: "assistant", content: fullResponse },
        });

        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
});
export default app;
