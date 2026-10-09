import { createAuthClient } from "better-auth/react";

const getAuthBaseUrl = () => {
  if (import.meta.env.VITE_AUTH_URL) return import.meta.env.VITE_AUTH_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
});

export const { signIn, signUp, signOut, useSession } = authClient;