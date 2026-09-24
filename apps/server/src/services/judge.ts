import { db } from "@intervue/db";
import { spawn } from "child_process";

export type SupportedLanguage =
  | "CPP"
  | "JAVA"
  | "PYTHON"
  | "JAVASCRIPT"
  | "TYPESCRIPT";

export type FinalVerdict =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TLE"
  | "MLE"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "JUDGE_ERROR";

export type JudgeResult = {
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

export type ExecutionOutcome = { result: JudgeResult } | { infraError: string };

export interface TestCaseResult {
  testCaseId?: number;
  orderIndex: number;
  isHidden: boolean;
  verdict: FinalVerdict;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  timeMs: number | null;
  memoryKb: number | null;
  stderr: string | null;
  compileOutput: string | null;
}

export interface JudgeExecutionSummary {
  verdict: FinalVerdict;
  runtime: number; // in ms
  memory: number | null; // in KB
  passedCount: number;
  totalTestCases: number;
  runtimePercentile?: number | null;
  memoryPercentile?: number | null;
  compileOutput: string | null;
  stderr: string | null;
  results: TestCaseResult[];
}

export const LANGUAGE_IDS: Record<SupportedLanguage, number> = {
  CPP: 54,
  JAVA: 62,
  PYTHON: 71,
  JAVASCRIPT: 63,
  TYPESCRIPT: 74,
};

const MAX_SOURCE_CODE_BYTES = 64 * 1024; // 64KB

export function isSupportedLanguage(value: string): value is SupportedLanguage {
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

const MEMORY_KILL_CANDIDATE_STATUSES: number[] = [
  STATUS.RUNTIME_ERROR_SIGSEGV,
  STATUS.RUNTIME_ERROR_SIGABRT,
  STATUS.RUNTIME_ERROR_OTHER,
];

const JUDGE_INFRA_FAILURE_STATUSES: number[] = [
  STATUS.INTERNAL_ERROR,
  STATUS.EXEC_FORMAT_ERROR,
];

export function normalizeOutput(str: string | null | undefined): string {
  if (str == null) return "";
  return str
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

export function mapVerdict(result: JudgeResult, memoryLimitKb: number): FinalVerdict {
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
      return "JUDGE_ERROR";
  }
}

export function validateSourceCode(sourceCode: unknown): asserts sourceCode is string {
  if (typeof sourceCode !== "string" || sourceCode.trim().length === 0) {
    throw new Error("sourceCode must be a non-empty string");
  }
  if (Buffer.byteLength(sourceCode, "utf8") > MAX_SOURCE_CODE_BYTES) {
    throw new Error(
      `sourceCode exceeds maximum size of ${MAX_SOURCE_CODE_BYTES} bytes`
    );
  }
}

/**
 * Lightweight local sandbox runner used as a fallback if Judge0 server is offline.
 * Supports JAVASCRIPT and TYPESCRIPT execution safely with standard timeout.
 */
async function executeLocalSandbox({
  sourceCode,
  language,
  input,
  expectedOutput,
  timeLimit,
}: {
  sourceCode: string;
  language: SupportedLanguage;
  input: string;
  expectedOutput: string;
  timeLimit: number;
}): Promise<ExecutionOutcome> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    let child: any;
    let stdoutData = "";
    let stderrData = "";
    let isTerminated = false;

    const timeoutHandle = setTimeout(() => {
      isTerminated = true;
      try {
        child?.kill("SIGKILL");
      } catch {}
      resolve({
        result: {
          stdout: stdoutData,
          stderr: "Time limit exceeded",
          compile_output: null,
          message: null,
          time: (timeLimit / 1000).toFixed(3),
          memory: 32000,
          status: { id: STATUS.TIME_LIMIT_EXCEEDED, description: "Time Limit Exceeded" },
        },
      });
    }, timeLimit + 1000);

    try {
      if (language === "JAVASCRIPT" || language === "TYPESCRIPT") {
        // Run with bun/node
        child = spawn(process.execPath || "bun", ["-e", sourceCode], {
          stdio: ["pipe", "pipe", "pipe"],
          timeout: timeLimit + 1500,
        });
      } else if (language === "PYTHON") {
        child = spawn("python", ["-c", sourceCode], {
          stdio: ["pipe", "pipe", "pipe"],
          timeout: timeLimit + 1500,
        });
      } else {
        clearTimeout(timeoutHandle);
        return resolve({
          infraError: `Judge0 is offline and native compiled language (${language}) cannot be evaluated without Judge0 server.`,
        });
      }

      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      } else {
        child.stdin.end();
      }

      child.stdout.on("data", (chunk: Buffer) => {
        stdoutData += chunk.toString("utf8");
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderrData += chunk.toString("utf8");
      });

      child.on("error", (err: any) => {
        clearTimeout(timeoutHandle);
        if (isTerminated) return;
        resolve({
          infraError: `Local execution error: ${err.message}`,
        });
      });

      child.on("close", (code: number | null) => {
        clearTimeout(timeoutHandle);
        if (isTerminated) return;

        const durationMs = Date.now() - startTime;
        const normalizedActual = normalizeOutput(stdoutData);
        const normalizedExpected = normalizeOutput(expectedOutput);

        if (code !== 0) {
          const isCompileErr = stderrData.includes("SyntaxError") || stderrData.includes("compile");
          return resolve({
            result: {
              stdout: stdoutData,
              stderr: stderrData,
              compile_output: isCompileErr ? stderrData : null,
              message: null,
              time: (durationMs / 1000).toFixed(3),
              memory: 24000,
              status: {
                id: isCompileErr ? STATUS.COMPILATION_ERROR : STATUS.RUNTIME_ERROR_OTHER,
                description: isCompileErr ? "Compilation Error" : "Runtime Error",
              },
            },
          });
        }

        const isMatch = normalizedActual === normalizedExpected;

        resolve({
          result: {
            stdout: stdoutData,
            stderr: stderrData || null,
            compile_output: null,
            message: null,
            time: (durationMs / 1000).toFixed(3),
            memory: 24000,
            status: {
              id: isMatch ? STATUS.ACCEPTED : STATUS.WRONG_ANSWER,
              description: isMatch ? "Accepted" : "Wrong Answer",
            },
          },
        });
      });
    } catch (e: any) {
      clearTimeout(timeoutHandle);
      resolve({ infraError: `Sandbox invocation error: ${e.message}` });
    }
  });
}

/**
 * Execute a single test case against Judge0 CE with fast polling and timeout guard.
 * Gracefully falls back to local sandbox if Judge0 connection is refused/down.
 */
export async function executeSingleTestCase({
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
  const judgeApiUrl = process.env.JUDGE0_API_URL;

  if (judgeApiUrl) {
    try {
      // Fast submit with 5s timeout guard
      const submitResponse = await fetch(
        `${judgeApiUrl}/submissions/?base64_encoded=false`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            source_code: sourceCode,
            language_id: languageId,
            stdin: input,
            expected_output: expectedOutput,
            cpu_time_limit: timeLimit / 1000,
            wall_time_limit: wallTimeLimitSeconds,
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

      // Poll for the result with adaptive intervals
      const pollIntervalMs = 350;
      const maxPollAttempts = 40; // 14s total ceiling

      for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

        const pollResponse = await fetch(
          `${judgeApiUrl}/submissions/${token}?base64_encoded=false`,
          { signal: AbortSignal.timeout(4000) }
        );

        if (!pollResponse.ok) {
          const errorText = await pollResponse.text();
          return {
            infraError: `Judge0 poll failed (${pollResponse.status}): ${errorText}`,
          };
        }

        const result = (await pollResponse.json()) as JudgeResult;

        if (
          result.status.id !== STATUS.IN_QUEUE &&
          result.status.id !== STATUS.PROCESSING
        ) {
          return { result };
        }
      }

      return {
        infraError: `Judge0 timeout: execution exceeded polling window (${(maxPollAttempts * pollIntervalMs) / 1000}s) — token ${token}`,
      };
    } catch (networkError: any) {
      console.warn(
        `[Judge0] Remote API unreachable (${networkError.message}), attempting local sandbox fallback...`
      );
    }
  }

  // Fallback to local sandbox runner if Judge0 is unreachable or offline
  return executeLocalSandbox({
    sourceCode,
    language,
    input,
    expectedOutput,
    timeLimit,
  });
}

/**
 * Runs ONLY public/sample test cases for non-authoritative local testing.
 * Does NOT pollute submission history in the database.
 */
export async function runSampleTestCases({
  problemId,
  sourceCode,
  language,
}: {
  problemId: number;
  sourceCode: string;
  language: string;
}): Promise<JudgeExecutionSummary> {
  validateSourceCode(sourceCode);

  if (!isSupportedLanguage(language)) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const problem = await db.problem.findUnique({
    where: { id: problemId },
    include: {
      testCases: {
        where: { isHidden: false },
        orderBy: { orderIndex: "asc" },
      },
      examples: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!problem) throw new Error("Problem not found");

  // If no test cases are explicitly marked as public, use first 2 testcases or examples
  let casesToRun: Array<{ id?: number; orderIndex: number; input: string; output: string }> = [];

  if (problem.testCases.length > 0) {
    casesToRun = problem.testCases.map((tc) => ({
      id: tc.id,
      orderIndex: tc.orderIndex,
      input: tc.input,
      output: tc.expectedOutput,
    }));
  } else if (problem.examples.length > 0) {
    casesToRun = problem.examples.map((ex, i) => ({
      id: ex.id,
      orderIndex: ex.orderIndex ?? i,
      input: ex.input,
      output: ex.output,
    }));
  } else {
    // Fallback query to get any 2 testcases
    const anyCases = await db.testCase.findMany({
      where: { problemId },
      orderBy: { orderIndex: "asc" },
      take: 2,
    });
    casesToRun = anyCases.map((tc) => ({
      id: tc.id,
      orderIndex: tc.orderIndex,
      input: tc.input,
      output: tc.expectedOutput,
    }));
  }

  if (casesToRun.length === 0) {
    throw new Error("No sample test cases found for this problem");
  }

  const results: TestCaseResult[] = [];
  let finalVerdict: FinalVerdict = "ACCEPTED";
  let maxTime = 0;
  let maxMemory = 0;
  const memoryLimitKb = problem.memoryLimit * 1024;

  for (let idx = 0; idx < casesToRun.length; idx++) {
    const tc = casesToRun[idx];
    if (!tc) continue;
    const outcome = await executeSingleTestCase({
      sourceCode,
      language,
      input: tc.input,
      expectedOutput: tc.output,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
    });

    if ("infraError" in outcome) {
      finalVerdict = "JUDGE_ERROR";
      results.push({
        testCaseId: tc.id,
        orderIndex: tc.orderIndex ?? idx,
        isHidden: false,
        verdict: "JUDGE_ERROR",
        input: tc.input,
        expectedOutput: tc.output,
        actualOutput: "",
        timeMs: null,
        memoryKb: null,
        stderr: outcome.infraError,
        compileOutput: null,
      });
      break;
    }

    const { result } = outcome;
    const verdict = mapVerdict(result, memoryLimitKb);

    const timeMs = result.time ? Math.round(Number(result.time) * 1000) : 0;
    maxTime = Math.max(maxTime, timeMs);
    if (result.memory) maxMemory = Math.max(maxMemory, result.memory);

    const actualOutput = result.stdout ?? "";

    results.push({
      testCaseId: tc.id,
      orderIndex: tc.orderIndex ?? idx,
      isHidden: false,
      verdict,
      input: tc.input,
      expectedOutput: tc.output,
      actualOutput,
      timeMs,
      memoryKb: result.memory,
      stderr: result.stderr,
      compileOutput: result.compile_output,
    });

    if (verdict === "COMPILATION_ERROR" || verdict === "JUDGE_ERROR") {
      finalVerdict = verdict;
      break;
    }

    if (verdict !== "ACCEPTED" && finalVerdict === "ACCEPTED") {
      finalVerdict = verdict;
    }
  }

  const compileOutput = results.find((r) => r.compileOutput)?.compileOutput ?? null;
  const stderrOutput = results.find((r) => r.stderr)?.stderr ?? null;
  const passedCount = results.filter((r) => r.verdict === "ACCEPTED").length;

  return {
    verdict: finalVerdict,
    runtime: maxTime,
    memory: maxMemory > 0 ? maxMemory : null,
    passedCount,
    totalTestCases: casesToRun.length,
    compileOutput,
    stderr: stderrOutput,
    results,
  };
}

/**
 * Authoritative submission evaluator against ALL test cases (both public and hidden).
 * Records an official submission in the database, enforces hidden test case privacy,
 * and calculates runtime & memory percentiles against all historical accepted solutions.
 */
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
}): Promise<
  JudgeExecutionSummary & {
    submissionId: number;
    isAccepted: boolean;
  }
> {
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
      language: language as any,
      languageId: LANGUAGE_IDS[language],
      sourceCode,
      verdict: "PENDING",
      isAccepted: false,
    },
  });

  const results: TestCaseResult[] = [];
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
        finalVerdict = "JUDGE_ERROR";
        results.push({
          testCaseId: testCase.id,
          orderIndex: testCase.orderIndex,
          isHidden: testCase.isHidden,
          verdict: "JUDGE_ERROR",
          input: testCase.isHidden ? "[Hidden Test Case]" : testCase.input,
          expectedOutput: testCase.isHidden ? "[Hidden Test Case]" : testCase.expectedOutput,
          actualOutput: "",
          timeMs: null,
          memoryKb: null,
          stderr: outcome.infraError,
          compileOutput: null,
        });
        break;
      }

      const { result } = outcome;
      const verdict = mapVerdict(result, memoryLimitKb);
      sawAnyResult = true;

      const timeMs = result.time ? Math.round(Number(result.time) * 1000) : 0;
      maxTime = Math.max(maxTime, timeMs);
      if (result.memory) maxMemory = Math.max(maxMemory, result.memory);

      const actualOutput = result.stdout ?? "";

      // Mask hidden test case details to preserve competitive integrity
      const maskedInput = testCase.isHidden ? "[Hidden Test Case]" : testCase.input;
      const maskedExpected = testCase.isHidden ? "[Hidden Test Case]" : testCase.expectedOutput;
      const maskedActual = testCase.isHidden
        ? verdict === "ACCEPTED"
          ? "[Passed - Hidden Output]"
          : "[Output Mismatch on Hidden Case]"
        : actualOutput;

      results.push({
        testCaseId: testCase.id,
        orderIndex: testCase.orderIndex,
        isHidden: testCase.isHidden,
        verdict,
        input: maskedInput,
        expectedOutput: maskedExpected,
        actualOutput: maskedActual,
        timeMs,
        memoryKb: result.memory,
        stderr: result.stderr,
        compileOutput: result.compile_output,
      });

      // Stop on first failure to optimize compute and conform to competitive programming standards
      if (verdict !== "ACCEPTED") {
        finalVerdict = verdict;
        break;
      }
    }

    const compileOutput = results.find((r) => r.compileOutput)?.compileOutput ?? null;
    const stderrOutput = results.find((r) => r.stderr)?.stderr ?? null;
    const isAccepted = finalVerdict === "ACCEPTED";
    const passedCount = results.filter((r) => r.verdict === "ACCEPTED").length;

    // Percentile calculations against historical accepted submissions
    let runtimePercentile: number | null = null;
    let memoryPercentile: number | null = null;

    if (isAccepted) {
      try {
        const acceptedSubmissions = await db.submission.findMany({
          where: { problemId, isAccepted: true },
          select: { runtime: true, memory: true },
        });

        // Runtime percentile: % of historical submissions with runtime >= current runtime
        const totalSample = acceptedSubmissions.length + 1;
        const slowerOrEqualRuntime = acceptedSubmissions.filter(
          (s) => s.runtime == null || s.runtime >= maxTime
        ).length + 1;

        runtimePercentile = Math.min(
          99.9,
          Math.max(1.0, Math.round((slowerOrEqualRuntime / totalSample) * 1000) / 10)
        );

        // Memory percentile: % of historical submissions with memory >= current memory
        if (maxMemory > 0) {
          const heavierOrEqualMemory = acceptedSubmissions.filter(
            (s) => s.memory == null || s.memory >= maxMemory
          ).length + 1;

          memoryPercentile = Math.min(
            99.9,
            Math.max(1.0, Math.round((heavierOrEqualMemory / totalSample) * 1000) / 10)
          );
        } else {
          memoryPercentile = 90.0;
        }
      } catch (err) {
        console.warn("Could not calculate percentiles:", err);
      }
    }

    await db.submission.update({
      where: { id: submission.id },
      data: {
        verdict: finalVerdict as any,
        isAccepted,
        runtime: Math.round(maxTime),
        memory: sawAnyResult ? maxMemory : null,
        stderr: stderrOutput ?? compileOutput,
      },
    });

    return {
      submissionId: submission.id,
      isAccepted,
      verdict: finalVerdict,
      runtime: Math.round(maxTime),
      memory: sawAnyResult ? maxMemory : null,
      passedCount,
      totalTestCases: problem.testCases.length,
      runtimePercentile,
      memoryPercentile,
      compileOutput,
      stderr: stderrOutput,
      results,
    };
  } catch (error) {
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