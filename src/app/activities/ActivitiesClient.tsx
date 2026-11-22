"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { EnrichedActivity } from "@/types";
import {
  filterActivities,
  CATEGORIES,
  SUBCATEGORY_OPTIONS,
  DAY_OPTIONS,
} from "@/lib/data";
import {
  resolveActivityFilters,
  type ActivityFilters,
} from "@/lib/activity-filters";
import { LOCATION_BANDS } from "@/lib/location-bands";
import ActivityCard from "@/components/ActivityCard";
import GroupedActivityCard from "@/components/GroupedActivityCard";
import { Search, SlidersHorizontal, X } from "lucide-react";

const ACTIVITY_TYPES = [
  "Class",
  "Camp",
  "Event",
  "Drop-in",
  "Afterschool Program",
  "Workshop",
  "Performance",
  "Tour",
  "Playdate",
];

const SCHEDULE_PATTERNS = [
  "One-time",
  "Recurring Weekly",
  "Recurring Monthly",
  "Daily",
  "Weekend",
];

const AGE_SELECT_OPTIONS = Array.from({ length: 19 }, (_, age) => age);

interface Props {
  activities: EnrichedActivity[];
  title?: string;
  subtitle?: string;
  defaultType?: string;
  /** When unset, neighborhood defaults to Upper West Side (browse-all pages). */
  defaultNeighborhood?: string;
  emptyLabel?: string;
  /** Group multi-session classes into expandable class-time cards. */
  groupedCards?: boolean;
  /** Filters resolved on the server from the URL so first paint matches the query. */
  initialFilters: ActivityFilters;
}

function buildQuery(filters: ActivityFilters): string {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.subcategory !== "all") {
    params.set("subcategory", filters.subcategory);
  }
  // Neighborhood UI removed — always browse all.
  params.set("neighborhood", "all");
  if (filters.locationBand !== "all") params.set("location", filters.locationBand);
  if (filters.activityType !== "all") params.set("type", filters.activityType);
  if (filters.schedulePattern !== "all") {
    params.set("schedule", filters.schedulePattern);
  }
  if (filters.day !== "all") params.set("day", filters.day);
  if (filters.age !== null) params.set("age", String(filters.age));
  return params.toString();
}

function sameFilters(a: ActivityFilters, b: ActivityFilters): boolean {
  return (
    a.search === b.search &&
    a.category === b.category &&
    a.subcategory === b.subcategory &&
    a.neighborhood === b.neighborhood &&
    a.locationBand === b.locationBand &&
    a.activityType === b.activityType &&
    a.schedulePattern === b.schedulePattern &&
    a.day === b.day &&
    a.age === b.age &&
    a.ageMin === b.ageMin &&
    a.ageMax === b.ageMax
  );
}

export default function ActivitiesClient({
  activities,
  title = "Browse Activities",
  subtitle,
  defaultType = "all",
  defaultNeighborhood = "all",
  emptyLabel = "activities",
  groupedCards = false,
  initialFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const skipUrlSync = useRef(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch] = useState(initialFilters.search);
  const [category, setCategory] = useState(initialFilters.category);
  const [subcategory, setSubcategory] = useState(initialFilters.subcategory);
  const [neighborhood, setNeighborhood] = useState(initialFilters.neighborhood);
  const [locationBand, setLocationBand] = useState(initialFilters.locationBand);
  const [activityType, setActivityType] = useState(initialFilters.activityType);
  const [schedulePattern, setSchedulePattern] = useState(
    initialFilters.schedulePattern
  );
  const [day, setDay] = useState(initialFilters.day);
  const [age, setAge] = useState<number | null>(initialFilters.age);
  const [ageMin, setAgeMin] = useState<number | null>(initialFilters.ageMin);
  const [ageMax, setAgeMax] = useState<number | null>(initialFilters.ageMax);
  const [showFilters, setShowFilters] = useState(
    initialFilters.schedulePattern !== "all" ||
      initialFilters.subcategory !== "all" ||
      initialFilters.locationBand !== "all" ||
      initialFilters.day !== "all" ||
      initialFilters.age !== null ||
      initialFilters.ageMin !== null ||
      initialFilters.ageMax !== null ||
      (initialFilters.activityType !== "all" &&
        initialFilters.activityType !== defaultType)
  );

  const filters: ActivityFilters = useMemo(
    () => ({
      search,
      category,
      subcategory,
      neighborhood,
      locationBand,
      activityType,
      schedulePattern,
      day,
      age,
      ageMin,
      ageMax,
    }),
    [
      search,
      category,
      subcategory,
      neighborhood,
      locationBand,
      activityType,
      schedulePattern,
      day,
      age,
      ageMin,
      ageMax,
    ]
  );

  const applyFiltersState = useCallback((next: ActivityFilters) => {
    setSearch(next.search);
    setCategory(next.category);
    setSubcategory(next.subcategory);
    setNeighborhood(next.neighborhood);
    setLocationBand(next.locationBand);
    setActivityType(next.activityType);
    setSchedulePattern(next.schedulePattern);
    setDay(next.day);
    setAge(next.age);
    setAgeMin(next.ageMin);
    setAgeMax(next.ageMax);
  }, []);

  const writeUrl = useCallback(
    (next: ActivityFilters) => {
      const qs = buildQuery(next);
      const current = searchParams.toString();
      if (qs === current) return;
      skipUrlSync.current = true;
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Browser back/forward or inbound links → sync URL into local state.
  useEffect(() => {
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }
    const fromUrl = resolveActivityFilters(
      Object.fromEntries(searchParams.entries()),
      { defaultType, defaultNeighborhood: "all" }
    );
    fromUrl.neighborhood = "all";
    if (!sameFilters(fromUrl, filters)) {
      applyFiltersState(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to URL changes
  }, [searchParams, defaultType, defaultNeighborhood]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const update = useCallback(
    (patch: Partial<ActivityFilters>, options?: { debounceSearch?: boolean }) => {
      const next = { ...filters, ...patch };
      if (patch.search !== undefined) setSearch(patch.search);
      if (patch.category !== undefined) setCategory(patch.category);
      if (patch.subcategory !== undefined) setSubcategory(patch.subcategory);
      if (patch.neighborhood !== undefined) setNeighborhood(patch.neighborhood);
      if (patch.locationBand !== undefined) setLocationBand(patch.locationBand);
      if (patch.activityType !== undefined) setActivityType(patch.activityType);
      if (patch.schedulePattern !== undefined) {
        setSchedulePattern(patch.schedulePattern);
      }
      if (patch.day !== undefined) setDay(patch.day);
      if (patch.age !== undefined) {
        setAge(patch.age);
        // Single-age mode clears legacy range params.
        setAgeMin(null);
        setAgeMax(null);
        next.ageMin = null;
        next.ageMax = null;
      }
      if (patch.ageMin !== undefined) setAgeMin(patch.ageMin);
      if (patch.ageMax !== undefined) setAgeMax(patch.ageMax);

      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (options?.debounceSearch && patch.search !== undefined) {
        searchTimer.current = setTimeout(() => writeUrl(next), 250);
        return;
      }
      writeUrl(next);
    },
    [filters, writeUrl]
  );

  const filtered = filterActivities(activities, filters);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    category !== "all" ||
    subcategory !== "all" ||
    locationBand !== "all" ||
    activityType !== defaultType ||
    schedulePattern !== "all" ||
    day !== "all" ||
    age !== null ||
    ageMin !== null ||
    ageMax !== null;

  const clearFilters = () => {
    const cleared: ActivityFilters = {
      search: "",
      category: "all",
      subcategory: "all",
      neighborhood: "all",
      locationBand: "all",
      activityType: defaultType,
      schedulePattern: "all",
      day: "all",
      age: null,
      ageMin: null,
      ageMax: null,
    };
    applyFiltersState(cleared);
    writeUrl(cleared);
  };

  const isAfterschoolTab = defaultType === "Afterschool Program";

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    writeUrl(filters);
  };

  const filterSelectClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B346]/40";

  return (
    <div
      className={`${
        groupedCards ? "max-w-7xl" : "max-w-6xl"
      } mx-auto px-4 py-8 ${isPending ? "opacity-90" : ""}`}
    >
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-gray-500 text-sm">
          {filtered.length} {emptyLabel}
          {search.trim() && (
            <span className="text-gray-400"> matching “{search.trim()}”</span>
          )}
        </p>
      </div>

      <form
        method="get"
        action={pathname}
        onSubmit={onFormSubmit}
        className="mb-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start"
        role="search"
      >
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/70" />
          <input
            type="search"
            name="search"
            value={search}
            onChange={(e) =>
              update({ search: e.target.value }, { debounceSearch: true })
            }
            placeholder={
              isAfterschoolTab
                ? "Search afterschool programs…"
                : "Search activities, places, programs…"
            }
            className="hero-search w-full rounded-full py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-foreground/55 focus:outline-none"
            aria-label={
              isAfterschoolTab
                ? "Search afterschool programs"
                : "Search activities"
            }
            autoComplete="off"
          />
          {search && (
            <button
              type="button"
              onClick={() => update({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`filter-chip inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
            showFilters || hasActiveFilters
              ? "border-foreground/40 bg-white"
              : ""
          }`}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs text-white">
              !
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}

        {isAfterschoolTab && !showFilters && (
          <input type="hidden" name="type" value={activityType} />
        )}
        <input type="hidden" name="neighborhood" value="all" />

        {showFilters && (
          <div className="grid w-full grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-center text-xs font-semibold text-gray-600">
                Category
              </label>
              <select
                name="category"
                value={category}
                onChange={(e) => update({ category: e.target.value })}
                className={filterSelectClass}
              >
                <option value="all">Any category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-center text-xs font-semibold text-gray-600">
                Subcategory
              </label>
              <select
                name="subcategory"
                value={subcategory}
                onChange={(e) => update({ subcategory: e.target.value })}
                className={filterSelectClass}
              >
                <option value="all">Any subcategory</option>
                {SUBCATEGORY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-center text-xs font-semibold text-gray-600">
                Day
              </label>
              <select
                name="day"
                value={day}
                onChange={(e) => update({ day: e.target.value })}
                className={filterSelectClass}
              >
                <option value="all">Any day</option>
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-center text-xs font-semibold text-gray-600">
                Location
              </label>
              <select
                name="location"
                value={locationBand}
                onChange={(e) => update({ locationBand: e.target.value })}
                className={filterSelectClass}
              >
                <option value="all">Any blocks</option>
                {LOCATION_BANDS.map((band) => (
                  <option key={band.id} value={band.id}>
                    {band.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-center text-xs font-semibold text-gray-600">
                Age
              </label>
              <select
                name="age"
                value={age ?? ""}
                onChange={(e) =>
                  update({
                    age: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                className={filterSelectClass}
              >
                <option value="">Any</option>
                {AGE_SELECT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-center text-xs font-semibold text-gray-600">
                Activity Type
              </label>
              <select
                name="type"
                value={activityType}
                onChange={(e) => update({ activityType: e.target.value })}
                className={filterSelectClass}
              >
                <option value="all">Any type</option>
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-center text-xs font-semibold text-gray-600">
                Schedule
              </label>
              <select
                name="schedule"
                value={schedulePattern}
                onChange={(e) => update({ schedulePattern: e.target.value })}
                className={filterSelectClass}
              >
                <option value="all">Any schedule</option>
                {SCHEDULE_PATTERNS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>

      <div className="mb-6 flex flex-wrap justify-center gap-2 sm:justify-start">
        <button
          type="button"
          onClick={() => update({ category: "all" })}
          className={`rounded-full px-3 py-1.5 text-center text-xs font-semibold transition-colors ${
            category === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => update({ category: category === c ? "all" : c })}
            className={`rounded-full px-3 py-1.5 text-center text-xs font-semibold transition-colors ${
              category === c
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {category !== "all" || subcategory !== "all"
              ? "Check back soon…"
              : "No activities found"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {category !== "all" || subcategory !== "all"
              ? "We’re still adding programs in this category. Try another interest or clear filters."
              : "Try a different search term or clear filters"}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 rounded-full bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div
          className={
            groupedCards
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {filtered.map((activity) =>
            groupedCards ? (
              <GroupedActivityCard
                key={activity["Activity ID"]}
                activity={activity}
              />
            ) : (
              <ActivityCard
                key={activity["Activity ID"]}
                activity={activity}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

export type { ActivityFilters };
