import { Hono } from "hono";
import { db } from "@intervue/db";
import { requireAuth } from "../middleware/auth";
import type { AuthVariables } from "../types";

const rewards = new Hono<{ Variables: AuthVariables }>();

rewards.use("*", requireAuth);

const DAILY_POINTS = 10;
const REFERRAL_POINTS = 50;

// GET /api/rewards/status - get points, streak, whether today is claimed
rewards.get("/status", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  let profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: {
      points: true,
      streakCount: true,
      lastDailyCheckInAt: true,
      referralCode: true,
      totalReferrals: true,
    },
  });

  if (!profile) {
    profile = await db.profile.create({
      data: { userId: user.id },
      select: {
        points: true,
        streakCount: true,
        lastDailyCheckInAt: true,
        referralCode: true,
        totalReferrals: true,
      },
    });
  }

  const todayClaimed = profile.lastDailyCheckInAt
    ? isSameDay(new Date(profile.lastDailyCheckInAt), new Date())
    : false;

  return c.json({
    points: profile.points,
    streakCount: profile.streakCount,
    todayClaimed,
    referralCode: profile.referralCode,
    totalReferrals: profile.totalReferrals,
  });
});

// POST /api/rewards/daily-checkin - claim daily reward
rewards.post("/daily-checkin", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  let profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: { points: true, streakCount: true, lastDailyCheckInAt: true },
  });

  if (!profile) {
    profile = await db.profile.create({
      data: { userId: user.id },
      select: { points: true, streakCount: true, lastDailyCheckInAt: true },
    });
  }

  // Check if already claimed today
  if (profile.lastDailyCheckInAt && isSameDay(new Date(profile.lastDailyCheckInAt), new Date())) {
    return c.json({
      alreadyClaimed: true,
      points: profile.points,
      streakCount: profile.streakCount,
    });
  }

  // Check if continuing a streak (solved yesterday) or resetting
  const isConsecutive =
    profile.lastDailyCheckInAt &&
    isYesterday(new Date(profile.lastDailyCheckInAt));

  const newStreak = isConsecutive ? profile.streakCount + 1 : 1;
  const newPoints = profile.points + DAILY_POINTS;

  await db.profile.update({
    where: { userId: user.id },
    data: {
      points: newPoints,
      streakCount: newStreak,
      lastDailyCheckInAt: new Date(),
    },
  });

  return c.json({
    alreadyClaimed: false,
    pointsAwarded: DAILY_POINTS,
    points: newPoints,
    streakCount: newStreak,
  });
});

// GET /api/rewards/referral - get or generate referral code
rewards.get("/referral", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  let profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: { referralCode: true, totalReferrals: true, points: true },
  });

  if (!profile) {
    profile = await db.profile.create({
      data: { userId: user.id },
      select: { referralCode: true, totalReferrals: true, points: true },
    });
  }

  // Generate referral code if missing
  if (!profile.referralCode) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    profile = await db.profile.update({
      where: { userId: user.id },
      data: { referralCode: code },
      select: { referralCode: true, totalReferrals: true, points: true },
    });
  }

  return c.json({
    referralCode: profile.referralCode,
    totalReferrals: profile.totalReferrals,
    points: profile.points,
  });
});

// POST /api/rewards/referral/claim - claim referral code
rewards.post("/referral/claim", async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { referralCode } = body;

    if (!referralCode) return c.json({ error: "Referral code is required" }, 400);

    const cleanedCode = String(referralCode).trim().toUpperCase();

    // Find the referrer
    const referrerProfile = await db.profile.findFirst({
      where: { referralCode: { equals: cleanedCode, mode: "insensitive" } },
      select: { userId: true, points: true, totalReferrals: true },
    });

    if (!referrerProfile) return c.json({ error: "Invalid referral code" }, 404);
    if (referrerProfile.userId === user.id) {
      return c.json({ error: "You cannot refer your own account" }, 400);
    }

    // Ensure current user has a profile
    let myProfile = await db.profile.findUnique({
      where: { userId: user.id },
      select: { referredByUserId: true, points: true },
    });

    if (!myProfile) {
      myProfile = await db.profile.create({
        data: { userId: user.id, points: 0 },
        select: { referredByUserId: true, points: true },
      });
    }

    if (myProfile.referredByUserId) {
      return c.json({ error: "You have already claimed a referral bonus" }, 400);
    }

    // Credit both users with +50 points
    await db.$transaction([
      db.profile.update({
        where: { userId: user.id },
        data: {
          points: myProfile.points + REFERRAL_POINTS,
          referredByUserId: referrerProfile.userId,
        },
      }),
      db.profile.update({
        where: { userId: referrerProfile.userId },
        data: {
          points: referrerProfile.points + REFERRAL_POINTS,
          totalReferrals: referrerProfile.totalReferrals + 1,
        },
      }),
    ]);

    return c.json({ success: true, pointsAwarded: REFERRAL_POINTS });
  } catch (err: any) {
    console.error("Error claiming referral:", err);
    return c.json({ error: err.message || "Failed to claim referral" }, 500);
  }
});

// --- Helpers ------------------------------------------
function isSameDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function isYesterday(d: Date) {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return isSameDay(d, yesterday);
}

export default rewards;