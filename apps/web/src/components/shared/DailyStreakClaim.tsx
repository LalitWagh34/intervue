import { useEffect, useRef } from "react";
import { useDailyCheckIn, useRewardsStatus } from "@/hooks/useRewards";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Flame, Coins } from "lucide-react";

export function DailyStreakClaim() {
  const { data: status, isSuccess } = useRewardsStatus();
  const checkIn = useDailyCheckIn();
  const queryClient = useQueryClient();
  const claimedRef = useRef(false);

  useEffect(() => {
    // Only claim referral once rewards status is loaded (meaning user is authenticated!)
    if (!isSuccess) return;

    try {
      const pendingRef = localStorage.getItem("intervue_referral_code");
      if (pendingRef) {
        api.post("/rewards/referral/claim", { referralCode: pendingRef })
          .then((r) => {
            if (r.data?.success) {
              localStorage.removeItem("intervue_referral_code");
              queryClient.invalidateQueries({ queryKey: ["rewards-status"] });
              queryClient.invalidateQueries({ queryKey: ["referral"] });
              toast.success("Referral bonus claimed! +50 Points awarded to you and your friend 🎉");
            }
          })
          .catch((err) => {
            const status = err?.response?.status;
            const msg = err?.response?.data?.error;
            // Only delete if it was an invalid code or already claimed, NOT if unauthenticated
            if (status !== 401) {
              localStorage.removeItem("intervue_referral_code");
              if (msg) toast.error(msg);
            }
          });
      }
    } catch {}

    if (claimedRef.current) return;
    if (status?.todayClaimed) {
      claimedRef.current = true;
      return;
    }

    claimedRef.current = true;

    checkIn.mutateAsync().then((res) => {
      if (!res.alreadyClaimed) {
        toast.custom(() => (
          <div className="flex items-center gap-3 bg-[#0D0E12] border border-[#272B33] rounded-xl px-4 py-3 shadow-2xl min-w-[280px]">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center shrink-0">
              <img src="/fire.png" alt="Streak" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#F5F7FA]">
                Day {res.streakCount} Streak! 🔥
              </p>
              <p className="text-xs text-[#A1A7B3] mt-0.5">
                <span className="text-[#22C55E] font-semibold">+{res.pointsAwarded} pts</span>
                {" "}daily reward claimed
              </p>
            </div>
            <div className="flex items-center gap-1 text-[#F59E0B] font-mono text-xs font-bold shrink-0">
              <Coins className="w-3.5 h-3.5" />
              {res.points}
            </div>
          </div>
        ), { duration: 4000 });
      }
    }).catch(() => {});
  }, [isSuccess, status?.todayClaimed]);

  return null;
}