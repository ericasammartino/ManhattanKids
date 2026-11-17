/**
 * Canonical search taxonomy from the Lists sheet / Categories–Subcategories
 * spreadsheet. Grayed Educational / Performances / Science are inactive in the
 * sheet; Science (+ Educational) stay filterable because Session data uses them.
 */

export const PRIMARY_CATEGORIES = [
  "Afterschool Care",
  "Arts & Creativity",
  "Entertainment",
  "Learning & Enrichment",
  "Museums & Culture",
  "Play & Exploration",
  "Sports & Movement",
  "STEM",
] as const;

export type PrimaryCategory = (typeof PRIMARY_CATEGORIES)[number];

/** Active (black) subcategories from the taxonomy sheet. */
export const ACTIVE_SUBCATEGORIES = [
  "Arts & Crafts",
  "Attractions",
  "Coding",
  "Collections",
  "Cooking & Baking",
  "Creative Writing",
  "Cultural Experiences",
  "Dance",
  "Fitness",
  "Gaming",
  "General Afterschool",
  "Gymnastics",
  "History",
  "Homework Help",
  "Indoor Play",
  "Language",
  "Life Skills",
  "Martial Arts",
  "Math",
  "Movies",
  "Museums",
  "Music",
  "Outdoor Activities",
  "Parks & Playgrounds",
  "Performing Arts",
  "Photography",
  "Robotics",
  "Sports",
  "Swimming",
  "Technology",
  "Test Prep",
  "Theater",
  "Tutoring",
  "Visual Arts",
] as const;

/** Grayed in the sheet but present in Manual Entry Session data. */
export const LEGACY_SUBCATEGORIES_IN_DATA = ["Educational", "Science"] as const;

/** Filter dropdown: active taxonomy + legacy-in-data grayed rows. */
export const SUBCATEGORIES = [
  ...ACTIVE_SUBCATEGORIES,
  ...LEGACY_SUBCATEGORIES_IN_DATA,
] as const;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

/** Map historical / alternate primary-category labels onto the taxonomy. */
const CATEGORY_ALIASES: Record<string, string> = {
  "STEM & Discovery": "STEM",
  "Nature & Outdoors": "Play & Exploration",
  "Events & Experiences": "Entertainment",
  "Food & Cooking": "Arts & Creativity",
  Seasonal: "Entertainment",
};

/** Extra tokens in Session Subcategory that should match a taxonomy value. */
const SUBCATEGORY_ALIASES: Record<string, string[]> = {
  "Creative Writing": ["Creative Writing", "Writing", "Essay Writing"],
  Language: ["Language", "Early Literacy", "Debate"],
  Gaming: ["Gaming", "Tabletop Role-Playing"],
  Technology: ["Technology", "Gaming, Technology"],
};

export function normalizePrimaryCategory(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return CATEGORY_ALIASES[trimmed] ?? trimmed;
}

/** Split multi-tag subcategory strings ("Dance, Theater, Music"). */
export function splitSubcategories(
  value: string | null | undefined
): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function subcategoryMatchTargets(selected: string): Set<string> {
  const targets = new Set<string>([selected]);
  const aliases = SUBCATEGORY_ALIASES[selected];
  if (aliases) aliases.forEach((a) => targets.add(a));
  return targets;
}

export function activityMatchesSubcategory(
  raw: string | null | undefined,
  selected: string
): boolean {
  const tokens = splitSubcategories(raw);
  if (tokens.length === 0) return false;
  const targets = subcategoryMatchTargets(selected);
  return tokens.some((token) => {
    if (targets.has(token)) return true;
    // Also allow selected to appear inside a multi-word token list item
    return token
      .split(/[/,]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .some((t) => targets.has(t));
  });
}

const DAY_ORDER = DAYS_OF_WEEK as readonly string[];

/** Parse "Monday, Wednesday" / "Monday–Thursday" / "Tue" into day names. */
export function parseDaysOfWeek(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const text = String(raw).trim();
  if (!text || /^none$/i.test(text)) return [];

  const found = new Set<string>();
  const lower = text.toLowerCase();

  // Ranges: Monday–Thursday or Monday-Friday
  const range = lower.match(
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*[–—-]\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
  );
  if (range) {
    const start = capitalizeDay(range[1]);
    const end = capitalizeDay(range[2]);
    const si = DAY_ORDER.indexOf(start);
    const ei = DAY_ORDER.indexOf(end);
    if (si >= 0 && ei >= 0 && si <= ei) {
      for (let i = si; i <= ei; i++) found.add(DAY_ORDER[i]);
      return [...found];
    }
  }

  for (const day of DAY_ORDER) {
    const re = new RegExp(`\\b${day}\\b`, "i");
    if (re.test(text)) found.add(day);
  }

  // Abbreviations: Mon, Tue, Wed…
  const abbrev: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    tues: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };
  for (const [abbr, day] of Object.entries(abbrev)) {
    if (new RegExp(`\\b${abbr}\\b`, "i").test(text)) found.add(day);
  }

  return [...found];
}

function capitalizeDay(value: string): string {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function sessionRunsOnDay(
  daysRaw: string | null | undefined,
  day: string
): boolean {
  return parseDaysOfWeek(daysRaw).includes(day);
}
