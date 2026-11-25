import type { LearnConceptResponse } from "@/hooks/useLearn";

const ACCOUNT_CACHE_PREFIX = "intervue:cache:v1:";
const DRAFT_PREFIX = "intervue:draft:v1:";
const PREFS_PREFIX = "intervue:prefs:v1:";
const RECENT_SEARCHES_PREFIX = "intervue:recent-searches:v1:";
const LAST_LESSON_PREFIX = "intervue:last-lesson:";
const SOLVED_PROBLEMS_PREFIX = "intervue:solved-problems:v1:";

const LEARN_CONCEPT_PREFIX = "intervue:learn-concept:v1:";
const LEARN_CONCEPT_LATEST_PREFIX = "intervue:learn-concept-latest:v1:";

const IDB_NAME = "intervue-local-cache";
const IDB_VERSION = 1;
const IDB_LEARN_STORE = "learnConcepts";
const MAX_RECENT_SEARCHES = 6;
const MAX_LOCAL_CONCEPT_ENTRIES = 25;

interface AccountCacheEnvelope<T> {
  value: T;
  expiresAt: number;
}

export interface FeedbackDraft {
  name?: string;
  email?: string;
  subject: string;
  message: string;
  updatedAt: number;
}

export interface PracticePreferences {
  difficulty?: string[];
  status?: string[];
  topics?: string[];
  companies?: string[];
  companyTabFilter?: "global" | "indian";
  companyPageSize?: number;
  selectedTimeframe?: string;
}

export type LearnReaderModePreference = "quick" | "deep";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeGetItem(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage quota or private-mode restrictions
  }
}

function safeRemoveItem(key: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage access errors
  }
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getIndexedDbFactory(): IDBFactory | null {
  if (typeof window === "undefined") return null;
  try {
    return window.indexedDB ?? null;
  } catch {
    return null;
  }
}

function openLocalCacheDb(): Promise<IDBDatabase | null> {
  const idb = getIndexedDbFactory();
  if (!idb) return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const request = idb.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_LEARN_STORE)) {
          db.createObjectStore(IDB_LEARN_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openLocalCacheDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_LEARN_STORE, "readonly");
      const store = tx.objectStore(IDB_LEARN_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
      req.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
      tx.onabort = () => db.close();
    } catch {
      db.close();
      resolve(null);
    }
  });
}

async function idbSet<T>(key: string, value: T): Promise<boolean> {
  const db = await openLocalCacheDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_LEARN_STORE, "readwrite");
      const store = tx.objectStore(IDB_LEARN_STORE);
      store.put(value, key);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
      tx.onabort = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

// ─── 1. Account-Scoped Read Cache ─────────────────────────────────────────

export function getAccountCacheKey(userId: string, key: string): string {
  return `${ACCOUNT_CACHE_PREFIX}${userId}:${key}`;
}

export function getAccountCache<T>(userId: string, key: string): T | null {
  if (!userId) return null;
  const fullKey = getAccountCacheKey(userId, key);
  const envelope = safeJsonParse<AccountCacheEnvelope<T>>(safeGetItem(fullKey));
  if (!envelope || typeof envelope.expiresAt !== "number") return null;

  if (envelope.expiresAt <= Date.now()) {
    safeRemoveItem(fullKey);
    return null;
  }

  return envelope.value;
}

export function setAccountCache<T>(
  userId: string,
  key: string,
  value: T,
  ttlMs: number
): void {
  if (!userId || ttlMs <= 0) return;
  const envelope: AccountCacheEnvelope<T> = {
    value,
    expiresAt: Date.now() + ttlMs,
  };
  safeSetItem(getAccountCacheKey(userId, key), JSON.stringify(envelope));
}

/**
 * Remove account-scoped localStorage entries on sign-out or account switch.
 * If userId is omitted, clears all account-scoped entries across all prefixes.
 */
export function clearUserLocalCaches(userId?: string): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const prefixes = userId
      ? [
          `${ACCOUNT_CACHE_PREFIX}${userId}:`,
          `${DRAFT_PREFIX}${userId}:`,
          `${PREFS_PREFIX}${userId}:`,
          `${RECENT_SEARCHES_PREFIX}${userId}`,
          `${LAST_LESSON_PREFIX}${userId}`,
          `${SOLVED_PROBLEMS_PREFIX}${userId}`,
        ]
      : [
          ACCOUNT_CACHE_PREFIX,
          DRAFT_PREFIX,
          PREFS_PREFIX,
          RECENT_SEARCHES_PREFIX,
          LAST_LESSON_PREFIX,
          SOLVED_PROBLEMS_PREFIX,
        ];

    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      storage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors
  }
}

// ─── 2. Immutable Published Learn Concept Cache (IndexedDB + localStorage) ─

export function getLearnConceptVersionKey(slug: string, version: number): string {
  return `${LEARN_CONCEPT_PREFIX}${slug}:v${version}`;
}

function getLearnConceptLatestKey(slug: string): string {
  return `${LEARN_CONCEPT_LATEST_PREFIX}${slug}`;
}

function trimLocalConceptStorageFallback(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const conceptKeys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(LEARN_CONCEPT_PREFIX)) {
        conceptKeys.push(key);
      }
    }
    if (conceptKeys.length > MAX_LOCAL_CONCEPT_ENTRIES) {
      for (const oldKey of conceptKeys.slice(0, conceptKeys.length - MAX_LOCAL_CONCEPT_ENTRIES)) {
        storage.removeItem(oldKey);
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Cache immutable published Learn concept body and navigation (explicitly omitting per-user progress).
 */
export async function saveLearnConceptCache(payload: LearnConceptResponse): Promise<void> {
  const slug = payload?.concept?.slug;
  const version = payload?.concept?.version;
  if (!slug || typeof version !== "number") return;

  const immutablePayload: LearnConceptResponse = {
    concept: payload.concept,
    navigation: payload.navigation,
  };

  const versionKey = getLearnConceptVersionKey(slug, version);
  const storedInIdb = await idbSet(versionKey, immutablePayload);
  if (!storedInIdb) {
    trimLocalConceptStorageFallback();
    safeSetItem(versionKey, JSON.stringify(immutablePayload));
  }

  safeSetItem(
    getLearnConceptLatestKey(slug),
    JSON.stringify({ version, storedAt: Date.now() })
  );
}

export async function loadLearnConceptByVersion(
  slug: string,
  version: number
): Promise<LearnConceptResponse | null> {
  if (!slug || typeof version !== "number") return null;
  const versionKey = getLearnConceptVersionKey(slug, version);

  const fromIdb = await idbGet<LearnConceptResponse>(versionKey);
  if (fromIdb?.concept?.slug === slug && fromIdb.concept.version === version) {
    return fromIdb;
  }

  const fromStorage = safeJsonParse<LearnConceptResponse>(safeGetItem(versionKey));
  if (fromStorage?.concept?.slug === slug && fromStorage.concept.version === version) {
    return fromStorage;
  }

  return null;
}

export async function loadLatestLearnConceptCache(
  slug: string
): Promise<LearnConceptResponse | null> {
  if (!slug) return null;
  const latestMeta = safeJsonParse<{ version: number }>(
    safeGetItem(getLearnConceptLatestKey(slug))
  );
  if (!latestMeta || typeof latestMeta.version !== "number") return null;

  return loadLearnConceptByVersion(slug, latestMeta.version);
}

// ─── 3. Local Draft Buffers ───────────────────────────────────────────────

function scopeUser(userId?: string | null): string {
  return userId && userId.trim() ? userId.trim() : "anon";
}

function getCodeDraftKey(userId: string | undefined | null, scopeKey: string, language: string): string {
  return `${DRAFT_PREFIX}${scopeUser(userId)}:code:${scopeKey}:${language}`;
}

export function getCodeDraft(
  userId: string | undefined | null,
  scopeKey: string,
  language: string
): string | null {
  if (!scopeKey || !language) return null;
  const parsed = safeJsonParse<{ code: string }>(
    safeGetItem(getCodeDraftKey(userId, scopeKey, language))
  );
  return typeof parsed?.code === "string" ? parsed.code : null;
}

export function setCodeDraft(
  userId: string | undefined | null,
  scopeKey: string,
  language: string,
  code: string
): void {
  if (!scopeKey || !language) return;
  safeSetItem(
    getCodeDraftKey(userId, scopeKey, language),
    JSON.stringify({ code, updatedAt: Date.now() })
  );
}

export function clearCodeDraft(
  userId: string | undefined | null,
  scopeKey: string,
  language?: string
): void {
  if (!scopeKey) return;
  if (language) {
    safeRemoveItem(getCodeDraftKey(userId, scopeKey, language));
    return;
  }

  const storage = getStorage();
  if (!storage) return;
  const prefix = `${DRAFT_PREFIX}${scopeUser(userId)}:code:${scopeKey}:`;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      storage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors
  }
}

function getFeedbackDraftKey(userId?: string | null): string {
  return `${DRAFT_PREFIX}${scopeUser(userId)}:feedback`;
}

export function getFeedbackDraft(userId?: string | null): FeedbackDraft | null {
  const parsed = safeJsonParse<FeedbackDraft>(safeGetItem(getFeedbackDraftKey(userId)));
  if (!parsed || typeof parsed.message !== "string" || typeof parsed.subject !== "string") {
    return null;
  }
  return parsed;
}

export function setFeedbackDraft(
  userId: string | undefined | null,
  draft: Omit<FeedbackDraft, "updatedAt">
): void {
  safeSetItem(
    getFeedbackDraftKey(userId),
    JSON.stringify({ ...draft, updatedAt: Date.now() })
  );
}

export function clearFeedbackDraft(userId?: string | null): void {
  safeRemoveItem(getFeedbackDraftKey(userId));
}

// ─── 4. UI & Study Preferences ────────────────────────────────────────────

export function getLearnReaderMode(userId?: string | null): LearnReaderModePreference {
  const raw = safeGetItem(`${PREFS_PREFIX}${scopeUser(userId)}:learn-reader-mode`);
  return raw === "deep" ? "deep" : "quick";
}

export function setLearnReaderMode(
  userId: string | undefined | null,
  mode: LearnReaderModePreference
): void {
  safeSetItem(`${PREFS_PREFIX}${scopeUser(userId)}:learn-reader-mode`, mode);
}

export function getPracticePreferences(userId?: string | null): PracticePreferences | null {
  const parsed = safeJsonParse<PracticePreferences>(
    safeGetItem(`${PREFS_PREFIX}${scopeUser(userId)}:practice-filters`)
  );
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  return parsed;
}

export function setPracticePreferences(
  userId: string | undefined | null,
  prefs: PracticePreferences
): void {
  const current = getPracticePreferences(userId) || {};
  safeSetItem(
    `${PREFS_PREFIX}${scopeUser(userId)}:practice-filters`,
    JSON.stringify({ ...current, ...prefs })
  );
}

// ─── 5. Command Palette Recent Searches ───────────────────────────────────

function getRecentSearchesKey(userId?: string | null): string {
  return `${RECENT_SEARCHES_PREFIX}${scopeUser(userId)}`;
}

export function getRecentSearches(userId?: string | null): string[] {
  const parsed = safeJsonParse<unknown>(safeGetItem(getRecentSearchesKey(userId)));
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === "string" && item.trim().length >= 2);
}

export function addRecentSearch(userId: string | undefined | null, query: string): string[] {
  const normalized = query.trim();
  if (normalized.length < 2) return getRecentSearches(userId);

  const existing = getRecentSearches(userId).filter(
    (entry) => entry.toLowerCase() !== normalized.toLowerCase()
  );
  const next = [normalized, ...existing].slice(0, MAX_RECENT_SEARCHES);
  safeSetItem(getRecentSearchesKey(userId), JSON.stringify(next));
  return next;
}

export function clearRecentSearches(userId?: string | null): void {
  safeRemoveItem(getRecentSearchesKey(userId));
}
