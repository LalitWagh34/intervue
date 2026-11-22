import { api } from "@/lib/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useInterviews(){
    const query = useInfiniteQuery({
        queryKey:["interviews"],
        initialPageParam: undefined as string | undefined,
        queryFn:async({ pageParam })=>{
            const res = await api.get("/interviews", {
                params: { limit: 30, ...(pageParam ? { cursor: pageParam } : {}) },
            });
            return res.data;
        },
        getNextPageParam: (lastPage) => lastPage.pageInfo.hasMore
            ? lastPage.pageInfo.nextCursor ?? undefined
            : undefined,
    });
    const interviews = useMemo(
        () => query.data?.pages.flatMap((page) => page.interviews) ?? undefined,
        [query.data]
    );

    return { ...query, data: interviews };
}
