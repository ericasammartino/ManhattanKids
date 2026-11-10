import Link from "next/link";
import { getEnrichedActivities, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/data";
import ActivityCard from "@/components/ActivityCard";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  const allActivities = getEnrichedActivities();

  // UWS activities first
  const uwsActivities = allActivities.filter(
    (a) => a.location?.["Neighborhood"] === "Upper West Side"
  );

  // Pick highlights — UWS activities with sessions (upcoming events)
  const withSessions = uwsActivities.filter((a) => (a.sessions?.length ?? 0) > 0);
  const highlights = withSessions.slice(0, 3);

  // Fall favorites — UWS curated set
  const fallFavorites = uwsActivities
    .filter((a) => a["Seasonal Tags"]?.includes("Fall") || a["Activity Type"] === "Event")
    .slice(0, 4);

  const afterschool = allActivities
    .filter((a) => a["Activity Type"] === "Afterschool Program")
    .slice(0, 4);

  const stats = {
    activities: allActivities.length,
    organizations: new Set(allActivities.map((a) => a["Organization ID"])).size,
    neighborhoods: new Set(
      allActivities.map((a) => a.location?.["Neighborhood"]).filter(Boolean)
    ).size,
  };

  const categories = CATEGORIES.slice(0, 5);

  return (
    <div>
      {/* Hero */}
      <section className="px-4 pt-12 pb-10 max-w-6xl mx-auto">
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold mb-4">
            📍 Starting with the Upper West Side
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-3">
            The Best Kids&apos; Activities on the Upper West Side
          </h1>
          <p className="text-gray-500 text-base mb-6">
            Classes, camps, museums, events and more — curated for UWS families. Expanding across Manhattan soon.
          </p>
          <SearchBar />
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-6 mt-8">
          <div className="text-sm text-gray-500">
            <span className="font-bold text-gray-900 text-lg">{stats.activities}+</span> activities
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-bold text-gray-900 text-lg">{stats.organizations}+</span> organizations
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <span className="font-bold text-gray-900 text-lg">🏘️</span> Upper West Side
          </div>
        </div>
      </section>

      {/* Explore by Interest */}
      <section className="px-4 pb-12 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Explore by Interest</h2>
        <div className="flex flex-wrap gap-4">
          {categories.map((category) => {
            const colorClass = CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-700";
            const icon = CATEGORY_ICONS[category] ?? "🎯";
            const bg = colorClass.split(" ")[0];
            return (
              <Link
                key={category}
                href={`/activities?category=${encodeURIComponent(category)}`}
                className={`flex flex-col items-center justify-center w-24 h-24 rounded-full ${bg} hover:opacity-80 transition-opacity cursor-pointer`}
              >
                <span className="text-2xl mb-1">{icon}</span>
                <span className="text-xs font-semibold text-center leading-tight px-2 text-gray-800">
                  {category}
                </span>
              </Link>
            );
          })}
          <Link
            href="/activities?neighborhood=Upper+West+Side"
            className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <span className="text-2xl mb-1">→</span>
            <span className="text-xs font-semibold text-center text-gray-600">View All</span>
          </Link>
        </div>
      </section>

      {/* Highlights */}
      {highlights.length > 0 && (
        <section className="px-4 pb-12 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Highlights</h2>
            <Link
              href="/activities"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              explore all UWS activities →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {highlights.map((activity) => (
              <ActivityCard key={activity["Activity ID"]} activity={activity} variant="highlight" />
            ))}
          </div>
        </section>
      )}

      {/* Fall Favorites */}
      <section className="px-4 pb-12 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Fall Favorites</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(fallFavorites.length > 0 ? fallFavorites : allActivities.slice(0, 4)).map((activity) => (
            <ActivityCard key={activity["Activity ID"]} activity={activity} variant="compact" />
          ))}
        </div>
      </section>

      {/* More sections */}
      <section className="px-4 pb-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/activities?type=Afterschool+Program"
            className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all"
          >
            <div className="text-3xl mb-2">🏫</div>
            <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-green-800">
              Afterschool Programs
            </h3>
            <p className="text-sm text-gray-500">
              Regular enrichment classes and programs for school-age kids.
            </p>
          </Link>

          <Link
            href="/activities?type=Camp"
            className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all"
          >
            <div className="text-3xl mb-2">⛺</div>
            <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-800">
              Camps & Workshops
            </h3>
            <p className="text-sm text-gray-500">
              Day camps, weekend workshops, and intensive programs.
            </p>
          </Link>

          <Link
            href="/activities?type=Event"
            className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-yellow-200 hover:bg-yellow-50 transition-all"
          >
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-yellow-800">
              Upcoming Events
            </h3>
            <p className="text-sm text-gray-500">
              One-time events, performances, and special programming.
            </p>
          </Link>

          <Link
            href="/activities?type=Drop-in"
            className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-rose-200 hover:bg-rose-50 transition-all"
          >
            <div className="text-3xl mb-2">🚶</div>
            <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-rose-800">
              Drop-in Activities
            </h3>
            <p className="text-sm text-gray-500">
              No registration required — just show up and play.
            </p>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 max-w-6xl mx-auto">
        <div
          className="rounded-3xl p-8 text-white text-center"
          style={{ background: "linear-gradient(135deg, #2d5a3d, #4a7c5f)" }}
        >
          <h2 className="text-2xl font-bold mb-2">Know of a great activity?</h2>
          <p className="text-green-100 mb-5 text-sm">
            We&apos;re always looking to expand our database with new activities for NYC families.
          </p>
          <Link
            href="/admin"
            className="inline-block px-6 py-2.5 bg-white text-green-800 font-semibold rounded-full hover:bg-green-50 transition-colors"
          >
            Submit an Activity
          </Link>
        </div>
      </section>
    </div>
  );
}
