import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is required for Groq-backed requests");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// Delay SDK construction until a Groq-backed route actually handles a request.
export const groq = new Proxy({} as Groq, {
  get(_target, property) {
    return Reflect.get(getGroqClient(), property);
  },
});

// Available fast high-parameter models on Groq
export const GROQ_CHAT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
export const GROQ_FAST_MODEL = process.env.GROQ_FAST_MODEL || "openai/gpt-oss-20b";
