"use client";
import Link from "next/link";
import Image from "next/image";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="inline-flex items-center"
          aria-label="Little City Life home"
        >
          <Image
            src="/little-city-life-logo.png"
            alt="Little City Life"
            width={200}
            height={46}
            className="h-8 w-auto sm:h-9"
            priority
          />
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
