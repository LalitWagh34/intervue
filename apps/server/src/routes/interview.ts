import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { aiReviewLimiter } from "../middleware/rateLimiter";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { evaluateInterview } from "../services/evaluation";
import { groq, GROQ_CHAT_MODEL } from "../lib/groq";
import { checkInputGuardrails, buildInterviewSystemPrompt } from "../lib/guardrails";

const app = new Hono<{Variables:AuthVariables}>();

app.post("/" , requireAuth ,async(c)=>{
    const user = c.get("user")
    const body = await c.req.json();
    
    const interview= await db.interview.create({
        data:{
            userId:user.id,
            mode:body.mode,
            role:body.role,
            difficulty:body.difficulty|| "mid",
            status:"active",
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
      skills: profile?.skills?.join(", "),
      experienceLevel: profile?.experienceLevel,
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
      skills: profile?.skills?.join(", "),
      experienceLevel: profile?.experienceLevel,
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
    skills: profile?.skills?.join(", "),
    experienceLevel: profile?.experienceLevel,
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