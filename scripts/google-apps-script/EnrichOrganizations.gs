/**
 * Manhattan Kids — Enrich Organizations (writes INTO your spreadsheet)
 * =====================================================================
 * This fills empty Organization columns (Website, Type, Description,
 * Email, Phone, Instagram, Logo, Status, Last Verified, Source URL)
 * by reading public websites. It only fills blank cells.
 *
 * WHY THIS EXISTS:
 *   `npm run enrich-orgs` updates src/data/organizations.json for the
 *   website. It does NOT update Google Sheets. Run THIS script inside
 *   your spreadsheet to enrich the Organizations tab where you edit.
 *
 * HOW TO INSTALL:
 *   1. Open your Google Sheet
 *   2. Extensions → Apps Script
 *   3. File → New → Script file → name it EnrichOrganizations
 *   4. Paste this entire file, Save
 *   5. Select enrichOrganizations from the function dropdown → Run
 *   6. Approve permissions the first time (it needs to fetch websites)
 *
 * OPTIONAL:
 *   Run setupOrgEnrichMenu() once to add a "Manhattan Kids" menu
 *   with "Enrich Organizations" in the spreadsheet UI.
 */

var ORG_SHEET_NAME = "Organizations";
var LOC_SHEET_NAME = "Locations";

// Known official sites keyed by Organization ID (used when Website is blank
// and Locations also has no website). Add new IDs here as needed.
var WEBSITE_SEEDS = {
  "ORG-0006": "https://www.mygym.com/west79/",
  "ORG-0007": "https://www.robofun.org/",
  "ORG-0008": "https://www.thespark.nyc/",
  "ORG-0009": "https://www.discoveryprograms.com/",
  "ORG-0010": "https://www.nyhistory.org/",
  "ORG-0013": "https://www.nycgovparks.org/facilities/playgrounds/360",
};

var PUBLIC_FALLBACKS = {
  "ORG-0001": { "Contact Email": "info@cmom.org" },
  "ORG-0002": {
    Description:
      "The American Museum of Natural History is one of the world’s preeminent scientific and cultural institutions, welcoming families to explore exhibitions, collections, and programs across natural history.",
    "Contact Email": "info@amnh.org",
    Phone: "(212) 769-5100",
    "Instagram URL": "https://www.instagram.com/amnh",
  },
  "ORG-0005": { "Contact Email": "info@funfitnyc.com" },
  "ORG-0008": { Phone: "(917) 817-7142" },
  "ORG-0009": {
    "Contact Email": "info@discoveryprograms.com",
    "Organization Type": "Classes / Programs",
  },
  "ORG-0010": {
    Description:
      "New York’s first museum, The New York Historical documents over 400 years of American history through exhibitions, collections, and educational programs for families and students.",
    Phone: "(212) 873-3400",
    "Instagram URL": "https://www.instagram.com/nyhistory",
  },
  "ORG-0013": {
    Description:
      "Hippo Playground in Riverside Park (W. 91st Street) is a popular NYC Parks playground with accessible play features and a water play area for young kids.",
    Phone: "311",
    "Organization Type": "Playground / Park",
  },
};

function setupOrgEnrichMenu() {
  SpreadsheetApp.getUi()
    .createMenu("Manhattan Kids")
    .addItem("Enrich Organizations", "enrichOrganizations")
    .addToUi();
}

function onOpen() {
  try {
    setupOrgEnrichMenu();
  } catch (e) {
    // Ignore if UI is unavailable (e.g. time-driven triggers)
  }
}

function enrichOrganizations() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ORG_SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Sheet "' + ORG_SHEET_NAME + '" not found.');
    return;
  }

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    SpreadsheetApp.getUi().alert("Organizations sheet has no data rows.");
    return;
  }

  var headers = values[0].map(function (h) {
    return String(h || "").trim();
  });
  var col = headerIndex(headers);
  requireCols(col, ["Organization ID", "Organization Name"]);

  var locWebsites = loadLocationWebsites(ss);
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var updated = 0;
  var skipped = 0;
  var errors = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var orgId = cell(row, col["Organization ID"]);
    var name = cell(row, col["Organization Name"]);
    if (!orgId && !name) {
      skipped++;
      continue;
    }

    try {
      var changed = enrichRow_(sheet, r + 1, row, col, orgId, name, locWebsites, today);
      if (changed) updated++;
      else skipped++;
      Utilities.sleep(250);
    } catch (err) {
      errors.push((orgId || name) + ": " + err.message);
      Logger.log("Enrich error " + (orgId || name) + ": " + err.message);
    }
  }

  var msg =
    "Done.\n\nUpdated rows: " +
    updated +
    "\nUnchanged / empty: " +
    skipped +
    (errors.length ? "\n\nErrors:\n- " + errors.slice(0, 8).join("\n- ") : "");
  SpreadsheetApp.getUi().alert(msg);
  Logger.log(msg);
}

function enrichRow_(sheet, rowNumber, row, col, orgId, name, locWebsites, today) {
  var filled = [];
  var website = cell(row, col.Website);

  if (!website && locWebsites[orgId]) {
    website = locWebsites[orgId];
    setIfBlank_(sheet, rowNumber, col, row, "Website", website, filled);
  }
  if (!website && WEBSITE_SEEDS[orgId]) {
    website = WEBSITE_SEEDS[orgId];
    setIfBlank_(sheet, rowNumber, col, row, "Website", website, filled);
  }

  var htmlBundle = website ? fetchOrgPages_(website) : null;
  if (htmlBundle) {
    setIfBlank_(sheet, rowNumber, col, row, "Website", htmlBundle.finalUrl || website, filled);
    setIfBlank_(sheet, rowNumber, col, row, "Description", htmlBundle.description, filled);
    setIfBlank_(sheet, rowNumber, col, row, "Contact Email", htmlBundle.email, filled);
    setIfBlank_(sheet, rowNumber, col, row, "Phone", htmlBundle.phone, filled);
    setIfBlank_(sheet, rowNumber, col, row, "Instagram URL", htmlBundle.instagram, filled);
    setIfBlank_(sheet, rowNumber, col, row, "Logo URL", htmlBundle.logo, filled);
    setIfBlank_(sheet, rowNumber, col, row, "Source URL", htmlBundle.finalUrl || website, filled);
  }

  var fallback = PUBLIC_FALLBACKS[orgId] || {};
  Object.keys(fallback).forEach(function (key) {
    setIfBlank_(sheet, rowNumber, col, row, key, fallback[key], filled);
  });

  var inferredType = inferOrgType_(
    name,
    cell(row, col.Description) || fallback.Description || "",
    cell(row, col.Website) || website || ""
  );
  setIfBlank_(sheet, rowNumber, col, row, "Organization Type", inferredType, filled);
  setIfBlank_(sheet, rowNumber, col, row, "Status", "Active", filled);

  // Always refresh verification date when we touch the row or when blank
  if (filled.length || isBlank_(cell(row, col["Last Verified"]))) {
    sheet.getRange(rowNumber, col["Last Verified"] + 1).setValue(today);
    row[col["Last Verified"]] = today;
    if (filled.indexOf("Last Verified") === -1) filled.push("Last Verified");
  }

  if (filled.length) {
    Logger.log("✅ " + orgId + " " + name + " → " + filled.join(", "));
  }
  return filled.length > 0;
}

function fetchOrgPages_(website) {
  var urls = [website];
  try {
    var base = website.replace(/\/$/, "");
    urls.push(base + "/contact");
    urls.push(base + "/contact-us");
    urls.push(base + "/about");
  } catch (e) {}

  var combined = {
    description: null,
    email: null,
    phone: null,
    instagram: null,
    logo: null,
    finalUrl: website,
  };

  for (var i = 0; i < urls.length; i++) {
    var page = fetchHtml_(urls[i]);
    if (!page) continue;
    combined.finalUrl = page.url || combined.finalUrl;
    if (!combined.description) combined.description = extractDescription_(page.body);
    if (!combined.email) combined.email = extractEmail_(page.body);
    if (!combined.phone) combined.phone = extractPhone_(page.body);
    if (!combined.instagram) combined.instagram = extractInstagram_(page.body);
    if (!combined.logo) combined.logo = extractLogo_(page.body, page.url || urls[i]);
    if (combined.email && combined.phone && combined.description) break;
    Utilities.sleep(150);
  }
  return combined;
}

function fetchHtml_(url) {
  try {
    var res = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        "User-Agent":
          "ManhattanKidsOrgEnricher/1.0 (Google Apps Script; kids activity directory)",
        Accept: "text/html",
      },
    });
    var code = res.getResponseCode();
    if (code >= 400) return null;
    var body = res.getContentText();
    if (!body || body.length < 200) return null;
    return { url: url, body: body };
  } catch (e) {
    return null;
  }
}

function setIfBlank_(sheet, rowNumber, col, row, key, value, filled) {
  if (col[key] === undefined) return;
  if (value === null || value === undefined || String(value).trim() === "") return;
  var current = cell(row, col[key]);
  if (!isBlank_(current)) return;
  // Skip placeholder junk
  if (key === "Contact Email" && isPlaceholderEmail_(value)) return;
  if (key === "Phone") {
    value = normalizePhone_(String(value));
    if (!value) return;
  }
  sheet.getRange(rowNumber, col[key] + 1).setValue(value);
  row[col[key]] = value;
  filled.push(key);
}

function loadLocationWebsites(ss) {
  var map = {};
  var sheet = ss.getSheetByName(LOC_SHEET_NAME);
  if (!sheet) return map;
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return map;
  var headers = values[0].map(function (h) {
    return String(h || "").trim();
  });
  var col = headerIndex(headers);
  if (col["Organization ID"] === undefined || col.Website === undefined) return map;
  for (var r = 1; r < values.length; r++) {
    var id = cell(values[r], col["Organization ID"]);
    var website = cell(values[r], col.Website);
    if (id && website && !map[id]) map[id] = website;
  }
  return map;
}

function headerIndex(headers) {
  var col = {};
  headers.forEach(function (h, i) {
    if (h) col[h] = i;
  });
  return col;
}

function requireCols(col, keys) {
  keys.forEach(function (k) {
    if (col[k] === undefined) {
      throw new Error('Missing required column "' + k + '" on Organizations sheet');
    }
  });
}

function cell(row, idx) {
  if (idx === undefined || idx === null) return "";
  var v = row[idx];
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function isBlank_(v) {
  return v === null || v === undefined || String(v).trim() === "";
}

function isPlaceholderEmail_(email) {
  return /^(user@domain\.com|your@email\.com|email@example\.com|name@email\.com)$/i.test(
    String(email)
  );
}

function normalizePhone_(raw) {
  var digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits === "311") return "311";
  var local = digits.length === 11 && digits.charAt(0) === "1" ? digits.substring(1) : digits;
  if (/^(\d)\1{9}$/.test(local) || local === "1234567890") return null;
  if (local.length !== 10) return null;
  return "(" + local.substring(0, 3) + ") " + local.substring(3, 6) + "-" + local.substring(6);
}

function extractMeta_(html, prop) {
  var patterns = [
    new RegExp(
      '<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]+content=["\']([^"\']+)["\'][^>]*>',
      "i"
    ),
    new RegExp(
      '<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + prop + '["\'][^>]*>',
      "i"
    ),
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = html.match(patterns[i]);
    if (m && m[1]) return cleanText_(decodeEntities_(m[1]));
  }
  return null;
}

function extractDescription_(html) {
  var meta =
    extractMeta_(html, "description") ||
    extractMeta_(html, "og:description") ||
    extractMeta_(html, "twitter:description");
  if (meta && meta.length >= 40) return meta.length > 400 ? meta.substring(0, 397) + "..." : meta;
  var matches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  for (var i = 0; i < matches.length; i++) {
    var text = cleanText_(decodeEntities_(matches[i].replace(/<[^>]+>/g, " ")));
    if (text.length >= 60 && !/cookie|privacy|subscribe|sign up/i.test(text)) {
      return text.length > 400 ? text.substring(0, 397) + "..." : text;
    }
  }
  return null;
}

function extractEmail_(html) {
  var emails = [];
  var mailto = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi) || [];
  mailto.forEach(function (m) {
    emails.push(m.replace(/^mailto:/i, "").toLowerCase());
  });
  var plain =
    html.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|org|net|edu|nyc|io|co))\b/gi) || [];
  plain.forEach(function (e) {
    e = e.toLowerCase();
    if (
      isPlaceholderEmail_(e) ||
      e.indexOf("example.com") !== -1 ||
      e.indexOf("domain.com") !== -1 ||
      e.indexOf("sentry") !== -1 ||
      e.indexOf("wixpress") !== -1
    ) {
      return;
    }
    emails.push(e);
  });
  emails.sort(function (a, b) {
    function score(e) {
      if (e.indexOf("info@") === 0) return 0;
      if (e.indexOf("hello@") === 0) return 1;
      if (e.indexOf("contact@") === 0) return 2;
      return 3;
    }
    return score(a) - score(b);
  });
  return emails[0] || null;
}

function extractPhone_(html) {
  var tel = html.match(/tel:([+\d().\-\s]{7,})/gi) || [];
  for (var i = 0; i < tel.length; i++) {
    var n = normalizePhone_(tel[i].replace(/^tel:/i, ""));
    if (n) return n;
  }
  var us = html.match(/(?:\+1[\s\-.]*)?(?:\(?\d{3}\)?[\s\-.]*)\d{3}[\s\-.]+\d{4}\b/g) || [];
  for (var j = 0; j < us.length; j++) {
    var p = normalizePhone_(us[j]);
    if (p) return p;
  }
  return null;
}

function extractInstagram_(html) {
  var matches =
    html.match(
      /(?:href|content)=["'](https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]+\/?)["']/gi
    ) || [];
  for (var i = 0; i < matches.length; i++) {
    var url = matches[i].replace(/^[^"']+["']/, "").replace(/["']$/, "").replace(/\/$/, "");
    if (/instagram\.com\/(p|reel|stories|explore|accounts)\b/i.test(url)) continue;
    return url;
  }
  return null;
}

function extractLogo_(html, baseUrl) {
  var candidates = [
    extractMeta_(html, "og:image"),
    extractMeta_(html, "twitter:image"),
  ];
  var icon = html.match(
    /<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i
  );
  if (icon) candidates.push(icon[1]);
  for (var i = 0; i < candidates.length; i++) {
    if (!candidates[i]) continue;
    try {
      return absoluteUrl_(candidates[i], baseUrl);
    } catch (e) {}
  }
  return null;
}

function absoluteUrl_(maybeRelative, baseUrl) {
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
  if (maybeRelative.indexOf("//") === 0) return "https:" + maybeRelative;
  var base = baseUrl.replace(/\/[^\/]*$/, "/");
  if (maybeRelative.charAt(0) === "/") {
    var origin = baseUrl.match(/^https?:\/\/[^\/]+/i);
    return origin ? origin[0] + maybeRelative : base + maybeRelative.replace(/^\//, "");
  }
  return base + maybeRelative;
}

function inferOrgType_(name, description, website) {
  var rules = [
    { type: "Museum", pattern: /\bmuseum\b/i },
    { type: "Historical Society", pattern: /historical\s+society|nyhistory/i },
    { type: "Theater", pattern: /theater|theatre|marionette|puppet/i },
    { type: "Playground / Park", pattern: /playground|\bnycgovparks\b/i },
    { type: "Community Center", pattern: /\bjcc\b|community\s+center|ymca/i },
    { type: "Gym / Fitness", pattern: /\bmy\s*gym\b|\bgym\b|fitness|funfit/i },
    { type: "Arts / Mindfulness", pattern: /\bspark\b|yoga|meditation/i },
    { type: "STEM / Education", pattern: /robo|stem|coding|science/i },
    { type: "Play Space", pattern: /play\s*street|playday|kidville|indoor\s+play/i },
    { type: "Classes / Programs", pattern: /discovery\s+program|class|program|lesson|studio/i },
  ];
  var i;
  for (i = 0; i < rules.length; i++) {
    if (rules[i].pattern.test(name || "")) return rules[i].type;
  }
  var hay = (description || "") + " " + (website || "");
  for (i = 0; i < rules.length; i++) {
    if (rules[i].pattern.test(hay)) return rules[i].type;
  }
  return "Kids Activity Provider";
}

function cleanText_(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities_(s) {
  return String(s || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}
