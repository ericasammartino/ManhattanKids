"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { CATEGORIES, CATEGORY_ICONS, NEIGHBORHOODS } from "@/lib/data";

type Props = {
  variant?: "hero" | "compact";
  /** Where search results should open. Defaults to afterschool for launch. */
  resultsPath?: string;
};

const AGE_OPTIONS = [
  { label: "Any age", value: "" },
  { label: "Ages 0–2", value: "0-2" },
  { label: "Ages 3–5", value: "3-5" },
  { label: "Ages 6–8", value: "6-8" },
  { label: "Ages 9–12", value: "9-12" },
  { label: "Ages 13–18", value: "13-18" },
];

export default function SearchBar({
  variant = "hero",
  resultsPath = "/afterschool",
}: Props) {
  const [query, setQuery] = useState("");
  const [neighborhood, setNeighborhood] = useState("all");
  const [category, setCategory] = useState("all");
  const [ageRange, setAgeRange] = useState("");
  const router = useRouter();

  const buildParams = () => {
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set("search", trimmed);
    if (neighborhood && neighborhood !== "all") {
      params.set("neighborhood", neighborhood);
    } else {
      params.set("neighborhood", "all");
    }
    if (category && category !== "all") params.set("category", category);
    if (ageRange) {
      const [min, max] = ageRange.split("-");
      if (min) params.set("ageMin", min);
      if (max) params.set("ageMax", max);
    }
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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
          <input
            type="search"
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search afterschool programs…"
            className="hero-search w-full rounded-full bg-white py-2.5 pl-9 pr-12 text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
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
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-accent" />
        <input
          type="search"
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search afterschool programs…"
          className="hero-search w-full rounded-full bg-white py-3.5 pl-11 pr-14 text-[15px] text-foreground placeholder:text-muted/65 focus:outline-none"
          autoComplete="off"
        />
        <input type="hidden" name="neighborhood" value={neighborhood} />
        {category !== "all" && (
          <input type="hidden" name="category" value={category} />
        )}
        {ageRange && (
          <>
            <input type="hidden" name="ageMin" value={ageRange.split("-")[0]} />
            <input type="hidden" name="ageMax" value={ageRange.split("-")[1]} />
          </>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90"
          aria-label="Search"
        >
          <ArrowRight className="h-[18px] w-[18px]" />
        </button>
      </form>

      <div className="mt-3.5 flex flex-wrap gap-2">
        <label className="filter-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm cursor-pointer">
          <span className="sr-only">Age</span>
          <select
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
            className="bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer appearance-none pr-1"
            aria-label="Age range"
          >
            {AGE_OPTIONS.map((o) => (
              <option key={o.value || "any"} value={o.value}>
                {o.label === "Any age" ? "age" : o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm cursor-pointer">
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer appearance-none pr-1 max-w-[11rem]"
            aria-label="Category"
          >
            <option value="all">category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_ICONS[c]} {c}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm cursor-pointer">
          <span className="sr-only">Neighborhood</span>
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer appearance-none pr-1 max-w-[12rem]"
            aria-label="Neighborhood"
          >
            <option value="all">all neighborhoods</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={go}
          className="filter-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm"
        >
          search afterschool
        </button>
      </div>
    </div>
  );
}
