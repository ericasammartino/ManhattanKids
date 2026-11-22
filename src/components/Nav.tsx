"use client";
import Link from "next/link";
import Image from "next/image";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 md:h-20 md:px-6">
        <Link
          href="/"
          className="inline-flex flex-shrink-0 items-center"
          aria-label="Little City Life home"
        >
          <Image
            src="/little-city-life-logo-dark.png"
            alt="Little City Life"
            width={320}
            height={106}
            className="h-11 w-auto sm:h-12 md:h-14"
            priority
          />
        </Link>

        <Link
          href="/#programs"
          className="rounded-full bg-[#1D2B4B] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Find Programs
        </Link>
      </div>
    </nav>
  );
}
