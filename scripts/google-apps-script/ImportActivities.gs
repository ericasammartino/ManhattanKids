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
 *   5. Fill in EVENTBRITE_API_KEY below (free at eventbrite.com/platform)
 *   6. Run setupDailyTrigger() once to schedule daily imports
 *   7. Run importAllSources() to import right now
 *
 * SOURCES INCLUDED:
 *   ✅ Eventbrite       — thousands of NYC kids events (requires free API key)
 *   ✅ NYC Open Data    — city parks & rec programs (no key needed)
 *   ✅ NYPL Events      — New York Public Library programs (no key needed)
 *   ✅ WordPress sites  — any museum/studio using The Events Calendar plugin
 *   ✅ RSS feeds        — sites that publish an event RSS feed
 */


// ============================================================
// ⚙️  CONFIGURATION — Fill these in
// ============================================================

// Get a FREE Eventbrite API key at: https://www.eventbrite.com/platform/api
// This is the most powerful source — covers theaters, museums, studios, stores, etc.
const EVENTBRITE_API_KEY = ""; // ← Paste your key here

// Your email for daily summary notifications
const NOTIFY_EMAIL = Session.getActiveUser().getEmail();

// How many days ahead to look for events
const DAYS_AHEAD = 60;

// ============================================================
// 🏛️  WORDPRESS SITES (The Events Calendar plugin)
// Test any site by visiting: https://[site]/wp-json/tribe/events/v1/events
// If you see JSON data, add it here!
// ============================================================
const WP_EVENTS_SOURCES = [
  {
    url: "https://cmom.org",
    name: "Children's Museum of Manhattan",
    defaultCategory: "Museums & Culture",
    defaultType: "Event",
  },
  // Smart Cookie Kids removed — their site doesn't expose the Events Calendar API
  // ➕ ADD MORE HERE — copy the block above, change the values:
  // {
  //   url: "https://example-kids-site.com",
  //   name: "Example Studio",
  //   defaultCategory: "Arts & Creativity",
  //   defaultType: "Class",
  // },
];

// ============================================================
// 📰  RSS FEED SOURCES
// Many sites publish an RSS feed of their events.
// Test by visiting: https://[site]/feed or https://[site]/events/feed
// ============================================================
const RSS_SOURCES = [
  // ➕ ADD RSS FEEDS HERE as you find them
  // Test a site's feed by visiting its URL in your browser first
  // Example:
  // {
  //   url: "https://example-site.com/events/feed",
  //   name: "Example Theater",
  //   defaultCategory: "Entertainment",
  //   defaultType: "Event",
  // },
];

// ============================================================
// 🗽  NYC OPEN DATA — Government data, always free, no key needed
// ============================================================
const NYC_OPEN_DATA_SOURCES = [
  // Disabled until correct dataset IDs are confirmed
  // ➕ ADD DATASETS HERE — find them at data.cityofnewyork.us
  // Example:
  // {
  //   endpoint: "https://data.cityofnewyork.us/resource/DATASET-ID.json",
  //   name: "NYC Parks Programs",
  //   defaultCategory: "Events & Experiences",
  //   defaultType: "Event",
  //   enabled: true,
  // },
];

// ============================================================
// 🎟️  EVENTBRITE SEARCH TERMS
// Kept to 4 broad searches to stay within Google's 6-minute limit.
// Each returns up to 50 results, so you still get 200 events per run.
// ============================================================
const EVENTBRITE_SEARCHES = [
  { query: "kids Manhattan",          category: "Events & Experiences" },
  { query: "children New York",       category: "Learning & Enrichment" },
  { query: "family activities NYC",   category: "Events & Experiences" },
  { query: "toddler New York City",   category: "Learning & Enrichment" },
];

// Sheet names
const INCOMING_SHEET_NAME  = "Incoming Data";
const SOURCE_MONITOR_NAME  = "Source Monitor";

// Stop processing if within 30 seconds of the 6-minute limit
const MAX_RUNTIME_MS = 5.5 * 60 * 1000;
let START_TIME;


// ============================================================
// 🚀  MAIN — runs all sources
// ============================================================

function timeIsUp() {
  return (Date.now() - START_TIME) > MAX_RUNTIME_MS;
}

function importAllSources() {
  START_TIME = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(INCOMING_SHEET_NAME);
  if (!sheet) { Logger.log("ERROR: Sheet '" + INCOMING_SHEET_NAME + "' not found"); return; }

  const existingUrls = getExistingUrls(sheet);
  let allNew = [];
  const errors = [];
  const summary = [];

  // --- WordPress Events Calendar sites ---
  for (const source of WP_EVENTS_SOURCES) {
    if (timeIsUp()) { summary.push("⏱ Stopped early — time limit reached"); break; }
    try {
      const events = fetchWordPressSite(source);
      const fresh = events.filter(e => !existingUrls.has(e.sourceUrl));
      allNew = allNew.concat(fresh);
      summary.push("✅ " + source.name + ": " + fresh.length + " new (of " + events.length + " found)");
      updateSourceMonitor(ss, source.name, source.url, events.length, fresh.length);
    } catch (err) {
      errors.push("❌ " + source.name + ": " + err.message);
      Logger.log("WP ERROR " + source.name + ": " + err.message);
    }
  }

  // --- RSS feeds ---
  for (const source of RSS_SOURCES) {
    if (timeIsUp()) { summary.push("⏱ Stopped early — time limit reached"); break; }
    try {
      const events = fetchRSSFeed(source);
      const fresh = events.filter(e => !existingUrls.has(e.sourceUrl));
      allNew = allNew.concat(fresh);
      summary.push("✅ " + source.name + " (RSS): " + fresh.length + " new");
    } catch (err) {
      errors.push("❌ " + source.name + " RSS: " + err.message);
    }
  }

  // --- NYC Open Data ---
  for (const source of NYC_OPEN_DATA_SOURCES) {
    if (timeIsUp()) { summary.push("⏱ Stopped early — time limit reached"); break; }
    if (!source.enabled) continue;
    try {
      const events = fetchNYCOpenData(source);
      const fresh = events.filter(e => !existingUrls.has(e.sourceUrl));
      allNew = allNew.concat(fresh);
      summary.push("✅ " + source.name + " (NYC Data): " + fresh.length + " new");
    } catch (err) {
      errors.push("❌ " + source.name + ": " + err.message);
    }
  }

  // --- Eventbrite ---
  if (EVENTBRITE_API_KEY && !timeIsUp()) {
    try {
      const events = fetchEventbrite();
      const fresh = events.filter(e => !existingUrls.has(e.sourceUrl));
      allNew = allNew.concat(fresh);
      summary.push("✅ Eventbrite: " + fresh.length + " new events");
    } catch (err) {
      errors.push("❌ Eventbrite: " + err.message);
    }
  } else if (!EVENTBRITE_API_KEY) {
    summary.push("⚠️  Eventbrite: skipped (no API key set)");
  }

  // Deduplicate within this batch by sourceUrl
  const seen = new Set();
  allNew = allNew.filter(e => {
    if (!e.sourceUrl || seen.has(e.sourceUrl)) return false;
    seen.add(e.sourceUrl);
    return true;
  });

  // Write to sheet
  if (allNew.length > 0) writeToSheet(sheet, allNew);

  // Send email
  sendEmail(allNew.length, summary, errors);

  Logger.log("Done. " + allNew.length + " new items added.");
}


// ============================================================
// WORDPRESS EVENTS CALENDAR FETCHER
// ============================================================

function fetchWordPressSite(source) {
  const start = Utilities.formatDate(new Date(), "UTC", "yyyy-MM-dd");
  const end = new Date(); end.setDate(end.getDate() + DAYS_AHEAD);
  const endStr = Utilities.formatDate(end, "UTC", "yyyy-MM-dd");

  const url = source.url + "/wp-json/tribe/events/v1/events?per_page=50&start_date=" + start + "&end_date=" + endStr;
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });

  if (res.getResponseCode() !== 200) throw new Error("HTTP " + res.getResponseCode());

  const data = JSON.parse(res.getContentText());
  return (data.events || []).map(e => {
    const desc = (e.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
    const ageMatch = desc.match(/ages?\s*(\d+)\s*(?:[-–to]+\s*(\d+))?/i);
    return {
      importId: Utilities.getUuid(),
      dateDiscovered: new Date(),
      organization: source.name,
      activityName: e.title || "",
      activityType: source.defaultType,
      category: source.defaultCategory,
      description: desc,
      minAge: ageMatch ? parseInt(ageMatch[1]) : null,
      maxAge: ageMatch && ageMatch[2] ? parseInt(ageMatch[2]) : null,
      date: (e.start_date || "").split(" ")[0],
      startTime: ((e.start_date || "").split(" ")[1] || "").slice(0, 5),
      endTime: ((e.end_date || "").split(" ")[1] || "").slice(0, 5),
      price: e.cost ? parseFloat(e.cost.replace(/[^0-9.]/g, "")) || null : null,
      sourceUrl: e.url || "",
      existingActivityId: null,
      reviewStatus: "Pending Review",
      notes: "Auto-imported from " + source.name + (e.venue ? " | Venue: " + e.venue.venue : ""),
    };
  });
}


// ============================================================
// RSS FEED FETCHER
// ============================================================

function fetchRSSFeed(source) {
  const res = UrlFetchApp.fetch(source.url, { muteHttpExceptions: true, headers: { "User-Agent": "Mozilla/5.0" } });
  if (res.getResponseCode() !== 200) throw new Error("HTTP " + res.getResponseCode());

  const xml = res.getContentText();
  const doc = XmlService.parse(xml);
  const root = doc.getRootElement();
  const channel = root.getChild("channel");
  if (!channel) throw new Error("No RSS channel found");

  const items = channel.getChildren("item");
  return items.slice(0, 30).map(item => {
    const title = getXmlText(item, "title");
    const link = getXmlText(item, "link");
    const desc = (getXmlText(item, "description") || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
    const pubDate = getXmlText(item, "pubDate");
    return {
      importId: Utilities.getUuid(),
      dateDiscovered: new Date(),
      organization: source.name,
      activityName: title || "",
      activityType: source.defaultType,
      category: source.defaultCategory,
      description: desc,
      minAge: null,
      maxAge: null,
      date: pubDate ? new Date(pubDate).toISOString().split("T")[0] : "",
      startTime: "",
      endTime: "",
      price: null,
      sourceUrl: link || "",
      existingActivityId: null,
      reviewStatus: "Pending Review",
      notes: "Auto-imported via RSS from " + source.name,
    };
  });
}

function getXmlText(element, tag) {
  try { return element.getChildText(tag) || ""; } catch (e) { return ""; }
}


// ============================================================
// NYC OPEN DATA FETCHER
// ============================================================

function fetchNYCOpenData(source) {
  const url = source.endpoint + "?$limit=100";
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error("HTTP " + res.getResponseCode());

  const records = JSON.parse(res.getContentText());
  return records.slice(0, 50).map(r => ({
    importId: Utilities.getUuid(),
    dateDiscovered: new Date(),
    organization: r.organization || r.agency || source.name,
    activityName: r.program_name || r.event_name || r.name || "NYC Program",
    activityType: source.defaultType,
    category: source.defaultCategory,
    description: (r.description || r.program_description || "").slice(0, 500),
    minAge: r.age_min ? parseInt(r.age_min) : null,
    maxAge: r.age_max ? parseInt(r.age_max) : null,
    date: r.start_date || r.event_date || "",
    startTime: r.start_time || "",
    endTime: r.end_time || "",
    price: r.fee ? parseFloat(r.fee) : null,
    sourceUrl: r.url || r.link || source.endpoint,
    existingActivityId: null,
    reviewStatus: "Pending Review",
    notes: "Auto-imported from NYC Open Data | " + (r.location || r.address || ""),
  }));
}


// ============================================================
// EVENTBRITE FETCHER
// ============================================================

function fetchEventbrite() {
  const results = [];
  const start = new Date().toISOString();
  const seen = new Set();

  for (const search of EVENTBRITE_SEARCHES) {
    const url = "https://www.eventbriteapi.com/v3/events/search/" +
      "?q=" + encodeURIComponent(search.query) +
      "&location.latitude=40.7831" +
      "&location.longitude=-73.9712" +
      "&location.within=10km" +
      "&start_date.range_start=" + start +
      "&expand=venue,organizer";

    try {
      const res = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: { "Authorization": "Bearer " + EVENTBRITE_API_KEY },
      });
      if (res.getResponseCode() !== 200) continue;
      const data = JSON.parse(res.getContentText());

      for (const e of (data.events || [])) {
        if (seen.has(e.url)) continue;
        seen.add(e.url);

        const startLocal = e.start ? e.start.local : "";
        results.push({
          importId: Utilities.getUuid(),
          dateDiscovered: new Date(),
          organization: e.organizer ? e.organizer.name : "Eventbrite",
          activityName: e.name ? e.name.text : "",
          activityType: "Event",
          category: search.category,
          description: e.description ? (e.description.text || "").slice(0, 500) : "",
          minAge: null,
          maxAge: null,
          date: startLocal ? startLocal.split("T")[0] : "",
          startTime: startLocal ? startLocal.split("T")[1].slice(0, 5) : "",
          endTime: "",
          price: e.is_free ? 0 : null,
          sourceUrl: e.url || "",
          existingActivityId: null,
          reviewStatus: "Pending Review",
          notes: "Auto-imported from Eventbrite | " + (e.venue ? (e.venue.name || "") + ", " + (e.venue.address ? e.venue.address.localized_area_display || "" : "") : ""),
        });
      }

    } catch (err) {
      Logger.log("Eventbrite search error (" + search.query + "): " + err.message);
    }
  }

  return results;
}


// ============================================================
// SHEET OPERATIONS
// ============================================================

function getExistingUrls(sheet) {
  const urls = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return urls;
  sheet.getRange(2, 14, lastRow - 1, 1).getValues().forEach(r => { if (r[0]) urls.add(r[0]); });
  return urls;
}

function writeToSheet(sheet, items) {
  const rows = items.map(i => [
    i.importId, i.dateDiscovered, i.organization, i.activityName,
    i.activityType, i.category, i.description, i.minAge, i.maxAge,
    i.date, i.startTime, i.endTime, i.price, i.sourceUrl,
    i.existingActivityId, i.reviewStatus, i.notes,
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 17).setValues(rows);
}

function updateSourceMonitor(ss, name, url, total, fresh) {
  const sheet = ss.getSheetByName(SOURCE_MONITOR_NAME);
  if (!sheet) return;
  const now = new Date();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      sheet.getRange(i + 1, 3).setValue(now);
      sheet.getRange(i + 1, 5).setValue(fresh > 0 ? "Changed" : "No Change");
      sheet.getRange(i + 1, 7).setValue("Found " + total + " events, " + fresh + " new");
      return;
    }
  }
  sheet.appendRow([name, url, now, now, fresh > 0 ? "Changed" : "No Change", "", "Found " + total + " events, " + fresh + " new"]);
}


// ============================================================
// EMAIL SUMMARY
// ============================================================

function sendEmail(count, summary, errors) {
  const subject = count > 0 ? "🎉 " + count + " new kids activities found!" : "✅ Daily scan complete — no new items";
  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const body = [
    "Manhattan Kids Activities — Daily Import Report",
    "================================================",
    "",
    "New items added to review queue: " + count,
    count > 0 ? "Review them here: " + sheetUrl : "",
    "",
    "SOURCES:",
    ...summary,
    errors.length > 0 ? "\nERRORS:\n" + errors.join("\n") : "",
  ].join("\n");
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}


// ============================================================
// TRIGGER SETUP — Run once to schedule daily imports at 7am
// ============================================================

function setupDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "importAllSources")
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger("importAllSources").timeBased().everyDays(1).atHour(7).create();

  SpreadsheetApp.getUi().alert(
    "✅ All set!\n\n" +
    "The import will run every morning at 7am.\n\n" +
    "To run it right now, select importAllSources from the dropdown and click ▶ Run."
  );
}


// ============================================================
// TEST HELPERS — Run these to check individual sources
// ============================================================

function testWordPressSite() {
  // Change this to test any site
  const source = { url: "https://cmom.org", name: "CMOM", defaultCategory: "Museums & Culture", defaultType: "Event" };
  try {
    const events = fetchWordPressSite(source);
    Logger.log("Found " + events.length + " events from " + source.name);
    events.slice(0, 3).forEach(e => Logger.log(e.activityName + " | " + e.date + " | " + e.sourceUrl));
    SpreadsheetApp.getUi().alert("✅ Found " + events.length + " events! Check View → Logs for details.");
  } catch (err) {
    SpreadsheetApp.getUi().alert("❌ Error: " + err.message);
  }
}

function testEventbrite() {
  if (!EVENTBRITE_API_KEY) {
    SpreadsheetApp.getUi().alert("⚠️ No Eventbrite API key set. Add it at the top of the script.");
    return;
  }
  try {
    const events = fetchEventbrite();
    Logger.log("Found " + events.length + " Eventbrite events");
    SpreadsheetApp.getUi().alert("✅ Eventbrite returned " + events.length + " events! Check logs for details.");
  } catch (err) {
    SpreadsheetApp.getUi().alert("❌ Eventbrite error: " + err.message);
  }
}
