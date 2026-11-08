/**
 * Import script: converts your Excel spreadsheet → JSON data files used by the site.
 *
 * Usage:
 *   npx tsx scripts/import-from-xlsx.ts --input path/to/database.xlsx
 *   npx tsx scripts/import-from-xlsx.ts --input path/to/database.xlsx --output src/data/
 *
 * This script reads the following sheets from your workbook:
 *   - Organizations
 *   - Locations
 *   - Activities
 *   - Sessions
 *   - Incoming Data
 *
 * And writes them as JSON files to the output directory (default: src/data/).
 * Run `npm run build` after this to publish the updated data.
 */

import * as fs from "fs";
import * as path from "path";

// Dynamically import xlsx (run: npm install xlsx)
async function main() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const outputIdx = args.indexOf("--output");

  if (inputIdx === -1) {
    console.error("Usage: npx tsx scripts/import-from-xlsx.ts --input path/to/file.xlsx");
    process.exit(1);
  }

  const inputPath = args[inputIdx + 1];
  const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : "src/data";

  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  // Try to load xlsx
  let XLSX: typeof import("xlsx");
  try {
    XLSX = await import("xlsx");
  } catch {
    console.error("xlsx package not found. Run: npm install xlsx");
    process.exit(1);
  }

  console.log(`📂 Reading: ${inputPath}`);
  const workbook = XLSX.readFile(inputPath);

  const SHEET_MAP: Record<string, string> = {
    "Organizations": "organizations",
    "Locations": "locations",
    "Activities": "activities",
    "Sessions": "sessions",
    "Incoming Data": "incoming",
  };

  fs.mkdirSync(outputDir, { recursive: true });

  for (const [sheetName, outputName] of Object.entries(SHEET_MAP)) {
    if (!workbook.SheetNames.includes(sheetName)) {
      console.warn(`⚠️  Sheet "${sheetName}" not found, skipping.`);
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      raw: false,
      dateNF: "yyyy-mm-dd",
    }) as Record<string, unknown>[];

    // Filter to rows that have a primary key (first column not empty)
    const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[];
    const primaryKey = headerRow[0];
    const records = rows.filter(
      (r) => r[primaryKey] !== null && r[primaryKey] !== undefined && r[primaryKey] !== ""
    );

    const outputPath = path.join(outputDir, `${outputName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
    console.log(`✅ ${sheetName} → ${outputPath} (${records.length} records)`);
  }

  console.log("\n🎉 Import complete! Run `npm run build` to publish the updated data.");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
