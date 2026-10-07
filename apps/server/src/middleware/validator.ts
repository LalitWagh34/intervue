import type { Context, Next } from "hono";
import { z } from "zod";

/**
 * Higher-order middleware to validate incoming request JSON bodies using Zod schemas.
 * Rejects invalid requests with HTTP 400 and structured field-level error messages.
 * Stores validated & sanitized payload in Hono context under `c.set("validatedBody", data)`.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async function validationMiddleware(c: Context, next: Next) {
    try {
      const rawBody = await c.req.json();
      const parseResult = schema.safeParse(rawBody);

      if (!parseResult.success) {
        const formattedErrors = parseResult.error.issues.map((err) => ({
          field: err.path.join(".") || "body",
          message: err.message,
          code: err.code,
        }));

        return c.json(
          {
            error: "Validation failed",
            statusCode: 400,
            details: formattedErrors,
          },
          400
        );
      }

      // Attach sanitized, typed data to request context
      (c as any).set("validatedBody", parseResult.data);
      await next();
    } catch (err) {
      return c.json(
        {
          error: "Invalid JSON payload in request body",
          statusCode: 400,
        },
        400
      );
    }
  };
}

/**
 * Validates route parameters (e.g. /rooms/:code)
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return async function paramValidationMiddleware(c: Context, next: Next) {
    const rawParams = c.req.param();
    const parseResult = schema.safeParse(rawParams);

    if (!parseResult.success) {
      const formattedErrors = parseResult.error.issues.map((err) => ({
        field: err.path.join(".") || "param",
        message: err.message,
        code: err.code,
      }));

      return c.json(
        {
          error: "Invalid route parameters",
          statusCode: 400,
          details: formattedErrors,
        },
        400
      );
    }

    (c as any).set("validatedParams", parseResult.data);
    await next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 🛡️ Pre-Configured Production Domain Schemas for Intervue
// ─────────────────────────────────────────────────────────────────────────────

/** Code Execution & Sandbox Runner Schema */
export const runCodeSchema = z.object({
  problemId: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .pipe(z.number().int().positive("problemId must be a positive integer")),
  language: z.enum(["CPP", "PYTHON", "JAVA", "JAVASCRIPT", "TYPESCRIPT"]),
  sourceCode: z
    .string()
    .min(1, "sourceCode cannot be empty")
    .max(65_536, "sourceCode exceeds maximum allowed size (64 KB)"),
  mode: z.enum(["run", "submit"]).optional(),
});

/** Contest Room Creation Schema */
export const createRoomSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Room title must be at least 3 characters")
    .max(100, "Room title cannot exceed 100 characters"),
  type: z.enum(["CODING", "APTITUDE", "MIXED"]).default("CODING"),
  duration: z
    .number()
    .int()
    .min(5, "Contest duration must be at least 5 minutes")
    .max(240, "Contest duration cannot exceed 240 minutes (4 hours)"),
  maxParticipants: z
    .number()
    .int()
    .min(2, "Room must allow at least 2 participants")
    .max(10000, "Room cannot exceed 10,000 participants")
    .default(10),
  codingDifficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  codingCount: z
    .number()
    .int()
    .min(0, "Coding problem count cannot be negative")
    .max(10, "Cannot select more than 10 coding problems")
    .optional(),
  codingTags: z
    .array(z.string().trim().max(50))
    .max(15, "Cannot specify more than 15 tags")
    .optional(),
  assessmentCount: z
    .number()
    .int()
    .min(0, "MCQ count cannot be negative")
    .max(50, "Cannot select more than 50 MCQ questions")
    .optional(),
  assessmentSubjects: z
    .array(z.string().trim().max(50))
    .max(10, "Cannot specify more than 10 subjects")
    .optional(),
  allowLateJoin: z.boolean().default(true),
});

/** Contest Room Join Schema */
export const joinRoomSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, "Room code must be exactly 6 uppercase alphanumeric characters"),
});

/** Contest Code Submission Schema */
export const roomSubmitCodeSchema = z.object({
  problemId: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .pipe(z.number().int().positive("problemId must be a positive integer")),
  language: z.enum(["CPP", "PYTHON", "JAVA", "JAVASCRIPT", "TYPESCRIPT"]),
  sourceCode: z
    .string()
    .min(1, "sourceCode cannot be empty")
    .max(65_536, "sourceCode exceeds maximum allowed size (64 KB)"),
});

/** Contest MCQ Answer Schema */
export const roomSubmitMcqSchema = z.object({
  questionId: z.string().trim().min(1, "questionId is required"),
  selectedOption: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .pipe(z.number().int().min(0).max(10, "Invalid option selected")),
});

/** AI Review Request Schema */
export const aiReviewSchema = z.object({
  problemTitle: z.string().trim().min(1).max(200),
  problemDescription: z.string().trim().min(1).max(50_000),
  language: z.string().trim().min(1).max(30),
  sourceCode: z.string().min(1).max(65_536),
  verdict: z.string().optional(),
});
