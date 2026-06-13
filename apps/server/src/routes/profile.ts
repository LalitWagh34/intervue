import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";

const app = new Hono<{ Variables: AuthVariables }>();

app.get("/" , requireAuth , async(c) =>{
    const user = c.get("user") ;

    const profile =await db.profile.findUnique({
        where:{userId:user.id},
        include:{user:true},
    })
    if(!profile){
        return c.json({error:"Profile not found"} , 400)
    }

    return c.json({profile})

})

app.post("/setup" , requireAuth ,async(c)=>{
    const user = c.get("user");
    const body =await c.req.json();

    const profile =await db.profile.upsert({
        where:{userId:user.id},
        update:{
            fullName: body.fullName,
            targetRole: body.targetRole,
            experienceLevel: body.experienceLevel,
            githubUrl: body.githubUrl,
            linkedinUrl: body.linkedinUrl,
            skills: body.skills || [],
        },
        create:{
            userId:user.id,
            fullName:body.fullName,
            targetRole: body.targetRole,
            experienceLevel: body.experienceLevel,
            githubUrl: body.githubUrl,
            linkedinUrl: body.linkedinUrl,
            skills: body.skills || [],
        },
    });
    return c.json({profile});
})

app.get("/me", requireAuth, async (c) => {
  const user = c.get("user");

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
  });

  return c.json({ profile });
});

export default app;