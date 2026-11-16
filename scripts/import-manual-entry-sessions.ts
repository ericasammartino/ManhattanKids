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

const CATEGORY_MAP: Record<string, string> = {
  "Sports & Movement": "Sports & Movement",
  "Arts & Creativity": "Arts & Creativity",
  "Learning & Enrichment": "Learning & Enrichment",
  STEM: "STEM & Discovery",
  "STEM & Discovery": "STEM & Discovery",
  "Afterschool Care": "Learning & Enrichment",
  "Play & Exploration": "Nature & Outdoors",
  "Museums & Culture": "Museums & Culture",
  Entertainment: "Entertainment",
};

/** Keep in sync with src/data/org-logos.ts */
const ORG_LOGOS: Record<string, string> = {
  "Marlene Meyerson JCC Manhattan": "/logos/marlene-meyerson-jcc.png",
  "West Side YMCA Y Afterschool": "/logos/ymca.jpg",
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
};

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

/** "5:10 PM" → "17:10" */
function to24h(value: unknown): string | null {
  const s = text(value);
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) {
    // already 24h-ish
    if (/^\d{1,2}:\d{2}$/.test(s)) return s.padStart(5, "0");
    return s;
  }
  let h = Number(m[1]);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function parseZip(address: string | null): string | null {
  if (!address) return null;
  const m = address.match(/\b(100\d{2})\b/);
  return m ? m[1] : null;
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

  const orgIds = new Map<string, string>();
  const locIds = new Map<string, string>(); // key: orgId|address
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
    const address = text(row.Address);
    const notes = text(row.Notes);
    const sourceUrl = text(row["Source URL"]);
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
      locations.push({
        "Location ID": id,
        "Location Name": orgName,
        "Organization ID": orgId,
        "Venue Type": null,
        Description: null,
        "Street Address": address,
        "Address Line 2": null,
        Neighborhood: null, // inferred later from zip in data.ts
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
      });
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
        Description: notes,
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
        Notes: [sessionDates, sourceType].filter(Boolean).join(" · ") || null,
      });
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
      "Price Notes": sessionDates,
      Availability: "Available",
      "Registration Opens": null,
      "Registration Closes": null,
      "Registration URL": sourceUrl,
      Status: "Active",
      "Source URL": sourceUrl,
      "Last Verified": null,
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
