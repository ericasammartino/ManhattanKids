/**
 * Manhattan Kids Activities — Auto-Import Script
 * ================================================
 * Paste this entire file into Google Apps Script (Extensions → Apps Script)
 * then run setupDailyTrigger() once to schedule it automatically.
 *
 * HOW TO INSTALL:
 *   1. Open your Google Sheet
 *   2. Click Extensions → Apps Script
 *   3. Delete any existing code, paste this entire file
 *   4. Click Save (floppy disk icon)
 *   5. Run setupDailyTrigger() once (select it from the dropdown, click ▶ Run)
 *   6. Approve the permissions when prompted
 *   7. Done! The script will run automatically every morning at 7am.
 *
 * TO ADD A NEW SOURCE:
 *   - If it's a WordPress site using "The Events Calendar" plugin,
 *     add the site URL to WP_EVENTS_SOURCES below.
 *   - For other sources, contact your developer to add a custom fetcher.
 *
 * TO RUN MANUALLY:
 *   - Select "importAllSources" from the dropdown and click ▶ Run
 */


// ============================================================
// CONFIGURATION — Edit this section to add/remove sources
// ============================================================

// WordPress sites using "The Events Calendar" plugin.
// Most museums, studios, and activity centers use this.
// Just add the base URL — the script handles the rest.
const WP_EVENTS_SOURCES = [
  {
    url: "https://cmom.org",
    name: "Children's Museum of Manhattan",
    defaultCategory: "Museums & Culture",
    defaultType: "Event",
  },
  {
    url: "https://smartcookiekids.com",
    name: "Smart Cookie Kids",
    defaultCategory: "Learning & Enrichment",
    defaultType: "Class",
  },
  // ADD MORE SITES HERE — just copy the block above and change the values:
  // {
  //   url: "https://example-kids-site.com",
  //   name: "Example Studio",
  //   defaultCategory: "Arts & Creativity",
  //   defaultType: "Class",
  // },
];

// Eventbrite API (optional — get a free key at eventbrite.com/platform)
// Leave blank to skip Eventbrite.
const EVENTBRITE_API_KEY = "";
const EVENTBRITE_SEARCH_TERMS = ["kids NYC", "children Manhattan", "family NYC", "toddler NYC"];

// Email to notify when new activities are found (usually your email)
const NOTIFY_EMAIL = Session.getActiveUser().getEmail();

// Sheet names (don't change unless you renamed your sheets)
const INCOMING_SHEET_NAME = "Incoming Data";
const SOURCE_MONITOR_SHEET_NAME = "Source Monitor";

// How many days ahead to look for events
const DAYS_AHEAD = 90;

// ============================================================
// MAIN FUNCTION — runs all sources
// ============================================================

function importAllSources() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const incomingSheet = ss.getSheetByName(INCOMING_SHEET_NAME);

  if (!incomingSheet) {
    SpreadsheetApp.getUi().alert('Sheet "' + INCOMING_SHEET_NAME + '" not found. Check the sheet name.');
    return;
  }

  // Load existing source URLs to avoid duplicates
  const existingUrls = getExistingSourceUrls(incomingSheet);

  let allNew = [];
  const errors = [];

  // --- WordPress Events Calendar sources ---
  for (const source of WP_EVENTS_SOURCES) {
    try {
      Logger.log("Fetching: " + source.name);
      const events = fetchWordPressEvents(source);
      const newEvents = events.filter(e => !existingUrls.has(e.sourceUrl));
      allNew = allNew.concat(newEvents);
      Logger.log("  Found " + events.length + " events, " + newEvents.length + " new");
      updateSourceMonitor(ss, source.name, source.url, events.length, newEvents.length);
    } catch (err) {
      errors.push(source.name + ": " + err.message);
      Logger.log("  ERROR: " + err.message);
    }
  }

  // --- Eventbrite (if API key provided) ---
  if (EVENTBRITE_API_KEY) {
    try {
      Logger.log("Fetching Eventbrite events...");
      const events = fetchEventbriteEvents();
      const newEvents = events.filter(e => !existingUrls.has(e.sourceUrl));
      allNew = allNew.concat(newEvents);
      Logger.log("  Found " + events.length + " events, " + newEvents.length + " new");
    } catch (err) {
      errors.push("Eventbrite: " + err.message);
    }
  }

  // --- Write new items to Incoming Data sheet ---
  if (allNew.length > 0) {
    writeToIncomingSheet(incomingSheet, allNew);
    Logger.log("Wrote " + allNew.length + " new items to Incoming Data sheet");
  }

  // --- Send summary email ---
  sendSummaryEmail(allNew.length, errors);

  Logger.log("Import complete. " + allNew.length + " new items added.");
  return allNew.length;
}


// ============================================================
// WORDPRESS EVENTS CALENDAR FETCHER
// Supports any site using the "The Events Calendar" plugin
// ============================================================

function fetchWordPressEvents(source) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + DAYS_AHEAD);

  const startStr = Utilities.formatDate(startDate, "UTC", "yyyy-MM-dd");
  const endStr = Utilities.formatDate(endDate, "UTC", "yyyy-MM-dd");

  const apiUrl = source.url + "/wp-json/tribe/events/v1/events" +
    "?per_page=50" +
    "&start_date=" + startStr +
    "&end_date=" + endStr;

  const response = UrlFetchApp.fetch(apiUrl, {
    muteHttpExceptions: true,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (response.getResponseCode() !== 200) {
    throw new Error("HTTP " + response.getResponseCode() + " from " + source.url);
  }

  const data = JSON.parse(response.getContentText());
  const events = data.events || [];

  return events.map(event => normalizeWordPressEvent(event, source));
}

function normalizeWordPressEvent(event, source) {
  // Strip HTML tags from description
  const rawDesc = event.description || "";
  const description = rawDesc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);

  // Parse dates and times
  const startDate = event.start_date ? event.start_date.split(" ")[0] : "";
  const endDate = event.end_date ? event.end_date.split(" ")[0] : "";
  const startTime = event.start_date ? event.start_date.split(" ")[1] || "" : "";
  const endTime = event.end_date ? event.end_date.split(" ")[1] || "" : "";

  // Extract venue/location
  const venue = event.venue ? event.venue.venue || "" : "";

  // Parse cost
  const costStr = event.cost || "";
  const price = costStr ? parseFloat(costStr.replace(/[^0-9.]/g, "")) || null : null;

  // Extract categories
  const categories = (event.categories || []).map(c => c.name).join(", ");

  // Age info from title/description (simple heuristic)
  const ageMatch = description.match(/ages?\s*(\d+)\s*(?:[-–to]+\s*(\d+))?/i);
  const minAge = ageMatch ? parseInt(ageMatch[1]) : null;
  const maxAge = ageMatch && ageMatch[2] ? parseInt(ageMatch[2]) : null;

  return {
    importId: Utilities.getUuid(),
    dateDiscovered: new Date(),
    organization: source.name,
    activityName: event.title || "",
    activityType: source.defaultType,
    category: source.defaultCategory,
    description: description,
    minAge: minAge,
    maxAge: maxAge,
    date: startDate,
    startTime: startTime.slice(0, 5), // HH:MM
    endTime: endTime.slice(0, 5),
    price: price,
    sourceUrl: event.url || "",
    existingActivityId: null,
    reviewStatus: "Pending Review",
    notes: "Auto-imported. Venue: " + venue + (categories ? " | Categories: " + categories : ""),
  };
}


// ============================================================
// EVENTBRITE FETCHER (optional)
// ============================================================

function fetchEventbriteEvents() {
  const results = [];
  const today = new Date().toISOString();

  for (const term of EVENTBRITE_SEARCH_TERMS) {
    const url = "https://www.eventbriteapi.com/v3/events/search/" +
      "?q=" + encodeURIComponent(term) +
      "&location.address=Manhattan,+New+York" +
      "&location.within=5km" +
      "&start_date.range_start=" + today +
      "&categories=1&expand=venue,organizer" +
      "&token=" + EVENTBRITE_API_KEY;

    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) continue;

    const data = JSON.parse(response.getContentText());
    const events = data.events || [];

    for (const event of events) {
      const startUtc = event.start ? event.start.local : "";
      results.push({
        importId: Utilities.getUuid(),
        dateDiscovered: new Date(),
        organization: event.organizer ? event.organizer.name : "Eventbrite",
        activityName: event.name ? event.name.text : "",
        activityType: "Event",
        category: "Events & Experiences",
        description: event.description ? event.description.text.slice(0, 500) : "",
        minAge: null,
        maxAge: null,
        date: startUtc ? startUtc.split("T")[0] : "",
        startTime: startUtc ? startUtc.split("T")[1].slice(0, 5) : "",
        endTime: "",
        price: event.is_free ? 0 : null,
        sourceUrl: event.url || "",
        existingActivityId: null,
        reviewStatus: "Pending Review",
        notes: "Auto-imported from Eventbrite",
      });
    }
  }

  return results;
}


// ============================================================
// SHEET OPERATIONS
// ============================================================

function getExistingSourceUrls(sheet) {
  const urls = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return urls;

  // Source URL is column 14 (N)
  const urlCol = sheet.getRange(2, 14, lastRow - 1, 1).getValues();
  urlCol.forEach(row => { if (row[0]) urls.add(row[0]); });
  return urls;
}

function writeToIncomingSheet(sheet, items) {
  const rows = items.map(item => [
    item.importId,
    item.dateDiscovered,
    item.organization,
    item.activityName,
    item.activityType,
    item.category,
    item.description,
    item.minAge,
    item.maxAge,
    item.date,
    item.startTime,
    item.endTime,
    item.price,
    item.sourceUrl,
    item.existingActivityId,
    item.reviewStatus,
    item.notes,
  ]);

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 17).setValues(rows);
}

function updateSourceMonitor(ss, orgName, url, totalFound, newFound) {
  const monitorSheet = ss.getSheetByName(SOURCE_MONITOR_SHEET_NAME);
  if (!monitorSheet) return;

  const now = new Date();
  const lastRow = monitorSheet.getLastRow();

  // Find existing row for this org
  for (let i = 2; i <= lastRow; i++) {
    const cell = monitorSheet.getRange(i, 1).getValue();
    if (cell === orgName) {
      monitorSheet.getRange(i, 3).setValue(now);  // Last Checked
      monitorSheet.getRange(i, 5).setValue(newFound > 0 ? "Changed" : "No Change"); // Status
      monitorSheet.getRange(i, 7).setValue("Found " + totalFound + " events, " + newFound + " new"); // Notes
      return;
    }
  }

  // Add new row if org not found
  monitorSheet.appendRow([orgName, url, now, now, newFound > 0 ? "Changed" : "No Change", "", "Found " + totalFound + " events, " + newFound + " new"]);
}


// ============================================================
// EMAIL NOTIFICATION
// ============================================================

function sendSummaryEmail(newCount, errors) {
  const subject = newCount > 0
    ? "🎉 " + newCount + " new kids activities found!"
    : "✅ Daily activity scan complete — no new items";

  let body = "Manhattan Kids Activities — Daily Import Summary\n";
  body += "================================================\n\n";
  body += "New items added to Incoming Data: " + newCount + "\n";

  if (newCount > 0) {
    body += "\nOpen your Google Sheet to review and approve these items:\n";
    body += SpreadsheetApp.getActiveSpreadsheet().getUrl() + "\n";
  }

  if (errors.length > 0) {
    body += "\n\nErrors encountered:\n";
    errors.forEach(e => { body += "  - " + e + "\n"; });
  }

  body += "\n\nSources checked:\n";
  WP_EVENTS_SOURCES.forEach(s => { body += "  - " + s.name + " (" + s.url + ")\n"; });
  if (EVENTBRITE_API_KEY) body += "  - Eventbrite\n";

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}


// ============================================================
// TRIGGER SETUP — Run this once to schedule daily imports
// ============================================================

function setupDailyTrigger() {
  // Remove any existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === "importAllSources") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Set up a new daily trigger at 7am
  ScriptApp.newTrigger("importAllSources")
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  Logger.log("Daily trigger set! importAllSources will run every day at 7am.");
  SpreadsheetApp.getUi().alert("✅ Success! The import will now run automatically every morning at 7am.\n\nYou can also run it manually by selecting importAllSources from the dropdown.");
}


// ============================================================
// HELPER — Test a single WordPress site URL
// ============================================================

function testSingleSite() {
  // Change this URL to test any site
  const testSource = {
    url: "https://cmom.org",
    name: "Children's Museum of Manhattan",
    defaultCategory: "Museums & Culture",
    defaultType: "Event",
  };

  try {
    const events = fetchWordPressEvents(testSource);
    Logger.log("Found " + events.length + " events:");
    events.slice(0, 5).forEach(e => Logger.log(JSON.stringify(e)));
    SpreadsheetApp.getUi().alert("Found " + events.length + " events from " + testSource.name + ". Check the Apps Script logs for details.");
  } catch (err) {
    SpreadsheetApp.getUi().alert("Error: " + err.message);
  }
}
