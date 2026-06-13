import {Hono} from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";

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
    const id =c.req.param("id");

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
    const id =c.req.param("id");

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

    return c.json({interview})
})

app.put("/:id/abandon" , requireAuth ,async(c)=>{
    const user =c.get("user");
    const id =c.req.param("id");

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

export default app;