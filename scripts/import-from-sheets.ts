/**
 * Google Sheets Import Script
 *
 * Fetches data from your Google Sheets database and writes JSON files
 * to src/data/. Designed to run as a cron job or GitHub Action.
 *
 * Setup:
 *   1. Export your Excel file to Google Sheets (File > Upload to Sheets)
 *   2. Create a Google Cloud project at console.cloud.google.com
 *   3. Enable the Google Sheets API
 *   4. Create a Service Account and download the JSON key
 *   5. Share your Google Sheet with the service account email
 *   6. Set environment variables:
 *        GOOGLE_SHEETS_ID=<your-spreadsheet-id>
 *        GOOGLE_SERVICE_ACCOUNT_KEY=<base64-encoded-json-key>
 *
 * Usage:
 *   npx tsx scripts/import-from-sheets.ts
 *
 * GitHub Actions example (.github/workflows/import.yml):
 *   on:
 *     schedule:
 *       - cron: '0 6 * * *'   # every day at 6am UTC
 *   jobs:
 *     import:
 *       runs-on: ubuntu-latest
 *       steps:
 *         - uses: actions/checkout@v4
 *         - uses: actions/setup-node@v4
 *           with: { node-version: '20' }
 *         - run: npm ci
 *         - run: npx tsx scripts/import-from-sheets.ts
 *           env:
 *             GOOGLE_SHEETS_ID: ${{ secrets.GOOGLE_SHEETS_ID }}
 *             GOOGLE_SERVICE_ACCOUNT_KEY: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_KEY }}
 *         - run: git add src/data && git diff --cached --quiet || git commit -m "chore: sync data from Google Sheets [skip ci]"
 *         - run: git push
 */

import * as fs from "fs";
import * as path from "path";

const SHEET_NAMES: Record<string, string> = {
  "Organizations": "organizations",
  "Locations": "locations",
  "Activities": "activities",
  "Sessions": "sessions",
  "Incoming Data": "incoming",
};

async function fetchSheet(
  sheetsId: string,
  sheetName: string,
  auth: { client_email: string; private_key: string }
): Promise<Record<string, unknown>[]> {
  // Dynamically import googleapis (run: npm install googleapis)
  const { google } = await import("googleapis").catch(() => {
    throw new Error("googleapis package not found. Run: npm install googleapis");
  });

  const authClient = new google.auth.JWT({
    email: auth.client_email,
    key: auth.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth: authClient });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetsId,
    range: `${sheetName}!A1:ZZ`,
  });

  const rows = response.data.values ?? [];
  if (rows.length < 2) return [];

  const headers = rows[0] as string[];
  return rows
    .slice(1)
    .filter((row) => row[0] !== undefined && row[0] !== "")
    .map((row) => {
      const record: Record<string, unknown> = {};
      headers.forEach((header, i) => {
        if (header) {
          record[header] = (row[i] as string | undefined) ?? null;
        }
      });
      return record;
    });
}

async function main() {
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!sheetsId || !keyBase64) {
    console.error(
      "Missing environment variables: GOOGLE_SHEETS_ID and GOOGLE_SERVICE_ACCOUNT_KEY are required."
    );
    process.exit(1);
  }

  const keyJson = JSON.parse(Buffer.from(keyBase64, "base64").toString("utf-8"));
  const outputDir = "src/data";
  fs.mkdirSync(outputDir, { recursive: true });

  for (const [sheetName, outputName] of Object.entries(SHEET_NAMES)) {
    try {
      console.log(`📡 Fetching sheet: ${sheetName}…`);
      const records = await fetchSheet(sheetsId, sheetName, keyJson);
      const outputPath = path.join(outputDir, `${outputName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
      console.log(`✅ ${sheetName} → ${outputPath} (${records.length} records)`);
    } catch (err) {
      console.error(`❌ Failed to fetch ${sheetName}:`, err);
    }
  }

  console.log("\n🎉 Sync complete!");
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
