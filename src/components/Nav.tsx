"use client";
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="font-extrabold tracking-tight text-foreground text-[17px]"
        >
          ManhattanKids
        </Link>
        <Link
          href="/afterschool"
          className="rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Find Programs
        </Link>
      </div>
    </nav>
  );
}
