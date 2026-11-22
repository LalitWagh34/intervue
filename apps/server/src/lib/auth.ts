import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { db } from "@intervue/db";

const defaultFrontendUrl =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  (process.env.NODE_ENV === "production" ? "https://intervue-mu.vercel.app" : "http://localhost:5173");

export const auth = betterAuth({
  baseURL:
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000",
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  plugins: [bearer()],
  emailAndPassword: {
    enabled: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  onAPIError: {
    errorURL: `${defaultFrontendUrl}/login`,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },
  trustedOrigins: async () => {
    const origins = [
      "https://intervue-mu.vercel.app",
      "https://intervue.vercel.app",
      "https://intervue-git-main-lalit-wagh-s-projects.vercel.app",
      ...(process.env.FRONTEND_URL ? [new URL(process.env.FRONTEND_URL).origin] : []),
      ...(process.env.CLIENT_URL ? [new URL(process.env.CLIENT_URL).origin] : []),
      ...(process.env.RENDER_EXTERNAL_URL ? [new URL(process.env.RENDER_EXTERNAL_URL).origin] : []),
    ];
    if (process.env.NODE_ENV !== "production") {
      origins.push(
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
      );
    }
    return Array.from(new Set(origins));
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});