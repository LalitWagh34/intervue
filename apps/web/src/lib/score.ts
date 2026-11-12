export interface FormattedScore {
  value: string;
  max: 10 | 100;
  formatted: string;
}

/**
 * Formats an interview or dimension score consistently with the backend contract.
 * Backend evaluation (`evaluateInterview`) and `/api/profile/dashboard` store and
 * return raw 1-10 scores; values > 10 (up to 100) are preserved on a /100 scale
 * in case legacy normalized records exist.
 */
export function formatInterviewScore(
  rawScore: number | null | undefined,
): FormattedScore | null {
  if (rawScore === null || rawScore === undefined || !Number.isFinite(rawScore) || rawScore < 0) {
    return null;
  }

  if (rawScore <= 10) {
    const value = Number.isInteger(rawScore)
      ? String(rawScore)
      : String(Number(rawScore.toFixed(1)));
    return {
      value,
      max: 10,
      formatted: `${value}/10`,
    };
  }

  const clamped = Math.min(100, Math.round(rawScore));
  const value = String(clamped);
  return {
    value,
    max: 100,
    formatted: `${value}/100`,
  };
}

