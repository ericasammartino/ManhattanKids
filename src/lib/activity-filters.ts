export type ActivityFilters = {
  search: string;
  /** Empty array means all categories. */
  categories: string[];
  subcategories: string[];
  neighborhood: string;
  /** UWS cross-street band ids; empty = Entire UWS. */
  locationBands: string[];
  activityTypes: string[];
  schedulePatterns: string[];
  /** Selected ages; empty = all ages. */
  ages: number[];
  days: string[];
  /** @deprecated Prefer `ages`. */
  age: number | null;
  ageMin: number | null;
  ageMax: number | null;
  /** Legacy single-value mirrors for older callers. */
  category: string;
  subcategory: string;
  locationBand: string;
  activityType: string;
  schedulePattern: string;
  day: string;
};

function first(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseList(raw: string | string[] | undefined): string[] {
  if (Array.isArray(raw)) {
    return raw
      .flatMap((v) => String(v).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseAge(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function parseAges(raw: string | string[] | undefined): number[] {
  return parseList(raw)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n));
}

export function resolveActivityFilters(
  searchParams: Record<string, string | string[] | undefined>,
  options: { defaultType?: string; defaultNeighborhood?: string } = {}
): ActivityFilters {
  const defaultType = options.defaultType ?? "all";
  const search = first(searchParams.search)?.trim() ?? "";
  const fromUrlNeighborhood = first(searchParams.neighborhood);
  const neighborhood =
    fromUrlNeighborhood ??
    (search
      ? "all"
      : (options.defaultNeighborhood ?? "all"));

  const categories = parseList(searchParams.category).filter((c) => c !== "all");
  const subcategories = parseList(searchParams.subcategory).filter(
    (s) => s !== "all"
  );
  const days = parseList(searchParams.day).filter((d) => d !== "all");
  const locationBands = parseList(searchParams.location).filter(
    (l) => l !== "all"
  );
  const ages: number[] = parseAges(searchParams.age);

  let activityTypes = parseList(searchParams.type).filter((t) => t !== "all");
  if (activityTypes.length === 0 && defaultType !== "all") {
    activityTypes = [defaultType];
  }
  const schedulePatterns = parseList(searchParams.schedule).filter(
    (s) => s !== "all"
  );

  const ageRaw = first(searchParams.age);
  const ageMinRaw = first(searchParams.ageMin);
  const ageMaxRaw = first(searchParams.ageMax);

  let age = ages.length === 1 ? ages[0] : parseAge(ageRaw);
  const ageMin = parseAge(ageMinRaw);
  const ageMax = parseAge(ageMaxRaw);
  if (age === null && ageMin !== null && ageMax === null) {
    age = ageMin;
  }
  if (ages.length === 0 && age !== null) {
    ages.push(age);
  }

  return {
    search,
    categories,
    subcategories,
    neighborhood,
    locationBands,
    activityTypes,
    schedulePatterns,
    ages,
    days,
    age,
    ageMin,
    ageMax,
    category: categories[0] ?? "all",
    subcategory: subcategories[0] ?? "all",
    locationBand: locationBands[0] ?? "all",
    activityType: activityTypes[0] ?? defaultType,
    schedulePattern: schedulePatterns[0] ?? "all",
    day: days[0] ?? "all",
  };
}

export function encodeFilterList(values: string[]): string | null {
  const cleaned = values.filter(Boolean);
  return cleaned.length ? cleaned.join(",") : null;
}
