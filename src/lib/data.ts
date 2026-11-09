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

export const getOrganizations = (): Organization[] =>
  organizations as unknown as Organization[];
export const getLocations = (): Location[] => locations as unknown as Location[];
export const getActivities = (): Activity[] => activities as unknown as Activity[];
export const getSessions = (): Session[] => sessions as unknown as Session[];
export const getIncomingActivities = (): IncomingActivity[] =>
  incoming as unknown as IncomingActivity[];

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

export function filterActivities(
  activities: EnrichedActivity[],
  filters: Partial<FilterState>
): EnrichedActivity[] {
  return activities.filter((activity) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const name = activity["Activity Name"]?.toLowerCase() ?? "";
      const desc = activity["Description"]?.toLowerCase() ?? "";
      const org = activity.organization?.["Organization Name"]?.toLowerCase() ?? "";
      if (!name.includes(q) && !desc.includes(q) && !org.includes(q)) return false;
    }

    if (filters.category && filters.category !== "all") {
      const cat = activity["Primary Category"];
      if (cat !== filters.category) return false;
    }

    if (filters.neighborhood && filters.neighborhood !== "all") {
      const loc = activity.location;
      if (loc?.["Neighborhood"] !== filters.neighborhood) return false;
    }

    if (filters.ageMin !== null && filters.ageMin !== undefined) {
      const ageMax = activity["Age Maximum"];
      if (ageMax !== null && ageMax < filters.ageMin) return false;
    }

    if (filters.ageMax !== null && filters.ageMax !== undefined) {
      const ageMin = activity["Age Minimum"];
      if (ageMin !== null && ageMin > filters.ageMax) return false;
    }

    if (filters.activityType && filters.activityType !== "all") {
      if (activity["Activity Type"] !== filters.activityType) return false;
    }

    if (filters.schedulePattern && filters.schedulePattern !== "all") {
      if (activity["Schedule Pattern"] !== filters.schedulePattern) return false;
    }

    return true;
  });
}

export function formatAgeRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return "All ages";
  if (min === null) return `Up to ${max}`;
  if (max === null) return `${min}+`;
  if (min === 0) return `Up to age ${max}`;
  return `Ages ${min}–${max}`;
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
