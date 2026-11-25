/**
 * Canonical search taxonomy from Erica’s Categories / Subcategories lists.
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

/** Homepage results pills — Museums / Entertainment hidden for now. */
export const RESULT_PILL_CATEGORIES = [
  "Afterschool Care",
  "Arts & Creativity",
  "Learning & Enrichment",
  "Play & Exploration",
  "Sports & Movement",
  "STEM",
] as const;

/** Subcategories typically offered under each primary category (Session-21). */
export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  "Afterschool Care": [
    "Arts & Crafts",
    "Coding",
    "Dance",
    "Educational",
    "Gaming",
    "General Afterschool",
    "Gymnastics",
    "Homework Help",
    "Math",
    "Music",
    "Robotics",
    "Science",
    "Sports",
    "Technology",
    "Tutoring",
  ],
  "Arts & Creativity": [
    "Acting",
    "Arts & Crafts",
    "Ballet",
    "Ceramics",
    "Contemporary",
    "Cooking & Baking",
    "Creative Writing",
    "Dance",
    "Drama",
    "Drawing",
    "Hip-hop",
    "Jazz",
    "Music",
    "Painting",
    "Performing Arts",
    "Photography",
    "Piano",
    "Sewing",
    "Tap",
    "Theater",
    "Visual Arts",
  ],
  Entertainment: ["Movies", "Attractions"],
  "Learning & Enrichment": [
    "Chess",
    "Coding",
    "Educational",
    "Engineering",
    "Gaming",
    "Homework Help",
    "Language",
    "Math",
    "Reading",
    "Robotics",
    "Science",
    "Technology",
    "Writing",
  ],
  "Museums & Culture": ["Museums", "Cultural Experiences", "History"],
  "Play & Exploration": ["Gaming", "Indoor Play", "Outdoor Activities"],
  "Sports & Movement": [
    "Ballet",
    "Baseball",
    "Basketball",
    "Contemporary",
    "Dance",
    "Gymnastics",
    "Hip-hop",
    "Jazz",
    "Martial Arts",
    "Performing Arts",
    "Soccer",
    "Sports",
    "Swimming",
    "Tap",
    "Tennis",
    "Theater",
  ],
  STEM: [
    "Coding",
    "Educational",
    "Engineering",
    "Gaming",
    "Math",
    "Robotics",
    "Science",
    "Technology",
  ],
};

/** Updated subcategory list (Erica Lists sheet screenshots 2026-11-23). */
export const ACTIVE_SUBCATEGORIES = [
  "Academic",
  "Acting",
  "Arts & Crafts",
  "Attractions",
  "Ballet",
  "Baseball",
  "Basketball",
  "Ceramics",
  "Chess",
  "Coding",
  "Contemporary",
  "Cooking & Baking",
  "Creative Writing",
  "Cultural Experiences",
  "Dance",
  "Drama",
  "Drawing",
  "Educational",
  "Engineering",
  "Fitness",
  "Gaming",
  "General Afterschool",
  "Gymnastics",
  "Hip-hop",
  "History",
  "Homework Help",
  "Indoor Play",
  "Jazz",
  "Language",
  "Life Skills",
  "Martial Arts",
  "Math",
  "Movies",
  "Museums",
  "Music",
  "Outdoor Activities",
  "Painting",
  "Parks & Playgrounds",
  "Performing Arts",
  "Photography",
  "Piano",
  "Reading",
  "Robotics",
  "Science",
  "Sewing",
  "Soccer",
  "Sports",
  "Swimming",
  "Tap",
  "Technology",
  "Tennis",
  "Test Prep",
  "Theater",
  "Tutoring",
  "Visual Arts",
  "Writing",
  "Yoga",
] as const;

export const SUBCATEGORIES = [...ACTIVE_SUBCATEGORIES] as const;

export function subcategoriesForCategories(categories: string[]): string[] {
  if (categories.length === 0) return [...ACTIVE_SUBCATEGORIES];
  const set = new Set<string>();
  for (const cat of categories) {
    for (const sub of CATEGORY_SUBCATEGORIES[cat] ?? []) set.add(sub);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

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

/**
 * Map historical / alternate primary-category labels onto the taxonomy.
 * Keys are lowercase; lookup is case-insensitive via normalizePrimaryCategory.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  "stem & discovery": "STEM",
  "nature & outdoors": "Play & Exploration",
  "events & experiences": "Entertainment",
  "food & cooking": "Arts & Creativity",
  seasonal: "Entertainment",
  // Short / common aliases
  arts: "Arts & Creativity",
  creativity: "Arts & Creativity",
  "arts and creativity": "Arts & Creativity",
  sports: "Sports & Movement",
  movement: "Sports & Movement",
  "sports and movement": "Sports & Movement",
  play: "Play & Exploration",
  exploration: "Play & Exploration",
  "play and exploration": "Play & Exploration",
  learning: "Learning & Enrichment",
  enrichment: "Learning & Enrichment",
  "learning and enrichment": "Learning & Enrichment",
  afterschool: "Afterschool Care",
  "after school": "Afterschool Care",
  "afterschool care": "Afterschool Care",
  "after school care": "Afterschool Care",
  museums: "Museums & Culture",
  culture: "Museums & Culture",
  "museums and culture": "Museums & Culture",
  entertainment: "Entertainment",
};

/** Extra tokens in Session Subcategory that should match a taxonomy value. */
const SUBCATEGORY_ALIASES: Record<string, string[]> = {
  "Creative Writing": ["Creative Writing", "Writing", "Essay Writing"],
  Writing: ["Writing", "Creative Writing", "Essay Writing"],
  Language: ["Language", "Early Literacy", "Debate"],
  Gaming: ["Gaming", "Tabletop Role-Playing"],
  Technology: ["Technology"],
  Ballet: ["Ballet"],
  Basketball: ["Basketball"],
  Ceramics: ["Ceramics"],
  Drama: ["Drama"],
  Acting: ["Acting"],
  Tennis: ["Tennis"],
  Soccer: ["Soccer"],
  Yoga: ["Yoga"],
  Piano: ["Piano"],
  Painting: ["Painting"],
  Reading: ["Reading"],
  Sewing: ["Sewing"],
  Chess: ["Chess"],
  Academic: ["Academic"],
};

export function normalizePrimaryCategory(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const canonical = PRIMARY_CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (canonical) return canonical;
  return CATEGORY_ALIASES[lower] ?? trimmed;
}

/** Soft lavender fallback used on closed/open cards before the color map. */
export const CATEGORY_PILL_FALLBACK = {
  background: "#EDE4F5",
  color: "#6B4C8A",
} as const;

/**
 * Primary-category wash + readable text (darker same-hue / near-navy).
 * Backgrounds locked to the brand palette; text chosen for contrast.
 */
export const CATEGORY_PILL_COLORS: Record<
  string,
  { background: string; color: string }
> = {
  "Arts & Creativity": { background: "#FED8E4", color: "#9B3D5A" },
  "Sports & Movement": { background: "#FFF4C2", color: "#7A5C10" },
  STEM: { background: "#F0DFF1", color: "#6B3D7A" },
  "Play & Exploration": { background: "#DAEAAE", color: "#3F5A1F" },
  "Learning & Enrichment": { background: "#FDD9B5", color: "#8B4A28" },
  "Afterschool Care": { background: "#CDEAE7", color: "#2F6B66" },
};

/** Resolve pill wash/text for any raw Primary Category label (aliases OK). */
export function getCategoryPillStyle(
  value: string | null | undefined
): { background: string; color: string } {
  const canonical = normalizePrimaryCategory(value);
  if (canonical && CATEGORY_PILL_COLORS[canonical]) {
    return CATEGORY_PILL_COLORS[canonical];
  }
  return CATEGORY_PILL_FALLBACK;
}

/** Prefer a specific subcategory over a broad companion tag like "Sports". */
const BROAD_SUBCATEGORY_TAGS = new Set([
  "Sports",
  "Educational",
  "Performing Arts",
]);

export function displaySubcategory(
  raw: string | null | undefined
): string | null {
  const tokens = splitSubcategories(raw);
  if (tokens.length === 0) return null;
  const specific = tokens.find((t) => !BROAD_SUBCATEGORY_TAGS.has(t));
  return specific ?? tokens[0];
}

/** Split multi-tag subcategory strings ("Swimming, Sports"). */
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

/** Compact day span for cards: "Tuesday–Friday" or "Mon, Wed". */
export function formatDayRange(days: string[]): string | null {
  if (days.length === 0) return null;
  const ordered = DAY_ORDER.filter((d) => days.includes(d));
  if (ordered.length === 0) return null;
  if (ordered.length === 1) return ordered[0];
  const indexes = ordered.map((d) => DAY_ORDER.indexOf(d));
  const contiguous = indexes.every(
    (idx, i) => i === 0 || idx === indexes[i - 1] + 1
  );
  if (contiguous) return `${ordered[0]}–${ordered[ordered.length - 1]}`;
  return ordered.join(", ");
}
