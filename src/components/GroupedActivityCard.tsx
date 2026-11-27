"use client";

import { useMemo } from "react";
import type { EnrichedActivity } from "@/types";
import {
  formatAgeRange,
  resolveActivityImage,
  safeExternalUrl,
} from "@/lib/data";
import {
  displaySubcategory,
  formatDayRange,
  getCategoryPillStyle,
  normalizePrimaryCategory,
  parseDaysOfWeek,
  splitSubcategories,
} from "@/lib/taxonomy";
import {
  collectSessionDays,
  formatPriceWithFrequency,
  formatSessionTimeRange,
  sessionDurationMinutes,
  sessionSeasonMeta,
  sortSessionsByDay,
} from "@/lib/session-display";
import OrgLogoMark from "@/components/OrgLogoMark";
import {
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Info,
  MapPin,
  Users,
} from "lucide-react";

interface Props {
  activity: EnrichedActivity;
  /** Controlled expand state for accordion (one open at a time). */
  expanded?: boolean;
  onToggle?: () => void;
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

export default function GroupedActivityCard({
  activity,
  expanded: expandedProp,
  onToggle,
}: Props) {
  const sessions = useMemo(
    () => sortSessionsByDay(activity.sessions ?? []),
    [activity.sessions]
  );
  const expanded = Boolean(expandedProp);

  const category = displayPrimaryCategory(activity["Primary Category"]);
  const subcategory = displaySubcategory(activity.Subcategory);
  const taxonomyPill = [category, subcategory].filter(Boolean).join(" • ");
  const categoryPillStyle = getCategoryPillStyle(category);

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
    safeExternalUrl(activity["Registration URL"]) ||
    safeExternalUrl(activity["Source URL"]) ||
    safeExternalUrl(activity.organization?.Website) ||
    safeExternalUrl(activity.location?.Website) ||
    null;
  const cardNotes = useMemo(() => {
    const dayNotePairs: { day: string | null; note: string }[] = [];
    const distinctSessionNotes = new Set<string>();
    for (const session of sessions) {
      const note = session.Notes?.trim();
      if (!note) continue;
      distinctSessionNotes.add(note);
      const day = parseDaysOfWeek(session["Days of the Week"])[0] ?? null;
      dayNotePairs.push({ day, note });
    }
    if (distinctSessionNotes.size > 1) {
      const seen = new Set<string>();
      const lines: string[] = [];
      for (const { day, note } of dayNotePairs) {
        const line = day ? `${day}: ${note}` : note;
        if (!seen.has(line)) {
          seen.add(line);
          lines.push(line);
        }
      }
      return lines;
    }
    const single =
      activity["Notes"]?.trim() ||
      (distinctSessionNotes.size === 1 ? [...distinctSessionNotes][0] : null);
    return single ? [single] : [];
  }, [activity, sessions]);
  const priceLabel = formatPriceWithFrequency(sessions);
  const { src: imgSrc, isLogo, textFallback } = resolveActivityImage(activity);
  const { seasonBadge, dateRange } = sessionSeasonMeta(sessions);

  function toggleExpanded() {
    onToggle?.();
  }

  if (expanded) {
    const seasonLine = [seasonBadge, dateRange].filter(Boolean).join(": ");
    return (
      <article className="open-class-card flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[#E8E2D8] bg-white shadow-[0_12px_32px_rgba(29,43,75,0.08)] xl:col-span-2">
        <div className="open-class-card__header relative flex flex-1 flex-col gap-4 p-4 sm:p-5">
          {/* Header: logo | divider | taxonomy + title */}
          <div className="relative z-[1] flex gap-3 sm:gap-4">
            <div className="flex w-[120px] flex-shrink-0 flex-col items-center justify-center sm:w-[144px]">
              <div className="flex h-[88px] w-full items-center justify-center overflow-hidden rounded-xl border border-[#E5DFD5] bg-white px-2.5 py-2 sm:h-[100px]">
                <OrgLogoMark
                  src={imgSrc}
                  alt={provider || activity["Activity Name"]}
                  textFallback={textFallback}
                  isLogo={isLogo}
                  className="max-h-full max-w-full object-contain"
                  textClassName="text-xs sm:text-[13px]"
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
                <span
                  className="inline-flex max-w-full truncate rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide"
                  style={{
                    backgroundColor: categoryPillStyle.background,
                    color: categoryPillStyle.color,
                  }}
                >
                  {taxonomyPill}
                </span>
              )}
              <h3 className="mt-2 text-[1.05rem] font-extrabold leading-snug tracking-tight text-[#1D2B4B] sm:text-[1.15rem]">
                {activity["Activity Name"]}
              </h3>
              {activity["Description"]?.trim() && (
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B6578] sm:text-[14px]">
                  {activity["Description"].trim()}
                </p>
              )}
            </div>
          </div>

          {/* Info row: age pill + season/date + location */}
          <div className="relative z-[1] flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
            {ageRange && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE8C2] px-3.5 py-1.5 text-[13.5px] font-bold text-[#7A4B2A] sm:text-[14px]">
                <Users className="h-4 w-4 flex-shrink-0" aria-hidden />
                {ageRange}
              </span>
            )}
            {(seasonLine || daySummary) && (
              <>
                <span className="hidden h-[18px] w-px bg-[#E5E0D8] sm:block" aria-hidden />
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[14px] font-semibold text-[#1D2B4B] sm:text-[14.5px]">
                  <Calendar className="h-4 w-4 flex-shrink-0 text-[#6B6578]" aria-hidden />
                  <span className="truncate">
                    {seasonLine || daySummary}
                  </span>
                </span>
              </>
            )}
            {locationLabel && (
              <>
                <span className="hidden h-[18px] w-px bg-[#E5E0D8] sm:block" aria-hidden />
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[14px] font-semibold text-[#1D2B4B] sm:text-[14.5px]">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-[#6B6578]" aria-hidden />
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
              className="relative z-[1] -mt-1 inline-flex w-fit items-center gap-1 text-[12px] font-semibold text-[#3B6EA5] transition-colors hover:text-[#1D2B4B] hover:underline"
            >
              <span>Website</span>
              <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            </a>
          )}

          <p className="relative z-[1] text-[13px] font-bold text-[#1D2B4B]">
            {priceLabel}
          </p>

          {cardNotes.length > 0 && (
            <div
              className="relative z-[1] flex flex-wrap gap-2"
              aria-label="Notes"
            >
              {cardNotes.map((line) => (
                <span
                  key={line}
                  className="inline-flex max-w-full items-start gap-1.5 rounded-2xl border border-[#E8E1D5] bg-[#F8F5F0] px-3 py-1.5 text-[12px] font-medium leading-snug text-[#5A5466]"
                >
                  <Info
                    className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#8A8094]"
                    aria-hidden
                  />
                  <span className="break-words">{line}</span>
                </span>
              ))}
            </div>
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
          <div className="flex h-[68px] w-[68px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5DFD5] bg-white sm:h-[76px] sm:w-[76px]">
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
              textClassName="text-[10px] sm:text-[11px] px-1.5"
            />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            {category && (
              <span
                className="mb-1 inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide"
                style={{
                  backgroundColor: categoryPillStyle.background,
                  color: categoryPillStyle.color,
                }}
              >
                {category}
              </span>
            )}
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-[#1D2B4B]">
              {activity["Activity Name"]}
            </h3>
            {provider && (
              <p className="mt-0.5 truncate text-[13px] text-[#8A8494]">
                {provider}
              </p>
            )}
          </div>
        </div>

        {/* Meta: ages + days; location */}
        <div className="mb-3 mt-3.5 space-y-2 text-[12px] text-[#4B5563]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {ageRange && (
              <p className="inline-flex items-center gap-1.5">
                <Users
                  className="h-3.5 w-3.5 flex-shrink-0 text-[#6B6578]"
                  aria-hidden
                />
                <span>{ageRange}</span>
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

        {/* Footer: price / frequency | View class times */}
        <div className="mt-auto flex flex-nowrap items-center justify-between gap-2 border-t border-[#EEE9E1] pt-3">
          <p
            title={priceLabel}
            className="min-w-0 flex-1 truncate whitespace-nowrap text-[11.5px] font-bold leading-none text-[#1D2B4B] sm:text-[12px]"
          >
            {priceLabel}
          </p>
          <button
            type="button"
            onClick={toggleExpanded}
            className="inline-flex flex-shrink-0 items-center gap-0.5 whitespace-nowrap text-[11.5px] font-semibold leading-none text-[#3B6EA5] transition-colors hover:text-[#1D2B4B] sm:text-[12px]"
          >
            View class times
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
