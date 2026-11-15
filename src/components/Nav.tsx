"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `transition-colors hover:text-foreground ${
      active ? "text-foreground font-semibold" : ""
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="font-extrabold tracking-tight text-foreground text-[17px]">
          ManhattanKids
        </Link>
        <div className="flex items-center gap-5 text-sm font-medium text-muted">
          <Link
            href="/activities"
            className={linkClass(pathname.startsWith("/activities"))}
          >
            Browse
          </Link>
          <Link
            href="/afterschool"
            className={linkClass(pathname.startsWith("/afterschool"))}
          >
            Afterschool
          </Link>
          <Link href="/admin" className={linkClass(pathname === "/admin")}>
            Admin
          </Link>
          <Link
            href="/afterschool"
            className="rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Find Programs
          </Link>
        </div>
      </div>
    </nav>
  );
}
