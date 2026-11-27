/**
 * Import Manual Entry Session sheet → site JSON (afterschool-focused).
 *
 * Usage:
 *   npx tsx scripts/import-manual-entry-sessions.ts --input path/to/database.xlsx
 *
 * Groups class rows into Activities + Sessions, creates Organizations and
 * Locations from unique names/addresses, and marks every activity as
 * "Afterschool Program".
 */

import * as fs from "fs";
import * as path from "path";
import { logoForOrganization } from "../src/data/org-logos";
import { ACTIVE_SUBCATEGORIES, splitSubcategories } from "../src/lib/taxonomy";

const CANONICAL_SUBCATEGORY_BY_LOWER = new Map<string, string>(
  ACTIVE_SUBCATEGORIES.map((s) => [s.toLowerCase(), s])
);

function normalizeSubcategoryList(
  raw: string | null,
  unknownTracker?: Set<string>
): string | null {
  const tokens = splitSubcategories(raw);
  if (tokens.length === 0) return null;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of tokens) {
    const canonical =
      CANONICAL_SUBCATEGORY_BY_LOWER.get(token.toLowerCase()) ?? token;
    if (!CANONICAL_SUBCATEGORY_BY_LOWER.has(token.toLowerCase())) {
      unknownTracker?.add(token);
    }
    if (!seen.has(canonical)) {
      seen.add(canonical);
      out.push(canonical);
    }
  }
  return out.length ? out.join(", ") : null;
}

function mergeSubcategories(
  existing: string | null,
  incoming: string | null
): string | null {
  if (!incoming) return existing;
  if (!existing) return incoming;
  const tokens = [...splitSubcategories(existing), ...splitSubcategories(incoming)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out.length ? out.join(", ") : null;
}

type Row = Record<string, unknown>;

/** Canonical Primary Categories from Lists / taxonomy (pass-through). */
const CATEGORY_MAP: Record<string, string> = {
  "Afterschool Care": "Afterschool Care",
  "Arts & Creativity": "Arts & Creativity",
  Entertainment: "Entertainment",
  "Learning & Enrichment": "Learning & Enrichment",
  "Museums & Culture": "Museums & Culture",
  "Play & Exploration": "Play & Exploration",
  "Sports & Movement": "Sports & Movement",
  STEM: "STEM",
  // Legacy aliases from earlier imports / UI labels
  "STEM & Discovery": "STEM",
  "Nature & Outdoors": "Play & Exploration",
  "Events & Experiences": "Entertainment",
  "Food & Cooking": "Arts & Creativity",
};

/** Canonical organization renames applied during import. */
const ORG_NAME_ALIASES: Record<string, string> = {
  "west side ymca y afterschool": "West Side YMCA",
};

/** Fallback provider websites when the spreadsheet omits a URL. */
const ORG_WEBSITES: Record<string, string> = {
  "Marlene Meyerson JCC Manhattan": "https://www.mmjccm.org/children-families",
  "West Side YMCA":
    "https://ymcanyc.org/locations/west-side-ymca/programs-and-classes/kids-family/y-afterschool",
  "Goddard Riverside - Lincoln Center": "https://goddard.org/lsnc/",
  "Goddard Riverside - Beacon":
    "https://goddard.org/programs/children-and-youth/beacon/",
  "Supermud Pottery": "https://www.supermudpottery.com/",
  "Bloomingdale Library": "https://www.nypl.org/locations/bloomingdale",
  "Riverside Library": "https://www.nypl.org/locations/riverside",
  Robofun: "https://www.robofun.org/",
  ZPlaySchool: "https://zplayschool.com/",
  "Writopia Lab Upper West Side": "https://www.writopialab.org/",
  "Tim Morehouse Fencing Club": "https://www.timmorehousefencing.com/",
  "NYC Elite Gymnastics": "https://nycelite.com/",
  "Elliott’s Classes": "https://www.elliottsclasses.com/",
  "FunFit Kids": "https://www.funfitnyc.com/",
  "Central Park Tennis Center": "https://www.centralparktenniscenter.com/",
  "Discovery Programs": "https://www.discoveryprograms.com/",
  "Harmony By Karate": "https://harmonybykarate.com/",
  "Broadway Dance Center Children & Teens": "https://broadwaydancecenter.com/",
  "Play On! Studios": "https://www.playonstudios.com/",
  "The Art Farm": "https://www.theartfarminc.com/",
  "PLAYDAY UWS": "https://www.playday.com/uws",
  "Spotlight Kids NY": "https://spotlightkidsny.com",
  "West Side Dance Studio": "https://www.westsidedancestudio.com/",
  "Dance with Miss Rachel": "https://www.dancewithmissrachel.com/",
  "Chess Max Academy": "https://chessmaxacademy.com/",
  SOMATH: "https://www.schoolofmath.us/",
  "Wise Wonder": "https://wisewonder.com/",
  Bonjour: "https://bonjourny.com/",
  "The Little Gym Upper Westside":
    "https://www.thelittlegym.com/new-york-upper-westside/",
  "New York Empire Baseball": "https://newyorkempirebaseball.org/",
  "Mo’ Motion": "https://www.momotiondance.com/",
  "Soccer Stars": "https://www.soccerstars.com/super-soccer-stars/",
  "Super Soccer Stars": "https://www.soccerstars.com/super-soccer-stars/",
  "Modern Martial Arts": "https://www.mmanewyorkcity.com/",
  "Steps on Broadway Academy": "https://www.stepsnyc.com/academy/",
  "Launch Math + Science Centers": "https://launchmath.com/",
  "Launch @ FunFit": "https://launchmath.com/",
  "Launch @ FunFit Kids": "https://launchmath.com/",
  "Baker Piano Studio": "https://www.bakerpianolessons.com/",
  "UWS Piano School": "https://www.uwspianoschool.com/",
  "Upper West Side Brazilian Jiu-Jitsu / Kenshikai":
    "https://www.uwskenshikai.com/index18316m.php",
  "Broadway TaeKwonDo": "https://broadwaytkd.com/",
  "Children’s Aid-Frederick Douglass Community Center":
    "https://www.childrensaidnyc.org/programs/location/frederick-douglass-community-center",
  "Strycker’s Bay Neighborhood Council":
    "https://robhen.com/new-york/manhattan/dehostos-community-center/",
  "Bloomingdale School of Music": "https://www.bsmny.org/",
  "Broadway Rise": "https://www.broadwayrise.com/",
  "Children's Art Classes – NYC":
    "https://ny-new-york.childrensartclasses.com/",
  "Imagine Skateboarding": "https://www.imagineskateboarding.com/",
  "Russian Children Studio": "https://russianchildrenstudio.org/",
  SayNinja: "https://www.sayninja.com/locations/amsterdam-ave/",
  "Shuffles NYC": "https://www.shufflesnyc.com/",
  "Silver Music": "https://silvermusic.org/",
  "West Amadeus Music Studio": "https://westamadeus.com/",
  "The Art Studio NY": "https://www.theartstudiony.com/",
};

function normalizeName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function canonicalOrgName(raw: string): string {
  return ORG_NAME_ALIASES[normalizeName(raw)] ?? raw;
}

function validHttpUrl(value: unknown): string | null {
  const s = text(value);
  if (!s) return null;
  try {
    const parsed = new URL(s);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return s;
    }
    return null;
  } catch {
    return null;
  }
}

function isPlaceholderCross(value: string | null): boolean {
  if (!value) return true;
  return /needs location/i.test(value);
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function num(value: unknown): number | null {
  const s = text(value);
  if (!s) return null;
  const cleaned = s.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseCost(value: unknown): number | null {
  const s = text(value);
  if (!s) return null;
  const match = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

/** Excel serial fraction or "5:10 PM" / "17:10" → "17:10" */
function to24h(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  // Excel time serial (e.g. 0.75 = 18:00)
  if (typeof value === "number" && Number.isFinite(value)) {
    const dayFraction = value % 1;
    const totalMinutes = Math.round(dayFraction * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const min = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  const s = text(value);
  if (!s) return null;

  // Numeric string serial
  if (/^0?\.\d+$/.test(s) || /^\d+\.\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && n >= 0 && n < 1.5) return to24h(n);
  }

  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return s;
  let h = Number(m[1]);
  const min = m[2];
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  // Bare 1:00–7:59 without AM/PM in afterschool sheets is afternoon PM (e.g. "3:45" → "15:45").
  if (!ap && h >= 1 && h <= 7) h += 12;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function parseZip(address: string | null): string | null {
  if (!address) return null;
  const m = address.match(/\b(100\d{2})\b/);
  return m ? m[1] : null;
}

/** Best-effort UWS tag when the sheet omits Neighborhood/zip. */
function inferNeighborhood(
  address: string | null,
  orgName: string,
  crossStreets?: string | null
): string | null {
  const zip = parseZip(address);
  if (zip && ["10023", "10024", "10025", "10069"].includes(zip)) {
    return "Upper West Side";
  }
  const a = `${address ?? ""} ${crossStreets ?? ""}`.toLowerCase();
  if (
    /\bwest end ave/.test(a) ||
    /\briverside(?:\s+(?:blvd|drive|dr))?\b/.test(a) ||
    /\bamsterdam(?:\s+ave)?\b/.test(a) ||
    /\bcolumbus(?:\s+ave)?\b/.test(a) ||
    /\bcentral park west\b/.test(a) ||
    /\bbroadway\b/.test(a)
  ) {
    return "Upper West Side";
  }
  const westSt = a.match(/\b(?:w|west)\s*(\d{1,3})/);
  if (westSt) {
    const n = Number(westSt[1]);
    if (n >= 59 && n <= 110) return "Upper West Side";
  }
  const name = orgName.toLowerCase();
  if (
    name.includes("upper west") ||
    name.includes("discovery programs") ||
    name.includes("funfit") ||
    name.includes("central park tennis") ||
    name.includes("nyc elite") ||
    name.includes("robofun") ||
    name.includes("zplay") ||
    name.includes("goddard") ||
    name.includes("bloomingdale") ||
    name.includes("riverside library") ||
    name.includes("supermud") ||
    name.includes("west side ymca") ||
    name.includes("writopia") ||
    name.includes("strycker") ||
    name.includes("children") ||
    name.includes("elliott") ||
    name.includes("tim morehouse") ||
    name.includes("marlene meyerson")
  ) {
    return "Upper West Side";
  }
  return null;
}

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const DAY_ALIASES: Record<string, string> = {
  monday: "Monday",
  mon: "Monday",
  tuesday: "Tuesday",
  tue: "Tuesday",
  tues: "Tuesday",
  wednesday: "Wednesday",
  wed: "Wednesday",
  thursday: "Thursday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  friday: "Friday",
  fri: "Friday",
  saturday: "Saturday",
  sat: "Saturday",
  sunday: "Sunday",
  sun: "Sunday",
};

const DAY_TOKEN_PATTERN =
  "monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues|tue|wed|thurs|thur|thu|fri|sat|sun";

/**
 * Expand a Day(s) cell ("Monday, Tuesday, Wednesday, Thursday, Friday",
 * "Mon–Fri", "Every day", "Daily", "Weekdays", "Monday, Wednesday") into
 * canonical single-day names in Monday–Sunday order so each day gets its own
 * session row in the expanded card schedule.
 */
function expandDaysOfWeek(raw: string | null): (string | null)[] {
  if (!raw) return [null];
  const cleaned = raw.trim();
  if (!cleaned || /^none$/i.test(cleaned)) return [null];

  const lower = cleaned.toLowerCase();
  if (/\b(every\s*day|daily|all\s*week|7\s*days?)\b/.test(lower)) {
    return [...DAYS_OF_WEEK];
  }
  if (/\bweekdays?\b/.test(lower)) {
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  }
  if (/\bweekends?\b/.test(lower)) {
    return ["Saturday", "Sunday"];
  }

  const found = new Set<string>();

  const rangeRe = new RegExp(
    `\\b(${DAY_TOKEN_PATTERN})\\.?\\s*(?:[–—-]|to|thru|through)\\s*(${DAY_TOKEN_PATTERN})\\.?\\b`,
    "gi"
  );
  for (const match of lower.matchAll(rangeRe)) {
    const start = DAY_ALIASES[match[1].toLowerCase()];
    const end = DAY_ALIASES[match[2].toLowerCase()];
    if (!start || !end) continue;
    const si = DAYS_OF_WEEK.indexOf(start as (typeof DAYS_OF_WEEK)[number]);
    const ei = DAYS_OF_WEEK.indexOf(end as (typeof DAYS_OF_WEEK)[number]);
    if (si >= 0 && ei >= 0) {
      if (si <= ei) {
        for (let i = si; i <= ei; i++) found.add(DAYS_OF_WEEK[i]);
      } else {
        for (let i = si; i < DAYS_OF_WEEK.length; i++) found.add(DAYS_OF_WEEK[i]);
        for (let i = 0; i <= ei; i++) found.add(DAYS_OF_WEEK[i]);
      }
    }
  }

  const tokenRe = new RegExp(`\\b(${DAY_TOKEN_PATTERN})\\.?\\b`, "gi");
  for (const match of lower.matchAll(tokenRe)) {
    const canonical = DAY_ALIASES[match[1].toLowerCase()];
    if (canonical) found.add(canonical);
  }

  if (found.size === 0) return [cleaned];
  return DAYS_OF_WEEK.filter((d) => found.has(d));
}

async function main() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const outputIdx = args.indexOf("--output");
  if (inputIdx === -1) {
    console.error(
      "Usage: npx tsx scripts/import-manual-entry-sessions.ts --input path/to/file.xlsx"
    );
    process.exit(1);
  }

  const inputPath = args[inputIdx + 1];
  const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : "src/data";
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  let XLSX: typeof import("xlsx");
  try {
    // CJS interop — ESM default export varies by bundler
    const mod = await import("xlsx");
    XLSX = ((mod as { default?: typeof import("xlsx") }).default ??
      mod) as typeof import("xlsx");
  } catch {
    console.error("xlsx package not found. Run: npm install xlsx");
    process.exit(1);
  }

  console.log(`📂 Reading: ${inputPath}`);
  const workbook = XLSX.readFile(inputPath);
  const sheetName =
    workbook.SheetNames.find((n) => /manual\s*entry\s*session/i.test(n)) ??
    "Manual Entry Session";
  if (!workbook.Sheets[sheetName]) {
    console.error(`Sheet "${sheetName}" not found. Available: ${workbook.SheetNames.join(", ")}`);
    process.exit(1);
  }

  const raw = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: null,
    raw: false,
    dateNF: "yyyy-mm-dd",
  }) as Row[];

  const rows = raw.filter((r) => text(r["Session / Class Name"]) && text(r.Organization));
  console.log(`Found ${rows.length} session rows on "${sheetName}"`);

  // Build website hints: prefer spreadsheet sheets over hardcoded fallbacks.
  const fallbackWebsiteByName = new Map<string, string>();
  for (const [name, url] of Object.entries(ORG_WEBSITES)) {
    const valid = validHttpUrl(url);
    if (valid) {
      fallbackWebsiteByName.set(normalizeName(canonicalOrgName(name)), valid);
    }
  }

  const sheetOrgWebsiteByName = new Map<string, string>();
  const discoverySheet = workbook.Sheets["Business Discovery"];
  if (discoverySheet) {
    const discovery = XLSX.utils.sheet_to_json(discoverySheet, {
      defval: null,
    }) as Row[];
    for (const row of discovery) {
      const rawName = text(row["Business Name"]) ?? text(row["Organization Name"]);
      const website = validHttpUrl(row.Website) ?? validHttpUrl(row["Website URL"]);
      if (!rawName || !website) continue;
      const key = normalizeName(canonicalOrgName(rawName));
      if (!sheetOrgWebsiteByName.has(key)) {
        sheetOrgWebsiteByName.set(key, website);
      }
    }
  }
  const orgsSheet = workbook.Sheets.Organizations;
  if (orgsSheet) {
    const orgRows = XLSX.utils.sheet_to_json(orgsSheet, {
      defval: null,
    }) as Row[];
    for (const row of orgRows) {
      const rawName = text(row["Organization Name"]);
      const website = validHttpUrl(row.Website) ?? validHttpUrl(row["Source URL"]);
      if (!rawName || !website) continue;
      const key = normalizeName(canonicalOrgName(rawName));
      // Organizations sheet overrides Business Discovery.
      sheetOrgWebsiteByName.set(key, website);
    }
  }

  function rowWebsite(row: Row): string | null {
    const trailingUrl =
      Object.entries(row)
        .filter(([k]) => /^__EMPTY/.test(k))
        .map(([, v]) => validHttpUrl(v))
        .find((v): v is string => Boolean(v)) ?? null;
    return (
      validHttpUrl(row.Website) ??
      validHttpUrl(row["Website URL"]) ??
      validHttpUrl(row["Source URL"]) ??
      validHttpUrl(row.Registration) ??
      trailingUrl
    );
  }

  // Collect per-org URLs directly from Manual Entry Session so updated
  // spreadsheet URLs always beat stale fallbacks.
  const sessionUrlsByOrg = new Map<string, Set<string>>();
  for (const row of rows) {
    const orgName = canonicalOrgName(text(row.Organization)!);
    const key = normalizeName(orgName);
    const url = rowWebsite(row);
    if (!url) continue;
    let set = sessionUrlsByOrg.get(key);
    if (!set) {
      set = new Set<string>();
      sessionUrlsByOrg.set(key, set);
    }
    set.add(url);
  }

  function websiteForOrg(orgName: string): string | null {
    const key = normalizeName(orgName);
    const sessionUrls = sessionUrlsByOrg.get(key);
    if (sessionUrls && sessionUrls.size === 1) {
      return [...sessionUrls][0];
    }
    if (sessionUrls && sessionUrls.size > 1) {
      // Provider uses class-specific URLs (e.g. Broadway Rise): prefer a matching
      // org-level URL from other sheets, else derive the shared origin.
      const sheetOrg = sheetOrgWebsiteByName.get(key);
      if (sheetOrg) return sheetOrg;
      const first = [...sessionUrls][0];
      try {
        return `${new URL(first).origin}/`;
      } catch {
        return first;
      }
    }
    return sheetOrgWebsiteByName.get(key) ?? fallbackWebsiteByName.get(key) ?? null;
  }

  const orgIds = new Map<string, string>();
  const locIds = new Map<string, string>(); // key: orgId|address
  const locById = new Map<string, Row>();
  const activityIds = new Map<string, string>(); // key: orgId|name|category|ageMin|ageMax
  const activityById = new Map<string, Row>();
  const activityNotesById = new Map<string, string[]>();
  // Deduplicates overlapping day slots created when expanding multi-day rows.
  const sessionBySlot = new Map<string, { session: Row; fromMultiDay: boolean }>();

  const organizations: Row[] = [];
  const locations: Row[] = [];
  const activities: Row[] = [];
  const sessions: Row[] = [];
  const unknownSubcategories = new Set<string>();

  let orgSeq = 1;
  let locSeq = 1;
  let actSeq = 1;
  let sessSeq = 1;

  for (const row of rows) {
    const orgName = canonicalOrgName(text(row.Organization)!);
    const className = text(row["Session / Class Name"])!;
    const categoryRaw = text(row.Category);
    const category =
      (categoryRaw && CATEGORY_MAP[categoryRaw]) ||
      categoryRaw ||
      "Learning & Enrichment";
    const subcategory = normalizeSubcategoryList(
      text(row.Subcategory),
      unknownSubcategories
    );
    const ageMin = num(row["Minimum Age"]);
    const ageMax = num(row["Maximum Age"]);
    const days = text(row["Day(s)"]);
    const startTime = to24h(row["Start Time"]);
    const endTime = to24h(row["End Time"]);
    const sessionDates = text(row["Session Dates (as shown)"]);
    const cost = text(row.Cost);
    const price = parseCost(row.Cost);
    // Column M: Erica labels cost with cadence ("Billing Cycle" / "Frequency").
    const frequency =
      text(row["Billing Cycle"]) ??
      text(row.Frequency) ??
      text(row["Price Frequency"]);
    const address = text(row.Address);
    const crossStreets = text(row["Cross Streets"]);
    // DB25+: dedicated class blurb (distinct from freeform Notes).
    const classDescription =
      text(row["Class Description"]) ?? text(row["Class description"]);
    const notes = text(row.Notes);
    const orgWebsite = websiteForOrg(orgName);
    const sourceUrl = rowWebsite(row) ?? orgWebsite;
    const sourceType = text(row["Source Type"]);
    const zip = parseZip(address);

    if (!orgIds.has(orgName)) {
      const id = `ORG-${pad(orgSeq++)}`;
      orgIds.set(orgName, id);
      organizations.push({
        "Organization ID": id,
        "Organization Name": orgName,
        "Organization Type": "Afterschool Provider",
        Description: null,
        Website: orgWebsite,
        "Contact Email": null,
        Phone: null,
        "Logo URL": logoForOrganization(orgName),
        "Instagram URL": null,
        Status: "Active",
        "Source URL": orgWebsite,
        "Last Verified": null,
        Notes: sourceType,
        "External ID": null,
      });
    }
    const orgId = orgIds.get(orgName)!;

    const locKey = `${orgId}|${address ?? orgName}`;
    if (!locIds.has(locKey)) {
      const id = `LOC-${pad(locSeq++)}`;
      locIds.set(locKey, id);
      const loc: Row = {
        "Location ID": id,
        "Location Name": orgName,
        "Organization ID": orgId,
        "Venue Type": null,
        Description: null,
        "Street Address": address,
        "Address Line 2": null,
        "Cross Streets": isPlaceholderCross(crossStreets) ? null : crossStreets,
        Neighborhood: inferNeighborhood(address, orgName, crossStreets),
        Borough: "Manhattan",
        "Zip Code": zip,
        Latitude: null,
        Longitude: null,
        Website: orgWebsite,
        Phone: null,
        "Opening Hours": null,
        "Admission Price": null,
        "Admission Notes": null,
        Setting: null,
        "Minimum Age": null,
        "Maximum Age": null,
        "Amenities/Accessibility": null,
        "Kid Friendly Features": null,
        "Image URL": null,
        "Public Listing": "Yes",
        "Source URL": orgWebsite,
        Status: "Active",
        "Last Verified": null,
        Notes: null,
      };
      locations.push(loc);
      locById.set(id, loc);
    } else {
      const existing = locById.get(locIds.get(locKey)!)!;
      // Prefer a real cross-street over placeholder / empty.
      if (
        crossStreets &&
        !isPlaceholderCross(crossStreets) &&
        isPlaceholderCross(text(existing["Cross Streets"]))
      ) {
        existing["Cross Streets"] = crossStreets;
      }
    }
    const locId = locIds.get(locKey)!;

    const actKey = [
      orgId,
      className.toLowerCase(),
      category,
      ageMin ?? "",
      ageMax ?? "",
    ].join("|");

    if (!activityIds.has(actKey)) {
      const id = `ACT-${pad(actSeq++)}`;
      activityIds.set(actKey, id);
      const initialNotes = notes ? [notes] : [];
      activityNotesById.set(id, initialNotes);
      const activityRow: Row = {
        "Activity ID": id,
        "Activity Name": className,
        "Organization ID": orgId,
        "Default Location ID": locId,
        "Default Location Name": orgName,
        Description: classDescription,
        "Primary Category": category,
        Subcategory: subcategory,
        "Secondary Categories": null,
        "Activity Type": "Afterschool Program",
        Setting: null,
        "Age Minimum": ageMin,
        "Age Maximum": ageMax,
        "Grade Minimum": null,
        "Grade Maximum": null,
        "Drop-Off Allowed": null,
        "Adult Required": null,
        "Schedule Pattern": "Recurring Weekly",
        "Price Minimum": price,
        "Price Maximum": price,
        "Registration Requirement": null,
        "Registration URL": sourceUrl,
        "Seasonal Tags": null,
        "Image URL": null,
        "Source URL": sourceUrl,
        Status: "Active",
        "Last Verified": null,
        Notes: notes,
      };
      activities.push(activityRow);
      activityById.set(id, activityRow);
    } else {
      const existing = activityById.get(activityIds.get(actKey)!)!;
      // Later rows may carry the blurb, URL, or notes when the first row was empty.
      if (classDescription && !text(existing.Description)) {
        existing.Description = classDescription;
      }
      if (sourceUrl && !text(existing["Registration URL"])) {
        existing["Registration URL"] = sourceUrl;
      }
      if (sourceUrl && !text(existing["Source URL"])) {
        existing["Source URL"] = sourceUrl;
      }
      if (subcategory) {
        existing.Subcategory = mergeSubcategories(
          text(existing.Subcategory),
          subcategory
        );
      }
      if (notes) {
        const list = activityNotesById.get(existing["Activity ID"] as string)!;
        if (!list.includes(notes)) {
          list.push(notes);
          existing.Notes = list.join(" · ");
        }
      }
    }
    const actId = activityIds.get(actKey)!;

    const expandedDays = expandDaysOfWeek(days);
    const isMultiDay = expandedDays.length > 1;

    for (const day of expandedDays) {
      const slotKey = [
        actId,
        day ?? "",
        startTime ?? "",
        endTime ?? "",
      ].join("|");
      const existingSlot = sessionBySlot.get(slotKey);

      if (isMultiDay && existingSlot) {
        const existingPrice =
          typeof existingSlot.session["Price Amount"] === "number"
            ? (existingSlot.session["Price Amount"] as number)
            : null;
        if (
          price !== null &&
          (existingPrice === null || price < existingPrice)
        ) {
          existingSlot.session["Price Amount"] = price;
          existingSlot.session["Cost Structure"] = cost;
          existingSlot.session.Frequency = frequency;
        }
        if (!text(existingSlot.session.Notes) && notes) {
          existingSlot.session.Notes = notes;
        }
        if (!text(existingSlot.session.Description) && classDescription) {
          existingSlot.session.Description = classDescription;
        }
        continue;
      }

      if (!isMultiDay && existingSlot?.fromMultiDay) {
        const existingPrice =
          typeof existingSlot.session["Price Amount"] === "number"
            ? (existingSlot.session["Price Amount"] as number)
            : null;
        if (
          price !== null &&
          (existingPrice === null || price < existingPrice)
        ) {
          existingSlot.session["Price Amount"] = price;
          existingSlot.session["Cost Structure"] = cost;
          existingSlot.session.Frequency = frequency;
        }
        if (notes) {
          existingSlot.session.Notes = notes;
        }
        if (classDescription) {
          existingSlot.session.Description = classDescription;
        }
        existingSlot.fromMultiDay = false;
        continue;
      }

      const session: Row = {
        "Session ID": `SES-${pad(sessSeq++)}`,
        "Activity ID": actId,
        "Location ID": locId,
        "Session Name":
          [day, startTime && endTime ? `${startTime}–${endTime}` : null]
            .filter(Boolean)
            .join(" · ") || className,
        "Start Date": null,
        "End Date": null,
        "Start Time": startTime,
        "End Time": endTime,
        "Days of the Week": day,
        "Schedule Pattern": "Recurring Weekly",
        "Minimum Age Override": ageMin,
        "Maximum Age Override": ageMax,
        "Price Amount": price,
        "Cost Structure": cost,
        Frequency: frequency,
        "Price Notes": sessionDates,
        Availability: "Available",
        "Registration Opens": null,
        "Registration Closes": null,
        "Registration URL": sourceUrl,
        Status: "Active",
        "Source URL": sourceUrl,
        "Last Verified": null,
        Description: classDescription,
        Notes: notes,
      };
      sessions.push(session);
      if (!existingSlot) {
        sessionBySlot.set(slotKey, { session, fromMultiDay: isMultiDay });
      }
    }
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const writes: [string, unknown[]][] = [
    ["organizations.json", organizations],
    ["locations.json", locations],
    ["activities.json", activities],
    ["sessions.json", sessions],
  ];

  for (const [file, data] of writes) {
    const out = path.join(outputDir, file);
    fs.writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
    console.log(`✅ ${file} (${data.length})`);
  }

  // Keep incoming.json if present; otherwise write empty array
  const incomingPath = path.join(outputDir, "incoming.json");
  if (!fs.existsSync(incomingPath)) {
    fs.writeFileSync(incomingPath, "[]\n");
  }

  if (unknownSubcategories.size > 0) {
    console.warn(
      `⚠️ Unrecognized subcategories not in ACTIVE_SUBCATEGORIES: ${[...unknownSubcategories].sort().join(", ")}`
    );
  }

  console.log(
    `\n🎉 Imported ${activities.length} afterschool programs / ${sessions.length} sessions from Manual Entry Session.`
  );
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
