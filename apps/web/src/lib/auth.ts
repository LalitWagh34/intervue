import { createAuthClient } from "better-auth/react";
import { useEffect, useState } from "react";
import { clearUserLocalCaches } from "./localCache";
import { queryClient } from "./queryClient";

const getAuthBaseUrl = () => {
  if (import.meta.env.VITE_AUTH_URL) return import.meta.env.VITE_AUTH_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");
  return "http://localhost:3000";
};

// In-memory token store: never persist long-lived durable tokens to localStorage
let inMemorySessionToken: string | null = null;
let activeSessionUserId: string | null = null;

export const getSessionToken = () => {
  return inMemorySessionToken || "";
};

export const setSessionToken = (token: string) => {
  const normalized = token ? token : null;
  if (normalized !== inMemorySessionToken) {
    queryClient.clear();
  }
  inMemorySessionToken = normalized;
};

/**
 * Clear user-scoped caches whenever authenticated identity changes or ends
 * (including session expiry or account switching without explicit signOut).
 */
export function syncSessionCacheBoundary(
  nextUserId: string | undefined | null,
  isPending: boolean
): void {
  if (isPending) return;
  const normalized = nextUserId || null;
  if (activeSessionUserId && activeSessionUserId !== normalized) {
    clearUserLocalCaches(activeSessionUserId);
    queryClient.clear();
  }
  activeSessionUserId = normalized;
}

export function resetSessionCacheBoundaryForTests(): void {
  activeSessionUserId = null;
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  fetchOptions: {
    onRequest: (context) => {
      try {
        const token = getSessionToken();
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
          setSessionToken(token);
        }
      } catch {}
    },
  },
});

let authBootstrapPending = false;
let authBootstrapPromise: Promise<void> = Promise.resolve();

// Remove legacy durable tokens and exchange an OAuth callback code before route guards decide.
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("intervue_session_token");

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const hadLegacyToken = params.has("session_token") || params.has("token");
    params.delete("code");
    params.delete("session_token");
    params.delete("token");

    if (code || hadLegacyToken) {
      const targetPath =
        window.location.pathname === "/" || !window.location.pathname
          ? "/dashboard"
          : window.location.pathname;
      const newSearch = params.toString();
      const newUrl = targetPath + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }

    if (code) {
      authBootstrapPending = true;
      authBootstrapPromise = fetch(`${getAuthBaseUrl()}/api/auth/exchange-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Authorization code exchange failed");
          const data = await res.json();
          if (!data?.token) throw new Error("Authorization code exchange returned no token");
          clearUserLocalCaches();
          queryClient.clear();
          setSessionToken(data.token);
        })
        .catch(() => {
          setSessionToken("");
        })
        .finally(() => {
          authBootstrapPending = false;
        });
    }
  } catch {
    authBootstrapPending = false;
  }
}

export const { signIn, signUp } = authClient;

export function useSession() {
  const session = authClient.useSession();
  const [isBootstrapping, setIsBootstrapping] = useState(authBootstrapPending);
  const isPending = session.isPending || isBootstrapping;

  useEffect(() => {
    syncSessionCacheBoundary(session.data?.user?.id, isPending);
  }, [session.data?.user?.id, isPending]);

  useEffect(() => {
    if (!isBootstrapping) return;
    let active = true;
    void authBootstrapPromise.finally(async () => {
      try {
        await session.refetch();
      } catch {
        // The route guard will render the signed-out state if verification is unavailable.
      } finally {
        if (active) setIsBootstrapping(false);
      }
    });
    return () => {
      active = false;
    };
  }, [isBootstrapping, session.refetch]);

  return {
    ...session,
    isPending,
  };
}

export const signOut = async (options?: Parameters<typeof authClient.signOut>[0]) => {
  const prevUserId = activeSessionUserId;
  activeSessionUserId = null;
  setSessionToken("");
  try {
    localStorage.removeItem("intervue_session_token");
  } catch {}
  clearUserLocalCaches(prevUserId ?? undefined);
  queryClient.clear();
  return authClient.signOut(options);
};
