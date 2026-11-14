"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, ChevronDown, SlidersHorizontal } from "lucide-react";

type Props = {
  variant?: "hero" | "compact";
};

export default function SearchBar({ variant = "hero" }: Props) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const go = (extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({
      neighborhood: "all",
      ...extra,
    });
    const trimmed = query.trim();
    if (trimmed) params.set("search", trimmed);
    router.push(`/activities?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    go();
  };

  if (variant === "compact") {
    return (
      <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-accent w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities, camps, classes & more..."
            className="hero-search w-full pl-9 pr-12 py-2.5 rounded-full bg-white text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center hover:opacity-90 transition-opacity"
            aria-label="Search"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-accent w-[18px] h-[18px]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search activities, camps, classes & more..."
          className="hero-search w-full pl-11 pr-14 py-3.5 rounded-full bg-white text-[15px] text-foreground placeholder:text-muted/65 focus:outline-none"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label="Search"
        >
          <ArrowRight className="w-[18px] h-[18px]" />
        </button>
      </form>

      <div className="mt-3.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => go({})}
          className="filter-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm"
        >
          age
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
        <button
          type="button"
          onClick={() => go({})}
          className="filter-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm"
        >
          date
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
        <button
          type="button"
          onClick={() => go({ neighborhood: "Upper West Side" })}
          className="filter-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm"
        >
          neighborhood
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
        <button
          type="button"
          onClick={() => go({})}
          className="filter-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm"
        >
          more filters
          <SlidersHorizontal className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>
    </div>
  );
}
