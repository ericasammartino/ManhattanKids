import Image from "next/image";
import Link from "next/link";
import { getEnrichedActivities } from "@/lib/data";
import ActivityCard from "@/components/ActivityCard";
import SearchBar from "@/components/SearchBar";
import InterestOrbs from "@/components/InterestOrbs";

export default function Home() {
  const allActivities = getEnrichedActivities();

  const uwsActivities = allActivities.filter(
    (a) => a.location?.["Neighborhood"] === "Upper West Side"
  );

  const withSessions = uwsActivities.filter((a) => (a.sessions?.length ?? 0) > 0);
  const highlights = withSessions.slice(0, 3);

  const fallFavorites = uwsActivities
    .filter(
      (a) =>
        a["Seasonal Tags"]?.includes("Fall") || a["Activity Type"] === "Event"
    )
    .slice(0, 4);

  return (
    <div>
      {/* Hero — matches design: copy + search left, UWS map right */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:px-6 md:pb-14 md:pt-14">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12">
          <div className="animate-fade-up">
            <h1 className="max-w-[11ch] text-[2.6rem] font-extrabold leading-[1.08] tracking-tight text-foreground md:text-[3.35rem]">
              The Best Kids&apos; Activities on the UWS
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted md:text-base">
              Classes, camps, museums, events and more. All in one place for NYC
              families.
            </p>
            <div className="mt-7">
              <SearchBar />
            </div>
          </div>

          <div
            className="animate-soft-pop relative mx-auto aspect-square w-full max-w-[440px] overflow-hidden rounded-sm md:mx-0 md:max-w-none"
            style={{ animationDelay: "120ms" }}
          >
            <Image
              src="/uws-map.jpg"
              alt="Watercolor map of the Upper West Side"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 440px"
            />
          </div>
        </div>
      </section>

      {/* Explore by Interest */}
      <section className="mx-auto max-w-6xl px-4 pb-14 md:px-6">
        <h2 className="mb-7 text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
          Explore by Interest
        </h2>
        <InterestOrbs />
      </section>

      {/* Highlights */}
      {highlights.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14 md:px-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              Highlights
            </h2>
            <Link
              href="/activities?neighborhood=Upper+West+Side"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              explore all UWS activities →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((activity) => (
              <ActivityCard
                key={activity["Activity ID"]}
                activity={activity}
                variant="highlight"
              />
            ))}
          </div>
        </section>
      )}

      {/* Fall Favorites */}
      <section className="mx-auto max-w-6xl px-4 pb-14 md:px-6">
        <h2 className="mb-5 text-xl font-extrabold tracking-tight text-foreground">
          Fall Favorites
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(fallFavorites.length > 0
            ? fallFavorites
            : allActivities.slice(0, 4)
          ).map((activity) => (
            <ActivityCard
              key={activity["Activity ID"]}
              activity={activity}
              variant="compact"
            />
          ))}
        </div>
      </section>

      {/* Type shortcuts */}
      <section className="mx-auto max-w-6xl px-4 pb-14 md:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              href: "/activities?type=Afterschool+Program&neighborhood=all",
              title: "Afterschool Programs",
              desc: "Regular enrichment classes and programs for school-age kids.",
              emoji: "🏫",
            },
            {
              href: "/activities?type=Camp&neighborhood=all",
              title: "Camps & Workshops",
              desc: "Day camps, weekend workshops, and intensive programs.",
              emoji: "⛺",
            },
            {
              href: "/activities?type=Event&neighborhood=all",
              title: "Upcoming Events",
              desc: "One-time events, performances, and special programming.",
              emoji: "🎉",
            },
            {
              href: "/activities?type=Drop-in&neighborhood=all",
              title: "Drop-in Activities",
              desc: "No registration required — just show up and play.",
              emoji: "🚶",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-border/80 bg-surface p-6 transition-all hover:border-accent/40 hover:shadow-sm"
            >
              <div className="mb-2 text-3xl">{item.emoji}</div>
              <h3 className="mb-1 text-lg font-bold text-foreground group-hover:text-accent">
                {item.title}
              </h3>
              <p className="text-sm text-muted">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <div className="rounded-3xl bg-foreground px-8 py-10 text-center text-white">
          <h2 className="mb-2 text-2xl font-extrabold">Know of a great activity?</h2>
          <p className="mb-5 text-sm text-white/70">
            We&apos;re always looking to expand our database with new activities for
            NYC families.
          </p>
          <Link
            href="/admin"
            className="inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Submit an Activity
          </Link>
        </div>
      </section>
    </div>
  );
}
