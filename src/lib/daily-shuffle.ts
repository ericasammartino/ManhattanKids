/**
 * Stable per-calendar-day shuffle (America/New_York).
 * Same seed → same order across refreshes; next day → new order.
 */

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** YYYY-MM-DD in America/New_York (UWS calendar day). */
export function calendarDayKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Mulberry32 PRNG from a 32-bit seed. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher–Yates shuffle seeded by calendar day.
 * Returns a new array; does not mutate the input.
 */
export function shuffleForDay<T>(
  items: readonly T[],
  dayKey: string = calendarDayKey()
): T[] {
  const out = [...items];
  const rand = mulberry32(hashString(`lcl-daily-shuffle:${dayKey}`));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
