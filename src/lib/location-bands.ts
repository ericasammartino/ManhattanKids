/**
 * UWS cross-street → ~10-block location bands (59th–110th).
 */

export const LOCATION_BANDS = [
  { id: "59-69", label: "59th–69th St", min: 59, max: 69 },
  { id: "70-79", label: "70th–79th St", min: 70, max: 79 },
  { id: "80-89", label: "80th–89th St", min: 80, max: 89 },
  { id: "90-99", label: "90th–99th St", min: 90, max: 99 },
  { id: "100-110", label: "100th–110th St", min: 100, max: 110 },
] as const;

export type LocationBandId = (typeof LOCATION_BANDS)[number]["id"];

/** Pull the primary street number from a cross-street string. */
export function parseStreetNumber(
  crossStreets: string | null | undefined
): number | null {
  if (!crossStreets) return null;
  const raw = crossStreets.trim();
  if (!raw || /needs location/i.test(raw)) return null;

  // Prefer explicit W/E Nth patterns first.
  const westEast = raw.match(/\b(?:[WE]|West|East)\s*(\d{1,3})(?:st|nd|rd|th)?\b/i);
  if (westEast) {
    const n = Number(westEast[1]);
    if (n >= 1 && n <= 220) return n;
  }

  // "76th & Amsterdam", "93rd–96th", "106th & Columbus"
  const numbered = [...raw.matchAll(/\b(\d{1,3})(?:st|nd|rd|th)?\b/gi)];
  for (const match of numbered) {
    const n = Number(match[1]);
    // Skip avenue numbers that aren't street blocks (1st Ave etc. when alone is rare on UWS west)
    if (n >= 59 && n <= 110) return n;
    if (n >= 1 && n <= 220) return n;
  }
  return null;
}

export function bandForStreetNumber(
  street: number | null
): (typeof LOCATION_BANDS)[number] | null {
  if (street === null) return null;
  return LOCATION_BANDS.find((b) => street >= b.min && street <= b.max) ?? null;
}

export function bandForCrossStreets(
  crossStreets: string | null | undefined
): (typeof LOCATION_BANDS)[number] | null {
  return bandForStreetNumber(parseStreetNumber(crossStreets));
}

export function locationBandIdFromCrossStreets(
  crossStreets: string | null | undefined
): LocationBandId | null {
  return bandForCrossStreets(crossStreets)?.id ?? null;
}
