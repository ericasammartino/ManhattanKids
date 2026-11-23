"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";

const ARROW_FILL = "#F6B346";

type Props = {
  resultsPath?: string;
};

export default function HeroSearch({ resultsPath = "/" }: Props) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const go = (nextQuery = query) => {
    const params = new URLSearchParams();
    const trimmed = nextQuery.trim();
    if (trimmed) params.set("search", trimmed);
    params.set("neighborhood", "all");
    const qs = params.toString();
    const href = qs ? `${resultsPath}?${qs}#programs` : `${resultsPath}#programs`;
    router.push(href);
    // Ensure scroll even when already on the same path.
    requestAnimationFrame(() => {
      document.getElementById("programs")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    go();
  };

  const clearQuery = () => {
    setQuery("");
    go("");
  };

  const hasQuery = query.trim().length > 0;

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-xl" role="search">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-foreground/55" />
      <input
        type="text"
        name="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search afterschool activities"
        className="hero-search w-full rounded-full py-3.5 pl-11 pr-14 text-[15px] placeholder:text-foreground/45 focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        autoComplete="off"
        aria-label="Search activities"
      />
      {hasQuery ? (
        <button
          type="button"
          onClick={clearQuery}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: ARROW_FILL }}
          aria-label="Clear search"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      ) : (
        <button
          type="submit"
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: ARROW_FILL }}
          aria-label="Search"
        >
          <ArrowRight className="h-[18px] w-[18px]" />
        </button>
      )}
    </form>
  );
}
