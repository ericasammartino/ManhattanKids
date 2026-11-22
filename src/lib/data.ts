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
  normalizePrimaryCategory,
  activityMatchesSubcategory,
  sessionRunsOnDay,
  splitSubcategories,
} from "@/lib/taxonomy";
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

/** Prefer activity photo, then org logo, then category placeholder. */
export function resolveActivityImage(activity: EnrichedActivity): {
  src: string;
  isLogo: boolean;
} {
  const activityImg = nonempty(activity["Image URL"]);
  if (activityImg) return { src: activityImg, isLogo: false };

  const logo =
    nonempty(activity.organization?.["Logo URL"]) ??
    logoForOrganization(activity.organization?.["Organization Name"]);
  if (logo) return { src: logo, isLogo: true };

  const category =
    normalizePrimaryCategory(activity["Primary Category"]) ?? "default";
  return {
    src: PLACEHOLDER_IMAGES[category] ?? PLACEHOLDER_IMAGES.default,
    isLogo: false,
  };
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
    activity.organization?.["Organization Name"],
    activity.organization?.["Organization Type"],
    activity.organization?.["Description"],
    activity.location?.["Location Name"],
    activity.location?.["Neighborhood"],
    activity.location?.["Street Address"],
    activity.location?.["Zip Code"],
    activity.location?.["Description"],
  ];
  return parts
    .map((p) => nonempty(p) ?? "")
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Every whitespace-separated token must appear somewhere in the searchable text. */
export function matchesSearch(activity: EnrichedActivity, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = activitySearchText(activity);
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
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

export const CATEGORY_COLORS: Record<string, string> = {
  "Afterschool Care": "bg-sky-200 text-sky-800",
  "Arts & Creativity": "bg-rose-200 text-rose-800",
  Entertainment: "bg-purple-200 text-purple-800",
  "Learning & Enrichment": "bg-blue-200 text-blue-800",
  "Museums & Culture": "bg-teal-200 text-teal-800",
  "Play & Exploration": "bg-lime-200 text-lime-800",
  "Sports & Movement": "bg-yellow-200 text-yellow-800",
  STEM: "bg-violet-200 text-violet-800",
};

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
