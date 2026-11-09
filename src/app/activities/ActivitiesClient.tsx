"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { EnrichedActivity } from "@/types";
import {
  filterActivities,
  CATEGORIES,
  CATEGORY_ICONS,
  NEIGHBORHOODS,
} from "@/lib/data";
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

interface Props {
  activities: EnrichedActivity[];
}

export default function ActivitiesClient({ activities }: Props) {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [neighborhood, setNeighborhood] = useState(searchParams.get("neighborhood") ?? "Upper West Side");
  const [activityType, setActivityType] = useState(searchParams.get("type") ?? "all");
  const [schedulePattern, setSchedulePattern] = useState("all");
  const [ageMin, setAgeMin] = useState<number | null>(null);
  const [ageMax, setAgeMax] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = filterActivities(activities, {
    search,
    category,
    neighborhood,
    activityType,
    schedulePattern,
    ageMin,
    ageMax,
  });

  const hasActiveFilters =
    search ||
    category !== "all" ||
    neighborhood !== "all" ||
    activityType !== "all" ||
    schedulePattern !== "all" ||
    ageMin !== null ||
    ageMax !== null;

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setNeighborhood("all");
    setActivityType("all");
    setSchedulePattern("all");
    setAgeMin(null);
    setAgeMax(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Neighborhood banner */}
      <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-green-900 text-sm">
            📍 Currently showing: Upper West Side
          </div>
          <div className="text-green-700 text-xs mt-0.5">
            More neighborhoods coming soon — Midtown, UES, Downtown and more.
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Upper West Side", "all"].map((n) => (
            <button
              key={n}
              onClick={() => setNeighborhood(n)}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Browse Activities</h1>
        <p className="text-gray-500 text-sm">
          {filtered.length} {neighborhood !== "all" ? `Upper West Side` : ""} activities
          {neighborhood !== "all" && <span className="text-gray-400"> · <button onClick={() => setNeighborhood("all")} className="underline hover:text-gray-600">show all Manhattan</button></span>}
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities, places, programs…"
            className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
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
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-full border border-red-200 bg-red-50 text-red-600 text-sm hover:bg-red-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-2xl border border-gray-200 bg-white grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Activity Type
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
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
              value={schedulePattern}
              onChange={(e) => setSchedulePattern(e.target.value)}
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
              Min Age
            </label>
            <input
              type="number"
              min={0}
              max={18}
              value={ageMin ?? ""}
              onChange={(e) =>
                setAgeMin(e.target.value ? parseInt(e.target.value) : null)
              }
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Max Age
            </label>
            <input
              type="number"
              min={0}
              max={18}
              value={ageMax ?? ""}
              onChange={(e) =>
                setAgeMax(e.target.value ? parseInt(e.target.value) : null)
              }
              placeholder="18"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>
      )}

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCategory("all")}
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
            onClick={() => setCategory(category === c ? "all" : c)}
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

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No activities found</h3>
          <p className="text-sm text-gray-500 mb-4">Try adjusting your filters</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-full bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((activity) => (
            <ActivityCard key={activity["Activity ID"]} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
