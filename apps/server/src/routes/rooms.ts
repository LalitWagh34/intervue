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

      const selectedMCQs = await db.assessmentQuestion.findMany({
        where: assessmentWhere,
        take: assessmentCount,
        orderBy: { id: "asc" },
      });

      selectedMCQs.forEach((mcq) => {
        questionsToLink.push({
          orderIndex: currentOrder++,
          points: 4, // standard +4 points for MCQs
          assessmentQuestionId: mcq.id,
        });
      });
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

export default app;

