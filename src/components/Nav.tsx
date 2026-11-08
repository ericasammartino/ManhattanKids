"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg" style={{ color: "#2d5a3d" }}>
          🗽 ManhattanKids
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link
            href="/activities"
            className={`hover:text-gray-900 transition-colors ${pathname === "/activities" ? "text-gray-900 font-semibold" : ""}`}
          >
            Browse Activities
          </Link>
          <Link
            href="/admin"
            className={`hover:text-gray-900 transition-colors ${pathname === "/admin" ? "text-gray-900 font-semibold" : ""}`}
          >
            Admin
          </Link>
          <Link
            href="/activities"
            className="px-4 py-1.5 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#2d5a3d" }}
          >
            Find Activities
          </Link>
        </div>
      </div>
    </nav>
  );
}
