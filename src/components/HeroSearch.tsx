"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";

const ARROW_FILL = "#F6B346";

type Props = {
  resultsPath?: string;
};

export default function HeroSearch({ resultsPath = "/" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlSearch = searchParams.get("search") ?? "";
  const [query, setQuery] = useState(urlSearch);

  // Keep the hero input aligned with URL-driven search (pills / back / clear).
  useEffect(() => {
    setQuery(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const navigate = useCallback(
    (nextQuery: string, options?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = nextQuery.trim();
      if (trimmed) params.set("search", trimmed);
      else params.delete("search");
      params.set("neighborhood", "all");
      const qs = params.toString();
      const href = qs
        ? `${resultsPath}?${qs}#programs`
        : `${resultsPath}#programs`;
      startTransition(() => {
        if (options?.replace) {
          router.replace(href, { scroll: false });
        } else {
          router.push(href, { scroll: false });
        }
      });
      requestAnimationFrame(() => {
        document.getElementById("programs")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    [resultsPath, router, searchParams]
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    navigate(query);
  };

  const onChange = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    // Live filter while typing so org/title search feels immediate on homepage.
    searchTimer.current = setTimeout(() => {
      navigate(value, { replace: true });
    }, 250);
  };

  const clearQuery = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setQuery("");
    navigate("");
  };

  const hasQuery = query.trim().length > 0;

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-xl" role="search">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-foreground/55" />
      <input
        type="text"
        name="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by class or organization"
        className="hero-search w-full rounded-full py-3.5 pl-11 pr-14 text-[15px] placeholder:text-foreground/45 focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        autoComplete="off"
        aria-label="Search activities by class or organization"
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
