import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

const transcribe = mock(async () => ({ text: "hello world" }));
const getSession = mock(async () => ({
  user: { id: "voice-user", email: "voice@example.com" },
  session: { id: "voice-session", userId: "voice-user" },
}));

mock.module("../lib/groq", () => ({
  groq: {
    audio: {
      transcriptions: { create: transcribe },
    },
  },
}));

mock.module("../lib/auth", () => ({
  auth: { api: { getSession } },
}));

const { default: voiceRoutes } = await import("../routes/voice");
const originalFetch = globalThis.fetch;
const originalGroqApiKey = process.env.GROQ_API_KEY;

function audioRequest(file: File) {
  const body = new FormData();
  body.set("audio", file);
  return voiceRoutes.request("/stt", { method: "POST", body });
}

describe("Voice STT route", () => {
  beforeEach(() => {
    transcribe.mockReset();
    transcribe.mockResolvedValue({ text: "hello world" });
    getSession.mockReset();
    getSession.mockResolvedValue({
      user: { id: `voice-user-${crypto.randomUUID()}`, email: "voice@example.com" },
      session: { id: "voice-session", userId: "voice-user" },
    });
  });

  it("rejects unsupported audio without calling the provider", async () => {
    const response = await audioRequest(new File(["not audio"], "clip.txt", { type: "text/plain" }));

    expect(response.status).toBe(415);
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("rejects an oversized audio upload without calling the provider", async () => {
    const response = await audioRequest(
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.webm", { type: "audio/webm" })
    );

    expect(response.status).toBe(413);
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("returns transcription text for a valid audio upload", async () => {
    const response = await audioRequest(new File(["audio bytes"], "clip.webm", { type: "audio/webm" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ text: "hello world" });
    expect(transcribe).toHaveBeenCalledTimes(1);
  });

  it("returns safe JSON when the transcription provider fails", async () => {
    transcribe.mockRejectedValueOnce(Object.assign(new Error("provider secret"), { status: 503 }));

    const response = await audioRequest(new File(["audio bytes"], "clip.wav", { type: "audio/wav" }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Voice transcription is temporarily unavailable" });
  });

  it("returns a timeout response when transcription exceeds its deadline", async () => {
    transcribe.mockRejectedValueOnce(Object.assign(new Error("timed out"), { name: "TimeoutError" }));

    const response = await audioRequest(new File(["audio bytes"], "clip.ogg", { type: "audio/ogg" }));

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ error: "Voice transcription timed out. Please try again." });
  });

  it("limits transcription cost per authenticated user", async () => {
    const userId = `rate-limited-${crypto.randomUUID()}`;
    getSession.mockResolvedValue({
      user: { id: userId, email: "voice@example.com" },
      session: { id: "voice-session", userId },
    });

    const responses = [];
    for (let attempt = 0; attempt < 11; attempt++) {
      responses.push(
        await audioRequest(new File(["audio bytes"], `clip-${attempt}.wav`, { type: "audio/wav" }))
      );
    }

    expect(responses.slice(0, 10).every((response) => response.status === 200)).toBe(true);
    expect(responses[10].status).toBe(429);
    expect(transcribe).toHaveBeenCalledTimes(10);
  });
});

describe("Voice TTS route", () => {
  const fetchMock = mock(async () =>
    new Response("wave data", {
      status: 200,
      headers: { "Content-Type": "audio/wav", "Content-Length": "9" },
    })
  );

  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-groq-key";
    globalThis.fetch = fetchMock as typeof fetch;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () =>
      new Response("wave data", {
        status: 200,
        headers: { "Content-Type": "audio/wav", "Content-Length": "9" },
      })
    );
    getSession.mockReset();
    getSession.mockResolvedValue({
      user: { id: `tts-user-${crypto.randomUUID()}`, email: "voice@example.com" },
      session: { id: "voice-session", userId: "tts-user" },
    });
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    if (originalGroqApiKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalGroqApiKey;
  });

  it("rejects missing and oversized text without calling the provider", async () => {
    const missing = await voiceRoutes.request("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   " }),
    });
    const oversized = await voiceRoutes.request("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "a".repeat(3_001) }),
    });

    expect(missing.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("streams a valid upstream audio response", async () => {
    const response = await voiceRoutes.request("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "  Hello interview  " }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/wav");
    expect(await response.text()).toBe("wave data");
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body)).input).toBe("Hello interview");
    expect(request.signal).toBeDefined();
  });

  it("returns safe JSON for an upstream error status", async () => {
    fetchMock.mockResolvedValueOnce(new Response("provider secret", { status: 500 }));

    const response = await voiceRoutes.request("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello" }),
    });

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ error: "Voice generation is temporarily unavailable" });
  });

  it("rejects a successful non-audio upstream response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "not audio" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const response = await voiceRoutes.request("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello" }),
    });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Voice generation returned an invalid response" });
  });

  it("returns a timeout response when the provider deadline is exceeded", async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error("timed out"), { name: "TimeoutError" }));

    const response = await voiceRoutes.request("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello" }),
    });

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ error: "Voice generation timed out. Please try again." });
  });

  it("limits voice generation cost per authenticated user", async () => {
    const userId = `tts-limited-${crypto.randomUUID()}`;
    getSession.mockResolvedValue({
      user: { id: userId, email: "voice@example.com" },
      session: { id: "voice-session", userId },
    });

    const responses = [];
    for (let attempt = 0; attempt < 11; attempt++) {
      responses.push(
        await voiceRoutes.request("/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `Hello ${attempt}` }),
        })
      );
    }

    expect(responses.slice(0, 10).every((response) => response.status === 200)).toBe(true);
    expect(responses[10].status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });
});
