import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getActivityById,
  getEnrichedActivities,
  formatAgeRange,
  formatDate,
  formatTime,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from "@/lib/data";
import { MapPin, Clock, Calendar, ExternalLink, ArrowLeft, Tag } from "lucide-react";
import ActivityImage from "@/components/ActivityImage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const activities = getEnrichedActivities();
  return activities.map((a) => ({ id: a["Activity ID"] }));
}

export default async function ActivityDetailPage({ params }: Props) {
  const { id } = await params;
  const activity = getActivityById(id);

  if (!activity) notFound();

  const category = activity["Primary Category"] ?? "";
  const colorClass = CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-700";
  const icon = CATEGORY_ICONS[category] ?? "🎯";
  const ageRange = formatAgeRange(activity["Age Minimum"], activity["Age Maximum"]);

  const imgSrc =
    activity["Image URL"] ??
    "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=400&fit=crop";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href="/activities"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to activities
      </Link>

      {/* Hero image */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-gray-100 mb-6">
          <ActivityImage
          src={imgSrc}
          alt={activity["Activity Name"]}
          className="w-full h-full object-cover"
        />
        {category && (
          <span
            className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-semibold ${colorClass}`}
          >
            {icon} {category}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="md:col-span-2">
          <div className="mb-1 text-sm text-gray-500 font-medium">
            {activity.organization?.["Organization Name"]}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {activity["Activity Name"]}
          </h1>

          {activity["Description"] && (
            <p className="text-gray-600 leading-relaxed mb-6">
              {activity["Description"]}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {activity["Activity Type"] && (
              <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                <Tag className="w-3.5 h-3.5" />
                {activity["Activity Type"]}
              </span>
            )}
            {activity["Schedule Pattern"] && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {activity["Schedule Pattern"]}
              </span>
            )}
            {activity["Setting"] && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {activity["Setting"]}
              </span>
            )}
            {activity["Seasonal Tags"] && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                🍂 {activity["Seasonal Tags"]}
              </span>
            )}
          </div>

          {/* Upcoming sessions */}
          {(activity.sessions?.length ?? 0) > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Upcoming Sessions
              </h2>
              <div className="space-y-3">
                {activity.sessions!.map((session) => (
                  <div
                    key={session["Session ID"]}
                    className="p-4 rounded-xl border border-gray-200 bg-white"
                  >
                    <div className="flex flex-wrap gap-3 text-sm">
                      {session["Start Date"] && (
                        <span className="flex items-center gap-1.5 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(session["Start Date"])}
                        </span>
                      )}
                      {session["Start Time"] && (
                        <span className="flex items-center gap-1.5 text-gray-700">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatTime(session["Start Time"])}
                          {session["End Time"] && ` – ${formatTime(session["End Time"])}`}
                        </span>
                      )}
                    </div>
                    {session["Notes"] && (
                      <p className="text-xs text-gray-500 mt-1.5">{session["Notes"]}</p>
                    )}
                    {session["Registration URL"] && (
                      <a
                        href={session["Registration URL"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
                      >
                        Register <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {activity["Notes"] && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
              <span className="font-semibold">Note: </span>
              {activity["Notes"]}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick info card */}
          <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
              Details
            </h3>

            {ageRange && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Age Range</div>
                <div className="text-sm font-medium text-gray-900">👦 {ageRange}</div>
              </div>
            )}

            {(activity["Price Minimum"] !== null ||
              activity["Price Maximum"] !== null) && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Price</div>
                <div className="text-sm font-medium text-gray-900">
                  {activity["Price Minimum"] === 0 && activity["Price Maximum"] === 0
                    ? "Free"
                    : activity["Price Minimum"] !== null && activity["Price Maximum"] !== null
                    ? `$${activity["Price Minimum"]}–$${activity["Price Maximum"]}`
                    : activity["Price Minimum"] !== null
                    ? `From $${activity["Price Minimum"]}`
                    : `Up to $${activity["Price Maximum"]}`}
                </div>
              </div>
            )}

            {activity["Registration Requirement"] && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Registration</div>
                <div className="text-sm font-medium text-gray-900">
                  {activity["Registration Requirement"]}
                </div>
              </div>
            )}

            {activity["Drop-Off Allowed"] && (
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Drop-off</div>
                <div className="text-sm font-medium text-gray-900">
                  {activity["Drop-Off Allowed"]}
                </div>
              </div>
            )}

            {activity["Registration URL"] && (
              <a
                href={activity["Registration URL"]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: "#2d5a3d" }}
              >
                Register / Learn More
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {activity["Source URL"] && !activity["Registration URL"] && (
              <a
                href={activity["Source URL"]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: "#2d5a3d" }}
              >
                View Details
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Location card */}
          {activity.location && (
            <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                Location
              </h3>
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  {activity.location["Location Name"]}
                </div>
                {activity.location["Street Address"] && (
                  <div className="flex items-start gap-1.5 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>
                      {activity.location["Street Address"]}
                      {activity.location["Neighborhood"] &&
                        `, ${activity.location["Neighborhood"]}`}
                    </span>
                  </div>
                )}
                {activity.location["Zip Code"] && (
                  <div className="text-sm text-gray-500 ml-5.5">
                    NYC {activity.location["Zip Code"]}
                  </div>
                )}
              </div>
              {activity.location["Website"] && (
                <a
                  href={activity.location["Website"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
                >
                  Visit website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
