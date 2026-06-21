import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export function useInterviews(){
    return useQuery({
        queryKey:["interviews"],
        queryFn:async()=>{
            const res = await api.get("/interviews");
            return res.data.interviews;
        }
    })
}