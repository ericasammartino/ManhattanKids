import type { Session } from "@/types";
import {
  formatDayRange,
  MONTHS_OF_YEAR,
  normalizeMonth,
  parseDaysOfWeek,
  type MonthOfYear,
} from "@/lib/taxonomy";

function formatClock(time: string | null | undefined): string {
  if (!time) return "";
  const trimmed = String(time).trim();
  if (!/^\d{1,2}:\d{2}(\s*[AaPp][Mm])?$/.test(trimmed)) return trimmed;
  const [hRaw, mRaw] = trimmed.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw.replace(/\D/g, ""));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return trimmed;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0
    ? `${hour}:00 ${ampm}`
    : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const MONTH_NAMES = MONTHS_OF_YEAR;

const MONTH_TOKEN_PATTERN =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

const MONTH_RANGE_RE = new RegExp(
  `\\b(${MONTH_TOKEN_PATTERN})(?:\\s+\\d{1,2}(?:,?\\s*\\d{4})?)?\\s*[–—-]\\s*(${MONTH_TOKEN_PATTERN})(?:\\s+\\d{1,2}(?:,?\\s*\\d{4})?)?\\b`,
  "gi"
);

const SINGLE_MONTH_DATE_RE = new RegExp(
  `\\b(${MONTH_TOKEN_PATTERN})\\s+\\d{1,2}(?:,?\\s*\\d{4})?\\b`,
  "gi"
);

function expandMonthIndices(startMonth: number, endMonth: number): number[] {
  const out: number[] = [];
  let m = startMonth;
  for (let i = 0; i < 12; i++) {
    out.push(m);
    if (m === endMonth) break;
    m = (m + 1) % 12;
  }
  return out;
}

function parseIsoOrUsDate(
  raw: string | null | undefined
): { year: number | null; month: number } | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const month = Number(iso[2]) - 1;
    if (month >= 0 && month <= 11) {
      return { year: Number(iso[1]), month };
    }
  }

  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (us) {
    const month = Number(us[1]) - 1;
    const yr = Number(us[3]);
    if (month >= 0 && month <= 11) {
      return { year: yr < 100 ? 2000 + yr : yr, month };
    }
  }

  const loose = parseLooseDate(trimmed);
  if (loose) {
    return { year: loose.year ?? null, month: loose.month };
  }
  return null;
}

/**
 * Extract active calendar months (0–11) from freeform session date/term text
 * such as "Jan 18 – Jun 4", "Sep - Jun", "Jul – Jun", "Jan 11, 2027",
 * "Winter/Spring", or "school year".
 */
export function parseMonthsFromText(
  raw: string | null | undefined
): MonthOfYear[] {
  if (!raw) return [];
  const text = String(raw).trim();
  if (!text || /^[-–—]+$/.test(text)) return [];

  const found = new Set<number>();
  let match: RegExpExecArray | null;

  MONTH_RANGE_RE.lastIndex = 0;
  while ((match = MONTH_RANGE_RE.exec(text)) !== null) {
    const s = MONTHS[match[1].toLowerCase()];
    const e = MONTHS[match[2].toLowerCase()];
    if (s !== undefined && e !== undefined) {
      for (const m of expandMonthIndices(s, e)) found.add(m);
    }
  }
  if (found.size > 0) {
    return [...found].sort((a, b) => a - b).map((m) => MONTH_NAMES[m]);
  }

  SINGLE_MONTH_DATE_RE.lastIndex = 0;
  while ((match = SINGLE_MONTH_DATE_RE.exec(text)) !== null) {
    const s = MONTHS[match[1].toLowerCase()];
    if (s !== undefined) found.add(s);
  }
  if (found.size > 0) {
    return [...found].sort((a, b) => a - b).map((m) => MONTH_NAMES[m]);
  }

  if (/\bschool\s*year\b/i.test(text)) {
    for (const m of expandMonthIndices(8, 5)) found.add(m);
  }
  if (/\b(?:year[\s-]*round|all[\s-]*year)\b/i.test(text)) {
    for (let m = 0; m < 12; m++) found.add(m);
  }
  if (/\bwinter\b/i.test(text)) {
    for (const m of [0, 1, 2]) found.add(m);
  }
  if (/\bspring\b/i.test(text)) {
    for (const m of [2, 3, 4, 5]) found.add(m);
  }
  if (/\bsummer\b/i.test(text)) {
    for (const m of [5, 6, 7]) found.add(m);
  }
  if (/\bfall\b/i.test(text)) {
    for (const m of [8, 9, 10, 11]) found.add(m);
  }

  return [...found].sort((a, b) => a - b).map((m) => MONTH_NAMES[m]);
}

/** Return the active calendar months for a single session. */
export function sessionActiveMonths(session: Session): MonthOfYear[] {
  const start = parseIsoOrUsDate(session["Start Date"]);
  const end = parseIsoOrUsDate(session["End Date"]);

  if (start && end) {
    if (
      start.year !== null &&
      end.year !== null &&
      (end.year - start.year) * 12 + (end.month - start.month) >= 11
    ) {
      return [...MONTH_NAMES];
    }
    return expandMonthIndices(start.month, end.month)
      .sort((a, b) => a - b)
      .map((m) => MONTH_NAMES[m]);
  }
  if (start) return [MONTH_NAMES[start.month]];
  if (end) return [MONTH_NAMES[end.month]];

  const fromPriceNotes = parseMonthsFromText(session["Price Notes"]);
  if (fromPriceNotes.length > 0) return fromPriceNotes;

  return parseMonthsFromText(session.Notes);
}

export function sessionRunsInMonth(session: Session, month: string): boolean {
  const canonical = normalizeMonth(month);
  if (!canonical) return false;
  return sessionActiveMonths(session).includes(canonical);
}

export function collectSessionDays(sessions: Session[]): string[] {
  const found = new Set<string>();
  for (const session of sessions) {
    for (const day of parseDaysOfWeek(session["Days of the Week"])) {
      found.add(day);
    }
  }
  return [...found];
}

export function formatSessionsDaySummary(sessions: Session[]): string | null {
  const days = collectSessionDays(sessions);
  const range = formatDayRange(days);
  if (!range) return null;
  const n = sessions.length;
  if (n <= 1) return range;
  return `${range} · ${n} class times`;
}

export function minPriceAmount(sessions: Session[]): number | null {
  const amounts = sessions
    .map((s) => s["Price Amount"])
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (amounts.length === 0) return null;
  return Math.min(...amounts);
}

/** Normalize sheet Billing Cycle / Frequency for card display ("Semester" → "semester"). */
export function formatFrequencyLabel(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (/^free$/i.test(trimmed)) return "free";
  if (/^bi[-\s]?monthly$/i.test(trimmed)) return "bi-monthly";
  if (/^month(ly)?$/i.test(trimmed)) return "month";
  if (/^year(ly)?$/i.test(trimmed)) return "year";
  if (/^semester$/i.test(trimmed)) return "semester";
  if (/^class$/i.test(trimmed)) return "class";
  if (/^session$/i.test(trimmed)) return "session";
  return trimmed.toLowerCase();
}

/** Frequency paired with the lowest priced session (fallback: first non-empty). */
export function frequencyForMinPrice(
  sessions: Session[]
): string | null {
  const priced = sessions
    .filter(
      (s) =>
        typeof s["Price Amount"] === "number" &&
        Number.isFinite(s["Price Amount"])
    )
    .sort(
      (a, b) => (a["Price Amount"] as number) - (b["Price Amount"] as number)
    );
  for (const s of priced) {
    const label = formatFrequencyLabel(s.Frequency);
    if (label) return label;
  }
  for (const s of sessions) {
    const label = formatFrequencyLabel(s.Frequency);
    if (label) return label;
  }
  return null;
}

/** Card price line: "from $925 / semester" (or "Free" / "Pricing varies"). */
export function formatPriceWithFrequency(
  sessions: Session[]
): string {
  const amount = minPriceAmount(sessions);
  const frequency = frequencyForMinPrice(sessions);

  if (frequency === "free" && (amount == null || amount === 0)) {
    return "Free";
  }
  if (amount == null) {
    if (frequency === "free") return "Free";
    return "Pricing varies";
  }

  const pretty =
    Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const unit = frequency ?? "session";
  return `from $${pretty} / ${unit}`;
}

/** Prefer member / from-price wording when Cost Structure mentions members. */
export function pricingFootnote(sessions: Session[]): string | null {
  const cost = sessions.map((s) => s["Cost Structure"] ?? "").join(" ");
  const notes = sessions.map((s) => s.Notes ?? "").join(" ");
  const blob = `${cost} ${notes}`.toLowerCase();
  if (blob.includes("ymca") && blob.includes("member")) {
    return "YMCA member pricing";
  }
  if (/\bmember\b/.test(blob)) return "Member pricing";
  return null;
}

export function sessionDurationMinutes(
  start: string | null | undefined,
  end: string | null | undefined
): number | null {
  if (!start || !end) return null;
  const toMins = (t: string) => {
    const m = t.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  };
  const a = toMins(start);
  const b = toMins(end);
  if (a === null || b === null || b <= a) return null;
  return b - a;
}

/** "6:00–6:30 PM" style range. */
export function formatSessionTimeRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  const startFmt = formatClock(start);
  const endFmt = formatClock(end);
  if (!startFmt && !endFmt) return "";
  if (!endFmt) return startFmt;
  if (!startFmt) return endFmt;

  const stripMeridiem = (t: string) => t.replace(/\s*(AM|PM)$/i, "").trim();
  const meridiem = (t: string) => {
    const m = t.match(/(AM|PM)$/i);
    return m ? m[1].toUpperCase() : "";
  };
  const startM = meridiem(startFmt);
  const endM = meridiem(endFmt);
  if (startM && endM && startM === endM) {
    return `${stripMeridiem(startFmt)}–${stripMeridiem(endFmt)} ${endM}`;
  }
  return `${startFmt}–${endFmt}`;
}

export function maxSelectableClassTimes(sessions: Session[]): number {
  const notes = sessions.map((s) => s.Notes ?? "").join(" ");
  const match = notes.match(/select up to\s+(\d+)\s+days?/i);
  if (match) return Math.max(1, Number(match[1]));
  if (/up to\s+2\s+days/i.test(notes)) return 2;
  return 1;
}

export function memberPricesByDayCount(
  sessions: Session[]
): { oneDay: number | null; twoDay: number | null } {
  const notes = sessions.map((s) => s.Notes ?? "").join(" ");
  const memberBlock = notes.match(
    /Member:\s*\$?([\d,]+)\s+for\s+1\s+day(?:,\s*\$?([\d,]+)\s+for\s+2\s+days?)?/i
  );
  if (memberBlock) {
    return {
      oneDay: Number(memberBlock[1].replace(/,/g, "")) || null,
      twoDay: memberBlock[2]
        ? Number(memberBlock[2].replace(/,/g, "")) || null
        : null,
    };
  }
  const min = minPriceAmount(sessions);
  return { oneDay: min, twoDay: null };
}

export function estimatedPriceForSelection(
  sessions: Session[],
  selectedCount: number
): { amount: number | null; label: string } {
  const prices = memberPricesByDayCount(sessions);
  if (selectedCount >= 2 && prices.twoDay != null) {
    return { amount: prices.twoDay, label: "2 days per week" };
  }
  if (prices.oneDay != null) {
    return {
      amount: prices.oneDay,
      label: selectedCount <= 1 ? "1 day per week" : `${selectedCount} days per week`,
    };
  }
  return { amount: null, label: "Session price" };
}

type DateParts = { month: number; day: number; year?: number };

function parseLooseDate(token: string): DateParts | null {
  const t = token.trim();
  const mdy = t.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,?\s*(\d{4}))?$/);
  if (!mdy) return null;
  const month = MONTHS[mdy[1].toLowerCase()];
  if (month === undefined) return null;
  return {
    month,
    day: Number(mdy[2]),
    year: mdy[3] ? Number(mdy[3]) : undefined,
  };
}

/** "Jan 4- Feb 28" / "January 4 – February 28, 2027" → display bits. */
export function sessionSeasonMeta(sessions: Session[]): {
  seasonBadge: string | null;
  dateRange: string | null;
} {
  const notes = [
    ...sessions.map((s) => s["Price Notes"] ?? ""),
    ...sessions.map((s) => s.Notes ?? ""),
  ].join(" | ");

  const rangeMatch = notes.match(
    /([A-Za-z]+\s+\d{1,2})\s*[–—-]\s*([A-Za-z]+\s+\d{1,2}(?:,?\s*\d{4})?)/
  );
  if (!rangeMatch) {
    return { seasonBadge: null, dateRange: null };
  }

  const start = parseLooseDate(rangeMatch[1]);
  const end = parseLooseDate(rangeMatch[2]);
  if (!start || !end) return { seasonBadge: null, dateRange: null };

  const year =
    end.year ??
    start.year ??
    (() => {
      const reg = notes.match(
        /(?:registration|member registration)\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i
      );
      if (reg) {
        const regYear = Number(reg[3]);
        // Jan–Mar sessions after Dec registration → next calendar year.
        if (start.month <= 2 && Number(reg[1]) === 12) return regYear + 1;
        return regYear;
      }
      return undefined;
    })();

  const dateRange = `${MONTH_NAMES[start.month]} ${start.day} – ${MONTH_NAMES[end.month]} ${end.day}`;

  const midMonth = Math.round((start.month + end.month) / 2);
  let season = "Session";
  if (midMonth <= 1 || midMonth === 11) season = "Winter";
  else if (midMonth >= 2 && midMonth <= 4) season = "Spring";
  else if (midMonth >= 5 && midMonth <= 7) season = "Summer";
  else season = "Fall";

  const seasonBadge = year ? `${season} ${year}` : season;
  return { seasonBadge, dateRange };
}

export function sortSessionsByDay(sessions: Session[]): Session[] {
  const order = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return [...sessions].sort((a, b) => {
    const da = parseDaysOfWeek(a["Days of the Week"])[0] ?? "";
    const db = parseDaysOfWeek(b["Days of the Week"])[0] ?? "";
    const ia = order.indexOf(da);
    const ib = order.indexOf(db);
    if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    return String(a["Start Time"] ?? "").localeCompare(
      String(b["Start Time"] ?? "")
    );
  });
}
