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

/** Keep in sync with src/data/org-logos.ts */
const ORG_LOGOS: Record<string, string> = {
  "Marlene Meyerson JCC Manhattan": "/logos/marlene-meyerson-jcc.png",
  "West Side YMCA Y Afterschool": "/logos/ymca.jpg",
  "West Side YMCA": "/logos/ymca.jpg",
  "Goddard Riverside - Lincoln Center": "/logos/goddard-riverside.png",
  "Goddard Riverside - Beacon": "/logos/goddard-riverside.png",
  "Supermud Pottery": "/logos/supermud.jpg",
  "Bloomingdale Library": "/logos/bloomingdale-library.png",
  "Riverside Library": "/logos/riverside-library.png",
  Robofun: "/logos/robofun.png",
  ZPlaySchool: "/logos/z-play.jpg",
  "Writopia Lab Upper West Side": "/logos/writopia-lab.png",
  "Tim Morehouse Fencing Club": "/logos/tim-morehouse-fencing.jpg",
  "NYC Elite Gymnastics": "/logos/nyc-elite-gymnastics.jpg",
  "Elliott’s Classes": "/logos/elliotts-classes.png",
  "FunFit Kids": "/logos/funfit.png",
  "Central Park Tennis Center": "/logos/central-park-tennis.jpg",
  "Discovery Programs": "/logos/discovery-programs.png",
  "Harmony By Karate": "/logos/harmony-by-karate.png",
  "Broadway Dance Center Children & Teens": "/logos/broadway-dance-center.png",
  "Play On! Studios": "/logos/play-on-studios.png",
  "The Art Farm": "/logos/the-art-farm.png",
  "PLAYDAY UWS": "/logos/playday-uws.png",
  "Spotlight Kids NY": "/logos/spotlight-kids-ny.png",
  "West Side Dance Studio": "/logos/west-side-dance-studio.png",
  "Dance with Miss Rachel": "/logos/dance-with-miss-rachel.png",
  "Chess Max Academy": "/logos/chess-max-academy.png",
  SOMATH: "/logos/school-of-math.png",
  "Wise Wonder": "/logos/wise-wonder.png",
  Bonjour: "/logos/bonjour.png",
  "The Little Gym Upper Westside": "/logos/the-little-gym.png",
  "New York Empire Baseball": "/logos/ny-empire-baseball.png",
  "Mo’ Motion": "/logos/mo-motion.png",
  "Soccer Stars": "/logos/soccer-stars.png",
  "Upper West Side Brazilian Jiu-Jitsu / Kenshikai":
    "/logos/uws-brazilian-jiu-jitsu.jpg",
  "Modern Martial Arts": "/logos/modern-martial-arts.png",
};

/** Fallback provider websites when Business Discovery / Source URL is empty. */
const ORG_WEBSITES: Record<string, string> = {
  "Marlene Meyerson JCC Manhattan": "https://jccmanhattan.org/",
  "West Side YMCA Y Afterschool": "https://ymcanyc.org/locations/west-side-ymca",
  "West Side YMCA": "https://ymcanyc.org/locations/west-side-ymca",
  "Goddard Riverside - Lincoln Center": "https://www.goddard.org/",
  "Goddard Riverside - Beacon": "https://www.goddard.org/",
  "Supermud Pottery": "https://www.supermud.com/",
  "Bloomingdale Library": "https://www.nypl.org/locations/bloomingdale",
  "Riverside Library": "https://www.nypl.org/locations/riverside",
  Robofun: "https://www.robofun.org/",
  ZPlaySchool: "https://www.zplayschool.com/",
  "Writopia Lab Upper West Side": "https://www.writopialab.org/",
  "Tim Morehouse Fencing Club": "https://www.timmorehousefencing.com/",
  "NYC Elite Gymnastics": "https://www.nycelitegymnastics.com/",
  "Elliott’s Classes": "https://www.elliottsclasses.com/",
  "FunFit Kids": "https://www.funfitkids.com/",
  "Central Park Tennis Center": "https://www.centralparktenniscenter.com/",
  "Discovery Programs": "https://www.discoveryprograms.com/",
  "Harmony By Karate": "https://www.harmonybykarate.com/",
  "Broadway Dance Center Children & Teens":
    "https://www.broadwaydancecenter.com/children-teens",
  "Play On! Studios": "https://www.playonstudios.com/",
  "The Art Farm": "https://www.theartfarminc.com/",
  "PLAYDAY UWS": "https://www.playdaynyc.com/",
  "Spotlight Kids NY": "https://www.spotlightkidsny.com/",
  "West Side Dance Studio": "https://westsidedancestudio.com/",
  "Dance with Miss Rachel": "https://www.dancewithmissrachel.com/",
  "Chess Max Academy": "https://www.chessmaxacademy.com/",
  SOMATH: "https://www.schoolofmath.com/",
  "Wise Wonder": "https://www.wisewonder.org/",
  Bonjour: "https://www.bonjourlanguages.com/",
  "The Little Gym Upper Westside": "https://www.thelittlegym.com/",
  "New York Empire Baseball": "https://www.nyempirebaseball.com/",
  "Mo’ Motion": "https://www.momotiondance.com/",
  "Soccer Stars": "https://www.soccerstars.com/",
  "Modern Martial Arts": "https://www.modernmartialarts.com/",
  "Steps on Broadway Academy": "https://www.stepsnyc.com/",
  "Launch Math + Science Centers": "https://www.launcheducation.com/",
  "Baker Piano Studio": "https://www.bakerpianostudio.com/",
  "UWS Piano School": "https://www.uwspianoschool.com/",
  "Upper West Side Brazilian Jiu-Jitsu / Kenshikai":
    "https://www.uwsbjj.com/",
  "Broadway TaeKwonDo": "https://www.broadwaytkd.com/",
  "Children’s Aid-Frederick Douglass Community Center":
    "https://www.childrensaidnyc.org/",
  "Strycker’s Bay Neighborhood Council": "https://www.stryckersbay.org/",
};

function normalizeName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
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
  orgName: string
): string | null {
  const zip = parseZip(address);
  if (zip && ["10023", "10024", "10025", "10069"].includes(zip)) {
    return "Upper West Side";
  }
  const a = (address ?? "").toLowerCase();
  if (
    /\bwest end ave/.test(a) ||
    /\briverside (blvd|drive|dr)\b/.test(a) ||
    /\bamsterdam ave/.test(a) ||
    /\bcolumbus ave/.test(a) ||
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

  // Optional website hints from Business Discovery / Organizations sheets.
  const websiteByName = new Map<string, string>();
  for (const [name, url] of Object.entries(ORG_WEBSITES)) {
    websiteByName.set(normalizeName(name), url);
  }
  const discoverySheet = workbook.Sheets["Business Discovery"];
  if (discoverySheet) {
    const discovery = XLSX.utils.sheet_to_json(discoverySheet, {
      defval: null,
    }) as Row[];
    for (const row of discovery) {
      const name = text(row["Business Name"]) ?? text(row["Organization Name"]);
      const website = text(row.Website) ?? text(row["Website URL"]);
      if (!name || !website) continue;
      const key = normalizeName(name);
      if (!websiteByName.has(key)) websiteByName.set(key, website);
    }
  }
  const orgsSheet = workbook.Sheets.Organizations;
  if (orgsSheet) {
    const orgRows = XLSX.utils.sheet_to_json(orgsSheet, {
      defval: null,
    }) as Row[];
    for (const row of orgRows) {
      const name = text(row["Organization Name"]);
      const website = text(row.Website) ?? text(row["Source URL"]);
      if (!name || !website) continue;
      const key = normalizeName(name);
      if (!websiteByName.has(key)) websiteByName.set(key, website);
    }
  }

  function websiteForOrg(orgName: string): string | null {
    return websiteByName.get(normalizeName(orgName)) ?? null;
  }

  const orgIds = new Map<string, string>();
  const locIds = new Map<string, string>(); // key: orgId|address
  const locById = new Map<string, Row>();
  const activityIds = new Map<string, string>(); // key: orgId|name|category|ageMin|ageMax

  const organizations: Row[] = [];
  const locations: Row[] = [];
  const activities: Row[] = [];
  const sessions: Row[] = [];

  let orgSeq = 1;
  let locSeq = 1;
  let actSeq = 1;
  let sessSeq = 1;

  for (const row of rows) {
    const orgName = text(row.Organization)!;
    const className = text(row["Session / Class Name"])!;
    const categoryRaw = text(row.Category);
    const category =
      (categoryRaw && CATEGORY_MAP[categoryRaw]) ||
      categoryRaw ||
      "Learning & Enrichment";
    const subcategory = text(row.Subcategory);
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
    const sourceUrl =
      text(row["Source URL"]) ??
      (text(row.Registration)?.startsWith("http")
        ? text(row.Registration)
        : null) ??
      websiteForOrg(orgName);
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
        Website: sourceUrl,
        "Contact Email": null,
        Phone: null,
        "Logo URL": ORG_LOGOS[orgName] ?? null,
        "Instagram URL": null,
        Status: "Active",
        "Source URL": sourceUrl,
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
        Neighborhood: inferNeighborhood(address, orgName),
        Borough: "Manhattan",
        "Zip Code": zip,
        Latitude: null,
        Longitude: null,
        Website: sourceUrl,
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
        "Source URL": sourceUrl,
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
      activities.push({
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
        Notes: [sessionDates, sourceType, notes].filter(Boolean).join(" · ") || null,
      });
    } else if (classDescription) {
      // Later rows may carry the blurb when the first grouping row was empty.
      const existing = activities.find(
        (a) => a["Activity ID"] === activityIds.get(actKey)
      );
      if (existing && !text(existing.Description)) {
        existing.Description = classDescription;
      }
    }
    const actId = activityIds.get(actKey)!;

    sessions.push({
      "Session ID": `SES-${pad(sessSeq++)}`,
      "Activity ID": actId,
      "Location ID": locId,
      "Session Name": [days, startTime && endTime ? `${startTime}–${endTime}` : null]
        .filter(Boolean)
        .join(" · ") || className,
      "Start Date": null,
      "End Date": null,
      "Start Time": startTime,
      "End Time": endTime,
      "Days of the Week": days,
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
    });
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

  console.log(
    `\n🎉 Imported ${activities.length} afterschool programs / ${sessions.length} sessions from Manual Entry Session.`
  );
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
