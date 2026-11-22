import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { AuthVariables } from "../types";
import { groq } from "../lib/groq";
import { rateLimiter } from "../middleware/rateLimiter";

const app = new Hono<{ Variables: AuthVariables }>();

const MAX_STT_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TTS_TEXT_CHARACTERS = 3_000;
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const STT_TIMEOUT_MS = 30_000;
const TTS_TIMEOUT_MS = 30_000;
const SUPPORTED_STT_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
  "audio/x-wav",
  "video/webm",
]);
const SUPPORTED_STT_EXTENSIONS = new Set([".m4a", ".mp3", ".mp4", ".ogg", ".wav", ".webm"]);

const sttLimiter = rateLimiter({
  windowMs: 5 * 60_000,
  max: 10,
  message: "Voice transcription limit reached. Please wait before trying again.",
  keyGenerator: (c) => `voice-stt:${c.get("user")?.id || "anonymous"}`,
});

const ttsLimiter = rateLimiter({
  windowMs: 5 * 60_000,
  max: 10,
  message: "Voice generation limit reached. Please wait before trying again.",
  keyGenerator: (c) => `voice-tts:${c.get("user")?.id || "anonymous"}`,
});

// STT — convert audio to text using Groq Whisper
app.post("/stt", requireAuth, sttLimiter, async (c) => {
  const contentLength = Number(c.req.header("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_STT_FILE_BYTES + MULTIPART_OVERHEAD_BYTES
  ) {
    return c.json({ error: "Audio file must be 10 MB or smaller" }, 413);
  }

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "Invalid multipart audio upload" }, 400);
  }

  const audioFile = formData.get("audio");

  if (!(audioFile instanceof File)) {
    return c.json({ error: "No audio file" }, 400);
  }

  const mimeType = audioFile.type.toLowerCase();
  const extension = audioFile.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
  const hasSupportedType = SUPPORTED_STT_MIME_TYPES.has(mimeType);
  const hasSafeBinaryFallback =
    mimeType === "application/octet-stream" && SUPPORTED_STT_EXTENSIONS.has(extension);
  if (!hasSupportedType && !hasSafeBinaryFallback) {
    return c.json({ error: "Unsupported audio format" }, 415);
  }

  if (audioFile.size === 0) {
    return c.json({ error: "Audio file is empty" }, 400);
  }

  if (audioFile.size > MAX_STT_FILE_BYTES) {
    return c.json({ error: "Audio file must be 10 MB or smaller" }, 413);
  }

  try {
    const transcription = await groq.audio.transcriptions.create(
      {
        file: audioFile,
        model: "whisper-large-v3",
        response_format: "json",
        language: "en",
      },
      { signal: AbortSignal.timeout(STT_TIMEOUT_MS) }
    );

    return c.json({ text: transcription.text });
  } catch (error: any) {
    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      return c.json({ error: "Voice transcription timed out. Please try again." }, 504);
    }
    console.error("[Voice STT] Upstream transcription failed", {
      status: error?.status,
      name: error?.name,
    });
    return c.json({ error: "Voice transcription is temporarily unavailable" }, 502);
  }
});

// TTS — convert text to audio using Groq PlayAI
app.post("/tts", requireAuth, ttsLimiter, async (c) => {
  const body = await c.req.json().catch(() => null);
  const text = body?.text;

  if (typeof text !== "string" || !text.trim()) {
    return c.json({ error: "No text provided" }, 400);
  }

  const normalizedText = text.trim();
  if (normalizedText.length > MAX_TTS_TEXT_CHARACTERS) {
    return c.json({ error: "Text must be 3,000 characters or fewer" }, 413);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return c.json({ error: "Voice generation is temporarily unavailable" }, 503);
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "playai-tts",
        input: normalizedText,
        voice: "Celeste-PlayAI",
        response_format: "wav",
      }),
      signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error("[Voice TTS] Upstream generation failed", { status: response.status });
      return c.json({ error: "Voice generation is temporarily unavailable" }, 502);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
    if (!contentType?.startsWith("audio/")) {
      console.error("[Voice TTS] Upstream returned a non-audio response", { contentType });
      return c.json({ error: "Voice generation returned an invalid response" }, 502);
    }

    const headers = new Headers({ "Content-Type": contentType });
    const contentLength = response.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(response.body, { status: 200, headers });
  } catch (error: any) {
    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      return c.json({ error: "Voice generation timed out. Please try again." }, 504);
    }
    console.error("[Voice TTS] Request failed", { name: error?.name });
    return c.json({ error: "Voice generation is temporarily unavailable" }, 502);
  }
});

export default app;
