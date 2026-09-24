import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { judgeSubmission } from "../services/judge";
import { roomSocketManager } from "../services/roomSocket";

const app = new Hono<{ Variables: AuthVariables }>();

// Helper to generate a unique 6-character uppercase alphanumeric code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars (0, O, 1, I)
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── GET /api/rooms/meta/topics ──────────────────────────────────────────
// Returns available topics and subjects for creating a room
app.get("/meta/topics", requireAuth, async (c) => {
  try {
    const problems = await db.problem.findMany({
      where: { status: "published" },
      select: { tags: true },
    });

    const allTags = new Set<string>();
    problems.forEach((p) => p.tags.forEach((t) => allTags.add(t)));

    const assessmentQuestions = await db.assessmentQuestion.findMany({
      select: { category: true, subject: true, topic: true },
    });

    const coreCsSubjects = new Set<string>();
    const aptitudeSubjects = new Set<string>();

    assessmentQuestions.forEach((q) => {
      if (q.category === "CORE_CS") {
        coreCsSubjects.add(q.subject);
      } else if (q.category === "APTITUDE") {
        aptitudeSubjects.add(q.subject);
      }
    });

    return c.json({
      codingTags: Array.from(allTags).sort(),
      coreCsSubjects: Array.from(coreCsSubjects).sort(),
      aptitudeSubjects: Array.from(aptitudeSubjects).sort(),
    });
  } catch (error) {
    console.error("Error fetching room meta topics:", error);
    return c.json({ error: "Failed to fetch room topics" }, 500);
  }
});

// ─── POST /api/rooms ─────────────────────────────────────────────────────
// Create a new competitive room
app.post("/", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const title = (body.title || "").trim();
    if (!title) {
      return c.json({ error: "Room title is required" }, 400);
    }

    const type = body.type || "CODING";
    if (!["CODING", "APTITUDE", "MIXED"].includes(type)) {
      return c.json({ error: "Invalid room type. Must be CODING, APTITUDE, or MIXED" }, 400);
    }

    const duration = Math.min(Math.max(Number(body.duration) || 30, 5), 180);
    const maxParticipants = Math.min(Math.max(Number(body.maxParticipants) || 10, 2), 50);

    // Generate unique code with collision safety
    let code = "";
    let codeIsUnique = false;
    for (let attempts = 0; attempts < 5; attempts++) {
      code = generateRoomCode();
      const existing = await db.room.findUnique({ where: { code } });
      if (!existing) {
        codeIsUnique = true;
        break;
      }
    }

    if (!codeIsUnique) {
      return c.json({ error: "Could not generate unique room code. Please try again." }, 500);
    }

    // Question Selection logic based on config & type
    const questionsToLink: Array<{
      orderIndex: number;
      points: number;
      problemId?: number;
      assessmentQuestionId?: string;
    }> = [];

    let currentOrder = 1;

    // 1. Coding Problems Selection
    if (type === "CODING" || type === "MIXED") {
      const codingCount = Number(body.codingCount) || (type === "MIXED" ? 2 : 3);
      const codingTags = Array.isArray(body.codingTags) && body.codingTags.length > 0 ? body.codingTags : undefined;
      const codingDifficulty = body.codingDifficulty;

      const problemWhere: any = { status: "published" };
      if (codingDifficulty) {
        problemWhere.difficulty = codingDifficulty;
      }
      if (codingTags) {
        problemWhere.tags = { hasSome: codingTags };
      }

      let selectedProblems = await db.problem.findMany({
        where: problemWhere,
        take: codingCount,
        orderBy: { id: "asc" },
      });

      // Fallback if specific tags don't yield enough problems
      if (selectedProblems.length < codingCount) {
        const fallbackProblems = await db.problem.findMany({
          where: {
            status: "published",
            id: { notIn: selectedProblems.map((p) => p.id) },
          },
          take: codingCount - selectedProblems.length,
          orderBy: { id: "asc" },
        });
        selectedProblems = [...selectedProblems, ...fallbackProblems];
      }

      selectedProblems.forEach((problem) => {
        let points = 100;
        if (problem.difficulty === "MEDIUM") points = 200;
        if (problem.difficulty === "HARD") points = 300;

        questionsToLink.push({
          orderIndex: currentOrder++,
          points,
          problemId: problem.id,
        });
      });
    }

    // 2. Assessment MCQs Selection (Aptitude / Core CS)
    if (type === "APTITUDE" || type === "MIXED") {
      const assessmentCount = Number(body.assessmentCount) || (type === "MIXED" ? 10 : 15);
      const assessmentSubjects =
        Array.isArray(body.assessmentSubjects) && body.assessmentSubjects.length > 0
          ? body.assessmentSubjects
          : undefined;

      const assessmentWhere: any = {};
      if (assessmentSubjects) {
        assessmentWhere.subject = { in: assessmentSubjects };
      }

      let selectedMCQs = await db.assessmentQuestion.findMany({
        where: assessmentWhere,
        take: assessmentCount,
        orderBy: { id: "asc" },
      });

      // Fallback if specific subjects don't yield enough questions
      if (selectedMCQs.length < assessmentCount) {
        const fallbackMCQs = await db.assessmentQuestion.findMany({
          where: {
            id: { notIn: selectedMCQs.map((m) => m.id) },
          },
          take: assessmentCount - selectedMCQs.length,
          orderBy: { id: "asc" },
        });
        selectedMCQs = [...selectedMCQs, ...fallbackMCQs];
      }

      selectedMCQs.forEach((mcq) => {
        questionsToLink.push({
          orderIndex: currentOrder++,
          points: 4, // standard +4 points for MCQs
          assessmentQuestionId: mcq.id,
        });
      });
    }

    // Safety check: Never allow an empty contest room
    if (questionsToLink.length === 0) {
      // Emergency fallback: fetch any published problem or MCQ
      const anyProblem = await db.problem.findFirst({ where: { status: "published" } });
      if (anyProblem) {
        questionsToLink.push({
          orderIndex: currentOrder++,
          points: 100,
          problemId: anyProblem.id,
        });
      } else {
        const anyMCQ = await db.assessmentQuestion.findFirst();
        if (anyMCQ) {
          questionsToLink.push({
            orderIndex: currentOrder++,
            points: 4,
            assessmentQuestionId: anyMCQ.id,
          });
        } else {
          return c.json({ error: "No questions available in database to initialize contest room." }, 400);
        }
      }
    }

    // Create Room and Link Host Participant + Questions inside a transaction
    const newRoom = await db.$transaction(async (tx) => {
      const createdRoom = await tx.room.create({
        data: {
          code,
          title,
          type: type as any,
          status: "WAITING",
          duration,
          maxParticipants,
          hostId: user.id,
          config: {
            codingTags: body.codingTags || [],
            assessmentSubjects: body.assessmentSubjects || [],
            allowLateJoin: body.allowLateJoin ?? true,
          },
        },
      });

      // Add Host as first participant
      await tx.roomParticipant.create({
        data: {
          roomId: createdRoom.id,
          userId: user.id,
          role: "HOST",
        },
      });

      // Link questions if any were selected
      if (questionsToLink.length > 0) {
        await tx.roomQuestion.createMany({
          data: questionsToLink.map((q) => ({
            roomId: createdRoom.id,
            orderIndex: q.orderIndex,
            points: q.points,
            problemId: q.problemId || null,
            assessmentQuestionId: q.assessmentQuestionId || null,
          })),
        });
      }

      return createdRoom;
    });

    return c.json({
      message: "Room created successfully",
      room: {
        id: newRoom.id,
        code: newRoom.code,
        title: newRoom.title,
        type: newRoom.type,
        status: newRoom.status,
        duration: newRoom.duration,
      },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return c.json({ error: "Internal server error creating room" }, 500);
  }
});

// ─── POST /api/rooms/join ────────────────────────────────────────────────
// Join room by 6-character code
app.post("/join", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const code = (body.code || "").trim().toUpperCase();

    if (!code) {
      return c.json({ error: "Room code is required" }, 400);
    }

    const room = await db.room.findUnique({
      where: { code },
      include: {
        participants: true,
      },
    });

    if (!room) {
      return c.json({ error: "Room not found with this code" }, 404);
    }

    if (room.status === "FINISHED") {
      return c.json({ error: "This contest has already finished" }, 400);
    }

    if (room.status === "ACTIVE") {
      const allowLateJoin = (room.config as any)?.allowLateJoin ?? true;
      if (!allowLateJoin) {
        return c.json({ error: "Contest has already started and late joining is not permitted." }, 400);
      }
    }

    // Check if user is already a participant
    const existingParticipant = room.participants.find((p) => p.userId === user.id);
    if (existingParticipant) {
      return c.json({
        message: "Already joined room",
        roomCode: room.code,
        role: existingParticipant.role,
      });
    }

    // Capacity check
    if (room.participants.length >= room.maxParticipants) {
      return c.json({ error: "Room has reached maximum participant capacity" }, 400);
    }

    // Join room
    await db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: user.id,
        role: "PARTICIPANT",
      },
    });

    return c.json({
      message: "Joined room successfully",
      roomCode: room.code,
      role: "PARTICIPANT",
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return c.json({ error: "Internal server error joining room" }, 500);
  }
});

// ─── GET /api/rooms/history ──────────────────────────────────────────────
// Get user's participated and finished contests
app.get("/history", requireAuth, async (c) => {
  try {
    const user = c.get("user");

    const participations = await db.roomParticipant.findMany({
      where: { userId: user.id },
      include: {
        room: {
          include: {
            host: { select: { id: true, name: true, image: true } },
            questions: { select: { id: true } },
            participants: {
              select: { id: true, userId: true, score: true, penaltyTime: true },
              orderBy: [{ score: "desc" }, { penaltyTime: "asc" }],
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const contests = participations.map((p) => {
      const room = p.room;
      const sortedParticipants = room.participants;
      const rankIndex = sortedParticipants.findIndex((sp) => sp.userId === user.id);
      const myRank = rankIndex !== -1 ? rankIndex + 1 : 1;

      return {
        id: room.id,
        code: room.code,
        title: room.title,
        type: room.type,
        status: room.status,
        duration: room.duration,
        startTime: room.startTime,
        endTime: room.endTime,
        createdAt: room.createdAt,
        joinedAt: p.joinedAt,
        role: p.role,
        myScore: p.score,
        mySolvedCount: p.solvedCount,
        myRank,
        totalParticipants: sortedParticipants.length,
        totalQuestions: room.questions.length,
      };
    });

    return c.json({ contests });
  } catch (error) {
    console.error("Error fetching user contest history:", error);
    return c.json({ error: "Failed to load contest history" }, 500);
  }
});

// ─── GET /api/rooms/:code ────────────────────────────────────────────────
// Get complete authoritative room state
app.get("/:code", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const code = (c.req.param("code") || "").toUpperCase();

    const room = await db.room.findUnique({
      where: { code },
      include: {
        host: {
          select: { id: true, name: true, image: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: [{ score: "desc" }, { penaltyTime: "asc" }],
        },
        questions: {
          orderBy: { orderIndex: "asc" },
          include: {
            problem: {
              include: {
                examples: { orderBy: { orderIndex: "asc" } },
                testCases: { where: { isHidden: false }, orderBy: { orderIndex: "asc" } },
                templates: true,
              },
            },
            assessmentQuestion: true,
          },
        },
      },
    });

    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }

    // Check if user is part of the room
    const currentParticipant = room.participants.find((p) => p.userId === user.id);
    const isHost = room.hostId === user.id;

    // Check if contest is finished or active
    const isFinished = room.status === "FINISHED";

    // Strictly enforce authorization: if not host and not participant, do NOT reveal questions or allow arena access
    if (!currentParticipant && !isHost && !isFinished) {
      return c.json(
        {
          error: "You are not a participant in this room. Please join using the room code first.",
          requiresJoin: true,
          room: {
            id: room.id,
            code: room.code,
            title: room.title,
            type: room.type,
            status: room.status,
            duration: room.duration,
            maxParticipants: room.maxParticipants,
            startTime: room.startTime,
            endTime: room.endTime,
            host: room.host,
            isHost: false,
            isParticipant: false,
            currentParticipantId: null,
            participantCount: room.participants.length,
            questionsCount: room.questions.length,
            allowLateJoin: (room.config as any)?.allowLateJoin ?? true,
          },
        },
        403
      );
    }

    // Sanitize questions: strip hidden answers for active/waiting contests
    const sanitizedQuestions = room.questions.map((rq) => {
      const base: any = {
        id: rq.id,
        orderIndex: rq.orderIndex,
        points: rq.points,
        type: rq.problem ? "CODING" : "MCQ",
      };

      if (rq.problem) {
        base.problem = {
          id: rq.problem.id,
          title: rq.problem.title,
          slug: rq.problem.slug,
          difficulty: rq.problem.difficulty,
          description: rq.problem.description,
          constraints: rq.problem.constraints,
          inputFormat: rq.problem.inputFormat,
          outputFormat: rq.problem.outputFormat,
          hints: rq.problem.hints,
          tags: rq.problem.tags,
          timeLimit: rq.problem.timeLimit,
          memoryLimit: rq.problem.memoryLimit,
          examples: rq.problem.examples,
          templates: rq.problem.templates,
          sampleTestCases: rq.problem.testCases,
        };
      }

      if (rq.assessmentQuestion) {
        base.assessmentQuestion = {
          id: rq.assessmentQuestion.id,
          category: rq.assessmentQuestion.category,
          subject: rq.assessmentQuestion.subject,
          topic: rq.assessmentQuestion.topic,
          difficulty: rq.assessmentQuestion.difficulty,
          question: rq.assessmentQuestion.question,
          options: rq.assessmentQuestion.options,
          // Only reveal correctOption and explanation if the contest has ended!
          ...(isFinished
            ? {
                correctOption: rq.assessmentQuestion.correctOption,
                explanation: rq.assessmentQuestion.explanation,
              }
            : {}),
        };
      }

      return base;
    });

    return c.json({
      room: {
        id: room.id,
        code: room.code,
        title: room.title,
        type: room.type,
        status: room.status,
        duration: room.duration,
        maxParticipants: room.maxParticipants,
        startTime: room.startTime,
        endTime: room.endTime,
        host: room.host,
        isHost,
        currentParticipantId: currentParticipant?.id || null,
        participants: room.participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          name: p.user.name,
          image: p.user.image,
          role: p.role,
          score: p.score,
          solvedCount: p.solvedCount,
          penaltyTime: p.penaltyTime,
        })),
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    console.error("Error fetching room details:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── POST /api/rooms/:code/start ─────────────────────────────────────────
// Host starts contest (authoritative timer initiation)
app.post("/:code/start", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const code = (c.req.param("code") || "").toUpperCase();

    const room = await db.room.findUnique({
      where: { code },
    });

    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }

    if (room.hostId !== user.id) {
      return c.json({ error: "Only the host can start the contest" }, 403);
    }

    if (room.status === "ACTIVE") {
      return c.json({
        message: "Contest is already active",
        status: room.status,
        startTime: room.startTime,
        endTime: room.endTime,
      });
    }

    if (room.status !== "WAITING") {
      return c.json({ error: `Cannot start contest. Current status is ${room.status}` }, 400);
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + room.duration * 60 * 1000);

    const updatedRoom = await db.room.update({
      where: { id: room.id },
      data: {
        status: "ACTIVE",
        startTime,
        endTime,
      },
    });

    // Broadcast contest start to all connected participants & start server timer
    roomSocketManager.handleContestStart(room.code, startTime, endTime);

    return c.json({
      message: "Contest started successfully",
      status: updatedRoom.status,
      startTime: updatedRoom.startTime,
      endTime: updatedRoom.endTime,
    });
  } catch (error) {
    console.error("Error starting contest:", error);
    return c.json({ error: "Internal server error starting contest" }, 500);
  }
});

// ─── POST /api/rooms/:code/finish ────────────────────────────────────────
// Individual participant finishes and submits their test early
app.post("/:code/finish", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const code = (c.req.param("code") || "").toUpperCase();

    const room = await db.room.findUnique({
      where: { code },
      include: { participants: true },
    });

    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }

    const participant = room.participants.find((p) => p.userId === user.id);
    if (!participant) {
      return c.json({ error: "You are not a participant in this room" }, 403);
    }

    // Broadcast subtle activity so other participants see this user finished
    roomSocketManager.broadcastToRoom(code, "submission:activity", {
      userId: user.id,
      userName: user.name || "Participant",
      userImage: user.image,
      problemTitle: "Finished Test",
      isAccepted: true,
      pointsAwarded: 0,
    });

    return c.json({
      message: "Test submitted successfully",
      roomCode: code,
      participantId: participant.id,
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    return c.json({ error: "Internal server error submitting test" }, 500);
  }
});

// ─── POST /api/rooms/:code/end ───────────────────────────────────────────
// Host authoritatively ends contest early
app.post("/:code/end", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const code = (c.req.param("code") || "").toUpperCase();

    const room = await db.room.findUnique({
      where: { code },
    });

    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }

    if (room.hostId !== user.id) {
      return c.json({ error: "Only the host can end the contest" }, 403);
    }

    if (room.status === "FINISHED") {
      return c.json({ message: "Contest already finished", status: "FINISHED" });
    }

    // Authoritatively conclude contest and broadcast to all participants
    await roomSocketManager.handleContestEnd(room.code);

    return c.json({
      message: "Contest ended successfully",
      status: "FINISHED",
    });
  } catch (error) {
    console.error("Error ending contest:", error);
    return c.json({ error: "Internal server error ending contest" }, 500);
  }
});

// ─── GET /api/rooms/:code/leaderboard ────────────────────────────────────
// Fetch authoritative leaderboard
app.get("/:code/leaderboard", requireAuth, async (c) => {
  try {
    const code = (c.req.param("code") || "").toUpperCase();

    const room = await db.room.findUnique({
      where: { code },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: [{ score: "desc" }, { penaltyTime: "asc" }, { joinedAt: "asc" }],
        },
      },
    });

    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }

    const leaderboard = room.participants.map((p, idx) => ({
      rank: idx + 1,
      participantId: p.id,
      userId: p.userId,
      name: p.user.name || "Anonymous",
      image: p.user.image,
      role: p.role,
      score: p.score,
      solvedCount: p.solvedCount,
      penaltyTime: p.penaltyTime,
    }));

    return c.json({
      status: room.status,
      leaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── GET /api/rooms/:code/scorecard ────────────────────────────────────
// Detailed question-by-question breakdown, user answers, and explanations
app.get("/:code/scorecard", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const code = (c.req.param("code") || "").toUpperCase();

    const room = await db.room.findUnique({
      where: { code },
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: [{ score: "desc" }, { penaltyTime: "asc" }, { joinedAt: "asc" }],
        },
        questions: {
          orderBy: { orderIndex: "asc" },
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                timeLimit: true,
                memoryLimit: true,
              },
            },
            assessmentQuestion: true,
          },
        },
      },
    });

    if (!room) {
      return c.json({ error: "Room not found" }, 404);
    }

    const participant = room.participants.find((p) => p.userId === user.id);
    const isHost = room.hostId === user.id;

    if (!participant && !isHost && room.status !== "FINISHED") {
      return c.json({ error: "Access denied" }, 403);
    }

    // Fetch user's MCQ answers for this room
    const userMcqAnswers = await db.roomMcqAnswer.findMany({
      where: {
        roomId: room.id,
        userId: user.id,
      },
    });
    const mcqAnswerMap = new Map(userMcqAnswers.map((a) => [a.questionId, a]));

    // Fetch user's code submissions for this room
    const userSubmissions = await db.roomSubmission.findMany({
      where: {
        roomId: room.id,
        userId: user.id,
      },
      orderBy: { submittedAt: "desc" },
    });
    const submissionsByProblemId = new Map<number, any[]>();
    for (const sub of userSubmissions) {
      if (!submissionsByProblemId.has(sub.problemId)) {
        submissionsByProblemId.set(sub.problemId, []);
      }
      submissionsByProblemId.get(sub.problemId)!.push(sub);
    }

    // Compute rank
    const myRank = participant
      ? room.participants.findIndex((p) => p.userId === user.id) + 1
      : 1;

    // Explanations can be revealed if contest finished OR participant is reviewing
    const canRevealExplanations = room.status === "FINISHED" || participant != null;

    let codingPoints = 0;
    let mcqPoints = 0;
    let correctCount = 0;
    let totalAnswered = 0;

    const questionBreakdown = room.questions.map((rq) => {
      const isCoding = rq.problem != null;

      if (isCoding) {
        const problemSubs = submissionsByProblemId.get(rq.problem!.id) || [];
        const acceptedSub = problemSubs.find((s) => s.verdict === "ACCEPTED");
        const isSolved = acceptedSub != null;
        if (isSolved) {
          codingPoints += rq.points;
          correctCount++;
        }
        if (problemSubs.length > 0) totalAnswered++;

        return {
          id: rq.id,
          orderIndex: rq.orderIndex,
          type: "CODING",
          points: rq.points,
          problem: {
            id: rq.problem!.id,
            title: rq.problem!.title,
            slug: rq.problem!.slug,
            difficulty: rq.problem!.difficulty,
          },
          isSolved,
          bestVerdict: acceptedSub ? "ACCEPTED" : problemSubs[0]?.verdict || "UNATTEMPTED",
          submissionsCount: problemSubs.length,
          latestRuntime: problemSubs[0]?.runtime,
          latestMemory: problemSubs[0]?.memory,
        };
      } else {
        const myAnswer = mcqAnswerMap.get(rq.assessmentQuestion!.id);
        if (myAnswer) {
          totalAnswered++;
          if (myAnswer.isCorrect) {
            correctCount++;
            mcqPoints += myAnswer.pointsAwarded;
          } else {
            mcqPoints += myAnswer.pointsAwarded;
          }
        }

        return {
          id: rq.id,
          orderIndex: rq.orderIndex,
          type: "MCQ",
          points: rq.points,
          assessmentQuestion: {
            id: rq.assessmentQuestion!.id,
            category: rq.assessmentQuestion!.category,
            subject: rq.assessmentQuestion!.subject,
            topic: rq.assessmentQuestion!.topic,
            difficulty: rq.assessmentQuestion!.difficulty,
            question: rq.assessmentQuestion!.question,
            options: rq.assessmentQuestion!.options,
            correctOption: canRevealExplanations ? rq.assessmentQuestion!.correctOption : undefined,
            explanation: canRevealExplanations ? rq.assessmentQuestion!.explanation : undefined,
          },
          myAnswer: myAnswer
            ? {
                selectedOption: myAnswer.selectedOption,
                isCorrect: myAnswer.isCorrect,
                pointsAwarded: myAnswer.pointsAwarded,
                answeredAt: myAnswer.answeredAt,
              }
            : null,
        };
      }
    });

    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return c.json({
      room: {
        id: room.id,
        code: room.code,
        title: room.title,
        type: room.type,
        status: room.status,
        duration: room.duration,
        startTime: room.startTime,
        endTime: room.endTime,
        totalParticipants: room.participants.length,
        totalQuestions: room.questions.length,
      },
      userSummary: {
        rank: myRank,
        score: participant?.score ?? 0,
        solvedCount: participant?.solvedCount ?? 0,
        penaltyTime: participant?.penaltyTime ?? 0,
        accuracy,
        codingPoints,
        mcqPoints,
        totalAnswered,
        totalQuestions: room.questions.length,
      },
      questions: questionBreakdown,
    });
  } catch (error) {
    console.error("Error fetching scorecard:", error);
    return c.json({ error: "Failed to generate scorecard" }, 500);
  }
});

// ─── POST /api/rooms/:code/mcq-answer ────────────────────────────────────
// Submit an answer to an MCQ question
app.post("/:code/mcq-answer", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const code = (c.req.param("code") || "").toUpperCase();
    const body = await c.req.json();

    const { questionId, selectedOption } = body;
    if (!questionId || selectedOption === undefined) {
      return c.json({ error: "questionId and selectedOption are required" }, 400);
    }

    const room = await db.room.findUnique({
      where: { code },
      include: {
        participants: true,
      },
    });

    if (!room) return c.json({ error: "Room not found" }, 404);
    if (room.status !== "ACTIVE") {
      return c.json({ error: "Contest is not active" }, 400);
    }

    // Check timer
    if (room.endTime && new Date() > room.endTime) {
      return c.json({ error: "Time is up! Submissions closed" }, 400);
    }

    const participant = room.participants.find((p) => p.userId === user.id);
    if (!participant) {
      return c.json({ error: "You are not a participant in this room" }, 403);
    }

    if (roomSocketManager.isUserDisqualified(code, user.id)) {
      return c.json({ error: "Disqualified: You have exceeded the maximum allowed anti-cheat warnings." }, 403);
    }

    // Fetch the question to verify the answer deterministically
    const question = await db.assessmentQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return c.json({ error: "Question not found" }, 404);
    }

    const isCorrect = Number(selectedOption) === question.correctOption;
    const pointsAwarded = isCorrect ? 4 : -1;

    // Check if already answered
    const existingAnswer = await db.roomMcqAnswer.findUnique({
      where: {
        roomId_userId_questionId: {
          roomId: room.id,
          userId: user.id,
          questionId,
        },
      },
    });

    let scoreDelta = pointsAwarded;
    let solvedDelta = isCorrect ? 1 : 0;

    if (existingAnswer) {
      // Re-answering: replace previous score delta
      scoreDelta = pointsAwarded - existingAnswer.pointsAwarded;
      solvedDelta = (isCorrect ? 1 : 0) - (existingAnswer.isCorrect ? 1 : 0);

      await db.roomMcqAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOption: Number(selectedOption),
          isCorrect,
          pointsAwarded,
          answeredAt: new Date(),
        },
      });
    } else {
      await db.roomMcqAnswer.create({
        data: {
          roomId: room.id,
          participantId: participant.id,
          userId: user.id,
          questionId,
          selectedOption: Number(selectedOption),
          isCorrect,
          pointsAwarded,
        },
      });
    }

    // Update participant score
    const updatedParticipant = await db.roomParticipant.update({
      where: { id: participant.id },
      data: {
        score: { increment: scoreDelta },
        solvedCount: { increment: solvedDelta },
      },
    });

    // Broadcast updated leaderboard to all participants in room
    roomSocketManager.broadcastLeaderboard(room.code);

    // Broadcast live activity event if correct
    if (isCorrect) {
      roomSocketManager.broadcastActivity(room.code, {
        userId: user.id,
        userName: user.name || "Anonymous",
        userImage: user.image,
        problemTitle: `${question.subject}: ${question.topic}`,
        isAccepted: true,
        pointsAwarded,
      });
    }

    return c.json({
      success: true,
      isCorrect,
      pointsAwarded,
      currentScore: updatedParticipant.score,
    });
  } catch (error) {
    console.error("Error submitting MCQ answer:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── POST /api/rooms/:code/submit-code ───────────────────────────────────
// Execute and judge code submitted in a competitive room
app.post("/:code/submit-code", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const code = (c.req.param("code") || "").toUpperCase();
    const body = await c.req.json();

    const { problemId, sourceCode, language } = body;
    if (!problemId || !sourceCode || !language) {
      return c.json({ error: "problemId, sourceCode, and language are required" }, 400);
    }

    const room = await db.room.findUnique({
      where: { code },
      include: {
        participants: true,
        questions: {
          where: { problemId: Number(problemId) },
          include: { problem: true },
        },
      },
    });

    if (!room) return c.json({ error: "Room not found" }, 404);
    if (room.status !== "ACTIVE") {
      return c.json({ error: "Contest is not active" }, 400);
    }

    if (room.endTime && new Date() > room.endTime) {
      return c.json({ error: "Time is up! Submissions closed" }, 400);
    }

    const participant = room.participants.find((p) => p.userId === user.id);
    if (!participant) {
      return c.json({ error: "You are not a participant in this room" }, 403);
    }

    if (roomSocketManager.isUserDisqualified(code, user.id)) {
      return c.json({ error: "Disqualified: You have exceeded the maximum allowed anti-cheat warnings." }, 403);
    }

    const roomQuestion = room.questions[0];
    if (!roomQuestion || !roomQuestion.problem) {
      return c.json({ error: "Problem is not part of this room contest" }, 400);
    }

    // Run Judge0
    const judgeResult = await judgeSubmission({
      userId: user.id,
      problemId: Number(problemId),
      sourceCode,
      language,
    });

    const isAccepted = judgeResult.verdict === "ACCEPTED";

    // Check if participant already solved this problem in this room
    const alreadyAccepted = await db.roomSubmission.findFirst({
      where: {
        roomId: room.id,
        userId: user.id,
        problemId: Number(problemId),
        verdict: "ACCEPTED",
      },
    });

    // Compute points and penalty
    let pointsAwarded = 0;
    if (isAccepted && !alreadyAccepted) {
      pointsAwarded = roomQuestion.points;

      // Count prior failed submissions for this problem by this user
      const priorFails = await db.roomSubmission.count({
        where: {
          roomId: room.id,
          userId: user.id,
          problemId: Number(problemId),
          verdict: { not: "ACCEPTED" },
        },
      });

      const contestStartMs = room.startTime ? room.startTime.getTime() : Date.now();
      const minutesToSolve = Math.max(0, Math.floor((Date.now() - contestStartMs) / 60000));
      const addedPenalty = minutesToSolve + priorFails * 10;

      await db.roomParticipant.update({
        where: { id: participant.id },
        data: {
          score: { increment: pointsAwarded },
          solvedCount: { increment: 1 },
          penaltyTime: { increment: addedPenalty },
        },
      });

      // Broadcast live solve event to everyone in the room!
      roomSocketManager.broadcastActivity(room.code, {
        userId: user.id,
        userName: user.name || "Anonymous",
        userImage: user.image,
        problemTitle: roomQuestion.problem.title,
        isAccepted: true,
        pointsAwarded,
      });

      // Broadcast updated leaderboard to everyone in the room!
      roomSocketManager.broadcastLeaderboard(room.code);
    }

    // Save RoomSubmission
    await db.roomSubmission.create({
      data: {
        roomId: room.id,
        participantId: participant.id,
        userId: user.id,
        problemId: Number(problemId),
        sourceCode,
        language: language as any,
        verdict: judgeResult.verdict as any,
        pointsAwarded,
        runtime: judgeResult.runtime,
        memory: judgeResult.memory,
      },
    });

    // Also update code snapshot for spectator inspection
    roomSocketManager.updateCodeSnapshot(code, user.id, {
      problemId: Number(problemId),
      sourceCode,
      language,
    });

    return c.json({
      ...judgeResult,
      pointsAwarded,
      isFirstSolve: isAccepted && !alreadyAccepted,
    });
  } catch (error) {
    console.error("Error submitting code in room:", error);
    return c.json({ error: "Internal server error submitting code" }, 500);
  }
});

// ─── GET /api/rooms/:code/anticheat-logs ──────────────────────────────────
// Returns all anti-cheat violation events for host & spectator inspection
app.get("/:code/anticheat-logs", requireAuth, async (c) => {
  const code = (c.req.param("code") || "").toUpperCase();
  const violations = roomSocketManager.getRoomViolations(code);
  return c.json({ violations });
});

// ─── GET /api/rooms/:code/participant-code/:userId ────────────────────────
// Spectator inspects live code snapshot of a competitor
app.get("/:code/participant-code/:userId", requireAuth, async (c) => {
  const code = (c.req.param("code") || "").toUpperCase();
  const targetUserId = c.req.param("userId");
  if (!targetUserId) return c.json({ snapshot: null });
  const snapshot = roomSocketManager.getCodeSnapshot(code, targetUserId);
  return c.json({ snapshot });
});

export default app;

