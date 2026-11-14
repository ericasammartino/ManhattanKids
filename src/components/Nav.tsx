"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="font-extrabold tracking-tight text-foreground text-[17px]">
          ManhattanKids
        </Link>
        <div className="flex items-center gap-5 text-sm font-medium text-muted">
          <Link
            href="/activities"
            className={`transition-colors hover:text-foreground ${
              pathname.startsWith("/activities") ? "text-foreground font-semibold" : ""
            }`}
          >
            Browse
          </Link>
          <Link
            href="/admin"
            className={`transition-colors hover:text-foreground ${
              pathname === "/admin" ? "text-foreground font-semibold" : ""
            }`}
          >
            Admin
          </Link>
          <Link
            href="/activities?neighborhood=Upper+West+Side"
            className="rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Find Activities
          </Link>
        </div>
      </div>
    </nav>
  );
}
