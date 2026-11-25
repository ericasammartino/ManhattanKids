import Link from "next/link";
import type { EnrichedActivity } from "@/types";
import {
  CATEGORY_ICONS,
  formatAgeRange,
  PLACEHOLDER_IMAGES,
  resolveActivityImage,
} from "@/lib/data";
import {
  getCategoryPillStyle,
  normalizePrimaryCategory,
} from "@/lib/taxonomy";
import { MapPin, Clock, Calendar } from "lucide-react";
import OrgLogoMark from "@/components/OrgLogoMark";

interface Props {
  activity: EnrichedActivity;
  variant?: "default" | "compact" | "highlight";
}

export { PLACEHOLDER_IMAGES };

export default function ActivityCard({ activity, variant = "default" }: Props) {
  const category =
    normalizePrimaryCategory(activity["Primary Category"]) ?? "default";
  const pillStyle = getCategoryPillStyle(
    category === "default" ? null : category
  );
  const icon = CATEGORY_ICONS[category] ?? "🎯";
  const { src: imgSrc, isLogo, textFallback } = resolveActivityImage(activity);
  const imgClass = isLogo
    ? "w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-300"
    : "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300";
  const imgWrapClass =
    isLogo || textFallback
      ? "relative overflow-hidden bg-[#f3eee4]"
      : "relative overflow-hidden bg-gray-100";
  const logoMark = (
    <OrgLogoMark
      src={imgSrc}
      alt={
        activity.organization?.["Organization Name"] ?? activity["Activity Name"]
      }
      textFallback={textFallback}
      isLogo={isLogo}
      className={imgClass}
      textClassName="text-sm sm:text-base px-4"
    />
  );
  const ageRange = formatAgeRange(activity["Age Minimum"], activity["Age Maximum"]);
  const locationName = activity.location?.["Location Name"] ?? activity["Default Location Name"] ?? "";
  const neighborhood = activity.location?.["Neighborhood"];
  const nextSession = activity.sessions?.[0];

  if (variant === "highlight") {
    return (
      <Link href={`/activities/${activity["Activity ID"]}`} className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className={`${imgWrapClass} h-44`}>{logoMark}</div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
              {activity["Activity Name"]}
            </h3>
            {nextSession?.["Start Date"] && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(nextSession["Start Date"]).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                  {nextSession["Start Time"] && ` @ ${nextSession["Start Time"].replace(":00", "")}`}
                </span>
              </div>
            )}
            {(locationName || neighborhood) && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{neighborhood ?? locationName}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={`/activities/${activity["Activity ID"]}`} className="block group">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className={`${imgWrapClass} h-32`}>{logoMark}</div>
          <div className="p-3">
            <p className="font-medium text-sm text-gray-900 leading-tight line-clamp-2 mb-1">
              {activity["Activity Name"]}
            </p>
            {locationName && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{locationName}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/activities/${activity["Activity ID"]}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden">
        <div className={`${imgWrapClass} h-48`}>
          {logoMark}
          {category && category !== "default" && (
            <span
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: pillStyle.background,
                color: pillStyle.color,
              }}
            >
              {icon} {category}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-green-800 transition-colors">
            {activity["Activity Name"]}
          </h3>
          {activity["Description"] && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {activity["Description"]}
            </p>
          )}
          <div className="flex flex-wrap gap-y-1.5 gap-x-3 text-xs text-gray-500">
            {(locationName || neighborhood) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {neighborhood ?? locationName}
              </span>
            )}
            {ageRange && (
              <span className="flex items-center gap-1">
                👦 {ageRange}
              </span>
            )}
            {nextSession?.["Start Time"] && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {nextSession["Start Time"]}
              </span>
            )}
          </div>
          {activity["Activity Type"] && (
            <div className="mt-3">
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {activity["Activity Type"]}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
