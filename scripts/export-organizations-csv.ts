/**
 * Export organizations.json → CSV you can import into Google Sheets.
 *
 * Use this after `npm run enrich-orgs` when you want the spreadsheet
 * updated. The enrich script only writes local JSON; this turns that
 * JSON into a CSV for the Organizations tab.
 *
 * Usage:
 *   npx tsx scripts/export-organizations-csv.ts
 *   npx tsx scripts/export-organizations-csv.ts --out ~/Downloads/organizations.csv
 *
 * Then in Google Sheets:
 *   Organizations tab → File → Import → Upload → Replace current sheet
 *   (or open the CSV and copy/paste into the Organizations tab)
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const DEFAULT_HEADERS = [
  "Organization ID",
  "Organization Name",
  "Organization Type",
  "Description",
  "Website",
  "Contact Email",
  "Phone",
  "Logo URL",
  "Instagram URL",
  "Status",
  "Source URL",
  "Last Verified",
  "Notes",
  "External ID",
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseArgs(argv: string[]) {
  const idx = argv.indexOf("--out");
  const dataIdx = argv.indexOf("--data-dir");
  return {
    out:
      idx !== -1 && argv[idx + 1]
        ? argv[idx + 1]
        : path.join(os.homedir(), "Downloads", "organizations-enriched.csv"),
    dataDir: dataIdx !== -1 && argv[dataIdx + 1] ? argv[dataIdx + 1] : "src/data",
  };
}

function main() {
  const { out, dataDir } = parseArgs(process.argv.slice(2));
  const inputPath = path.join(dataDir, "organizations.json");
  if (!fs.existsSync(inputPath)) {
    console.error(`Missing ${inputPath}. Run npm run sync-sheets / enrich-orgs first.`);
    process.exit(1);
  }

  const orgs = JSON.parse(fs.readFileSync(inputPath, "utf8")) as Record<
    string,
    string | null
  >[];
  if (!orgs.length) {
    console.error("organizations.json is empty.");
    process.exit(1);
  }

  const headers = DEFAULT_HEADERS.filter((h) =>
    orgs.some((o) => Object.prototype.hasOwnProperty.call(o, h))
  );
  // Keep any unexpected extra keys at the end
  const extras = Object.keys(orgs[0]).filter((k) => !headers.includes(k));
  const allHeaders = [...headers, ...extras];

  const lines = [
    allHeaders.map(csvEscape).join(","),
    ...orgs.map((org) =>
      allHeaders.map((h) => csvEscape(org[h] ?? "")).join(",")
    ),
  ];

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");

  const withWebsite = orgs.filter((o) => o.Website).length;
  console.log(`✅ Exported ${orgs.length} organizations → ${out}`);
  console.log(`   ${withWebsite}/${orgs.length} have a Website`);
  console.log(`
Next steps (Google Sheets):
  1. Open your spreadsheet → Organizations tab
  2. File → Import → Upload → select:
       ${out}
  3. Import location: Replace current sheet
  4. Click Import data
`);
}

main();
