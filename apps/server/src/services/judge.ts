import { db } from "@intervue/db";

type SupportedLanguage =
  | "CPP"
  | "JAVA"
  | "PYTHON"
  | "JAVASCRIPT"
  | "TYPESCRIPT";

type JudgeResult = {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  status: {
    id: number;
    description: string;
  };
};

type FinalVerdict =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TLE"
  | "MLE"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "JUDGE_ERROR";

// What executeSingleTestCase actually returns — either a real Judge0
// result, or a signal that our infrastructure (not the user's code)
// failed. Keeping these distinct lets judgeSubmission report the right
// verdict instead of falsely blaming the user's code for our problems.
type ExecutionOutcome = { result: JudgeResult } | { infraError: string };

const LANGUAGE_IDS: Record<SupportedLanguage, number> = {
  // Judge0 CE language IDs.
  CPP: 54,
  JAVA: 62,
  PYTHON: 71,
  JAVASCRIPT: 63,
  TYPESCRIPT: 74,
};

const MAX_SOURCE_CODE_BYTES = 64 * 1024; // 64KB — adjust to taste

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return value in LANGUAGE_IDS;
}

const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
} as const;

// Judge0 CE has no dedicated "memory limit exceeded" status — a
// memory-killed process typically surfaces as SIGSEGV (or another
// runtime-error signal) with `memory` at or above the limit you set.
// Verify this mapping against your actual deployed Judge0 version.
const MEMORY_KILL_CANDIDATE_STATUSES: number[] = [
  STATUS.RUNTIME_ERROR_SIGSEGV,
  STATUS.RUNTIME_ERROR_SIGABRT,
  STATUS.RUNTIME_ERROR_OTHER,
];

// Statuses that mean "our infrastructure failed," not "the user's code
// failed." These must never be reported to the user as RUNTIME_ERROR —
// that would falsely blame their code for a judge-side problem.
const JUDGE_INFRA_FAILURE_STATUSES: number[] = [
  STATUS.INTERNAL_ERROR,
  STATUS.EXEC_FORMAT_ERROR,
];

function mapVerdict(result: JudgeResult, memoryLimitKb: number): FinalVerdict {
  if (JUDGE_INFRA_FAILURE_STATUSES.includes(result.status.id)) {
    return "JUDGE_ERROR";
  }

  switch (result.status.id) {
    case STATUS.ACCEPTED:
      return "ACCEPTED";

    case STATUS.WRONG_ANSWER:
      return "WRONG_ANSWER";

    case STATUS.TIME_LIMIT_EXCEEDED:
      return "TLE";

    case STATUS.COMPILATION_ERROR:
      return "COMPILATION_ERROR";

    case STATUS.RUNTIME_ERROR_SIGSEGV:
    case STATUS.RUNTIME_ERROR_SIGXFSZ:
    case STATUS.RUNTIME_ERROR_SIGFPE:
    case STATUS.RUNTIME_ERROR_SIGABRT:
    case STATUS.RUNTIME_ERROR_NZEC:
    case STATUS.RUNTIME_ERROR_OTHER:
      if (
        MEMORY_KILL_CANDIDATE_STATUSES.includes(result.status.id) &&
        result.memory !== null &&
        result.memory >= memoryLimitKb
      ) {
        return "MLE";
      }
      return "RUNTIME_ERROR";

    default:
      // Unknown/unmapped status — treat as a judge-side problem, not
      // a silent RUNTIME_ERROR against the user's code.
      return "JUDGE_ERROR";
  }
}

function validateSourceCode(sourceCode: unknown): asserts sourceCode is string {
  if (typeof sourceCode !== "string" || sourceCode.trim().length === 0) {
    throw new Error("sourceCode must be a non-empty string");
  }
  if (Buffer.byteLength(sourceCode, "utf8") > MAX_SOURCE_CODE_BYTES) {
    throw new Error(
      `sourceCode exceeds maximum size of ${MAX_SOURCE_CODE_BYTES} bytes`
    );
  }
}

async function executeSingleTestCase({
  sourceCode,
  language,
  input,
  expectedOutput,
  timeLimit,
  memoryLimit,
}: {
  sourceCode: string;
  language: SupportedLanguage;
  input: string;
  expectedOutput: string;
  timeLimit: number;
  memoryLimit: number;
}): Promise<ExecutionOutcome> {
  const languageId = LANGUAGE_IDS[language];
  const wallTimeLimitSeconds = Math.min(timeLimit / 1000 + 2, 20);

  try {
    // Submit without wait=true — returns a token immediately instead of
    // holding the connection open for the whole compile+run duration.
    const submitResponse = await fetch(
      `${process.env.JUDGE0_API_URL}/submissions/?base64_encoded=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: languageId,

          stdin: input,
          expected_output: expectedOutput,

          cpu_time_limit: timeLimit / 1000,
          wall_time_limit: wallTimeLimitSeconds,

          // Judge0 expects memory in KB.
          memory_limit: memoryLimit * 1024,

          enable_network: false,

          max_processes_and_or_threads: 20,
        }),
      }
    );

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      return {
        infraError: `Judge0 submit failed (${submitResponse.status}): ${errorText}`,
      };
    }

    const { token } = (await submitResponse.json()) as { token: string };

    // Poll for the result. Each individual poll is fast — a slow VM
    // just means more polls, not one connection held open indefinitely.
    const pollIntervalMs = 500;
    const maxPollAttempts = 60; // 60 * 500ms = 30s total ceiling

    for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const pollResponse = await fetch(
        `${process.env.JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`
      );

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        return {
          infraError: `Judge0 poll failed (${pollResponse.status}): ${errorText}`,
        };
      }

      const result = (await pollResponse.json()) as JudgeResult;

      // status.id 1 = In Queue, 2 = Processing — anything else means done.
      if (
        result.status.id !== STATUS.IN_QUEUE &&
        result.status.id !== STATUS.PROCESSING
      ) {
        return { result };
      }
    }

    return {
      infraError: `Judge0 did not finish within ${(maxPollAttempts * pollIntervalMs) / 1000}s of polling — token ${token}`,
    };
  } catch (error) {
    // Network-level failure (fetch itself threw — VM unreachable, DNS
    // failure, connection refused, etc).
    return {
      infraError:
        error instanceof Error
          ? error.message
          : "Unknown network error contacting Judge0",
    };
  }
}

export async function judgeSubmission({
  userId,
  problemId,
  sourceCode,
  language,
}: {
  userId: string;
  problemId: number;
  sourceCode: string;
  language: string;
}) {
  validateSourceCode(sourceCode);

  if (!isSupportedLanguage(language)) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const problem = await db.problem.findUnique({
    where: { id: problemId },
    include: { testCases: { orderBy: { orderIndex: "asc" } } },
  });

  if (!problem) throw new Error("Problem not found");
  if (problem.status !== "published") throw new Error("Problem is not available");
  if (problem.testCases.length === 0) throw new Error("Problem has no test cases");

  const submission = await db.submission.create({
    data: {
      userId,
      problemId,
      language,
      languageId: LANGUAGE_IDS[language],
      sourceCode,
      verdict: "PENDING",
      isAccepted: false,
    },
  });

  const results: Array<{
    testCaseId: number;
    orderIndex: number;
    isHidden: boolean;
    verdict: FinalVerdict;
    time: string | null;
    memory: number | null;
    stderr: string | null;
    compileOutput: string | null;
  }> = [];

  let finalVerdict: FinalVerdict = "ACCEPTED";
  let maxTime = 0;
  let maxMemory = 0;
  let sawAnyResult = false;

  const memoryLimitKb = problem.memoryLimit * 1024;

  try {
    for (const testCase of problem.testCases) {
      const outcome = await executeSingleTestCase({
        sourceCode,
        language,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
      });

      if ("infraError" in outcome) {
        // Judge0 itself failed — this is not the user's fault.
        finalVerdict = "JUDGE_ERROR";
        results.push({
          testCaseId: testCase.id,
          orderIndex: testCase.orderIndex,
          isHidden: testCase.isHidden,
          verdict: "JUDGE_ERROR",
          time: null,
          memory: null,
          stderr: outcome.infraError,
          compileOutput: null,
        });
        break;
      }

      const { result } = outcome;
      const verdict = mapVerdict(result, memoryLimitKb);
      sawAnyResult = true;

      if (result.time) maxTime = Math.max(maxTime, Number(result.time) * 1000);
      if (result.memory) maxMemory = Math.max(maxMemory, result.memory);

    results.push({
      testCaseId: testCase.id,
      orderIndex: testCase.orderIndex,
      isHidden: testCase.isHidden,
      verdict,
      time: result.time,
      memory: result.memory,
      stderr: result.stderr,
      compileOutput: result.compile_output,
    });

      // First failing testcase determines final verdict — worst-case
      // time/memory below only reflect testcases run up to and
      // including this one, not the full problem.
      if (verdict !== "ACCEPTED") {
        finalVerdict = verdict;
        break;
      }
    }

    const compileOutput =
      results.find((r) => r.compileOutput)?.compileOutput ?? null;
    const stderrOutput =
      results.find((r) => r.stderr)?.stderr ?? null;

    await db.submission.update({
      where: { id: submission.id },
      data: {
        verdict: finalVerdict,
        isAccepted: finalVerdict === "ACCEPTED",
        runtime: Math.round(maxTime),
        memory: sawAnyResult ? maxMemory : null,
        stderr: stderrOutput ?? compileOutput,
      },
    });

    return {
      submissionId: submission.id,
      verdict: finalVerdict,
      runtime: Math.round(maxTime),
      memory: sawAnyResult ? maxMemory : null,
      totalTestCases: problem.testCases.length,
      compileOutput,
      stderr: stderrOutput,
      results,
    };
  } catch (error) {
    // Unexpected exception (DB error, programming bug) — still a judge
    // problem, not the user's code.
    await db.submission.update({
      where: { id: submission.id },
      data: {
        verdict: "JUDGE_ERROR",
        isAccepted: false,
        stderr: error instanceof Error ? error.message : "Unknown judge error",
      },
    });
    throw error;
  }
}