"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/activities?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/activities");
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search activities, places, programs"
          className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
        />
      </div>
      <button
        type="submit"
        className="p-2.5 rounded-full text-white flex-shrink-0 hover:opacity-90 transition-opacity"
        style={{ background: "#e8b84b" }}
        aria-label="Search"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
