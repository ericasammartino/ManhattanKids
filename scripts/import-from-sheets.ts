/**
 * Google Sheets Import Script (API Key auth — no service account needed)
 *
 * Setup:
 *   1. Open your Google Sheet
 *   2. Click Share → General access → "Anyone with the link" → Viewer → Done
 *   3. Go to Google Cloud → APIs & Services → Credentials
 *      → + Create Credentials → API Key → copy the key
 *   4. Add two GitHub secrets:
 *        GOOGLE_SHEETS_ID  = the ID from your Sheets URL (between /d/ and /edit)
 *        GOOGLE_API_KEY    = the API key you just copied
 *
 * Usage:
 *   GOOGLE_SHEETS_ID=xxx GOOGLE_API_KEY=xxx npx tsx scripts/import-from-sheets.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const SHEET_NAMES: Record<string, string> = {
  Organizations: "organizations",
  Locations: "locations",
  Activities: "activities",
  Sessions: "sessions",
  "Incoming Data": "incoming",
};

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function fetchSheet(
  sheetsId: string,
  apiKey: string,
  sheetName: string
): Promise<Record<string, string | null>[]> {
  const encodedName = encodeURIComponent(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/${encodedName}?key=${apiKey}`;

  const raw = await httpsGet(url);
  const json = JSON.parse(raw);

  if (json.error) {
    throw new Error(`Sheets API error on "${sheetName}": ${json.error.message}`);
  }

  const rows: string[][] = json.values ?? [];
  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows
    .slice(1)
    .filter((row) => row[0] !== undefined && row[0] !== "")
    .map((row) => {
      const record: Record<string, string | null> = {};
      headers.forEach((header, i) => {
        if (header) {
          record[header] = row[i] ?? null;
        }
      });
      return record;
    });
}

async function main() {
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!sheetsId || !apiKey) {
    console.error(
      "Missing environment variables.\n" +
        "Required: GOOGLE_SHEETS_ID and GOOGLE_API_KEY\n\n" +
        "Run as:\n" +
        "  GOOGLE_SHEETS_ID=xxx GOOGLE_API_KEY=xxx npx tsx scripts/import-from-sheets.ts"
    );
    process.exit(1);
  }

  const outputDir = "src/data";
  fs.mkdirSync(outputDir, { recursive: true });

  for (const [sheetName, outputName] of Object.entries(SHEET_NAMES)) {
    try {
      console.log(`📡 Fetching sheet: ${sheetName}…`);
      const records = await fetchSheet(sheetsId, apiKey, sheetName);
      const outputPath = path.join(outputDir, `${outputName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
      console.log(`✅ ${sheetName} → ${outputPath} (${records.length} records)`);
    } catch (err) {
      console.error(`❌ Failed to fetch "${sheetName}":`, err);
    }
  }

  console.log("\n🎉 Sync complete! Run `npm run build` to publish the updates.");
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
