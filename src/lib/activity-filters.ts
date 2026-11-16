export type ActivityFilters = {
  search: string;
  category: string;
  neighborhood: string;
  activityType: string;
  schedulePattern: string;
  ageMin: number | null;
  ageMax: number | null;
};

function first(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
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
      : (options.defaultNeighborhood ?? "Upper West Side"));

  const ageMinRaw = first(searchParams.ageMin);
  const ageMaxRaw = first(searchParams.ageMax);

  return {
    search,
    category: first(searchParams.category) ?? "all",
    neighborhood,
    activityType: first(searchParams.type) ?? defaultType,
    schedulePattern: first(searchParams.schedule) ?? "all",
    ageMin: ageMinRaw ? parseInt(ageMinRaw, 10) : null,
    ageMax: ageMaxRaw ? parseInt(ageMaxRaw, 10) : null,
  };
}
