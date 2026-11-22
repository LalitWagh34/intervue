export type PlatformSyncStatus = {
  state: "fresh" | "stale" | "disconnected";
  lastSyncedAt: string | null;
  reason?: "timeout" | "unavailable";
};

const FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000;

export function PlatformFreshness({
  lastSyncedAt,
  status,
  now = Date.now(),
}: {
  lastSyncedAt?: string | null;
  status?: PlatformSyncStatus;
  now?: number;
}) {
  if (status?.state === "disconnected") return null;

  const timestamp = status?.lastSyncedAt ?? lastSyncedAt ?? null;
  const timestampMs = timestamp ? new Date(timestamp).getTime() : Number.NaN;
  const staleByAge = !Number.isFinite(timestampMs) || now - timestampMs > FRESHNESS_WINDOW_MS;
  const isStale = status?.state === "stale" || (status?.state !== "fresh" && staleByAge);
  const detail = status?.state === "stale"
    ? status.reason === "timeout"
      ? "Sync timed out; showing cached data"
      : "Sync unavailable; showing cached data"
    : isStale
      ? timestamp
        ? "Cached data may be out of date"
        : "Freshness is unknown"
      : "Platform data is current";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-[11px]">
      <span className="flex items-center gap-2">
        <span
          className={isStale
            ? "rounded px-2 py-0.5 font-semibold uppercase text-[var(--status-warning)] bg-[var(--status-warning-subtle)]"
            : "rounded px-2 py-0.5 font-semibold uppercase text-[var(--status-success)] bg-[var(--status-success-subtle)]"
          }
        >
          {isStale ? "Stale" : "Fresh"}
        </span>
        <span className="text-[var(--text-secondary)]">{detail}</span>
      </span>
      {timestamp ? (
        <time dateTime={timestamp} className="font-mono text-[var(--text-muted)]">
          Updated {new Date(timestamp).toLocaleString()}
        </time>
      ) : (
        <span className="font-mono text-[var(--text-muted)]">Never successfully synced</span>
      )}
    </div>
  );
}
