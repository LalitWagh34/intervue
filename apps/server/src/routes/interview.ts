import {Hono} from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import Groq from "groq-sdk"
import type { AuthVariables } from "../types";
import { evaluateInterview } from "../services/evaluation";

const app = new Hono<{Variables:AuthVariables}>();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

app.post("/:id/message", requireAuth, async (c) => {
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

  // ─── Handle interview start signal (voice only) ───
  if (body.message === "[START_INTERVIEW]") {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are conducting a ${interview.difficulty} level voice interview for a ${interview.role} position.
          Candidate background: ${profile?.skills?.join(", ") || "Not specified"}.
          Start by greeting the candidate warmly and asking your first interview question. Keep it brief and conversational. 2-3 sentences max.`,
        },
        { role: "user", content: "Start the interview" },
      ],
    });

    const text = completion.choices[0]?.message?.content || "";
    await db.message.create({
      data: { interviewId: id, role: "assistant", content: text },
    });
    return c.json({ text });
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

    const systemPrompt = `You are conducting a ${interview.difficulty} level voice interview for a ${interview.role} position.
    Candidate background: ${profile?.skills?.join(", ") || "Not specified"}, experience level: ${profile?.experienceLevel || "unknown"}.
    Keep responses SHORT — 2-3 sentences max since this is a voice conversation. Ask one question at a time.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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

  const systemPrompt = `You are conducting a ${interview.difficulty} level technical interview for a ${interview.role} position.
  Candidate background: ${profile?.skills?.join(", ") || "Not specified"}, experience level: ${profile?.experienceLevel || "unknown"}.
  Ask one question at a time. Follow up on their answers. Keep questions relevant to ${interview.role}.
  Keep your responses concise and conversational, like a real interviewer would speak.`;

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
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