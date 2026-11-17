"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import {
  CATEGORIES,
  SUBCATEGORY_OPTIONS,
  DAY_OPTIONS,
} from "@/lib/data";

type Props = {
  variant?: "hero" | "compact";
  /** Where search results should open. Defaults to afterschool for launch. */
  resultsPath?: string;
};

const AGE_OPTIONS = [
  { label: "age", value: "" },
  ...Array.from({ length: 19 }, (_, age) => ({
    label: String(age),
    value: String(age),
  })),
];

const chipSelectClass =
  "bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer appearance-none text-center w-full";

export default function SearchBar({
  variant = "hero",
  resultsPath = "/afterschool",
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [subcategory, setSubcategory] = useState("all");
  const [day, setDay] = useState("all");
  const [age, setAge] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  const buildParams = () => {
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set("search", trimmed);
    // Always browse all neighborhoods — neighborhood UI removed.
    params.set("neighborhood", "all");
    if (category && category !== "all") params.set("category", category);
    if (subcategory && subcategory !== "all") {
      params.set("subcategory", subcategory);
    }
    if (day && day !== "all") params.set("day", day);
    if (age) params.set("age", age);
    return params;
  };

  const go = () => {
    const qs = buildParams().toString();
    router.push(qs ? `${resultsPath}?${qs}` : resultsPath);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    go();
  };

  const filtersActive =
    category !== "all" ||
    subcategory !== "all" ||
    day !== "all" ||
    Boolean(age);

  if (variant === "compact") {
    return (
      <form
        onSubmit={handleSearch}
        action={resultsPath}
        method="get"
        className="flex items-center gap-2 max-w-md"
        role="search"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/70" />
          <input
            type="search"
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search afterschool programs…"
            className="hero-search w-full rounded-full py-2.5 pl-9 pr-12 text-sm placeholder:text-foreground/55 focus:outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90"
            aria-label="Search"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <form
        onSubmit={handleSearch}
        action={resultsPath}
        method="get"
        className="relative"
        role="search"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-foreground/70" />
        <input
          type="search"
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search afterschool programs…"
          className="hero-search w-full rounded-full py-3.5 pl-11 pr-14 text-[15px] placeholder:text-foreground/55 focus:outline-none"
          autoComplete="off"
        />
        <input type="hidden" name="neighborhood" value="all" />
        {category !== "all" && (
          <input type="hidden" name="category" value={category} />
        )}
        {subcategory !== "all" && (
          <input type="hidden" name="subcategory" value={subcategory} />
        )}
        {day !== "all" && <input type="hidden" name="day" value={day} />}
        {age && <input type="hidden" name="age" value={age} />}
        <button
          type="submit"
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90"
          aria-label="Search"
        >
          <ArrowRight className="h-[18px] w-[18px]" />
        </button>
      </form>

      <div className="mt-3.5 flex flex-wrap justify-center gap-2">
        <label className="filter-chip inline-flex min-w-[4.5rem] items-center justify-center rounded-full px-3.5 py-1.5 text-sm cursor-pointer">
          <span className="sr-only">Age</span>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={chipSelectClass}
            aria-label="Child's age"
          >
            {AGE_OPTIONS.map((o) => (
              <option key={o.value || "any"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-chip inline-flex min-w-[5.5rem] items-center justify-center rounded-full px-3.5 py-1.5 text-sm cursor-pointer">
          <span className="sr-only">Day</span>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={chipSelectClass}
            aria-label="Day of the week"
          >
            <option value="all">day</option>
            {DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-chip inline-flex min-w-[7rem] max-w-[11rem] items-center justify-center rounded-full px-3.5 py-1.5 text-sm cursor-pointer">
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${chipSelectClass} max-w-[10rem]`}
            aria-label="Category"
          >
            <option value="all">category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setShowFilters((open) => !open)}
          className={`filter-chip inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ${
            showFilters || filtersActive ? "border-foreground/40 bg-white/80" : ""
          }`}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>

        <button
          type="button"
          onClick={go}
          className="filter-chip inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium"
        >
          search afterschool
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-white/90 p-4 text-left shadow-sm sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-center text-xs font-semibold text-muted">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B346]/40"
              aria-label="Category"
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
            <label className="mb-1.5 block text-center text-xs font-semibold text-muted">
              Subcategory
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B346]/40"
              aria-label="Subcategory"
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
            <label className="mb-1.5 block text-center text-xs font-semibold text-muted">
              Day
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B346]/40"
              aria-label="Day of the week"
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
            <label className="mb-1.5 block text-center text-xs font-semibold text-muted">
              Age
            </label>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B346]/40"
              aria-label="Child's age"
            >
              <option value="">Any</option>
              {AGE_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex justify-center gap-2 pt-1">
            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setCategory("all");
                  setSubcategory("all");
                  setDay("all");
                  setAge("");
                }}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
            <button
              type="button"
              onClick={go}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-white"
            >
              Apply filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
