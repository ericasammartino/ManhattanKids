"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Layers,
  MapPin,
  SlidersHorizontal,
  Tag,
  Users,
} from "lucide-react";
import {
  CATEGORIES,
  SUBCATEGORY_OPTIONS,
  DAY_OPTIONS,
} from "@/lib/data";
import { LOCATION_BANDS } from "@/lib/location-bands";
import { resolveActivityFilters } from "@/lib/activity-filters";

const AGE_OPTIONS = Array.from({ length: 19 }, (_, age) => age);

const ACTIVITY_TYPES = [
  "Afterschool Program",
  "Class",
  "Camp",
  "Event",
  "Drop-in",
  "Workshop",
];

const SCHEDULE_PATTERNS = [
  "Recurring Weekly",
  "One-time",
  "Daily",
  "Weekend",
];

type Props = {
  resultsPath?: string;
  defaultType?: string;
};

export default function FilterProgramsPanel({
  resultsPath = "/",
  defaultType = "Afterschool Program",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showMore, setShowMore] = useState(false);

  const fromUrl = resolveActivityFilters(
    Object.fromEntries(searchParams.entries()),
    { defaultType, defaultNeighborhood: "all" }
  );

  const [category, setCategory] = useState(fromUrl.category);
  const [subcategory, setSubcategory] = useState(fromUrl.subcategory);
  const [day, setDay] = useState(fromUrl.day);
  const [locationBand, setLocationBand] = useState(fromUrl.locationBand);
  const [age, setAge] = useState<number | null>(fromUrl.age);
  const [activityType, setActivityType] = useState(fromUrl.activityType);
  const [schedulePattern, setSchedulePattern] = useState(
    fromUrl.schedulePattern
  );

  useEffect(() => {
    const next = resolveActivityFilters(
      Object.fromEntries(searchParams.entries()),
      { defaultType, defaultNeighborhood: "all" }
    );
    setCategory(next.category);
    setSubcategory(next.subcategory);
    setDay(next.day);
    setLocationBand(next.locationBand);
    setAge(next.age);
    setActivityType(next.activityType);
    setSchedulePattern(next.schedulePattern);
    if (
      next.activityType !== defaultType ||
      next.schedulePattern !== "all"
    ) {
      setShowMore(true);
    }
  }, [searchParams, defaultType]);

  const writeUrl = useCallback(
    (next: {
      category: string;
      subcategory: string;
      day: string;
      locationBand: string;
      age: number | null;
      activityType: string;
      schedulePattern: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      const setOrDelete = (key: string, value: string | null, skip = "all") => {
        if (!value || value === skip) params.delete(key);
        else params.set(key, value);
      };
      setOrDelete("category", next.category);
      setOrDelete("subcategory", next.subcategory);
      setOrDelete("day", next.day);
      setOrDelete("location", next.locationBand);
      if (next.age === null) params.delete("age");
      else params.set("age", String(next.age));
      if (next.activityType === defaultType || next.activityType === "all") {
        params.delete("type");
      } else {
        params.set("type", next.activityType);
      }
      setOrDelete("schedule", next.schedulePattern);
      params.set("neighborhood", "all");
      const qs = params.toString();
      const target = resultsPath === pathname ? pathname : resultsPath;
      startTransition(() => {
        router.replace(qs ? `${target}?${qs}#programs` : `${target}#programs`, {
          scroll: false,
        });
      });
    },
    [defaultType, pathname, resultsPath, router, searchParams]
  );

  const apply = (patch: Partial<{
    category: string;
    subcategory: string;
    day: string;
    locationBand: string;
    age: number | null;
    activityType: string;
    schedulePattern: string;
  }>) => {
    const next = {
      category,
      subcategory,
      day,
      locationBand,
      age,
      activityType,
      schedulePattern,
      ...patch,
    };
    if (patch.category !== undefined) setCategory(patch.category);
    if (patch.subcategory !== undefined) setSubcategory(patch.subcategory);
    if (patch.day !== undefined) setDay(patch.day);
    if (patch.locationBand !== undefined) setLocationBand(patch.locationBand);
    if (patch.age !== undefined) setAge(patch.age);
    if (patch.activityType !== undefined) setActivityType(patch.activityType);
    if (patch.schedulePattern !== undefined) {
      setSchedulePattern(patch.schedulePattern);
    }
    writeUrl(next);
  };

  const clearAll = () => {
    setCategory("all");
    setSubcategory("all");
    setDay("all");
    setLocationBand("all");
    setAge(null);
    setActivityType(defaultType);
    setSchedulePattern("all");
    setShowMore(false);
    writeUrl({
      category: "all",
      subcategory: "all",
      day: "all",
      locationBand: "all",
      age: null,
      activityType: defaultType,
      schedulePattern: "all",
    });
  };

  const hasActive =
    category !== "all" ||
    subcategory !== "all" ||
    day !== "all" ||
    locationBand !== "all" ||
    age !== null ||
    (activityType !== "all" && activityType !== defaultType) ||
    schedulePattern !== "all";

  const fieldClass =
    "flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md";
  const selectClass =
    "w-full appearance-none bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer";

  return (
    <section
      className={`mx-auto max-w-6xl px-4 md:px-6 ${isPending ? "opacity-90" : ""}`}
      aria-label="Filter programs"
    >
      <div className="rounded-[1.5rem] bg-[#E8F4F8] px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-[15px] font-bold text-[#1D2B4B]">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filter Programs
          </div>
          {hasActive && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-semibold text-[#2B6CB0] hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className={fieldClass}>
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#FCE7EF]">
              <Layers className="h-4 w-4 text-[#C45A7A]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Category
              </span>
              <select
                value={category}
                onChange={(e) => apply({ category: e.target.value })}
                className={selectClass}
                aria-label="Category"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className={fieldClass}>
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFEDD5]">
              <Tag className="h-4 w-4 text-[#D4833A]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Subcategory
              </span>
              <select
                value={subcategory}
                onChange={(e) => apply({ subcategory: e.target.value })}
                className={selectClass}
                aria-label="Subcategory"
              >
                <option value="all">All Subcategories</option>
                {SUBCATEGORY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className={fieldClass}>
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#DBEAFE]">
              <Calendar className="h-4 w-4 text-[#3B82F6]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Day
              </span>
              <select
                value={day}
                onChange={(e) => apply({ day: e.target.value })}
                className={selectClass}
                aria-label="Day"
              >
                <option value="all">Any Day</option>
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className={fieldClass}>
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7]">
              <MapPin className="h-4 w-4 text-[#C9A227]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Location
              </span>
              <select
                value={locationBand}
                onChange={(e) => apply({ locationBand: e.target.value })}
                className={selectClass}
                aria-label="Location"
              >
                <option value="all">All Neighborhoods</option>
                {LOCATION_BANDS.map((band) => (
                  <option key={band.id} value={band.id}>
                    {band.label}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className={fieldClass}>
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE]">
              <Users className="h-4 w-4 text-[#7C6BC4]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Age
              </span>
              <select
                value={age ?? ""}
                onChange={(e) =>
                  apply({
                    age: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                className={selectClass}
                aria-label="Age"
              >
                <option value="">All Ages</option>
                {AGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <button
            type="button"
            onClick={() => setShowMore((open) => !open)}
            className={`${fieldClass} text-left`}
            aria-expanded={showMore}
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#DCFCE7]">
              <SlidersHorizontal className="h-4 w-4 text-[#059669]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                More Filters
              </span>
              <span className="block text-sm font-medium text-foreground">
                Activity Type, Schedule
              </span>
            </span>
          </button>
        </div>

        {showMore && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={fieldClass}>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Activity Type
                </span>
                <select
                  value={activityType}
                  onChange={(e) => apply({ activityType: e.target.value })}
                  className={selectClass}
                  aria-label="Activity type"
                >
                  <option value={defaultType}>{defaultType}</option>
                  {ACTIVITY_TYPES.filter((t) => t !== defaultType).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="all">All types</option>
                </select>
              </span>
            </label>
            <label className={fieldClass}>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Schedule
                </span>
                <select
                  value={schedulePattern}
                  onChange={(e) => apply({ schedulePattern: e.target.value })}
                  className={selectClass}
                  aria-label="Schedule"
                >
                  <option value="all">Any schedule</option>
                  {SCHEDULE_PATTERNS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
