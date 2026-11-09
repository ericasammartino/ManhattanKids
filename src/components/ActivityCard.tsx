import Link from "next/link";
import type { EnrichedActivity } from "@/types";
import { CATEGORY_COLORS, CATEGORY_ICONS, formatAgeRange } from "@/lib/data";
import { MapPin, Clock, Calendar } from "lucide-react";
import ActivityImage from "@/components/ActivityImage";

interface Props {
  activity: EnrichedActivity;
  variant?: "default" | "compact" | "highlight";
}

export const PLACEHOLDER_IMAGES: Record<string, string> = {
  "Arts & Creativity": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop",
  "Sports & Movement": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&h=300&fit=crop",
  "STEM & Discovery": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
  "Museums & Culture": "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop",
  "Events & Experiences": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
  "Learning & Enrichment": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
  "Entertainment": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop",
  "Nature & Outdoors": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
  "Food & Cooking": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
  "default": "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop",
};

export default function ActivityCard({ activity, variant = "default" }: Props) {
  const category = activity["Primary Category"] ?? "default";
  const colorClass = CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-700";
  const icon = CATEGORY_ICONS[category] ?? "🎯";
  const imgSrc = activity["Image URL"] ?? PLACEHOLDER_IMAGES[category] ?? PLACEHOLDER_IMAGES["default"];
  const ageRange = formatAgeRange(activity["Age Minimum"], activity["Age Maximum"]);
  const locationName = activity.location?.["Location Name"] ?? activity["Default Location Name"] ?? "";
  const neighborhood = activity.location?.["Neighborhood"];
  const nextSession = activity.sessions?.[0];

  if (variant === "highlight") {
    return (
      <Link href={`/activities/${activity["Activity ID"]}`} className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="relative h-44 overflow-hidden bg-gray-100">
            <ActivityImage
              src={imgSrc}
              alt={activity["Activity Name"]}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
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
          <div className="relative h-32 overflow-hidden bg-gray-100">
            <ActivityImage
              src={imgSrc}
              alt={activity["Activity Name"]}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
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
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <ActivityImage
            src={imgSrc}
            alt={activity["Activity Name"]}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {category && category !== "default" && (
            <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
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
