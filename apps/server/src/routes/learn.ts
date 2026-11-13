import { Hono } from "hono";
import { db } from "@intervue/db";
import { requireAuth } from "../middleware/auth";
import type { AuthVariables } from "../types";

const learn = new Hono<{ Variables: AuthVariables }>();

learn.use("*", requireAuth);

/**
 * GET /api/learn/subjects
 * Metadata-only list of published subjects with module and concept counts.
 * Lesson Markdown content is strictly excluded for minimal payload weight.
 */
learn.get("/subjects", async (c) => {
  const subjects = await db.learnSubject.findMany({
    where: { isPublished: true },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      icon: true,
      orderIndex: true,
      modules: {
        where: { isPublished: true },
        select: {
          id: true,
          concepts: {
            where: { publishedRevisionId: { not: null } },
            select: {
              publishedRevision: {
                select: { estimatedMinutes: true },
              },
            },
          },
        },
      },
    },
  });

  const payload = subjects.map((sub) => {
    let conceptCount = 0;
    let totalMinutes = 0;
    for (const mod of sub.modules) {
      conceptCount += mod.concepts.length;
      for (const concept of mod.concepts) {
        totalMinutes += concept.publishedRevision?.estimatedMinutes || 0;
      }
    }

    return {
      id: sub.id,
      slug: sub.slug,
      title: sub.title,
      description: sub.description,
      icon: sub.icon,
      moduleCount: sub.modules.length,
      conceptCount,
      estimatedMinutes: totalMinutes,
    };
  });

  return c.json({ subjects: payload });
});

/**
 * GET /api/learn/subjects/:slug
 * Subject metadata, ordered modules, and published concept cards (without markdown body).
 */
learn.get("/subjects/:slug", async (c) => {
  const slug = c.req.param("slug");
  if (!slug) return c.json({ error: "Subject slug is required" }, 400);

  const subject = await db.learnSubject.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      icon: true,
      isPublished: true,
      modules: {
        where: { isPublished: true },
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          orderIndex: true,
          concepts: {
            where: { publishedRevisionId: { not: null } },
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              slug: true,
              orderIndex: true,
              publishedRevision: {
                select: {
                  title: true,
                  summary: true,
                  difficulty: true,
                  estimatedMinutes: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!subject || !subject.isPublished) {
    return c.json({ error: "Subject not found" }, 404);
  }

  let totalConcepts = 0;
  let totalMinutes = 0;

  const modules = subject.modules.map((m) => {
    const concepts = m.concepts
      .filter((c) => c.publishedRevision !== null)
      .map((c) => {
        totalConcepts++;
        totalMinutes += c.publishedRevision!.estimatedMinutes;
        return {
          id: c.id,
          slug: c.slug,
          orderIndex: c.orderIndex,
          title: c.publishedRevision!.title,
          summary: c.publishedRevision!.summary,
          difficulty: c.publishedRevision!.difficulty,
          estimatedMinutes: c.publishedRevision!.estimatedMinutes,
        };
      });

    return {
      id: m.id,
      slug: m.slug,
      title: m.title,
      description: m.description,
      orderIndex: m.orderIndex,
      concepts,
    };
  });

  return c.json({
    subject: {
      id: subject.id,
      slug: subject.slug,
      title: subject.title,
      description: subject.description,
      icon: subject.icon,
      conceptCount: totalConcepts,
      estimatedMinutes: totalMinutes,
      modules,
    },
  });
});

/**
 * GET /api/learn/subjects/:subjectSlug/modules/:moduleSlug
 * Dedicated endpoint for a single module page with its published concepts.
 */
learn.get("/subjects/:subjectSlug/modules/:moduleSlug", async (c) => {
  const subjectSlug = c.req.param("subjectSlug");
  const moduleSlug = c.req.param("moduleSlug");

  if (!subjectSlug || !moduleSlug) {
    return c.json({ error: "subjectSlug and moduleSlug are required" }, 400);
  }

  const moduleItem = await db.learnModule.findFirst({
    where: {
      slug: moduleSlug,
      isPublished: true,
      subject: {
        slug: subjectSlug,
        isPublished: true,
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      orderIndex: true,
      subject: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
      concepts: {
        where: { publishedRevisionId: { not: null } },
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          slug: true,
          orderIndex: true,
          publishedRevision: {
            select: {
              title: true,
              summary: true,
              difficulty: true,
              estimatedMinutes: true,
            },
          },
        },
      },
    },
  });

  if (!moduleItem) {
    return c.json({ error: "Module not found" }, 404);
  }

  let totalMinutes = 0;
  const concepts = moduleItem.concepts
    .filter((c) => c.publishedRevision !== null)
    .map((c) => {
      totalMinutes += c.publishedRevision!.estimatedMinutes;
      return {
        id: c.id,
        slug: c.slug,
        orderIndex: c.orderIndex,
        title: c.publishedRevision!.title,
        summary: c.publishedRevision!.summary,
        difficulty: c.publishedRevision!.difficulty,
        estimatedMinutes: c.publishedRevision!.estimatedMinutes,
      };
    });

  return c.json({
    module: {
      id: moduleItem.id,
      slug: moduleItem.slug,
      title: moduleItem.title,
      description: moduleItem.description,
      orderIndex: moduleItem.orderIndex,
      subject: moduleItem.subject,
      conceptCount: concepts.length,
      estimatedMinutes: totalMinutes,
      concepts,
    },
  });
});

/**
 * GET /api/learn/concepts/:slug
 * Returns only the published revision of a concept, along with module/subject
 * metadata and prev/next published concept pointers within the same subject.
 */
learn.get("/concepts/:slug", async (c) => {
  const slug = c.req.param("slug");
  if (!slug) {
    return c.json({ error: "Concept slug is required" }, 400);
  }

  const concept = await db.learnConcept.findFirst({
    where: {
      slug,
      publishedRevisionId: { not: null },
      module: {
        isPublished: true,
        subject: { isPublished: true },
      },
    },
    select: {
      id: true,
      slug: true,
      orderIndex: true,
      module: {
        select: {
          id: true,
          slug: true,
          title: true,
          orderIndex: true,
          subject: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
        },
      },
      publishedRevision: {
        select: {
          id: true,
          version: true,
          title: true,
          summary: true,
          quickRevisionMd: true,
          deepDiveMd: true,
          estimatedMinutes: true,
          difficulty: true,
          keyTakeaways: true,
          commonMistakes: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!concept || !concept.publishedRevision) {
    return c.json({ error: "Concept not found" }, 404);
  }

  // Ordered published concepts within the same subject for prev/next navigation
  const siblings = await db.learnConcept.findMany({
    where: {
      publishedRevisionId: { not: null },
      module: {
        isPublished: true,
        subjectId: concept.module.subject.id,
      },
    },
    orderBy: [
      { module: { orderIndex: "asc" } },
      { orderIndex: "asc" },
    ],
    select: {
      slug: true,
      publishedRevision: {
        select: { title: true },
      },
    },
  });

  const currentIdx = siblings.findIndex((s) => s.slug === concept.slug);
  const prevItem = currentIdx > 0 ? siblings[currentIdx - 1] : null;
  const nextItem = currentIdx >= 0 && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null;

  const user = c.get("user");
  const progress = await db.userConceptProgress.findUnique({
    where: { userId_conceptId: { userId: user.id, conceptId: concept.id } },
  });

  return c.json({
    concept: {
      id: concept.id,
      slug: concept.slug,
      title: concept.publishedRevision.title,
      summary: concept.publishedRevision.summary,
      quickRevisionMd: concept.publishedRevision.quickRevisionMd,
      deepDiveMd: concept.publishedRevision.deepDiveMd,
      estimatedMinutes: concept.publishedRevision.estimatedMinutes,
      difficulty: concept.publishedRevision.difficulty,
      keyTakeaways: concept.publishedRevision.keyTakeaways,
      commonMistakes: concept.publishedRevision.commonMistakes,
      version: concept.publishedRevision.version,
      publishedAt: concept.publishedRevision.publishedAt,
      module: {
        slug: concept.module.slug,
        title: concept.module.title,
      },
      subject: {
        slug: concept.module.subject.slug,
        title: concept.module.subject.title,
      },
    },
    navigation: {
      prev: prevItem?.publishedRevision
        ? { slug: prevItem.slug, title: prevItem.publishedRevision.title }
        : null,
      next: nextItem?.publishedRevision
        ? { slug: nextItem.slug, title: nextItem.publishedRevision.title }
        : null,
    },
    progress: progress
      ? {
          status: progress.status,
          recallAttempts: progress.recallAttempts,
          recallCorrect: progress.recallCorrect,
          lastStudiedAt: progress.lastStudiedAt,
          nextReviewAt: progress.nextReviewAt,
        }
      : null,
  });
});

/**
 * GET /api/learn/concepts/:slug/recall
 * Fetches active recall questions for the concept, hiding correctOption and explanation.
 */
learn.get("/concepts/:slug/recall", async (c) => {
  const user = c.get("user");
  const slug = c.req.param("slug");

  const concept = await db.learnConcept.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!concept) return c.json({ error: "Concept not found" }, 404);

  const questions = await db.learnRecallQuestion.findMany({
    where: { conceptId: concept.id, isPublished: true },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      prompt: true,
      options: true,
      orderIndex: true,
    },
  });

  const progress = await db.userConceptProgress.findUnique({
    where: { userId_conceptId: { userId: user.id, conceptId: concept.id } },
  });

  return c.json({
    questions,
    progress: progress
      ? {
          status: progress.status,
          recallAttempts: progress.recallAttempts,
          recallCorrect: progress.recallCorrect,
          reviewStage: progress.reviewStage,
          confidence: progress.confidence,
          lastSessionScore: progress.lastSessionScore,
          nextReviewAt: progress.nextReviewAt,
        }
      : null,
  });
});

/**
 * POST /api/learn/concepts/:slug/recall
 * Immediate feedback on a single question without advancing the spaced review stage.
 * Records overall attempt counters on the concept progress.
 */
learn.post("/concepts/:slug/recall", async (c) => {
  const user = c.get("user");
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const { questionId, selectedOption } = body;

  if (!questionId || typeof selectedOption !== "number") {
    return c.json({ error: "questionId and selectedOption are required" }, 400);
  }

  const concept = await db.learnConcept.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!concept) return c.json({ error: "Concept not found" }, 404);

  const question = await db.learnRecallQuestion.findUnique({
    where: { id: questionId },
  });

  if (!question || question.conceptId !== concept.id) {
    return c.json({ error: "Question not found for this concept" }, 404);
  }

  const isCorrect = selectedOption === question.correctOption;

  // Single question attempts record counts for immediate feedback without mutating review schedule
  const updatedProgress = await db.userConceptProgress.upsert({
    where: { userId_conceptId: { userId: user.id, conceptId: concept.id } },
    update: {
      recallAttempts: { increment: 1 },
      recallCorrect: isCorrect ? { increment: 1 } : undefined,
    },
    create: {
      userId: user.id,
      conceptId: concept.id,
      status: "STUDYING",
      recallAttempts: 1,
      recallCorrect: isCorrect ? 1 : 0,
    },
  });

  return c.json({
    isCorrect,
    correctOption: question.correctOption,
    explanation: question.explanation,
    progress: {
      status: updatedProgress.status,
      recallAttempts: updatedProgress.recallAttempts,
      recallCorrect: updatedProgress.recallCorrect,
      reviewStage: updatedProgress.reviewStage,
      nextReviewAt: updatedProgress.nextReviewAt,
    },
  });
});

/**
 * POST /api/learn/concepts/:slug/recall/session
 * Records a completed recall session with atomic answers, grades performance,
 * and advances the spaced repetition schedule (reviewStage) at most once per eligible session.
 */
learn.post("/concepts/:slug/recall/session", async (c) => {
  const user = c.get("user");
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const { answers, isScheduledReview, revisionId } = body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return c.json({ error: "answers array is required and must not be empty" }, 400);
  }

  const concept = await db.learnConcept.findUnique({
    where: { slug },
    select: { id: true, publishedRevisionId: true },
  });

  if (!concept) return c.json({ error: "Concept not found" }, 404);

  // Retrieve all questions answered in this session
  const questionIds = answers.map((a: { questionId: string }) => a.questionId);
  const dbQuestions = await db.learnRecallQuestion.findMany({
    where: { id: { in: questionIds }, conceptId: concept.id },
  });
  const questionMap = new Map(dbQuestions.map((q) => [q.id, q]));

  let correctCount = 0;
  const gradedAnswers: Array<{ questionId: string; selectedOption: number; isCorrect: boolean }> = [];

  for (const item of answers) {
    const q = questionMap.get(item.questionId);
    if (!q) {
      return c.json({ error: `Question ${item.questionId} not found for concept` }, 400);
    }
    const isCorrect = item.selectedOption === q.correctOption;
    if (isCorrect) correctCount++;
    gradedAnswers.push({
      questionId: item.questionId,
      selectedOption: item.selectedOption,
      isCorrect,
    });
  }

  const questionsCount = gradedAnswers.length;
  const score = Number((correctCount / questionsCount).toFixed(2));

  // Current progress check
  const currentProgress = await db.userConceptProgress.findUnique({
    where: { userId_conceptId: { userId: user.id, conceptId: concept.id } },
  });

  const stageBefore = currentProgress?.reviewStage || 0;
  const now = new Date();

  // Spaced Repetition interval steps in days: Stage 0: 1d, Stage 1: 3d, Stage 2: 7d, Stage 3: 14d, Stage 4: 30d
  const STAGE_DAYS = [1, 3, 7, 14, 30];

  // A session is eligible to advance the spaced schedule if:
  // 1. Explicitly flagged as isScheduledReview, OR
  // 2. nextReviewAt is null or already past (due in queue), OR
  // 3. status is NEEDS_REVISION
  const isDue =
    !currentProgress?.nextReviewAt ||
    currentProgress.nextReviewAt <= now ||
    currentProgress.status === "NEEDS_REVISION";
  const eligibleForSchedule = Boolean(isScheduledReview || isDue);

  let stageAfter = stageBefore;
  let nextReviewAt = currentProgress?.nextReviewAt || null;
  let newStatus = currentProgress?.status || "STUDIED";

  if (eligibleForSchedule) {
    if (score >= 0.7) {
      stageAfter = Math.min(stageBefore + 1, 4);
      const daysToAdd = STAGE_DAYS[stageAfter] || 30;
      nextReviewAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      newStatus = stageAfter >= 3 ? "DEMONSTRATED_UNDERSTANDING" : "CONFIDENT";
    } else {
      // Failed review: reset stage to 0 and schedule immediate retry tomorrow
      stageAfter = 0;
      nextReviewAt = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      newStatus = "NEEDS_REVISION";
    }
  } else {
    // Unscheduled / practice attempt between intervals: preserve schedule, mark studied if fresh
    if (!currentProgress || currentProgress.status === "NOT_STARTED" || currentProgress.status === "STUDYING") {
      newStatus = "STUDIED";
      nextReviewAt = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    }
  }

  // Transaction: Create session + answers and update progress
  const targetRevisionId = revisionId || concept.publishedRevisionId;

  const [session, progress] = await db.$transaction([
    db.userRecallSession.create({
      data: {
        userId: user.id,
        conceptId: concept.id,
        revisionId: targetRevisionId,
        isScheduledReview: eligibleForSchedule,
        questionsCount,
        correctCount,
        score,
        stageBefore,
        stageAfter,
        completedAt: now,
        answers: {
          create: gradedAnswers.map((ga) => ({
            questionId: ga.questionId,
            selectedOption: ga.selectedOption,
            isCorrect: ga.isCorrect,
            createdAt: now,
          })),
        },
      },
    }),
    db.userConceptProgress.upsert({
      where: { userId_conceptId: { userId: user.id, conceptId: concept.id } },
      update: {
        status: newStatus as any,
        reviewStage: stageAfter,
        lastSessionScore: score,
        lastReviewedAt: now,
        lastStudiedAt: now,
        nextReviewAt,
        recallAttempts: { increment: questionsCount },
        recallCorrect: { increment: correctCount },
      },
      create: {
        userId: user.id,
        conceptId: concept.id,
        status: newStatus as any,
        reviewStage: stageAfter,
        lastSessionScore: score,
        lastReviewedAt: now,
        lastStudiedAt: now,
        nextReviewAt,
        recallAttempts: questionsCount,
        recallCorrect: correctCount,
      },
    }),
  ]);

  return c.json({
    session: {
      id: session.id,
      score: session.score,
      questionsCount: session.questionsCount,
      correctCount: session.correctCount,
      stageBefore: session.stageBefore,
      stageAfter: session.stageAfter,
      isScheduledReview: session.isScheduledReview,
      completedAt: session.completedAt,
    },
    progress: {
      status: progress.status,
      reviewStage: progress.reviewStage,
      lastSessionScore: progress.lastSessionScore,
      nextReviewAt: progress.nextReviewAt,
      recallAttempts: progress.recallAttempts,
      recallCorrect: progress.recallCorrect,
    },
  });
});

/**
 * PATCH /api/learn/concepts/:slug/progress
 * Manually update concept status or self-reported confidence.
 * Note: DEMONSTRATED_UNDERSTANDING is reserved for server-calculated session results.
 * Setting status to STUDIED schedules the first review in 1 day.
 */
learn.patch("/concepts/:slug/progress", async (c) => {
  const user = c.get("user");
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const { status, confidence } = body;

  const validManualStatuses = [
    "NOT_STARTED",
    "STUDYING",
    "STUDIED",
    "NEEDS_REVISION",
    "CONFIDENT",
  ];

  if (status && !validManualStatuses.includes(status)) {
    return c.json(
      { error: "Invalid status. DEMONSTRATED_UNDERSTANDING is server-calculated and cannot be set manually." },
      400
    );
  }

  if (confidence !== undefined && (typeof confidence !== "number" || confidence < 1 || confidence > 5)) {
    return c.json({ error: "Confidence must be an integer between 1 and 5" }, 400);
  }

  if (!status && confidence === undefined) {
    return c.json({ error: "Either status or confidence is required" }, 400);
  }

  const concept = await db.learnConcept.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!concept) return c.json({ error: "Concept not found" }, 404);

  const existing = await db.userConceptProgress.findUnique({
    where: { userId_conceptId: { userId: user.id, conceptId: concept.id } },
  });

  let nextReviewAt = existing?.nextReviewAt;
  if (status === "STUDIED" && !nextReviewAt) {
    nextReviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  const progress = await db.userConceptProgress.upsert({
    where: { userId_conceptId: { userId: user.id, conceptId: concept.id } },
    update: {
      ...(status ? { status: status as any } : {}),
      ...(confidence !== undefined ? { confidence } : {}),
      ...(nextReviewAt ? { nextReviewAt } : {}),
      lastStudiedAt: new Date(),
    },
    create: {
      userId: user.id,
      conceptId: concept.id,
      status: (status as any) || "STUDIED",
      confidence: confidence ?? null,
      nextReviewAt: status === "STUDIED" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      lastStudiedAt: new Date(),
    },
  });

  return c.json({ progress });
});

/**
 * GET /api/learn/queue
 * Returns concepts due for spaced revision where nextReviewAt <= now OR status is NEEDS_REVISION.
 */
learn.get("/queue", async (c) => {
  const user = c.get("user");
  const now = new Date();

  const dueItems = await db.userConceptProgress.findMany({
    where: {
      userId: user.id,
      concept: {
        publishedRevisionId: { not: null },
        module: {
          isPublished: true,
          subject: { isPublished: true },
        },
      },
      OR: [
        { nextReviewAt: { lte: now } },
        { status: "NEEDS_REVISION" as any },
      ],
    },
    orderBy: [
      { nextReviewAt: "asc" },
      { updatedAt: "desc" },
    ],
    select: {
      id: true,
      status: true,
      reviewStage: true,
      nextReviewAt: true,
      lastReviewedAt: true,
      recallAttempts: true,
      recallCorrect: true,
      concept: {
        select: {
          id: true,
          slug: true,
          module: {
            select: {
              slug: true,
              title: true,
              subject: {
                select: {
                  slug: true,
                  title: true,
                },
              },
            },
          },
          publishedRevision: {
            select: {
              title: true,
              summary: true,
              estimatedMinutes: true,
              difficulty: true,
            },
          },
        },
      },
    },
  });

  const queue = dueItems
    .filter((item) => item.concept.publishedRevision !== null)
    .map((item) => ({
      progressId: item.id,
      status: item.status,
      reviewStage: item.reviewStage,
      nextReviewAt: item.nextReviewAt,
      lastReviewedAt: item.lastReviewedAt,
      recallAttempts: item.recallAttempts,
      recallCorrect: item.recallCorrect,
      concept: {
        id: item.concept.id,
        slug: item.concept.slug,
        title: item.concept.publishedRevision!.title,
        summary: item.concept.publishedRevision!.summary,
        estimatedMinutes: item.concept.publishedRevision!.estimatedMinutes,
        difficulty: item.concept.publishedRevision!.difficulty,
        module: item.concept.module,
      },
    }));

  return c.json({
    queue,
    totalDue: queue.length,
  });
});

/**
 * GET /api/learn/recommendations/interview/:interviewId
 * Explainable concept recommendations mapped strictly from actual interview evaluation feedback.
 * If no weaknesses match published concepts, returns an empty array (no synthetic claims).
 */
learn.get("/recommendations/interview/:interviewId", async (c) => {
  const user = c.get("user");
  const interviewId = c.req.param("interviewId");

  const interview = await db.interview.findFirst({
    where: {
      id: interviewId,
      userId: user.id,
    },
    include: {
      evaluation: true,
    },
  });

  if (!interview || !interview.evaluation || interview.evaluation.status !== "completed") {
    return c.json({ recommendations: [] });
  }

  const improvements = interview.evaluation.improvements || [];
  if (improvements.length === 0) {
    return c.json({ recommendations: [] });
  }

  // Fetch published concepts with metadata
  const publishedConcepts = await db.learnConcept.findMany({
    where: { publishedRevisionId: { not: null } },
    include: {
      module: {
        include: {
          subject: true,
        },
      },
      publishedRevision: true,
    },
  });

  const KEYWORD_MAP: Record<string, string[]> = {
    "two-pointers": ["two pointer", "two-pointer", "two pointers", "2 pointer", "opposite ends"],
    "sliding-window": ["sliding window", "sliding-window", "contiguous subarray", "window expansion"],
    "binary-search": ["binary search", "binary-search", "monotonic search", "search space halving", "logarithmic search"],
  };

  const recommendations: Array<{
    concept: {
      slug: string;
      title: string;
      summary: string;
      difficulty: string;
      estimatedMinutes: number;
      module: {
        slug: string;
        title: string;
        subject: {
          slug: string;
          title: string;
        };
      };
    };
    matchedFeedback: string;
    matchedKeywords: string[];
  }> = [];

  for (const concept of publishedConcepts) {
    if (!concept.publishedRevision) continue;
    const keywords = KEYWORD_MAP[concept.slug] || [
      concept.title.toLowerCase(),
      concept.slug.replace(/-/g, " "),
    ];

    for (const item of improvements) {
      const itemLower = item.toLowerCase();
      const matched = keywords.filter((k) => itemLower.includes(k));
      if (matched.length > 0) {
        recommendations.push({
          concept: {
            slug: concept.slug,
            title: concept.publishedRevision.title,
            summary: concept.publishedRevision.summary,
            difficulty: concept.publishedRevision.difficulty,
            estimatedMinutes: concept.publishedRevision.estimatedMinutes,
            module: {
              slug: concept.module.slug,
              title: concept.module.title,
              subject: {
                slug: concept.module.subject.slug,
                title: concept.module.subject.title,
              },
            },
          },
          matchedFeedback: item,
          matchedKeywords: matched,
        });
        break;
      }
    }
  }

  return c.json({ recommendations });
});

export default learn;
