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
  estimatedPriceForSelection,
  formatSessionTimeRange,
  maxSelectableClassTimes,
  minPriceAmount,
  pricingFootnote,
  sessionDurationMinutes,
  sessionSeasonMeta,
  sortSessionsByDay,
} from "@/lib/session-display";
import ActivityImage from "@/components/ActivityImage";
import {
  Calendar,
  Check,
  ChevronDown,
  Copy,
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

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
  const locationLabel =
    activity.location?.["Location Name"]?.trim() ||
    activity.location?.["Neighborhood"]?.trim() ||
    activity["Default Location Name"]?.trim() ||
    "";
  const fromPrice = minPriceAmount(sessions);
  const priceNote = pricingFootnote(sessions);
  const { src: imgSrc, isLogo } = resolveActivityImage(activity);
  const { seasonBadge, dateRange } = sessionSeasonMeta(sessions);
  const maxSelect = maxSelectableClassTimes(sessions);

  const estimate = estimatedPriceForSelection(
    sessions,
    Math.max(1, selectedIds.length)
  );

  function toggleExpanded() {
    setExpanded((prev) => {
      const next = !prev;
      if (next && selectedIds.length === 0 && sessions[0]) {
        setSelectedIds([sessions[0]["Session ID"]]);
      }
      return next;
    });
  }

  function toggleSession(sessionId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(sessionId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== sessionId);
      }
      if (maxSelect <= 1) return [sessionId];
      if (prev.length >= maxSelect) {
        return [...prev.slice(1), sessionId];
      }
      return [...prev, sessionId];
    });
  }

  async function copySelection() {
    const chosen = sessions.filter((s) =>
      selectedIds.includes(s["Session ID"])
    );
    const lines = [
      activity["Activity Name"],
      provider,
      ageRange,
      seasonBadge && dateRange
        ? `${seasonBadge} · ${dateRange}`
        : seasonBadge || dateRange || "",
      "",
      "Class times:",
      ...chosen.map((s) => {
        const day = parseDaysOfWeek(s["Days of the Week"])[0] ?? "Day";
        const time = formatSessionTimeRange(s["Start Time"], s["End Time"]);
        return `• ${day} ${time}`;
      }),
      estimate.amount != null
        ? `\nEstimated session price: $${estimate.amount} (${estimate.label})`
        : "",
    ]
      .filter((line) => line !== null)
      .join("\n");

    try {
      await navigator.clipboard.writeText(lines.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (expanded) {
    return (
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] xl:col-span-2">
        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold leading-snug tracking-tight text-gray-900">
              {activity["Activity Name"]}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {[provider, ageRange].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {seasonBadge && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                  {seasonBadge}
                </span>
              )}
              {dateRange && (
                <span className="text-[11px] text-gray-500">{dateRange}</span>
              )}
            </div>
          </div>

          <div className="mt-3">
            <h4 className="text-xs font-semibold text-gray-900">
              Choose a class time
            </h4>
            <ul className="mt-2 space-y-1.5">
              {sessions.map((session) => {
                const id = session["Session ID"];
                const selected = selectedIds.includes(id);
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
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => toggleSession(id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                        selected
                          ? "border-[#1D2B4B] bg-[#EEF7FA]"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[#1D2B4B] bg-[#1D2B4B] text-white"
                            : "border-gray-300 bg-white"
                        }`}
                        aria-hidden
                      >
                        {selected ? <Check className="h-2.5 w-2.5" /> : null}
                      </span>
                      <span className="min-w-0 flex-1 text-xs font-medium text-gray-900">
                        {day}
                      </span>
                      <span className="text-[11px] text-gray-700">{time}</span>
                      {mins != null && (
                        <span className="w-10 text-right text-[11px] text-gray-400">
                          {mins}m
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[10px] leading-snug text-gray-400">
              {maxSelect > 1
                ? `Select up to ${maxSelect} days. Example schedule selection; not a live registration system.`
                : "Example schedule selection; not a live registration system."}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-gray-100 pt-3">
            <div>
              <p className="text-[10px] text-gray-400">
                Estimated session price
                {priceNote ? ` · ${priceNote.replace(/ pricing$/i, "")}` : ""}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {estimate.amount != null ? `$${estimate.amount}` : "See provider"}
              </p>
              <p className="text-[10px] text-gray-500">{estimate.label}</p>
            </div>
            <button
              type="button"
              onClick={copySelection}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1D2B4B] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy selection"}
            </button>
          </div>
        </div>

        <div className="flex justify-center border-t border-gray-100 pb-2.5 pt-1.5">
          <button
            type="button"
            onClick={toggleExpanded}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
            aria-label="Collapse class times"
          >
            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex h-[132px] flex-shrink-0 items-center justify-center bg-[#EEF7FA] px-6 py-5 sm:h-[148px]">
        <ActivityImage
          src={imgSrc}
          alt={provider || activity["Activity Name"]}
          className={
            isLogo
              ? "h-full w-full object-contain"
              : "h-full w-full rounded-lg object-cover"
          }
        />
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        {taxonomyPill && (
          <span className="inline-flex w-fit max-w-full truncate rounded-full bg-[#EDE4F5] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#5B4A6E]">
            {taxonomyPill}
          </span>
        )}

        <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-gray-900">
          <Link
            href={`/activities/${activity["Activity ID"]}`}
            className="hover:underline"
          >
            {activity["Activity Name"]}
          </Link>
        </h3>

        {provider && (
          <p className="mt-1 truncate text-[13px] text-gray-500">{provider}</p>
        )}

        <div className="mt-3 space-y-2 text-[12px] text-gray-600">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {ageRange && (
              <p className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" aria-hidden />
                <span className="rounded-full bg-[#FBE8D8] px-2 py-0.5 text-[11px] font-medium text-[#8A5A3B]">
                  {ageRange}
                </span>
              </p>
            )}
            {daySummary && (
              <p className="inline-flex min-w-0 items-center gap-1.5">
                <Calendar
                  className="h-3.5 w-3.5 flex-shrink-0 text-gray-500"
                  aria-hidden
                />
                <span className="truncate">{daySummary}</span>
              </p>
            )}
          </div>
          {locationLabel && (
            <p className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin
                className="h-3.5 w-3.5 flex-shrink-0 text-gray-500"
                aria-hidden
              />
              <span className="truncate">{locationLabel}</span>
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-gray-900">
              {fromPrice != null
                ? `From $${fromPrice} / session`
                : "Pricing varies"}
            </p>
            {priceNote && (
              <p className="truncate text-[10px] text-gray-400">{priceNote}</p>
            )}
          </div>
          <button
            type="button"
            onClick={toggleExpanded}
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[#1D2B4B] px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            View class times
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
