import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Available fast high-parameter models on Groq
export const GROQ_CHAT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
export const GROQ_FAST_MODEL = process.env.GROQ_FAST_MODEL || "openai/gpt-oss-20b";
