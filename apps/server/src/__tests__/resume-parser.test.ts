import { beforeEach, describe, expect, it, mock } from "bun:test";

const analyzeResume = mock(async () => ({
  choices: [{ message: { content: JSON.stringify({ projects: [], stack: ["TypeScript"], summary: "Engineer" }) } }],
}));
const getSession = mock(async () => ({
  user: { id: "resume-user", email: "resume@example.com" },
  session: { id: "resume-session", userId: "resume-user" },
}));

mock.module("../lib/groq", () => ({
  groq: { chat: { completions: { create: analyzeResume } } },
  GROQ_CHAT_MODEL: "test-model",
  GROQ_FAST_MODEL: "test-fast-model",
}));

mock.module("../lib/auth", () => ({
  auth: { api: { getSession } },
}));

mock.module("@intervue/db", () => ({
  db: new Proxy({}, { get: () => ({}) }),
}));

const { default: interviewRoutes } = await import("../routes/interview");

function resumeFileRequest(file: File) {
  const form = new FormData();
  form.set("file", file);
  return interviewRoutes.request("/parse-resume", { method: "POST", body: form });
}

describe("Resume parser upload boundary", () => {
  beforeEach(() => {
    analyzeResume.mockReset();
    analyzeResume.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ projects: [], stack: ["TypeScript"], summary: "Engineer" }) } }],
    });
    getSession.mockReset();
    getSession.mockResolvedValue({
      user: { id: `resume-user-${crypto.randomUUID()}`, email: "resume@example.com" },
      session: { id: "resume-session", userId: "resume-user" },
    });
  });

  it("rejects unsupported and MIME-mismatched files before analysis", async () => {
    const unsupported = await resumeFileRequest(
      new File(["A valid-length resume body for testing."], "resume.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
    );
    const mismatched = await resumeFileRequest(
      new File(["A valid-length resume body for testing."], "resume.pdf", { type: "text/plain" })
    );

    expect(unsupported.status).toBe(415);
    // Bun normalizes a .pdf multipart part to application/pdf, so signature validation rejects it as malformed.
    expect(mismatched.status).toBe(400);
    expect(analyzeResume).not.toHaveBeenCalled();
  });

  it("rejects an oversized resume before analysis", async () => {
    const response = await resumeFileRequest(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "resume.txt", { type: "text/plain" })
    );

    expect(response.status).toBe(413);
    expect(analyzeResume).not.toHaveBeenCalled();
  });

  it("parses a bounded UTF-8 text resume", async () => {
    const response = await resumeFileRequest(
      new File(["Experienced TypeScript engineer building reliable distributed services."], "resume.txt", {
        type: "text/plain",
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.fileName).toBe("resume.txt");
    expect(body.dossier.stack).toEqual(["TypeScript"]);
    expect(analyzeResume).toHaveBeenCalledTimes(1);
    expect(analyzeResume.mock.calls[0]?.[1]?.signal).toBeDefined();
  });

  it("rejects invalid JSON and excessive extracted text", async () => {
    const invalid = await interviewRoutes.request("/parse-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid",
    });
    const excessive = await interviewRoutes.request("/parse-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "a".repeat(20_001) }),
    });

    expect(invalid.status).toBe(400);
    expect(excessive.status).toBe(413);
    expect(analyzeResume).not.toHaveBeenCalled();
  });

  it("returns safe JSON when resume analysis fails", async () => {
    analyzeResume.mockRejectedValueOnce(Object.assign(new Error("provider secret"), { status: 503 }));

    const response = await resumeFileRequest(
      new File(["Experienced engineer with enough resume text for analysis."], "resume.txt", {
        type: "text/plain",
      })
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Resume analysis is temporarily unavailable" });
  });
});
