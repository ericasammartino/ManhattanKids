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
  CATEGORY_ICONS,
  NEIGHBORHOODS,
  SUBCATEGORY_OPTIONS,
  DAY_OPTIONS,
} from "@/lib/data";
import {
  resolveActivityFilters,
  type ActivityFilters,
} from "@/lib/activity-filters";
import ActivityCard from "@/components/ActivityCard";
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
  if (filters.neighborhood !== "all") {
    params.set("neighborhood", filters.neighborhood);
  } else if (filters.search.trim()) {
    params.set("neighborhood", "all");
  }
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
  defaultNeighborhood = "Upper West Side",
  emptyLabel = "activities",
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
      { defaultType, defaultNeighborhood }
    );
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
    neighborhood !== "all" ||
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
  const neighborhoodLabel =
    neighborhood === "all" ? "Manhattan" : neighborhood;

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    writeUrl(filters);
  };

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 ${isPending ? "opacity-90" : ""}`}>
      <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-green-900 text-sm">
            {isAfterschoolTab
              ? `Afterschool · ${neighborhoodLabel}`
              : `Currently showing: ${neighborhoodLabel}`}
          </div>
          <div className="text-green-700 text-xs mt-0.5">
            {subtitle ??
              "Starting with the Upper West Side — more neighborhoods as we expand."}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["Upper West Side", "all"] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update({ neighborhood: n })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                neighborhood === n
                  ? "bg-green-700 text-white"
                  : "bg-white text-green-700 border border-green-200 hover:bg-green-100"
              }`}
            >
              {n === "all" ? "Show All Manhattan" : "Upper West Side Only"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-gray-500 text-sm">
          {filtered.length} {neighborhood !== "all" ? neighborhood : ""}{" "}
          {emptyLabel}
          {search.trim() && (
            <span className="text-gray-400"> matching “{search.trim()}”</span>
          )}
          {neighborhood !== "all" && (
            <span className="text-gray-400">
              {" "}
              ·{" "}
              <button
                type="button"
                onClick={() => update({ neighborhood: "all" })}
                className="underline hover:text-gray-600"
              >
                show all Manhattan
              </button>
            </span>
          )}
        </p>
      </div>

      <form
        method="get"
        action={pathname}
        onSubmit={onFormSubmit}
        className="flex gap-3 mb-5 flex-wrap"
        role="search"
      >
        <div className="relative flex-1 min-w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
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
            className="hero-search w-full pl-9 pr-10 py-2.5 rounded-full bg-white text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          name="category"
          value={category}
          onChange={(e) => update({ category: e.target.value })}
          aria-label="Category"
          className="px-3 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-200 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_ICONS[c]} {c}
            </option>
          ))}
        </select>

        <select
          name="subcategory"
          value={subcategory}
          onChange={(e) => update({ subcategory: e.target.value })}
          aria-label="Subcategory"
          className="px-3 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-200 cursor-pointer max-w-[12rem]"
        >
          <option value="all">All Subcategories</option>
          {SUBCATEGORY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          name="day"
          value={day}
          onChange={(e) => update({ day: e.target.value })}
          aria-label="Day of the week"
          className="px-3 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-200 cursor-pointer"
        >
          <option value="all">Any Day</option>
          {DAY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          name="age"
          value={age ?? ""}
          onChange={(e) =>
            update({
              age: e.target.value ? parseInt(e.target.value, 10) : null,
            })
          }
          aria-label="Child's age"
          className="px-3 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-200 cursor-pointer"
        >
          <option value="">Any Age</option>
          {AGE_SELECT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n === 0 ? "Under 1" : `Age ${n}`}
            </option>
          ))}
        </select>

        <select
          name="neighborhood"
          value={neighborhood}
          onChange={(e) => update({ neighborhood: e.target.value })}
          aria-label="Neighborhood"
          className="px-3 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-200 cursor-pointer"
        >
          <option value="all">All Neighborhoods</option>
          {NEIGHBORHOODS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? "border-green-400 bg-green-50 text-green-800"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          More Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
              !
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-full border border-red-200 bg-red-50 text-red-600 text-sm hover:bg-red-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {isAfterschoolTab && !showFilters && (
          <input type="hidden" name="type" value={activityType} />
        )}

        {showFilters && (
          <div className="w-full p-4 rounded-2xl border border-gray-200 bg-white grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Activity Type
              </label>
              <select
                name="type"
                value={activityType}
                onChange={(e) => update({ activityType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="all">Any Type</option>
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Schedule
              </label>
              <select
                name="schedule"
                value={schedulePattern}
                onChange={(e) => update({ schedulePattern: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="all">Any Schedule</option>
                {SCHEDULE_PATTERNS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Child&apos;s age
              </label>
              <select
                name="age"
                value={age ?? ""}
                onChange={(e) =>
                  update({
                    age: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="">Any age</option>
                {AGE_SELECT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "Under 1" : `Age ${n}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Day of week
              </label>
              <select
                name="day"
                value={day}
                onChange={(e) => update({ day: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="all">Any day</option>
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => update({ category: "all" })}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
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
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              category === c
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {CATEGORY_ICONS[c]} {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No activities found
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Try a different search term or clear filters
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((activity) => (
            <ActivityCard
              key={activity["Activity ID"]}
              activity={activity}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export type { ActivityFilters };
