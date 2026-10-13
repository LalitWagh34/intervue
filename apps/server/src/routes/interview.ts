import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { aiReviewLimiter } from "../middleware/rateLimiter";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { evaluateInterview } from "../services/evaluation";
import { groq, GROQ_CHAT_MODEL } from "../lib/groq";
import { checkInputGuardrails, buildInterviewSystemPrompt } from "../lib/guardrails";
import { extractText } from "unpdf";

const app = new Hono<{Variables:AuthVariables}>();

app.post("/parse-resume", requireAuth, async (c) => {
  try {
    const contentType = c.req.header("content-type") || "";
    let rawText = "";
    let fileName = "Uploaded Resume";

    if (contentType.includes("multipart/form-data")) {
      const body = await c.req.parseBody();
      const file = body["file"];
      if (!file || typeof file === "string") {
        return c.json({ error: "No file provided" }, 400);
      }

      fileName = (file as File).name || "resume.pdf";
      const buffer = new Uint8Array(await (file as File).arrayBuffer());

      if (fileName.toLowerCase().endsWith(".pdf")) {
        const result = await extractText(buffer);
        rawText = Array.isArray(result.text) ? result.text.join("\n") : (result.text || "");
      } else {
        const dec = new TextDecoder("utf-8");
        rawText = dec.decode(buffer);
      }
    } else {
      const json = await c.req.json();
      rawText = json.text || "";
      fileName = json.fileName || "Imported Profile";
    }

    if (!rawText || rawText.trim().length < 20) {
      return c.json({ error: "Could not extract readable text from the file" }, 400);
    }

    // Clean up whitespace & non-printable characters
    const cleanText = rawText.replace(/[^\x20-\x7E\t\n\r]/g, " ").replace(/\s+/g, " ").trim();
    const truncated = cleanText.slice(0, 4000);

    // AI summarizer using Groq Llama to extract clean structured dossier
    const completion = await groq.chat.completions.create({
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
    });

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
    console.error("Resume parse error:", err);
    return c.json({ error: err.message || "Failed to parse resume" }, 500);
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
    const interviews = await db.interview.findMany({
        where:{
            userId:user.id
        },
        orderBy:{
            createdAt:"desc"
        },
        include:{
            evaluation:true
        },

    })
    return c.json({interviews});
})

app.get("/:id" , requireAuth,async(c)=>{
    const user =c.get("user");
    const id =c.req.param("id")!;

    const interview=await db.interview.findFirst({
        where:{
            id, 
            userId:user.id
        },
        include:{
            messages:{
                orderBy:{
                    createdAt:"asc"
                }
            },
            evaluation:true
        },
    })

    if(!interview){
        return c.json({error:"Interview Not found"} , 404);
    }

    return c.json({interview});
})

app.put("/:id/end" , requireAuth ,async(c)=>{
    const user =c.get("user");
    const id =c.req.param("id")!;

    const interview = await db.interview.update({
        where:{
            id,
            userId:user.id
        },
        data:{
            status:"completed",
            endedAt:new Date(),
        }
    })
    evaluateInterview(id).catch((err)=>console.error("Eval error:" , err))
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