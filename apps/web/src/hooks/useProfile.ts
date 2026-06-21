import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export function useProfile(){
    return useQuery({
        queryKey:["profile"],
        queryFn:async()=>{
            const res = await api.get("/profile/me");
            return res.data.profile;
        }
    })
}