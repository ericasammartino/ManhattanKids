import organizations from "@/data/organizations.json";
import locations from "@/data/locations.json";
import activities from "@/data/activities.json";
import sessions from "@/data/sessions.json";
import incoming from "@/data/incoming.json";
import type {
  Organization,
  Location,
  Activity,
  Session,
  IncomingActivity,
  EnrichedActivity,
} from "@/types";

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

export function resolveNeighborhood(location?: Location | null): string | null {
  if (!location) return null;
  const explicit = nonempty(location["Neighborhood"]);
  if (explicit) return explicit;

  const zip = nonempty(location["Zip Code"]);
  if (zip && ZIP_TO_NEIGHBORHOOD[zip]) return ZIP_TO_NEIGHBORHOOD[zip];

  const name = nonempty(location["Location Name"])?.toLowerCase() ?? "";
  if (name.includes("upper west")) return "Upper West Side";
  if (name.includes("upper east")) return "Upper East Side";

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

export const getOrganizations = (): Organization[] =>
  organizations as unknown as Organization[];
export const getLocations = (): Location[] =>
  (locations as unknown as Location[]).map(withResolvedNeighborhood);
export const getActivities = (): Activity[] => activities as unknown as Activity[];
export const getSessions = (): Session[] => sessions as unknown as Session[];
export const getIncomingActivities = (): IncomingActivity[] =>
  incoming as unknown as IncomingActivity[];

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

export const CATEGORIES = [
  "Arts & Creativity",
  "Entertainment",
  "Learning & Enrichment",
  "Sports & Movement",
  "STEM & Discovery",
  "Museums & Culture",
  "Events & Experiences",
  "Nature & Outdoors",
  "Food & Cooking",
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Arts & Creativity": "bg-rose-200 text-rose-800",
  "Entertainment": "bg-purple-200 text-purple-800",
  "Learning & Enrichment": "bg-blue-200 text-blue-800",
  "Sports & Movement": "bg-yellow-200 text-yellow-800",
  "STEM & Discovery": "bg-violet-200 text-violet-800",
  "Museums & Culture": "bg-teal-200 text-teal-800",
  "Events & Experiences": "bg-green-200 text-green-800",
  "Nature & Outdoors": "bg-lime-200 text-lime-800",
  "Food & Cooking": "bg-orange-200 text-orange-800",
};

export const CATEGORY_ICONS: Record<string, string> = {
  "Arts & Creativity": "🎨",
  "Entertainment": "🎭",
  "Learning & Enrichment": "📚",
  "Sports & Movement": "⚽",
  "STEM & Discovery": "🔬",
  "Museums & Culture": "🏛️",
  "Events & Experiences": "🎪",
  "Nature & Outdoors": "🌿",
  "Food & Cooking": "🍳",
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
  neighborhood: string;
  ageMin: number | null;
  ageMax: number | null;
  activityType: string;
  schedulePattern: string;
};

function asAge(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function filterActivities(
  activities: EnrichedActivity[],
  filters: Partial<FilterState>
): EnrichedActivity[] {
  return activities.filter((activity) => {
    if (filters.search && !matchesSearch(activity, filters.search)) {
      return false;
    }

    if (filters.category && filters.category !== "all") {
      const cat = nonempty(activity["Primary Category"]);
      if (cat !== filters.category) return false;
    }

    if (filters.neighborhood && filters.neighborhood !== "all") {
      const neighborhood =
        resolveNeighborhood(activity.location) ??
        nonempty(activity.location?.["Neighborhood"]);
      if (neighborhood !== filters.neighborhood) return false;
    }

    if (filters.ageMin !== null && filters.ageMin !== undefined) {
      const ageMax = asAge(activity["Age Maximum"]);
      if (ageMax !== null && ageMax < filters.ageMin) return false;
    }

    if (filters.ageMax !== null && filters.ageMax !== undefined) {
      const ageMin = asAge(activity["Age Minimum"]);
      if (ageMin !== null && ageMin > filters.ageMax) return false;
    }

    if (filters.activityType && filters.activityType !== "all") {
      if (nonempty(activity["Activity Type"]) !== filters.activityType) return false;
    }

    if (filters.schedulePattern && filters.schedulePattern !== "all") {
      if (nonempty(activity["Schedule Pattern"]) !== filters.schedulePattern)
        return false;
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
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${m.toString().padStart(2, "0")}${ampm}`;
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
