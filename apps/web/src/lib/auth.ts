import { createAuthClient } from "better-auth/react";

const getAuthBaseUrl = () => {
  if (import.meta.env.VITE_AUTH_URL) return import.meta.env.VITE_AUTH_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");
  return "http://localhost:3000";
};

export const getSessionToken = () => {
  try {
    return localStorage.getItem("intervue_session_token") || "";
  } catch {
    return "";
  }
};

export const setSessionToken = (token: string) => {
  try {
    if (token) {
      localStorage.setItem("intervue_session_token", token);
    } else {
      localStorage.removeItem("intervue_session_token");
    }
  } catch {}
};

// Check URL for session_token from OAuth redirect (e.g. mobile Safari / Google OAuth fallback)
if (typeof window !== "undefined") {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("session_token") || params.get("token");
    if (token) {
      localStorage.setItem("intervue_session_token", token);
      params.delete("session_token");
      params.delete("token");
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  } catch {}
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  fetchOptions: {
    onRequest: (context) => {
      try {
        const token = localStorage.getItem("intervue_session_token");
        if (token) {
          context.headers.set("authorization", `Bearer ${token}`);
        }
      } catch {}
      return context;
    },
    onResponse: (context) => {
      try {
        const token =
          context.response.headers.get("set-auth-token") ||
          context.response.headers.get("Set-Auth-Token");
        if (token) {
          localStorage.setItem("intervue_session_token", token);
        }
      } catch {}
    },
  },
});

export const { signIn, signUp, useSession } = authClient;

export const signOut = async (options?: Parameters<typeof authClient.signOut>[0]) => {
  try {
    localStorage.removeItem("intervue_session_token");
  } catch {}
  return authClient.signOut(options);
};