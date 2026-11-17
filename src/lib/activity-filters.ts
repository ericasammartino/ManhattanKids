export type ActivityFilters = {
  search: string;
  category: string;
  subcategory: string;
  neighborhood: string;
  activityType: string;
  schedulePattern: string;
  /** Child's age — program min/max must include this age. */
  age: number | null;
  /** @deprecated Prefer `age`; kept for legacy URLs / range overlap. */
  ageMin: number | null;
  ageMax: number | null;
  day: string;
};

function first(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseAge(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
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

  const ageRaw = first(searchParams.age);
  const ageMinRaw = first(searchParams.ageMin);
  const ageMaxRaw = first(searchParams.ageMax);

  // Single `age` wins. If only ageMin is present (no ageMax), treat as child's age.
  let age = parseAge(ageRaw);
  const ageMin = parseAge(ageMinRaw);
  const ageMax = parseAge(ageMaxRaw);
  if (age === null && ageMin !== null && ageMax === null) {
    age = ageMin;
  }

  return {
    search,
    category: first(searchParams.category) ?? "all",
    subcategory: first(searchParams.subcategory) ?? "all",
    neighborhood,
    activityType: first(searchParams.type) ?? defaultType,
    schedulePattern: first(searchParams.schedule) ?? "all",
    age,
    ageMin,
    ageMax,
    day: first(searchParams.day) ?? "all",
  };
}
