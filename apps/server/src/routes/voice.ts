import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import type { AuthVariables } from "../types";
import Groq from "groq-sdk";

const app = new Hono<{ Variables: AuthVariables }>();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// STT — convert audio to text using Groq Whisper
app.post("/stt", requireAuth, async (c) => {
  const formData = await c.req.formData();
  const audioFile = formData.get("audio") as File;

  if (!audioFile) {
    return c.json({ error: "No audio file" }, 400);
  }

  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-large-v3",
    response_format: "json",
    language: "en",
  });

  return c.json({ text: transcription.text });
});

// TTS — convert text to audio using Groq PlayAI
app.post("/tts", requireAuth, async (c) => {
  const body = await c.req.json();
  const text = body.text;

  if (!text) {
    return c.json({ error: "No text provided" }, 400);
  }

  const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "playai-tts",
      input: text,
      voice: "Celeste-PlayAI",
      response_format: "wav",
    }),
  });

  const audioBuffer = await response.arrayBuffer();

  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": audioBuffer.byteLength.toString(),
    },
  });
});

export default app;