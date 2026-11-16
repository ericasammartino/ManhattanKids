"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, ChevronDown, SlidersHorizontal } from "lucide-react";

type Props = {
  variant?: "hero" | "compact";
  /** Where search results should open. Defaults to afterschool for launch. */
  resultsPath?: string;
};

export default function SearchBar({
  variant = "hero",
  resultsPath = "/afterschool",
}: Props) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const go = (extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({
      neighborhood: "all",
      ...extra,
    });
    const trimmed = query.trim();
    if (trimmed) params.set("search", trimmed);
    const qs = params.toString();
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
        {/* Hidden so a no-JS / pre-hydration submit still opens citywide afterschool */}
        <input type="hidden" name="neighborhood" value="all" />
        <button
          type="submit"
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90"
          aria-label="Search"
        >
          <ArrowRight className="h-[18px] w-[18px]" />
        </button>
      </form>

      <div className="mt-3.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => go({})}
          className="filter-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm"
        >
          age
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
        <button
          type="button"
          onClick={() => go({})}
          className="filter-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm"
        >
          date
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
        <button
          type="button"
          onClick={() => go({ neighborhood: "Upper West Side" })}
          className="filter-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm"
        >
          neighborhood
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
        <button
          type="button"
          onClick={() => router.push("/afterschool")}
          className="filter-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm"
        >
          afterschool
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
        <button
          type="button"
          onClick={() => go({})}
          className="filter-chip inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm"
        >
          more filters
          <SlidersHorizontal className="h-3.5 w-3.5 opacity-60" />
        </button>
      </div>
    </div>
  );
}
