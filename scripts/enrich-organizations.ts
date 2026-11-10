/**
 * Enrich Organizations automation
 *
 * Fills missing Organization fields from:
 *   1. Matching Location website / phone values
 *   2. Optional DuckDuckGo HTML search for a public website
 *   3. Public website HTML (meta description, contact email, phone,
 *      Instagram, logo / og:image)
 *
 * Only fills empty/null fields by default. Existing values are preserved
 * unless you pass --force.
 *
 * Usage:
 *   npx tsx scripts/enrich-organizations.ts
 *   npx tsx scripts/enrich-organizations.ts --dry-run
 *   npx tsx scripts/enrich-organizations.ts --id ORG-0001
 *   npx tsx scripts/enrich-organizations.ts --limit 5
 *   npx tsx scripts/enrich-organizations.ts --no-search
 *   npx tsx scripts/enrich-organizations.ts --data-dir src/data
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

interface Organization {
  "Organization ID": string;
  "Organization Name": string;
  "Organization Type": string | null;
  Description: string | null;
  Website: string | null;
  "Contact Email": string | null;
  Phone: string | null;
  "Logo URL": string | null;
  "Instagram URL": string | null;
  Status: string | null;
  "Source URL": string | null;
  "Last Verified": string | null;
  Notes: string | null;
  "External ID": string | null;
  [key: string]: string | null;
}

interface Location {
  "Organization ID": string;
  Website: string | null;
  Phone: string | null;
  "Source URL": string | null;
  [key: string]: string | number | null;
}

const USER_AGENT =
  "ManhattanKidsOrgEnricher/1.0 (+https://github.com/ericasammartino/ManhattanKids; educational directory)";

const TYPE_RULES: Array<{ type: string; pattern: RegExp }> = [
  { type: "Museum", pattern: /\bmuseum\b/i },
  { type: "Historical Society", pattern: /historical\s+society|history\s+museum|nyhistory/i },
  { type: "Theater", pattern: /theater|theatre|marionette|puppet/i },
  { type: "Playground / Park", pattern: /playground|\bnycgovparks\b/i },
  { type: "Community Center", pattern: /\bjcc\b|community\s+center|ymca/i },
  { type: "Gym / Fitness", pattern: /\bmy\s*gym\b|\bgym\b|fitness|funfit/i },
  { type: "Arts / Mindfulness", pattern: /\bspark\b|yoga|meditation|art\s+class/i },
  { type: "STEM / Education", pattern: /robo|stem|coding|science/i },
  { type: "Play Space", pattern: /play\s*street|playday|kidville|indoor\s+play/i },
  { type: "Classes / Programs", pattern: /discovery\s+program|class|program|lesson|studio/i },
];

/**
 * Optional known official sites keyed by Organization ID.
 * Used when Location data and web search do not yield a website.
 * Keep this lightweight — the scraper still verifies/fills details live.
 */
const WEBSITE_SEEDS: Record<string, string> = {
  "ORG-0006": "https://www.mygym.com/west79/",
  "ORG-0007": "https://www.robofun.org/",
  "ORG-0008": "https://www.thespark.nyc/",
  "ORG-0009": "https://www.discoveryprograms.com/",
  "ORG-0010": "https://www.nyhistory.org/",
  "ORG-0013": "https://www.nycgovparks.org/facilities/playgrounds/360",
};

/**
 * Public fallbacks for sites that block automated fetches (403 / empty shells).
 * Values are only applied to empty fields.
 */
const PUBLIC_FALLBACKS: Record<
  string,
  Partial<
    Pick<
      Organization,
      | "Description"
      | "Contact Email"
      | "Phone"
      | "Instagram URL"
      | "Logo URL"
      | "Organization Type"
    >
  >
> = {
  "ORG-0001": {
    "Contact Email": "info@cmom.org",
  },
  "ORG-0002": {
    Description:
      "The American Museum of Natural History is one of the world’s preeminent scientific and cultural institutions, welcoming families to explore exhibitions, collections, and programs across natural history.",
    "Contact Email": "info@amnh.org",
    Phone: "(212) 769-5100",
    "Instagram URL": "https://www.instagram.com/amnh",
    "Logo URL": "https://www.amnh.org/favicon.ico",
  },
  "ORG-0005": {
    "Contact Email": "info@funfitnyc.com",
  },
  "ORG-0008": {
    Phone: "(917) 817-7142",
  },
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

const PLACEHOLDER_EMAIL =
  /^(user@domain\.com|your@email\.com|email@example\.com|name@email\.com|someone@example\.com)$/i;

function isEmpty(value: string | null | undefined): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw || isEmpty(raw)) return null;
  let url = raw.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString().replace(/\/$/, "") === `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "")
      ? parsed.toString()
      : parsed.toString();
  } catch {
    return null;
  }
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchText(
  url: string,
  redirects = 0
): Promise<{ url: string; body: string; statusCode: number } | null> {
  return new Promise((resolve) => {
    if (redirects > 5) {
      resolve(null);
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      resolve(null);
      return;
    }

    const lib = parsed.protocol === "http:" ? http : https;
    const req = lib.request(
      parsed,
      {
        method: "GET",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 15000,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;

        if ([301, 302, 303, 307, 308].includes(status) && location) {
          const next = new URL(location, parsed).toString();
          res.resume();
          fetchText(next, redirects + 1).then(resolve);
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          // Cap body size ~1.5MB
          if (Buffer.concat(chunks).length > 1_500_000) {
            res.destroy();
          }
        });
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({ url: parsed.toString(), body, statusCode: status });
        });
      }
    );

    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["'][^>]*>`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(decodeHtmlEntities(match[1]));
  }
  return null;
}

function extractEmails(html: string): string[] {
  const emails = new Set<string>();
  const mailto = html.matchAll(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
  for (const match of mailto) emails.add(match[1].toLowerCase());

  const plain = html.matchAll(
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|org|net|edu|nyc|io|co))\b/gi
  );
  for (const match of plain) {
    const email = match[1].toLowerCase();
    if (
      PLACEHOLDER_EMAIL.test(email) ||
      email.includes("example.com") ||
      email.includes("domain.com") ||
      email.endsWith(".png") ||
      email.endsWith(".jpg") ||
      email.includes("sentry") ||
      email.includes("wixpress") ||
      email.includes("cloudflare") ||
      email.includes("schema.org")
    ) {
      continue;
    }
    emails.add(email);
  }

  const preferred = [...emails].sort((a, b) => {
    const score = (e: string) =>
      (e.startsWith("info@") ? 0 : e.startsWith("hello@") ? 1 : e.startsWith("contact@") ? 2 : 3);
    return score(a) - score(b);
  });
  return preferred;
}

function extractPhones(html: string): string[] {
  const phones = new Set<string>();
  const tel = html.matchAll(/tel:([+\d().\-\s]{7,})/gi);
  for (const match of tel) {
    const normalized = normalizePhone(match[1]);
    if (normalized) phones.add(normalized);
  }

  const us = html.matchAll(
    /(?:\+1[\s\-.]*)?(?:\(?\d{3}\)?[\s\-.]*)\d{3}[\s\-.]+\d{4}\b/g
  );
  for (const match of us) {
    const normalized = normalizePhone(match[0]);
    if (normalized) phones.add(normalized);
  }
  return [...phones];
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // Reject obvious placeholders (000..., 1234567890, 9999999999, etc.)
  if (/^(\d)\1{9,}$/.test(digits.replace(/^1/, "")) || digits.replace(/^1/, "") === "1234567890") {
    return null;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    const local = digits.slice(1);
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits === "311") return "311";
  return null;
}

function extractInstagram(html: string, baseUrl: string): string | null {
  const matches = html.matchAll(
    /(?:href|content)=["'](https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]+\/?)["']/gi
  );
  for (const match of matches) {
    const url = match[1].replace(/\/$/, "");
    if (/instagram\.com\/(p|reel|stories|explore|accounts)\b/i.test(url)) continue;
    return url;
  }

  // Relative profile links are uncommon; absolute only.
  void baseUrl;
  return null;
}

function extractLogo(html: string, baseUrl: string): string | null {
  const candidates = [
    extractMeta(html, "og:image"),
    extractMeta(html, "twitter:image"),
    (() => {
      const match = html.match(
        /<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i
      );
      return match?.[1] ?? null;
    })(),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const absolute = new URL(candidate, baseUrl).toString();
      if (/\.(svg|png|jpe?g|webp)(\?|$)/i.test(absolute) || absolute.includes("logo")) {
        return absolute;
      }
      return absolute;
    } catch {
      continue;
    }
  }
  return null;
}

function extractDescription(html: string): string | null {
  const meta =
    extractMeta(html, "description") ||
    extractMeta(html, "og:description") ||
    extractMeta(html, "twitter:description");
  if (meta) {
    const cleaned = cleanText(meta);
    if (cleaned.length >= 40) {
      return cleaned.length > 400 ? `${cleaned.slice(0, 397)}...` : cleaned;
    }
  }

  // Fallback: first meaningful paragraph on the page
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => cleanText(decodeHtmlEntities(m[1].replace(/<[^>]+>/g, " "))))
    .filter((p) => p.length >= 60 && !/cookie|privacy|subscribe|sign up/i.test(p));
  if (!paragraphs.length) return null;
  const cleaned = paragraphs[0];
  return cleaned.length > 400 ? `${cleaned.slice(0, 397)}...` : cleaned;
}

function inferType(name: string, description: string | null, website: string | null): string | null {
  // Prefer signals from the organization name first so marketing copy
  // (e.g. "fitness" on a JCC page) does not mis-classify the org.
  for (const rule of TYPE_RULES) {
    if (rule.pattern.test(name)) return rule.type;
  }
  const haystack = `${description ?? ""} ${website ?? ""}`;
  for (const rule of TYPE_RULES) {
    if (rule.pattern.test(haystack)) return rule.type;
  }
  return "Kids Activity Provider";
}

function locationWebsiteMap(locations: Location[]): Map<string, { website?: string; phone?: string }> {
  const map = new Map<string, { website?: string; phone?: string }>();
  for (const loc of locations) {
    const id = loc["Organization ID"];
    if (!id) continue;
    const current = map.get(id) ?? {};
    if (!current.website && !isEmpty(String(loc.Website ?? ""))) {
      current.website = String(loc.Website);
    }
    if (!current.phone && !isEmpty(String(loc.Phone ?? ""))) {
      current.phone = String(loc.Phone);
    }
    map.set(id, current);
  }
  return map;
}

async function discoverWebsite(orgName: string): Promise<string | null> {
  const query = encodeURIComponent(`${orgName} Manhattan NYC kids official site`);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;
  const result = await fetchText(searchUrl);
  if (!result || result.statusCode >= 400) return null;

  const hrefs = [...result.body.matchAll(/uddg=([^&"]+)/gi)].map((m) => {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return null;
    }
  });

  const direct = [...result.body.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(
    (m) => m[1]
  );

  const candidates = [...hrefs, ...direct].filter(Boolean) as string[];
  const blocked = /(duckduckgo|google\.|bing\.|facebook\.|yelp\.|tripadvisor|wikipedia\.org|instagram\.com|youtube\.com|linkedin\.com|apple\.com\/maps|maps\.google)/i;

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate);
    if (!normalized) continue;
    if (blocked.test(normalized)) continue;
    return normalized;
  }
  return null;
}

function setIfEmpty(
  org: Organization,
  key: keyof Organization,
  value: string | null,
  force: boolean,
  filled: string[]
): void {
  if (!value || isEmpty(value)) return;
  if (!force && !isEmpty(org[key])) return;
  org[key] = value;
  filled.push(String(key));
}

async function enrichOne(
  org: Organization,
  locInfo: { website?: string; phone?: string } | undefined,
  options: { force: boolean; noSearch: boolean }
): Promise<string[]> {
  const filled: string[] = [];

  setIfEmpty(org, "Website", normalizeUrl(locInfo?.website ?? null), options.force, filled);
  setIfEmpty(org, "Phone", locInfo?.phone ? normalizePhone(locInfo.phone) ?? locInfo.phone : null, options.force, filled);
  setIfEmpty(
    org,
    "Website",
    normalizeUrl(WEBSITE_SEEDS[org["Organization ID"]] ?? null),
    options.force,
    filled
  );

  // Drop placeholder emails/phones left by site templates / prior imports
  if (org["Contact Email"] && PLACEHOLDER_EMAIL.test(org["Contact Email"])) {
    org["Contact Email"] = null;
  }
  if (org.Phone && !normalizePhone(org.Phone)) {
    org.Phone = null;
  }

  if (isEmpty(org.Website) && !options.noSearch) {
    const discovered = await discoverWebsite(org["Organization Name"]);
    setIfEmpty(org, "Website", discovered, options.force, filled);
    await sleep(400);
  }

  const website = normalizeUrl(org.Website);
  if (website) {
    if (org.Website !== website) {
      org.Website = website;
      if (!filled.includes("Website")) filled.push("Website");
    }

    const pagesToTry = [
      website,
      new URL("/contact", website).toString(),
      new URL("/contact-us", website).toString(),
      new URL("/about", website).toString(),
    ];

    let primaryHtml: string | null = null;
    let primaryUrl = website;
    const emails = new Set<string>();
    const phones = new Set<string>();
    let instagram: string | null = null;
    let logo: string | null = null;
    let description: string | null = null;

    for (let i = 0; i < pagesToTry.length; i++) {
      const page = await fetchText(pagesToTry[i]);
      if (!page || page.statusCode >= 400 || !page.body || page.body.length < 200) continue;
      if (!primaryHtml) {
        primaryHtml = page.body;
        primaryUrl = page.url;
      }
      if (!description) description = extractDescription(page.body);
      for (const email of extractEmails(page.body)) emails.add(email);
      for (const phone of extractPhones(page.body)) phones.add(phone);
      if (!instagram) instagram = extractInstagram(page.body, page.url);
      if (!logo) logo = extractLogo(page.body, page.url);

      // Keep fetching contact/about pages until we have email + phone when possible
      if (i > 0 && emails.size > 0 && phones.size > 0 && description) break;
      await sleep(200);
    }

    if (primaryHtml) {
      setIfEmpty(org, "Description", description, options.force, filled);
      setIfEmpty(org, "Contact Email", [...emails][0] ?? null, options.force, filled);
      setIfEmpty(org, "Phone", [...phones][0] ?? null, options.force, filled);
      setIfEmpty(org, "Instagram URL", instagram, options.force, filled);
      setIfEmpty(org, "Logo URL", logo, options.force, filled);
      setIfEmpty(org, "Source URL", primaryUrl, options.force, filled);
    }
  }

  const fallback = PUBLIC_FALLBACKS[org["Organization ID"]];
  if (fallback) {
    for (const [key, value] of Object.entries(fallback)) {
      setIfEmpty(org, key as keyof Organization, value ?? null, options.force, filled);
    }
  }

  const inferredType = inferType(org["Organization Name"], org.Description, org.Website);
  // Reclassify when empty or when a seed/name-based rule is more specific than a
  // generic leftover value from an earlier pass.
  if (
    options.force ||
    isEmpty(org["Organization Type"]) ||
    (inferredType &&
      org["Organization Type"] !== inferredType &&
      [
        "Kids Activity Provider",
        "Gym / Fitness",
        "Playground / Park",
        "STEM / Education",
      ].includes(org["Organization Type"] ?? ""))
  ) {
    if (inferredType && org["Organization Type"] !== inferredType) {
      org["Organization Type"] = inferredType;
      filled.push("Organization Type");
    }
  } else {
    setIfEmpty(org, "Organization Type", inferredType, options.force, filled);
  }
  setIfEmpty(org, "Status", "Active", options.force, filled);
  setIfEmpty(org, "Last Verified", todayISO(), true, filled);

  // Trim noisy blank name padding seen in sheet imports
  org["Organization Name"] = org["Organization Name"].trim();

  return filled;
}

function parseArgs(argv: string[]) {
  const get = (flag: string) => {
    const idx = argv.indexOf(flag);
    return idx === -1 ? undefined : argv[idx + 1];
  };
  return {
    dryRun: argv.includes("--dry-run"),
    force: argv.includes("--force"),
    noSearch: argv.includes("--no-search"),
    id: get("--id"),
    limit: get("--limit") ? Number(get("--limit")) : undefined,
    dataDir: get("--data-dir") ?? "src/data",
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const orgsPath = path.join(options.dataDir, "organizations.json");
  const locsPath = path.join(options.dataDir, "locations.json");

  if (!fs.existsSync(orgsPath)) {
    console.error(`Missing ${orgsPath}`);
    process.exit(1);
  }

  const organizations = JSON.parse(fs.readFileSync(orgsPath, "utf8")) as Organization[];
  const locations = fs.existsSync(locsPath)
    ? (JSON.parse(fs.readFileSync(locsPath, "utf8")) as Location[])
    : [];
  const locMap = locationWebsiteMap(locations);

  let targets = organizations;
  if (options.id) {
    targets = organizations.filter((o) => o["Organization ID"] === options.id);
    if (targets.length === 0) {
      console.error(`No organization with ID ${options.id}`);
      process.exit(1);
    }
  }
  if (options.limit && options.limit > 0) {
    targets = targets.slice(0, options.limit);
  }

  console.log(
    `Enriching ${targets.length} organization(s)${options.dryRun ? " (dry-run)" : ""}…`
  );

  let updatedCount = 0;
  for (const org of targets) {
    const before = JSON.stringify(org);
    const filled = await enrichOne(org, locMap.get(org["Organization ID"]), {
      force: options.force,
      noSearch: options.noSearch,
    });
    const changed = before !== JSON.stringify(org);
    if (changed) updatedCount += 1;
    console.log(
      `${changed ? "✅" : "•"} ${org["Organization ID"]} ${org["Organization Name"]}` +
        (filled.length ? ` → ${filled.join(", ")}` : " (no new fields)")
    );
    await sleep(250);
  }

  if (!options.dryRun) {
    fs.writeFileSync(orgsPath, `${JSON.stringify(organizations, null, 2)}\n`);
    console.log(`\nWrote ${orgsPath}`);
  }

  console.log(`\nDone. Updated ${updatedCount}/${targets.length} organizations.`);
}

main().catch((err) => {
  console.error("Enrichment failed:", err);
  process.exit(1);
});
