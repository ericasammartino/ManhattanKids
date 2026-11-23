"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { EnrichedActivity } from "@/types";
import {
  formatAgeRange,
  resolveActivityImage,
} from "@/lib/data";
import {
  displaySubcategory,
  formatDayRange,
  normalizePrimaryCategory,
  parseDaysOfWeek,
  splitSubcategories,
} from "@/lib/taxonomy";
import {
  collectSessionDays,
  formatSessionTimeRange,
  minPriceAmount,
  sessionDurationMinutes,
  sessionSeasonMeta,
  sortSessionsByDay,
} from "@/lib/session-display";
import OrgLogoMark from "@/components/OrgLogoMark";
import {
  Calendar,
  ChevronDown,
  ExternalLink,
  MapPin,
  Users,
} from "lucide-react";

interface Props {
  activity: EnrichedActivity;
}

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

function shortDaySummary(days: string[]): string | null {
  const range = formatDayRange(days);
  if (!range) return null;
  return range.replace(
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g,
    (day) => DAY_SHORT[day] ?? day
  );
}

function displayPrimaryCategory(raw: string | null | undefined): string | null {
  const tokens = splitSubcategories(raw)
    .map((t) => normalizePrimaryCategory(t))
    .filter((t): t is string => Boolean(t));
  if (tokens.length > 0) return tokens[0];
  return normalizePrimaryCategory(raw);
}

export default function GroupedActivityCard({ activity }: Props) {
  const sessions = useMemo(
    () => sortSessionsByDay(activity.sessions ?? []),
    [activity.sessions]
  );
  const [expanded, setExpanded] = useState(false);

  const category = displayPrimaryCategory(activity["Primary Category"]);
  const subcategory = displaySubcategory(activity.Subcategory);
  const taxonomyPill = [category, subcategory].filter(Boolean).join(" • ");

  const provider =
    activity.organization?.["Organization Name"] ??
    activity["Default Location Name"] ??
    "";
  const ageRange = formatAgeRange(
    activity["Age Minimum"],
    activity["Age Maximum"]
  );
  const daySummary = shortDaySummary(collectSessionDays(sessions));
  const crossStreets = activity.location?.["Cross Streets"]?.trim() || "";
  const locationLabel =
    crossStreets ||
    activity.location?.["Location Name"]?.trim() ||
    activity.location?.["Neighborhood"]?.trim() ||
    activity["Default Location Name"]?.trim() ||
    "";
  const website =
    activity.organization?.Website?.trim() ||
    activity["Registration URL"]?.trim() ||
    activity["Source URL"]?.trim() ||
    activity.location?.Website?.trim() ||
    "";
  const fromPrice = minPriceAmount(sessions);
  const { src: imgSrc, isLogo, textFallback } = resolveActivityImage(activity);
  const { seasonBadge, dateRange } = sessionSeasonMeta(sessions);

  function toggleExpanded() {
    setExpanded((prev) => !prev);
  }

  if (expanded) {
    const seasonLine = [seasonBadge, dateRange].filter(Boolean).join(": ");
    return (
      <article className="open-class-card flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[#E8E2D8] bg-white shadow-[0_12px_32px_rgba(29,43,75,0.08)] xl:col-span-2">
        <div className="open-class-card__header relative flex flex-1 flex-col gap-4 p-4 sm:p-5">
          {/* Header: logo | divider | taxonomy + title */}
          <div className="relative z-[1] flex gap-3 sm:gap-4">
            <div className="flex w-[88px] flex-shrink-0 flex-col items-center justify-center sm:w-[104px]">
              <div className="flex h-16 w-full items-center justify-center rounded-xl bg-[#FFF6F0] px-2 py-2 sm:h-[72px]">
                <OrgLogoMark
                  src={imgSrc}
                  alt={provider || activity["Activity Name"]}
                  textFallback={textFallback}
                  isLogo={isLogo}
                  className="max-h-full max-w-full object-contain"
                  textClassName="text-[11px] sm:text-xs"
                />
              </div>
              {provider && !textFallback && (
                <p className="mt-1.5 line-clamp-2 text-center text-[10px] font-semibold leading-tight text-[#1D2B4B]/80">
                  {provider}
                </p>
              )}
            </div>

            <div
              className="hidden w-px flex-shrink-0 self-stretch bg-[#E5E0D8] sm:block"
              aria-hidden
            />

            <div className="min-w-0 flex-1 pt-0.5">
              {taxonomyPill && (
                <span className="inline-flex max-w-full truncate rounded-full bg-[#EDE4F5] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#6B4C8A]">
                  {taxonomyPill}
                </span>
              )}
              <h3 className="mt-2 text-[1.05rem] font-extrabold leading-snug tracking-tight text-[#1D2B4B] sm:text-[1.15rem]">
                <Link
                  href={`/activities/${activity["Activity ID"]}`}
                  className="hover:underline"
                >
                  {activity["Activity Name"]}
                </Link>
              </h3>
            </div>
          </div>

          {/* Info row: age pill + season/date */}
          <div className="relative z-[1] flex flex-wrap items-center gap-x-3 gap-y-2">
            {ageRange && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE8C2] px-2.5 py-1 text-[11px] font-semibold text-[#8A5A3B]">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {ageRange}
              </span>
            )}
            {(seasonLine || daySummary) && (
              <>
                <span className="hidden h-4 w-px bg-[#E5E0D8] sm:block" aria-hidden />
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-[#4B5563]">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-[#6B6578]" aria-hidden />
                  <span className="truncate">
                    {seasonLine || daySummary}
                  </span>
                </span>
              </>
            )}
            {locationLabel && (
              <>
                <span className="hidden h-4 w-px bg-[#E5E0D8] sm:block" aria-hidden />
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-[#4B5563]">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#6B6578]" aria-hidden />
                  <span className="truncate">{locationLabel}</span>
                </span>
              </>
            )}
          </div>

          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-[1] -mt-1 inline-flex max-w-full items-center gap-1.5 text-[12px] font-semibold text-[#1D2B4B] hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
              <span className="truncate">
                {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
            </a>
          )}

          {/* Plain class-time schedule (non-interactive) */}
          {sessions.length > 0 && (
            <div className="relative z-[1]">
              <h4 className="text-[13px] font-bold text-[#1D2B4B]">
                Class times
              </h4>
              <ul className="mt-2.5 space-y-2">
                {sessions.map((session) => {
                  const id = session["Session ID"];
                  const day =
                    parseDaysOfWeek(session["Days of the Week"])[0] ?? "Day TBA";
                  const time = formatSessionTimeRange(
                    session["Start Time"],
                    session["End Time"]
                  );
                  const mins = sessionDurationMinutes(
                    session["Start Time"],
                    session["End Time"]
                  );
                  return (
                    <li
                      key={id}
                      className="flex w-full items-center gap-3 rounded-xl border border-[#E8E2D8] bg-[#FBF9F6] px-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#1D2B4B]">
                        {day}
                      </span>
                      <span className="text-[12px] font-medium text-[#374151]">
                        {time}
                      </span>
                      {mins != null && (
                        <span className="w-12 text-right text-[12px] text-[#9CA3AF]">
                          {mins} min
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-center pb-3 pt-0">
          <button
            type="button"
            onClick={toggleExpanded}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E2D8] text-[#6B6578] transition-colors hover:bg-[#FFF6F0]"
            aria-label="Collapse class times"
          >
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[14px] border border-[#E8E4DC] bg-white shadow-[0_4px_16px_rgba(29,43,75,0.06)]">
      <div className="flex flex-1 flex-col px-4 pb-3.5 pt-4 sm:px-5">
        {/* Header: logo | title + org */}
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#FFF8F2] sm:h-14 sm:w-14">
            <OrgLogoMark
              src={imgSrc}
              alt={provider || activity["Activity Name"]}
              textFallback={textFallback}
              isLogo={isLogo}
              className={
                isLogo
                  ? "h-full w-full object-contain p-1.5"
                  : "h-full w-full object-cover"
              }
              textClassName="text-[9px] sm:text-[10px] px-1"
            />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-[#1D2B4B]">
              <Link
                href={`/activities/${activity["Activity ID"]}`}
                className="hover:underline"
              >
                {activity["Activity Name"]}
              </Link>
            </h3>
            {provider && (
              <p className="mt-0.5 truncate text-[13px] text-[#8A8494]">
                {provider}
              </p>
            )}
          </div>
        </div>

        {/* Meta: ages + days; location */}
        <div className="mt-3.5 space-y-2 text-[12px] text-[#4B5563]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {ageRange && (
              <p className="inline-flex items-center gap-1.5">
                <Users
                  className="h-3.5 w-3.5 flex-shrink-0 text-[#6B6578]"
                  aria-hidden
                />
                <span className="rounded-full bg-[#FFE8C2] px-2 py-0.5 text-[11px] font-medium text-[#8A5A3B]">
                  {ageRange}
                </span>
              </p>
            )}
            {daySummary && (
              <p className="inline-flex min-w-0 items-center gap-1.5">
                <Calendar
                  className="h-3.5 w-3.5 flex-shrink-0 text-[#6B6578]"
                  aria-hidden
                />
                <span className="truncate">{daySummary}</span>
              </p>
            )}
          </div>
          {locationLabel && (
            <p className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin
                className="h-3.5 w-3.5 flex-shrink-0 text-[#6B6578]"
                aria-hidden
              />
              <span className="truncate">{locationLabel}</span>
            </p>
          )}
        </div>

        {/* Footer: price | View class times */}
        <div className="mt-auto flex items-center gap-3 border-t border-[#EEE9E1] pt-3">
          <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#1D2B4B]">
            {fromPrice != null
              ? `From $${fromPrice} / session`
              : "Pricing varies"}
          </p>
          <span className="h-4 w-px flex-shrink-0 bg-[#E5E0D8]" aria-hidden />
          <button
            type="button"
            onClick={toggleExpanded}
            className="inline-flex flex-shrink-0 items-center gap-1 text-[12px] font-semibold text-[#3B6EA5] transition-colors hover:text-[#1D2B4B]"
          >
            View class times
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
