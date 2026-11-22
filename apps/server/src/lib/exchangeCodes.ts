interface ExchangeCodeEntry {
  token: string;
  expiresAt: number;
}

const exchangeStore = new Map<string, ExchangeCodeEntry>();

/**
 * Creates a single-use authorization exchange code valid for 60 seconds.
 */
export function createAuthExchangeCode(token: string): string {
  const now = Date.now();
  // Evict expired entries
  for (const [code, entry] of exchangeStore.entries()) {
    if (entry.expiresAt <= now) {
      exchangeStore.delete(code);
    }
  }

  const code = crypto.randomUUID();
  exchangeStore.set(code, {
    token,
    expiresAt: now + 60_000, // 60-second validity window
  });
  return code;
}

/**
 * Consumes a single-use authorization code, invalidating it immediately.
 */
export function consumeAuthExchangeCode(code: string): string | null {
  const entry = exchangeStore.get(code);
  if (!entry) return null;
  exchangeStore.delete(code); // single-use: immediately invalidated!
  if (entry.expiresAt < Date.now()) return null;
  return entry.token;
}
