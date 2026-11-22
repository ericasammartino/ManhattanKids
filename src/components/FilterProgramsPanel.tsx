"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Layers,
  MapPin,
  SlidersHorizontal,
  Tag,
  Users,
} from "lucide-react";
import { CATEGORIES, DAY_OPTIONS } from "@/lib/data";
import { LOCATION_BANDS } from "@/lib/location-bands";
import {
  encodeFilterList,
  resolveActivityFilters,
} from "@/lib/activity-filters";
import { subcategoriesForCategories } from "@/lib/taxonomy";
import MultiSelectMenu from "@/components/MultiSelectMenu";

const AGE_OPTIONS = Array.from({ length: 19 }, (_, age) => ({
  value: String(age),
  label: String(age),
}));

const ACTIVITY_TYPE_OPTIONS = [
  "Afterschool Program",
  "Class",
  "Camp",
  "Event",
  "Drop-in",
  "Workshop",
].map((t) => ({ value: t, label: t }));

const SCHEDULE_OPTIONS = [
  "Recurring Weekly",
  "One-time",
  "Daily",
  "Weekend",
].map((s) => ({ value: s, label: s }));

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

  const [categories, setCategories] = useState(fromUrl.categories);
  const [subcategories, setSubcategories] = useState(fromUrl.subcategories);
  const [days, setDays] = useState(fromUrl.days);
  const [locationBands, setLocationBands] = useState(fromUrl.locationBands);
  const [ages, setAges] = useState(fromUrl.ages.map(String));
  const [activityTypes, setActivityTypes] = useState(
    fromUrl.activityTypes.filter((t) => t !== defaultType)
  );
  const [schedulePatterns, setSchedulePatterns] = useState(
    fromUrl.schedulePatterns
  );

  useEffect(() => {
    const next = resolveActivityFilters(
      Object.fromEntries(searchParams.entries()),
      { defaultType, defaultNeighborhood: "all" }
    );
    setCategories(next.categories);
    setSubcategories(next.subcategories);
    setDays(next.days);
    setLocationBands(next.locationBands);
    setAges(next.ages.map(String));
    setActivityTypes(next.activityTypes.filter((t) => t !== defaultType));
    setSchedulePatterns(next.schedulePatterns);
    if (
      next.activityTypes.some((t) => t !== defaultType) ||
      next.schedulePatterns.length > 0
    ) {
      setShowMore(true);
    }
  }, [searchParams, defaultType]);

  const subcategoryOptions = useMemo(
    () =>
      subcategoriesForCategories(categories).map((s) => ({
        value: s,
        label: s,
      })),
    [categories]
  );

  const writeUrl = useCallback(
    (next: {
      categories: string[];
      subcategories: string[];
      days: string[];
      locationBands: string[];
      ages: string[];
      activityTypes: string[];
      schedulePatterns: string[];
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      const setList = (key: string, values: string[]) => {
        const encoded = encodeFilterList(values);
        if (encoded) params.set(key, encoded);
        else params.delete(key);
      };

      setList("category", next.categories);
      setList("subcategory", next.subcategories);
      setList("day", next.days);
      setList("location", next.locationBands);
      setList("age", next.ages);

      const types =
        next.activityTypes.length > 0 ? next.activityTypes : [defaultType];
      if (types.length === 1 && types[0] === defaultType) {
        params.delete("type");
      } else {
        setList("type", types);
      }
      setList("schedule", next.schedulePatterns);
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
    categories: string[];
    subcategories: string[];
    days: string[];
    locationBands: string[];
    ages: string[];
    activityTypes: string[];
    schedulePatterns: string[];
  }>) => {
    let nextSubs = patch.subcategories ?? subcategories;
    if (patch.categories) {
      const allowed = new Set(subcategoriesForCategories(patch.categories));
      nextSubs = nextSubs.filter((s) => allowed.has(s));
      setCategories(patch.categories);
      setSubcategories(nextSubs);
    }
    if (patch.subcategories !== undefined && !patch.categories) {
      setSubcategories(patch.subcategories);
    }
    if (patch.days !== undefined) setDays(patch.days);
    if (patch.locationBands !== undefined) setLocationBands(patch.locationBands);
    if (patch.ages !== undefined) setAges(patch.ages);
    if (patch.activityTypes !== undefined) setActivityTypes(patch.activityTypes);
    if (patch.schedulePatterns !== undefined) {
      setSchedulePatterns(patch.schedulePatterns);
    }

    writeUrl({
      categories: patch.categories ?? categories,
      subcategories: nextSubs,
      days: patch.days ?? days,
      locationBands: patch.locationBands ?? locationBands,
      ages: patch.ages ?? ages,
      activityTypes: patch.activityTypes ?? activityTypes,
      schedulePatterns: patch.schedulePatterns ?? schedulePatterns,
    });
  };

  const clearAll = () => {
    setCategories([]);
    setSubcategories([]);
    setDays([]);
    setLocationBands([]);
    setAges([]);
    setActivityTypes([]);
    setSchedulePatterns([]);
    setShowMore(false);
    writeUrl({
      categories: [],
      subcategories: [],
      days: [],
      locationBands: [],
      ages: [],
      activityTypes: [],
      schedulePatterns: [],
    });
  };

  const hasActive =
    categories.length > 0 ||
    subcategories.length > 0 ||
    days.length > 0 ||
    locationBands.length > 0 ||
    ages.length > 0 ||
    activityTypes.length > 0 ||
    schedulePatterns.length > 0;

  return (
    <section
      className={`mx-auto max-w-6xl px-4 md:px-6 ${isPending ? "opacity-90" : ""}`}
      aria-label="Filter programs"
    >
      <div
        className="rounded-[1.5rem] border border-[#ebe4d8] px-4 py-5 sm:px-6 sm:py-6"
        style={{
          background: "linear-gradient(180deg, #faf6ef 0%, #f7f2e9 100%)",
        }}
      >
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
          <MultiSelectMenu
            label="Category"
            icon={<Layers className="h-4 w-4 text-[#C45A7A]" aria-hidden />}
            iconBg="#FCE7EF"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            selected={categories}
            emptyLabel="All Categories"
            onChange={(next) => apply({ categories: next })}
          />
          <MultiSelectMenu
            label="Subcategory"
            icon={<Tag className="h-4 w-4 text-[#D4833A]" aria-hidden />}
            iconBg="#FFEDD5"
            options={subcategoryOptions}
            selected={subcategories}
            emptyLabel="All Subcategories"
            onChange={(next) => apply({ subcategories: next })}
          />
          <MultiSelectMenu
            label="Day"
            icon={<Calendar className="h-4 w-4 text-[#3B82F6]" aria-hidden />}
            iconBg="#DBEAFE"
            options={DAY_OPTIONS.map((d) => ({ value: d, label: d }))}
            selected={days}
            emptyLabel="Any Day"
            onChange={(next) => apply({ days: next })}
          />
          <MultiSelectMenu
            label="Location"
            icon={<MapPin className="h-4 w-4 text-[#C9A227]" aria-hidden />}
            iconBg="#FEF3C7"
            options={LOCATION_BANDS.map((b) => ({
              value: b.id,
              label: b.label,
            }))}
            selected={locationBands}
            emptyLabel="Entire UWS"
            onChange={(next) => apply({ locationBands: next })}
          />
          <MultiSelectMenu
            label="Age"
            icon={<Users className="h-4 w-4 text-[#7C6BC4]" aria-hidden />}
            iconBg="#EDE9FE"
            options={AGE_OPTIONS}
            selected={ages}
            emptyLabel="All Ages"
            onChange={(next) => apply({ ages: next })}
          />
          <button
            type="button"
            onClick={() => setShowMore((open) => !open)}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white px-4 py-3.5 text-left shadow-sm transition-shadow hover:shadow-md"
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
            <MultiSelectMenu
              label="Activity Type"
              icon={<Layers className="h-4 w-4 text-[#059669]" aria-hidden />}
              iconBg="#DCFCE7"
              options={ACTIVITY_TYPE_OPTIONS}
              selected={
                activityTypes.length > 0 ? activityTypes : [defaultType]
              }
              emptyLabel={defaultType}
              onChange={(next) => apply({ activityTypes: next })}
            />
            <MultiSelectMenu
              label="Schedule"
              icon={<Calendar className="h-4 w-4 text-[#059669]" aria-hidden />}
              iconBg="#DCFCE7"
              options={SCHEDULE_OPTIONS}
              selected={schedulePatterns}
              emptyLabel="Any schedule"
              onChange={(next) => apply({ schedulePatterns: next })}
            />
          </div>
        )}
      </div>
    </section>
  );
}
