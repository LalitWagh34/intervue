import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { contestSubmissionLimiter } from "../middleware/rateLimiter";
import {
  validateBody,
  createRoomSchema,
  joinRoomSchema,
  roomSubmitCodeSchema,
  roomSubmitMcqSchema,
} from "../middleware/validator";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { judgeSubmission } from "../services/judge";
import { roomSocketManager } from "../services/roomSocket";
import { requireRoomMember, requireRoomHost } from "../middleware/authorize";
import { idempotency } from "../middleware/idempotency";
import { judgeSemaphore } from "../lib/semaphore";
import { AppError, BadRequestError, ForbiddenError, NotFoundError } from "../lib/errors";

const app = new Hono<{ Variables: AuthVariables }>();

async function runSerializableRoomTransaction<T>(
  action: (tx: any) => Promise<T>,
  client: Pick<typeof db, "$transaction"> = db,
  maxRetries = 3
): Promise<T> {
  let retries = 0;

  while (true) {
    try {
      return await client.$transaction(action, {
        isolationLevel: "Serializable",
      });
    } catch (error: any) {
      const isSerializationConflict =
        error?.code === "P2034" ||
        error?.code === "40001" ||
        error?.message?.includes("could not serialize") ||
        error?.message?.includes("serialization");

      if (!isSerializationConflict || retries >= maxRetries) {
        throw error;
      }

      retries++;
      await new Promise((resolve) => setTimeout(resolve, 20 * 2 ** retries));
    }
  }
}

export async function applyRoomMcqAnswer(
  input: { code: string; userId: string; questionId: string; selectedOption: number },
  client: any = db
) {
  const { code, userId, questionId, selectedOption } = input;

  return runSerializableRoomTransaction(async (tx) => {
    const room = await tx.room.findUnique({
      where: { code },
      include: {
        participants: { where: { userId } },
        questions: {
          where: { assessmentQuestionId: questionId },
          include: { assessmentQuestion: true },
        },
      },
    });

    if (!room) throw new NotFoundError("Room not found");
    if (room.status !== "ACTIVE") throw new BadRequestError("Contest is not active");
    if (room.endTime && new Date() > room.endTime) {
      throw new BadRequestError("Time is up! Submissions closed");
    }

    const participant = room.participants[0];
    if (!participant) throw new ForbiddenError("You are not a participant in this room");

    const roomQuestion = room.questions[0];
    if (!roomQuestion?.assessmentQuestion) {
      throw new BadRequestError("Question is not part of this room contest");
    }

    const question = roomQuestion.assessmentQuestion;
    const isCorrect = Number(selectedOption) === question.correctOption;
    const pointsAwarded = isCorrect ? 4 : -1;
    const existingAnswer = await tx.roomMcqAnswer.findUnique({
      where: { roomId_userId_questionId: { roomId: room.id, userId, questionId } },
    });

    const scoreDelta = pointsAwarded - (existingAnswer?.pointsAwarded ?? 0);
    const solvedDelta = Number(isCorrect) - Number(existingAnswer?.isCorrect ?? false);

    if (existingAnswer) {
      await tx.roomMcqAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOption: Number(selectedOption),
          isCorrect,
          pointsAwarded,
          answeredAt: new Date(),
        },
      });
    } else {
      await tx.roomMcqAnswer.create({
        data: {
          roomId: room.id,
          participantId: participant.id,
          userId,
          questionId,
          selectedOption: Number(selectedOption),
          isCorrect,
          pointsAwarded,
        },
      });
    }

    const updatedParticipant = await tx.roomParticipant.update({
      where: { id: participant.id },
      data: {
        score: { increment: scoreDelta },
        solvedCount: { increment: solvedDelta },
      },
    });

    return { room, question, isCorrect, pointsAwarded, updatedParticipant };
  }, client);
}

export async function applyRoomCodeSubmission(
  input: {
    code: string;
    userId: string;
    problemId: number;
    sourceCode: string;
    language: string;
    judgeResult: { verdict: string; runtime: number; memory: number | null };
    submittedAt?: Date;
  },
  client: any = db
) {
  const { code, userId, problemId, sourceCode, language, judgeResult } = input;
  const submittedAt = input.submittedAt ?? new Date();

  return runSerializableRoomTransaction(async (tx) => {
    const room = await tx.room.findUnique({
      where: { code },
      include: {
        participants: { where: { userId } },
        questions: {
          where: { problemId },
          include: { problem: true },
        },
      },
    });

    if (!room) throw new NotFoundError("Room not found");
    if (room.status !== "ACTIVE") throw new BadRequestError("Contest is not active");
    if (room.endTime && submittedAt > room.endTime) {
      throw new BadRequestError("Time is up! Submissions closed");
    }

    const participant = room.participants[0];
    if (!participant) throw new ForbiddenError("You are not a participant in this room");

    const roomQuestion = room.questions[0];
    if (!roomQuestion?.problem) {
      throw new BadRequestError("Problem is not part of this room contest");
    }

    const isAccepted = judgeResult.verdict === "ACCEPTED";
    const alreadyAccepted = isAccepted
      ? await tx.roomSubmission.findFirst({
          where: { roomId: room.id, userId, problemId, verdict: "ACCEPTED" },
          select: { id: true },
        })
      : null;
    const isFirstSolve = isAccepted && !alreadyAccepted;
    const pointsAwarded = isFirstSolve ? roomQuestion.points : 0;
    let addedPenalty = 0;

    if (isFirstSolve) {
      const priorFails = await tx.roomSubmission.count({
        where: {
          roomId: room.id,
          userId,
          problemId,
          verdict: { not: "ACCEPTED" },
        },
      });
      const contestStartMs = room.startTime ? room.startTime.getTime() : submittedAt.getTime();
      const minutesToSolve = Math.max(0, Math.floor((submittedAt.getTime() - contestStartMs) / 60_000));
      addedPenalty = minutesToSolve + priorFails * 10;

      await tx.roomParticipant.update({
        where: { id: participant.id },
        data: {
          score: { increment: pointsAwarded },
          solvedCount: { increment: 1 },
          penaltyTime: { increment: addedPenalty },
        },
      });
    }

    const submission = await tx.roomSubmission.create({
      data: {
        roomId: room.id,
        participantId: participant.id,
        userId,
        problemId,
        sourceCode,
        language,
        verdict: judgeResult.verdict,
        pointsAwarded,
        runtime: judgeResult.runtime,
        memory: judgeResult.memory,
      },
    });

    return {
      room,
      problem: roomQuestion.problem,
      submission,
      pointsAwarded,
      addedPenalty,
      isFirstSolve,
    };
  }, client);
}

// Standard RFC 7807 problem details handler for room router errors
app.onError((err, c) => {
  if (err instanceof AppError) {
    if (err.details?.retryAfter) {
      c.header("Retry-After", String(err.details.retryAfter));
    }
    return c.json(err.toJSON(c.req.path), (err.statusCode as any) || 500);
  }
  return c.json({ error: err.message || "Internal server error" }, 500);
});

// Helper to generate a unique 6-character uppercase alphanumeric code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars (0, O, 1, I)
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to shuffle candidates in-place (Fisher-Yates) without database-specific raw SQL
function shuffleCandidates<T>(items: T[]): T[] {
  if (!items || !Array.isArray(items)) return [];
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
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

// ─── GET /api/rooms/history ──────────────────────────────────────────────
app.get("/history", requireAuth, async (c) => {
  try {
    const user = c.get("user");

    const participations = await db.roomParticipant.findMany({
      where: { userId: user.id },
      include: {
        room: {
          include: {
            questions: true,
            participants: {
              orderBy: [
                { score: "desc" },
                { penaltyTime: "asc" }
              ]
            }
          }
        }
      },
      orderBy: { joinedAt: "desc" }
    });

    const contests = participations.map((p) => {
      const room = p.room;
      const rank = room.participants.findIndex(rp => rp.userId === user.id) + 1;
      
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
        myRank: rank > 0 ? rank : 0,
        totalParticipants: room.participants.length,
        totalQuestions: room.questions.length
      };
    });

    return c.json({ contests });
  } catch (error) {
    console.error("Error fetching room history:", error);
    return c.json({ error: "Failed to fetch history" }, 500);
  }
});

// ─── POST /api/rooms ─────────────────────────────────────────────────────
// Create a new competitive room
app.post("/", requireAuth, validateBody(createRoomSchema), async (c) => {
  try {
    const user = c.get("user");
    const body = (c as any).get("validatedBody") as {
      title: string;
      type: "CODING" | "APTITUDE" | "MIXED";
      duration: number;
      maxParticipants: number;
      codingDifficulty?: "EASY" | "MEDIUM" | "HARD";
      codingCount?: number;
      codingTags?: string[];
      assessmentCount?: number;
      assessmentSubjects?: string[];
      allowLateJoin: boolean;
    };

    const title = body.title;
    const type = body.type || "APTITUDE";
    const duration = body.duration;
    const maxParticipants = body.maxParticipants;

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

    const codingCount =
      type === "CODING" || type === "MIXED"
        ? Number(body.codingCount) || (type === "MIXED" ? 2 : 3)
        : 0;
    const assessmentCount =
      type === "APTITUDE" || type === "MIXED"
        ? Number(body.assessmentCount) || (type === "MIXED" ? 10 : 15)
        : 0;

    const effectiveFilters = {
      codingTags: body.codingTags || [],
      codingDifficulty: body.codingDifficulty || null,
      assessmentSubjects: body.assessmentSubjects || [],
      assessmentTopics: Array.isArray(body.assessmentTopics)
        ? body.assessmentTopics
        : typeof body.assessmentTopic === "string" && body.assessmentTopic.trim()
        ? [body.assessmentTopic.trim()]
        : [],
      assessmentCategory: body.assessmentCategory || null,
      assessmentDifficulty: body.assessmentDifficulty || null,
      allowLateJoin: body.allowLateJoin ?? true,
      requestedCounts: {
        coding: codingCount,
        assessment: assessmentCount,
      },
    };

    // 1. Coding Problems Selection
    if (type === "CODING" || type === "MIXED") {
      const codingTags = Array.isArray(body.codingTags) && body.codingTags.length > 0 ? body.codingTags : undefined;
      const codingDifficulty = body.codingDifficulty;

      const problemWhere: any = { status: "published" };
      if (codingDifficulty) {
        problemWhere.difficulty = codingDifficulty;
      }
      if (codingTags) {
        problemWhere.tags = { hasSome: codingTags };
      }

      const totalAvailableProblems = await db.problem.count({
        where: problemWhere,
      });

      if (totalAvailableProblems < codingCount) {
        return c.json(
          {
            error: "Insufficient coding problems matching criteria",
            requested: codingCount,
            available: totalAvailableProblems,
            filters: {
              difficulty: codingDifficulty || null,
              tags: codingTags || null,
            },
          },
          400
        );
      }

      const candidateProblems = await db.problem.findMany({
        where: problemWhere,
        select: { id: true, difficulty: true },
      });

      const selectedProblems = shuffleCandidates(candidateProblems).slice(0, codingCount);

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
      const assessmentSubjects =
        Array.isArray(body.assessmentSubjects) && body.assessmentSubjects.length > 0
          ? body.assessmentSubjects
          : undefined;
      const assessmentTopics =
        Array.isArray(body.assessmentTopics) && body.assessmentTopics.length > 0
          ? body.assessmentTopics
          : typeof body.assessmentTopic === "string" && body.assessmentTopic.trim()
          ? [body.assessmentTopic.trim()]
          : undefined;
      const assessmentCategory = body.assessmentCategory;
      const assessmentDifficulty = body.assessmentDifficulty;

      const assessmentWhere: any = {};
      if (assessmentCategory) {
        assessmentWhere.category = assessmentCategory;
      }
      if (assessmentSubjects) {
        assessmentWhere.subject = { in: assessmentSubjects };
      }
      if (assessmentTopics) {
        assessmentWhere.topic = { in: assessmentTopics };
      }
      if (assessmentDifficulty) {
        assessmentWhere.difficulty = assessmentDifficulty;
      }

      const totalAvailableMCQs = await db.assessmentQuestion.count({
        where: assessmentWhere,
      });

      if (totalAvailableMCQs < assessmentCount) {
        return c.json(
          {
            error: "Insufficient assessment questions matching criteria",
            requested: assessmentCount,
            available: totalAvailableMCQs,
            filters: {
              category: assessmentCategory || null,
              subjects: assessmentSubjects || null,
              topics: assessmentTopics || null,
              difficulty: assessmentDifficulty || null,
            },
          },
          400
        );
      }

      const candidateMCQs = await db.assessmentQuestion.findMany({
        where: assessmentWhere,
        select: { id: true },
      });

      const selectedMCQs = shuffleCandidates(candidateMCQs).slice(0, assessmentCount);

      selectedMCQs.forEach((mcq) => {
        questionsToLink.push({
          orderIndex: currentOrder++,
          points: 4, // standard +4 points for MCQs
          assessmentQuestionId: mcq.id,
        });
      });
    }

    // Hard Constraint Check: Never allow an empty contest room
    if (questionsToLink.length === 0) {
      return c.json({ error: "No questions selected for contest room." }, 400);
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
          config: effectiveFilters,
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
app.post("/join", requireAuth, validateBody(joinRoomSchema), async (c) => {
  try {
    const user = c.get("user");
    const body = (c as any).get("validatedBody") as { code: string };
    const code = body.code;

    const room = await db.room.findUnique({
      where: { code },
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
    const existingParticipant = await db.roomParticipant.findFirst({
      where: { roomId: room.id, userId: user.id }
    });
    
    if (existingParticipant) {
      return c.json({
        message: "Already joined room",
        roomCode: room.code,
        role: existingParticipant.role,
      });
    }

    // Capacity check
    const participantCount = await db.roomParticipant.count({
      where: { roomId: room.id }
    });

    if (participantCount >= room.maxParticipants) {
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

    const now = new Date();
    const contests = participations.map((p) => {
      const room = p.room;
      const sortedParticipants = room.participants;
      const rankIndex = sortedParticipants.findIndex((sp) => sp.userId === user.id);
      const myRank = rankIndex !== -1 ? rankIndex + 1 : 1;

      // Self-heal: If contest endTime has passed, card reliably shows FINISHED
      const isPastEndTime = room.endTime ? new Date(room.endTime) <= now : false;
      const effectiveStatus = (room.status === "ACTIVE" && isPastEndTime) ? "FINISHED" : room.status;

      return {
        id: room.id,
        code: room.code,
        title: room.title,
        type: room.type,
        status: effectiveStatus,
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
    const now = new Date();
    const isPastEndTime = room.endTime ? new Date(room.endTime) <= now : false;
    const isFinished = room.status === "FINISHED" || (room.status === "ACTIVE" && isPastEndTime);

    if (room.status === "ACTIVE" && isPastEndTime) {
      roomSocketManager.handleContestEnd(room.code).catch(() => {});
    }

    // Non-members may see only the minimal pre-join preview while the room is joinable.
    // Finished room questions, standings, and answer keys remain private to current members.
    if (!currentParticipant && !isHost) {
      if (isFinished) {
        return c.json({ error: "Access denied" }, 403);
      }

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

    const remainingSeconds =
      room.status === "ACTIVE" && room.endTime
        ? Math.max(0, Math.floor((new Date(room.endTime).getTime() - Date.now()) / 1000))
        : room.duration * 60;

    return c.json({
      room: {
        id: room.id,
        code: room.code,
        title: room.title,
        type: room.type,
        status: isFinished ? "FINISHED" : room.status,
        duration: room.duration,
        maxParticipants: room.maxParticipants,
        startTime: room.startTime,
        endTime: room.endTime,
        remainingSeconds,
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
app.post("/:code/start", requireAuth, requireRoomHost, async (c) => {
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
app.post("/:code/finish", requireAuth, requireRoomMember, idempotency(), async (c) => {
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

    // Track finished participant count
    const finishedCount = await roomSocketManager.markUserFinished(code, user.id);
    const totalParticipants = room.participants.length;
    const allFinished = finishedCount >= totalParticipants && totalParticipants > 0;

    // If ALL participants in the room submitted early, immediately auto-conclude the contest!
    if (allFinished && room.status === "ACTIVE") {
      await roomSocketManager.handleContestEnd(code);
    }

    return c.json({
      message: "Test submitted successfully",
      roomCode: code,
      participantId: participant.id,
      allFinished,
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    return c.json({ error: "Internal server error submitting test" }, 500);
  }
});

// ─── POST /api/rooms/:code/end ───────────────────────────────────────────
// Host authoritatively ends contest early
app.post("/:code/end", requireAuth, requireRoomHost, idempotency(), async (c) => {
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
app.get("/:code/leaderboard", requireAuth, requireRoomMember, async (c) => {
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
app.get("/:code/scorecard", requireAuth, requireRoomMember, async (c) => {
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

    // Never reveal the answer key while a contest is still active.
    const canRevealExplanations = room.status === "FINISHED";

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
app.post("/:code/mcq-answer", requireAuth, requireRoomMember, contestSubmissionLimiter, validateBody(roomSubmitMcqSchema), async (c) => {
  try {
    const user = c.get("user");
    const code = (c.req.param("code") || "").toUpperCase();
    const body = (c as any).get("validatedBody") as { questionId: string; selectedOption: number };
    const { questionId, selectedOption } = body;

    if (await roomSocketManager.isUserDisqualified(code, user.id)) {
      return c.json({ error: "Disqualified: You have exceeded the maximum allowed anti-cheat warnings." }, 403);
    }

    const result = await applyRoomMcqAnswer({
      code,
      userId: user.id,
      questionId,
      selectedOption,
    });

    // Broadcast updated leaderboard to all participants in room
    roomSocketManager.broadcastLeaderboard(result.room.code);

    // Broadcast live activity event if correct
    if (result.isCorrect) {
      roomSocketManager.broadcastActivity(result.room.code, {
        userId: user.id,
        userName: user.name || "Anonymous",
        userImage: user.image,
        problemTitle: `${result.question.subject}: ${result.question.topic}`,
        isAccepted: true,
        pointsAwarded: result.pointsAwarded,
      });
    }

    return c.json({
      success: true,
      isCorrect: result.isCorrect,
      pointsAwarded: result.pointsAwarded,
      currentScore: result.updatedParticipant.score,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error submitting MCQ answer:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── POST /api/rooms/:code/submit-code ───────────────────────────────────
// Execute and judge code submitted in a competitive room
app.post("/:code/submit-code", requireAuth, requireRoomMember, contestSubmissionLimiter, idempotency(), validateBody(roomSubmitCodeSchema), async (c) => {
  try {
    const user = c.get("user");
    const code = (c.req.param("code") || "").toUpperCase();
    const body = (c as any).get("validatedBody") as { problemId: number; sourceCode: string; language: string };
    const { problemId, sourceCode, language } = body;

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

    if (await roomSocketManager.isUserDisqualified(code, user.id)) {
      return c.json({ error: "Disqualified: You have exceeded the maximum allowed anti-cheat warnings." }, 403);
    }

    const roomQuestion = room.questions[0];
    if (!roomQuestion || !roomQuestion.problem) {
      return c.json({ error: "Problem is not part of this room contest" }, 400);
    }

    const submittedAt = new Date();

    // Run Judge0
    const judgeResult = await judgeSemaphore.withPermit(async () => {
      return await judgeSubmission({
        userId: user.id,
        problemId: Number(problemId),
        sourceCode,
        language,
      });
    });

    const scoringResult = await applyRoomCodeSubmission({
      code,
      userId: user.id,
      problemId: Number(problemId),
      sourceCode,
      language,
      judgeResult,
      submittedAt,
    });

    if (scoringResult.isFirstSolve) {
      roomSocketManager.broadcastActivity(room.code, {
        userId: user.id,
        userName: user.name || "Anonymous",
        userImage: user.image,
        problemTitle: scoringResult.problem.title,
        isAccepted: true,
        pointsAwarded: scoringResult.pointsAwarded,
      });
      roomSocketManager.broadcastLeaderboard(room.code);
    }

    // Also update code snapshot for spectator inspection
    await roomSocketManager.updateCodeSnapshot(code, user.id, {
      problemId: Number(problemId),
      sourceCode,
      language,
    });

    return c.json({
      ...judgeResult,
      pointsAwarded: scoringResult.pointsAwarded,
      isFirstSolve: scoringResult.isFirstSolve,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Error submitting code in room:", error);
    return c.json({ error: "Internal server error submitting code" }, 500);
  }
});

// ─── GET /api/rooms/:code/anticheat-logs ──────────────────────────────────
// Returns all anti-cheat violation events for host & spectator inspection
app.get("/:code/anticheat-logs", requireAuth, requireRoomMember, async (c) => {
  const code = (c.req.param("code") || "").toUpperCase();
  const violations = await roomSocketManager.getRoomViolations(code);
  return c.json({ violations });
});

// ─── GET /api/rooms/:code/participant-code/:userId ────────────────────────
// Spectator inspects live code snapshot of a competitor
app.get("/:code/participant-code/:userId", requireAuth, requireRoomMember, async (c) => {
  const code = (c.req.param("code") || "").toUpperCase();
  const targetUserId = c.req.param("userId");
  if (!targetUserId) return c.json({ snapshot: null });

  const room = (c as any).get("authorizedRoom");
  if (!room) {
    return c.json({ error: "Room authorization missing" }, 403);
  }

  const isTargetInRoom =
    room.hostId === targetUserId ||
    room.participants?.some((p: any) => p.userId === targetUserId);

  if (!isTargetInRoom) {
    return c.json({ snapshot: null });
  }

  const snapshot = await roomSocketManager.getCodeSnapshot(code, targetUserId);
  return c.json({ snapshot });
});

// ─── POST /api/rooms/:code/leave ─────────────────────────────────────────
// Participant voluntarily leaves room: removes DB participation & revokes socket
app.post("/:code/leave", requireAuth, requireRoomMember, async (c) => {
  try {
    const user = c.get("user");
    const code = (c.req.param("code") || "").toUpperCase();
    const room = (c as any).get("authorizedRoom");

    if (!room) {
      return c.json({ error: "Room authorization missing" }, 403);
    }

    if (room.hostId === user.id) {
      return c.json({ error: "Host cannot leave room. Use end contest instead." }, 400);
    }

    await db.roomParticipant.deleteMany({
      where: { roomId: room.id, userId: user.id },
    });

    await roomSocketManager.revokeMembership(code, user.id, "Participant left the room");

    return c.json({ success: true, message: "Left room successfully" });
  } catch (err: any) {
    console.error("Error leaving room:", err);
    return c.json({ error: "Failed to leave room" }, 500);
  }
});

// ─── POST /api/rooms/:code/kick/:targetUserId ────────────────────────────
// Host kicks participant: removes DB participation & disconnects socket
app.post("/:code/kick/:targetUserId", requireAuth, requireRoomHost, async (c) => {
  try {
    const code = (c.req.param("code") || "").toUpperCase();
    const targetUserId = c.req.param("targetUserId");
    const room = (c as any).get("authorizedRoom");

    if (!room) {
      return c.json({ error: "Room authorization missing" }, 403);
    }

    if (targetUserId === room.hostId) {
      return c.json({ error: "Cannot kick the room host" }, 400);
    }

    const deleted = await db.roomParticipant.deleteMany({
      where: { roomId: room.id, userId: targetUserId },
    });

    if (deleted.count === 0) {
      return c.json({ error: "Participant not found in room" }, 404);
    }

    await roomSocketManager.revokeMembership(code, targetUserId, "Kicked by room host");

    return c.json({ success: true, message: "Participant kicked from room" });
  } catch (err: any) {
    console.error("Error kicking participant:", err);
    return c.json({ error: "Failed to kick participant" }, 500);
  }
});

export default app;

