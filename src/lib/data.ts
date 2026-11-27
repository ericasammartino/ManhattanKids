import organizations from "@/data/organizations.json";
import locations from "@/data/locations.json";
import activities from "@/data/activities.json";
import sessions from "@/data/sessions.json";
import incoming from "@/data/incoming.json";
import { logoForOrganization } from "@/data/org-logos";
import type {
  Organization,
  Location,
  Activity,
  Session,
  IncomingActivity,
  EnrichedActivity,
} from "@/types";
import {
  PRIMARY_CATEGORIES,
  SUBCATEGORIES,
  DAYS_OF_WEEK,
  MONTHS_OF_YEAR,
  normalizePrimaryCategory,
  normalizeMonth,
  activityMatchesSubcategory,
  sessionRunsOnDay,
  splitSubcategories,
  CATEGORY_PILL_FALLBACK,
  getCategoryPillStyle,
} from "@/lib/taxonomy";
import { parseMonthsFromText, sessionRunsInMonth } from "@/lib/session-display";
import { locationBandIdFromCrossStreets } from "@/lib/location-bands";

/** Match category filter against single or multi-tag Primary Category values. */
function activityMatchesCategory(
  raw: string | null | undefined,
  selected: string
): boolean {
  const tokens = splitSubcategories(raw)
    .map((t) => normalizePrimaryCategory(t))
    .filter((t): t is string => Boolean(t));
  if (tokens.length === 0) {
    const whole = normalizePrimaryCategory(raw);
    return whole === selected;
  }
  return tokens.includes(selected);
}

/** Infer neighborhood when the spreadsheet left it blank (common after Sheets sync). */
const ZIP_TO_NEIGHBORHOOD: Record<string, string> = {
  "10023": "Upper West Side",
  "10024": "Upper West Side",
  "10025": "Upper West Side",
  "10069": "Upper West Side",
  "10021": "Upper East Side",
  "10028": "Upper East Side",
  "10065": "Upper East Side",
  "10075": "Upper East Side",
  "10128": "Upper East Side",
  "10019": "Midtown",
  "10022": "Midtown",
  "10036": "Midtown",
  "10001": "Chelsea",
  "10011": "Chelsea",
  "10003": "East Village",
  "10009": "East Village",
  "10012": "SoHo",
  "10013": "Tribeca",
  "10014": "Greenwich Village",
  "10026": "Harlem",
  "10027": "Harlem",
  "10029": "Harlem",
  "10030": "Harlem",
  "10031": "Harlem",
  "10032": "Washington Heights",
  "10033": "Washington Heights",
  "10034": "Washington Heights",
  "10040": "Washington Heights",
  "10004": "Financial District",
  "10005": "Financial District",
  "10006": "Financial District",
  "10007": "Financial District",
  "10038": "Financial District",
  "10280": "Battery Park City",
  "10002": "Chinatown",
};

function nonempty(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

/** Providers known to be UWS when the spreadsheet omits zip/address. */
const KNOWN_UWS_ORG_NAMES = [
  "discovery programs",
  "funfit kids",
  "central park tennis center",
  "nyc elite gymnastics",
  "robofun",
  "zplayschool",
  "supermud pottery",
  "bloomingdale library",
  "riverside library",
  "goddard riverside",
  "strycker",
  "children’s aid",
  "children's aid",
  "west side ymca",
  "elliott’s classes",
  "elliott's classes",
  "tim morehouse",
  "writopia",
  "marlene meyerson",
];

/** Infer UWS from street address text when zip is missing. */
function neighborhoodFromAddress(address: string): string | null {
  const a = address.toLowerCase();

  // Explicit zip anywhere in the string
  const zipMatch = a.match(/\b(100\d{2})\b/);
  if (zipMatch && ZIP_TO_NEIGHBORHOOD[zipMatch[1]]) {
    return ZIP_TO_NEIGHBORHOOD[zipMatch[1]];
  }

  // Classic UWS corridors
  if (
    /\bwest end ave/.test(a) ||
    /\briverside (blvd|drive|dr)\b/.test(a) ||
    /\bamsterdam ave/.test(a) ||
    /\bcolumbus ave/.test(a) ||
    /\bcentral park west\b/.test(a) ||
    /\bcpw\b/.test(a)
  ) {
    return "Upper West Side";
  }

  // West ## Street / W ## St in the UWS band (roughly 59–110)
  const westSt = a.match(/\b(?:w|west)\s*(\d{1,3})(?:st|nd|rd|th)?\s*(?:st|street)?\b/);
  if (westSt) {
    const n = Number(westSt[1]);
    if (n >= 59 && n <= 110) return "Upper West Side";
  }

  // Bare "##th Street" with Broadway / west-side context
  if (/\bbroadway\b/.test(a)) {
    const st = a.match(/\b(\d{2,3})(?:st|nd|rd|th)?\s*(?:st|street)\b/);
    if (st) {
      const n = Number(st[1]);
      if (n >= 59 && n <= 110) return "Upper West Side";
    }
    // Broadway alone with no street — often UWS in this dataset
    if (!/\beast\b/.test(a)) return "Upper West Side";
  }

  return null;
}

export function resolveNeighborhood(location?: Location | null): string | null {
  if (!location) return null;
  const explicit = nonempty(location["Neighborhood"]);
  if (explicit) return explicit;

  const zip = nonempty(location["Zip Code"]);
  if (zip && ZIP_TO_NEIGHBORHOOD[zip]) return ZIP_TO_NEIGHBORHOOD[zip];

  const address = nonempty(location["Street Address"]);
  if (address) {
    const fromAddr = neighborhoodFromAddress(address);
    if (fromAddr) return fromAddr;
  }

  const name = nonempty(location["Location Name"])?.toLowerCase() ?? "";
  if (name.includes("upper west")) return "Upper West Side";
  if (name.includes("upper east")) return "Upper East Side";
  if (KNOWN_UWS_ORG_NAMES.some((n) => name.includes(n))) {
    return "Upper West Side";
  }

  return null;
}

function withResolvedNeighborhood(location: Location): Location {
  const neighborhood = resolveNeighborhood(location);
  const borough =
    nonempty(location["Borough"]) ??
    (neighborhood ? "Manhattan" : null);
  return {
    ...location,
    Neighborhood: neighborhood,
    Borough: borough,
  };
}

function withOrgLogo(org: Organization): Organization {
  const mapped = logoForOrganization(org["Organization Name"]);
  const existing = nonempty(org["Logo URL"]);
  // Prefer curated local logos so asset refreshes win over stale JSON paths.
  return {
    ...org,
    "Logo URL": mapped ?? existing,
  };
}

export const getOrganizations = (): Organization[] =>
  (organizations as unknown as Organization[]).map(withOrgLogo);
export const getLocations = (): Location[] =>
  (locations as unknown as Location[]).map(withResolvedNeighborhood);
export const getActivities = (): Activity[] => activities as unknown as Activity[];
export const getSessions = (): Session[] => sessions as unknown as Session[];
export const getIncomingActivities = (): IncomingActivity[] =>
  incoming as unknown as IncomingActivity[];

export const PLACEHOLDER_IMAGES: Record<string, string> = {
  "Afterschool Care":
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
  "Arts & Creativity":
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop",
  "Sports & Movement":
    "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&h=300&fit=crop",
  STEM:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
  "STEM & Discovery":
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
  "Museums & Culture":
    "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop",
  "Learning & Enrichment":
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
  Entertainment:
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop",
  "Play & Exploration":
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
  "Nature & Outdoors":
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
  default:
    "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop",
};

/** Prefer activity photo, then org logo; otherwise org-name text (no invented logos). */
export function resolveActivityImage(activity: EnrichedActivity): {
  src: string | null;
  isLogo: boolean;
  /** When set, render this org name instead of an image. */
  textFallback: string | null;
} {
  const activityImg = nonempty(activity["Image URL"]);
  if (activityImg) {
    return { src: activityImg, isLogo: false, textFallback: null };
  }

  const orgName = nonempty(activity.organization?.["Organization Name"]);
  const logo =
    nonempty(activity.organization?.["Logo URL"]) ??
    logoForOrganization(orgName);
  if (logo) return { src: logo, isLogo: true, textFallback: null };

  if (orgName) {
    return { src: null, isLogo: false, textFallback: orgName };
  }

  const category =
    normalizePrimaryCategory(activity["Primary Category"]) ?? "default";
  return {
    src: PLACEHOLDER_IMAGES[category] ?? PLACEHOLDER_IMAGES.default,
    isLogo: false,
    textFallback: null,
  };
}

/** Normalize punctuation so “Elliott’s” matches “elliott's” / “elliotts”. */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019\u201A\u2032`']/g, "")
    .replace(/[\u201C\u201D\u201E"]/g, "")
    .replace(/[\u2013\u2014—–-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearchText(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

/** Light edit distance for near-miss tokens (elliots ≈ elliotts). */
function editDistanceAtMost(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  if (a === b) return true;
  const m = a.length;
  const n = b.length;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return false;
    [prev, curr] = [curr, prev];
  }
  return prev[n] <= max;
}

function tokenFuzzyMatch(token: string, haystack: string): boolean {
  if (!token) return true;
  if (haystack.includes(token)) return true;
  // Near-miss only for longer tokens so short noise ("y", "a") stays strict.
  if (token.length < 4) return false;
  const words = haystack.split(/\s+/).filter(Boolean);
  const max = token.length >= 8 ? 2 : 1;
  return words.some(
    (word) =>
      Math.abs(word.length - token.length) <= max &&
      editDistanceAtMost(token, word, max)
  );
}

function activitySearchText(activity: EnrichedActivity): string {
  const parts = [
    activity["Activity Name"],
    activity["Description"],
    activity["Primary Category"],
    activity["Subcategory"],
    activity["Secondary Categories"],
    activity["Activity Type"],
    activity["Seasonal Tags"],
    activity["Default Location Name"],
    activity["Notes"],
    // Provider / org names are first-class search targets (not just class titles).
    activity.organization?.["Organization Name"],
    activity.organization?.["Organization Type"],
    activity.organization?.["Description"],
    activity.location?.["Location Name"],
    activity.location?.["Neighborhood"],
    activity.location?.["Street Address"],
    activity.location?.["Zip Code"],
    activity.location?.["Description"],
  ];
  return normalizeSearchText(
    parts
      .map((p) => nonempty(p) ?? "")
      .filter(Boolean)
      .join(" ")
  );
}

function organizationSearchText(activity: EnrichedActivity): string {
  return normalizeSearchText(
    [
      activity.organization?.["Organization Name"],
      activity["Default Location Name"],
      activity.location?.["Location Name"],
    ]
      .map((p) => nonempty(p) ?? "")
      .filter(Boolean)
      .join(" ")
  );
}

/**
 * Match title + org/provider names.
 * Supports substring, compacted near-misses ("westside" → "west side"),
 * and light fuzzy token matching so org near-misses still hit.
 */
export function matchesSearch(activity: EnrichedActivity, query: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;

  const haystack = activitySearchText(activity);
  const orgText = organizationSearchText(activity);
  const title = normalizeSearchText(activity["Activity Name"] ?? "");
  const compactQ = compactSearchText(query);
  const compactOrg = compactSearchText(
    [
      activity.organization?.["Organization Name"],
      activity["Default Location Name"],
      activity.location?.["Location Name"],
    ]
      .map((p) => nonempty(p) ?? "")
      .filter(Boolean)
      .join(" ")
  );
  const compactTitle = compactSearchText(activity["Activity Name"] ?? "");
  const compactHay = compactSearchText(haystack);

  // Phrase / substring hits (org first, then title, then full haystack).
  if (orgText.includes(q) || title.includes(q) || haystack.includes(q)) {
    return true;
  }
  if (
    compactQ.length >= 3 &&
    (compactOrg.includes(compactQ) ||
      compactTitle.includes(compactQ) ||
      compactHay.includes(compactQ))
  ) {
    return true;
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  // Prefer org-name token match so provider queries don't require title hits.
  if (orgText && tokens.every((token) => tokenFuzzyMatch(token, orgText))) {
    return true;
  }
  return tokens.every((token) => tokenFuzzyMatch(token, haystack));
}

export const AFTERSCHOOL_ACTIVITY_TYPE = "Afterschool Program";

export function isAfterschoolProgram(
  activity: Activity | EnrichedActivity
): boolean {
  return nonempty(activity["Activity Type"]) === AFTERSCHOOL_ACTIVITY_TYPE;
}

export function getEnrichedActivities(): EnrichedActivity[] {
  const orgs = getOrganizations();
  const locs = getLocations();
  const sess = getSessions();
  const acts = getActivities();

  return acts.map((activity) => {
    const organization = orgs.find(
      (o) => o["Organization ID"] === activity["Organization ID"]
    );
    const location = locs.find(
      (l) => l["Location ID"] === activity["Default Location ID"]
    );
    const actSessions = sess.filter(
      (s) => s["Activity ID"] === activity["Activity ID"]
    );

    return {
      ...activity,
      organization,
      location,
      sessions: actSessions,
    };
  });
}

/** Afterschool-only list for the dedicated Afterschool tab. */
export function getAfterschoolPrograms(): EnrichedActivity[] {
  return getEnrichedActivities().filter(isAfterschoolProgram);
}

export function getActivityById(id: string): EnrichedActivity | undefined {
  return getEnrichedActivities().find((a) => a["Activity ID"] === id);
}

export const CATEGORIES = [...PRIMARY_CATEGORIES];
export const SUBCATEGORY_OPTIONS = [...SUBCATEGORIES];
export const DAY_OPTIONS = [...DAYS_OF_WEEK];
export const MONTH_OPTIONS = [...MONTHS_OF_YEAR];

/**
 * Tailwind class pairs for legacy call sites. Prefer getCategoryPillStyle()
 * (inline styles) so arbitrary hex washes are never purged by Tailwind JIT.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  "Arts & Creativity": "bg-[#FED8E4] text-[#9B3D5A]",
  "Sports & Movement": "bg-[#FFF4C2] text-[#7A5C10]",
  STEM: "bg-[#F0DFF1] text-[#6B3D7A]",
  "Play & Exploration": "bg-[#DAEAAE] text-[#3F5A1F]",
  "Learning & Enrichment": "bg-[#FDD9B5] text-[#8B4A28]",
  "Afterschool Care": "bg-[#CDEAE7] text-[#2F6B66]",
  Entertainment: "bg-[#EDE4F5] text-[#6B4C8A]",
  "Museums & Culture": "bg-[#EDE4F5] text-[#6B4C8A]",
};

export { getCategoryPillStyle, CATEGORY_PILL_FALLBACK };

export const CATEGORY_ICONS: Record<string, string> = {
  "Afterschool Care": "🏫",
  "Arts & Creativity": "🎨",
  Entertainment: "🎭",
  "Learning & Enrichment": "📚",
  "Museums & Culture": "🏛️",
  "Play & Exploration": "🌿",
  "Sports & Movement": "⚽",
  STEM: "🔬",
};

export const NEIGHBORHOODS = [
  "Upper West Side",
  "Upper East Side",
  "Midtown",
  "Lower Manhattan",
  "Chelsea",
  "Greenwich Village",
  "East Village",
  "Harlem",
  "Washington Heights",
  "Tribeca",
  "SoHo",
  "Battery Park City",
  "Chinatown",
  "Financial District",
];

export type FilterState = {
  search: string;
  category: string;
  subcategory: string;
  neighborhood: string;
  /** UWS cross-street band id (e.g. "70-79") or "all". */
  locationBand: string;
  categories?: string[];
  subcategories?: string[];
  locationBands?: string[];
  days?: string[];
  months?: string[];
  ages?: number[];
  activityTypes?: string[];
  schedulePatterns?: string[];
  /** Child's age — program must include this age in [min, max] inclusive. */
  age: number | null;
  ageMin: number | null;
  ageMax: number | null;
  activityType: string;
  schedulePattern: string;
  day: string;
  month: string;
};

function asAge(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Effective age bounds: activity fields, else any session overrides. */
function activityAgeBounds(activity: EnrichedActivity): {
  min: number | null;
  max: number | null;
} {
  let min = asAge(activity["Age Minimum"]);
  let max = asAge(activity["Age Maximum"]);
  if (min !== null || max !== null) return { min, max };

  for (const session of activity.sessions ?? []) {
    const sMin = asAge(session["Minimum Age Override"]);
    const sMax = asAge(session["Maximum Age Override"]);
    if (sMin !== null) min = min === null ? sMin : Math.min(min, sMin);
    if (sMax !== null) max = max === null ? sMax : Math.max(max, sMax);
  }
  return { min, max };
}

function activityMatchesAge(
  activity: EnrichedActivity,
  age: number
): boolean {
  const { min, max } = activityAgeBounds(activity);
  if (min === null && max === null) return false;
  if (min !== null && age < min) return false;
  if (max !== null && age > max) return false;
  return true;
}

function activityRunsOnDay(
  activity: EnrichedActivity,
  day: string
): boolean {
  const sessions = activity.sessions ?? [];
  if (sessions.length === 0) return false;
  return sessions.some((s) => sessionRunsOnDay(s["Days of the Week"], day));
}

function activityRunsInMonth(
  activity: EnrichedActivity,
  month: string
): boolean {
  const canonical = normalizeMonth(month);
  if (!canonical) return false;
  const sessions = activity.sessions ?? [];
  if (sessions.some((s) => sessionRunsInMonth(s, canonical))) {
    return true;
  }
  return parseMonthsFromText(activity["Seasonal Tags"]).includes(canonical);
}

export function filterActivities(
  activities: EnrichedActivity[],
  filters: Partial<FilterState>
): EnrichedActivity[] {
  return activities.filter((activity) => {
    if (filters.search && !matchesSearch(activity, filters.search)) {
      return false;
    }

    const categories =
      filters.categories && filters.categories.length > 0
        ? filters.categories
        : filters.category && filters.category !== "all"
          ? [filters.category]
          : [];
    if (categories.length > 0) {
      const match = categories.some((c) =>
        activityMatchesCategory(activity["Primary Category"], c)
      );
      if (!match) return false;
    }

    const subcategories =
      filters.subcategories && filters.subcategories.length > 0
        ? filters.subcategories
        : filters.subcategory && filters.subcategory !== "all"
          ? [filters.subcategory]
          : [];
    if (subcategories.length > 0) {
      const match = subcategories.some((s) =>
        activityMatchesSubcategory(activity["Subcategory"], s)
      );
      if (!match) return false;
    }

    if (filters.neighborhood && filters.neighborhood !== "all") {
      const neighborhood =
        resolveNeighborhood(activity.location) ??
        nonempty(activity.location?.["Neighborhood"]);
      if (neighborhood !== filters.neighborhood) return false;
    }

    const locationBands =
      filters.locationBands && filters.locationBands.length > 0
        ? filters.locationBands
        : filters.locationBand && filters.locationBand !== "all"
          ? [filters.locationBand]
          : [];
    if (locationBands.length > 0) {
      const band = locationBandIdFromCrossStreets(
        activity.location?.["Cross Streets"]
      );
      if (!band || !locationBands.includes(band)) return false;
    }

    const ages =
      filters.ages && filters.ages.length > 0
        ? filters.ages
        : filters.age !== null && filters.age !== undefined
          ? [filters.age]
          : filters.ageMin !== null &&
              filters.ageMin !== undefined &&
              (filters.ageMax === null || filters.ageMax === undefined)
            ? [filters.ageMin]
            : [];

    if (ages.length > 0) {
      if (!ages.some((a) => activityMatchesAge(activity, a))) return false;
    } else {
      // Legacy range overlap (homepage used to send ageMin+ageMax buckets).
      if (filters.ageMin !== null && filters.ageMin !== undefined) {
        const { max } = activityAgeBounds(activity);
        if (max !== null && max < filters.ageMin) return false;
      }
      if (filters.ageMax !== null && filters.ageMax !== undefined) {
        const { min } = activityAgeBounds(activity);
        if (min !== null && min > filters.ageMax) return false;
      }
    }

    const activityTypes =
      filters.activityTypes && filters.activityTypes.length > 0
        ? filters.activityTypes
        : filters.activityType && filters.activityType !== "all"
          ? [filters.activityType]
          : [];
    if (activityTypes.length > 0) {
      const type = nonempty(activity["Activity Type"]);
      if (!type || !activityTypes.includes(type)) return false;
    }

    const schedulePatterns =
      filters.schedulePatterns && filters.schedulePatterns.length > 0
        ? filters.schedulePatterns
        : filters.schedulePattern && filters.schedulePattern !== "all"
          ? [filters.schedulePattern]
          : [];
    if (schedulePatterns.length > 0) {
      const pattern = nonempty(activity["Schedule Pattern"]);
      if (!pattern || !schedulePatterns.includes(pattern)) return false;
    }

    const days =
      filters.days && filters.days.length > 0
        ? filters.days
        : filters.day && filters.day !== "all"
          ? [filters.day]
          : [];
    if (days.length > 0) {
      if (!days.some((d) => activityRunsOnDay(activity, d))) return false;
    }

    const months =
      filters.months && filters.months.length > 0
        ? filters.months
        : filters.month && filters.month !== "all"
          ? [filters.month]
          : [];
    if (months.length > 0) {
      if (!months.some((m) => activityRunsInMonth(activity, m))) return false;
    }

    return true;
  });
}

export function formatAgeRange(min: number | null, max: number | null): string {
  const ageMin = asAge(min);
  const ageMax = asAge(max);
  if (ageMin === null && ageMax === null) return "All ages";
  if (ageMin === null) return `Up to ${ageMax}`;
  if (ageMax === null) return `${ageMin}+`;
  if (ageMin === 0) return `Up to age ${ageMax}`;
  return `Ages ${ageMin}–${ageMax}`;
}

export function formatTime(time: string | null): string {
  if (!time) return "";
  const trimmed = String(time).trim();
  // Keep free-text times like "School dismissal" as-is.
  if (!/^\d{1,2}:\d{2}(\s*[AaPp][Mm])?$/.test(trimmed)) return trimmed;
  const [hRaw, mRaw] = trimmed.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw.replace(/\D/g, ""));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return trimmed;
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0
    ? `${hour}${ampm}`
    : `${hour}:${m.toString().padStart(2, "0")}${ampm}`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
