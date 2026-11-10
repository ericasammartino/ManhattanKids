"use client";
import { useState } from "react";
import type { IncomingActivity, EnrichedActivity } from "@/types";
import { formatDate, formatTime } from "@/lib/data";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Database,
  RefreshCw,
  Upload,
  FileSpreadsheet,
} from "lucide-react";

interface Props {
  incoming: IncomingActivity[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    organizations: number;
  };
  activities: EnrichedActivity[];
}

const STATUS_COLORS: Record<string, string> = {
  "Pending Review": "bg-yellow-100 text-yellow-800",
  "Approved": "bg-green-100 text-green-800",
  "Rejected": "bg-red-100 text-red-800",
  "Duplicate": "bg-gray-100 text-gray-700",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "Pending Review": <Clock className="w-3.5 h-3.5" />,
  "Approved": <CheckCircle className="w-3.5 h-3.5" />,
  "Rejected": <AlertCircle className="w-3.5 h-3.5" />,
};

export default function AdminClient({ incoming, stats, activities }: Props) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState<"incoming" | "pipeline" | "database">("incoming");

  const filtered = incoming.filter((item) => {
    if (filterStatus === "all") return true;
    return item["Review Status"] === filterStatus;
  });

  const orgCounts = activities.reduce<Record<string, number>>((acc, a) => {
    const org = a.organization?.["Organization Name"] ?? "Unknown";
    acc[org] = (acc[org] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Manage the activities database and import pipeline
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500 mt-0.5">Live Activities</div>
        </div>
        <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
          <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-sm text-yellow-600 mt-0.5">Pending Review</div>
        </div>
        <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
          <div className="text-3xl font-bold text-green-700">{stats.approved}</div>
          <div className="text-sm text-green-600 mt-0.5">Approved</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{stats.organizations}</div>
          <div className="text-sm text-gray-500 mt-0.5">Organizations</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { id: "incoming", label: "Incoming Data", icon: <Upload className="w-4 h-4" /> },
          { id: "pipeline", label: "Import Pipeline", icon: <RefreshCw className="w-4 h-4" /> },
          { id: "database", label: "Database Summary", icon: <Database className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Incoming Data Tab */}
      {activeTab === "incoming" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-5">
            {["all", "Pending Review", "Approved", "Rejected", "Duplicate"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filterStatus === status
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "All" : status}
                {status === "Pending Review" && stats.pending > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-yellow-500 text-white rounded-full text-[10px]">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((item) => {
              const status = item["Review Status"] ?? "Unknown";
              const statusClass = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
              const statusIcon = STATUS_ICONS[status];

              return (
                <div
                  key={item["Import ID"]}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-shadow"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {item["Activity Name"]}
                      </h3>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item["Organization"]}
                      </div>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}`}
                    >
                      {statusIcon}
                      {status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                    {item["Activity Type"] && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        {item["Activity Type"]}
                      </span>
                    )}
                    {item["Category"] && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {item["Category"]}
                      </span>
                    )}
                    {item["Date"] && (
                      <span>📅 {formatDate(item["Date"])}</span>
                    )}
                    {item["Start Time"] && (
                      <span>
                        🕐 {formatTime(item["Start Time"])}
                        {item["End Time"] && ` – ${formatTime(item["End Time"])}`}
                      </span>
                    )}
                    {item["Price"] !== null && (
                      <span>
                        💰 {item["Price"] === 0 ? "Free" : `$${item["Price"]}`}
                      </span>
                    )}
                  </div>

                  {item["Description"] && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {item["Description"]}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 items-center">
                    {item["Source URL"] && (
                      <a
                        href={item["Source URL"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
                      >
                        Source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {item["Notes"] && (
                      <span className="text-xs text-gray-400 italic">
                        {item["Notes"].slice(0, 80)}…
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No items with this status</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Pipeline Tab */}
      {activeTab === "pipeline" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50">
            <h2 className="font-bold text-blue-900 text-lg mb-2">
              🔄 Automated Import Pipeline
            </h2>
            <p className="text-blue-700 text-sm mb-4">
              The pipeline below shows how data flows from source websites into your database.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { step: "1", label: "Source Monitor", desc: "Scrapes configured URLs for new activities", icon: "🌐" },
                { step: "2", label: "Incoming Data", desc: "Discovered items land in the Incoming Data queue", icon: "📥" },
                { step: "3", label: "Review", desc: "Admin reviews and approves/rejects items", icon: "👁️" },
                { step: "4", label: "Live Database", desc: "Approved items are added to the Activities sheet", icon: "✅" },
              ].map((s) => (
                <div key={s.step} className="p-3 rounded-xl bg-white border border-blue-100 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="font-semibold text-sm text-gray-900 mb-0.5">{s.label}</div>
                  <div className="text-xs text-gray-500">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-gray-200 bg-white">
            <h2 className="font-bold text-gray-900 text-lg mb-3">
              📋 Next Steps to Fully Automate
            </h2>
            <div className="space-y-4">
              {[
                {
                  title: "1. Enrich organization details",
                  badge: "Ready to run",
                  badgeColor: "bg-emerald-100 text-emerald-700",
                  desc: "After adding business names to the Organizations tab, run the enricher to fill website, type, description, email, phone, Instagram, and logo from public pages (and matching Location rows). Safe by default: it only fills empty fields.",
                  cta: "npm run enrich-orgs",
                  ctaUrl: "#",
                },
                {
                  title: "2. Move database to Google Sheets",
                  badge: "Recommended",
                  badgeColor: "bg-green-100 text-green-700",
                  desc: "Export your Excel file to Google Sheets. This enables a live API connection and allows multiple editors. The structure of your spreadsheet is already well-suited for this.",
                  cta: "sheets.google.com",
                  ctaUrl: "https://sheets.google.com",
                },
                {
                  title: "3. Set up Google Sheets API",
                  badge: "Required for sheet sync",
                  badgeColor: "bg-blue-100 text-blue-700",
                  desc: "Create a Google Cloud project, enable the Sheets API, and generate an API key. Add GOOGLE_SHEETS_ID and GOOGLE_API_KEY to your GitHub secrets for nightly sync.",
                  cta: "Google Cloud Console",
                  ctaUrl: "https://console.cloud.google.com",
                },
                {
                  title: "4. Schedule enrich + sheet sync",
                  badge: "Automation",
                  badgeColor: "bg-purple-100 text-purple-700",
                  desc: "GitHub Actions already include nightly Sheets sync and a weekly organization enricher (also runnable via workflow_dispatch). After either job updates src/data, redeploy to publish.",
                  cta: "See .github/workflows/",
                  ctaUrl: "#",
                },
                {
                  title: "5. Build a web scraper for Source Monitor",
                  badge: "Advanced",
                  badgeColor: "bg-orange-100 text-orange-700",
                  desc: "Your spreadsheet already has a 'Source Monitor' sheet tracking source URLs per organization. Build a Playwright/Puppeteer scraper that checks each URL for new events and writes them to Incoming Data for review.",
                  cta: "Learn about web scraping",
                  ctaUrl: "https://playwright.dev",
                },
              ].map((step) => (
                <div key={step.title} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${step.badgeColor}`}>
                      {step.badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.desc}</p>
                  <a
                    href={step.ctaUrl}
                    target={step.ctaUrl !== "#" ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
                  >
                    {step.cta} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet className="w-5 h-5 text-green-700" />
              <h2 className="font-bold text-gray-900">Import from Spreadsheet (Manual)</h2>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Run this command to reimport your spreadsheet data into the site&apos;s JSON files.
              After running, deploy the site to publish the updates.
            </p>
            <pre className="bg-gray-900 text-green-400 text-sm rounded-xl p-4 overflow-x-auto">
{`# From the project root:
npm run import-data

# Fill missing organization details from public websites:
npm run enrich-orgs
npm run enrich-orgs -- --dry-run
npm run enrich-orgs -- --id ORG-0001

# Or manually:
npx tsx scripts/import-from-xlsx.ts \\
  --input your-database.xlsx \\
  --output src/data/`}
            </pre>
          </div>
        </div>
      )}

      {/* Database Summary Tab */}
      {activeTab === "database" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activities by org */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-white">
              <h3 className="font-bold text-gray-900 mb-4">Activities by Organization</h3>
              <div className="space-y-2.5">
                {Object.entries(orgCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([org, count]) => (
                    <div key={org} className="flex items-center gap-3">
                      <div className="text-sm text-gray-700 flex-1 truncate">{org}</div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full bg-green-500"
                          style={{
                            width: `${Math.round((count / activities.length) * 100)}px`,
                          }}
                        />
                        <div className="text-xs font-semibold text-gray-500 w-6 text-right">
                          {count}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Activities by type */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-white">
              <h3 className="font-bold text-gray-900 mb-4">Activities by Type</h3>
              <div className="space-y-2.5">
                {Object.entries(
                  activities.reduce<Record<string, number>>((acc, a) => {
                    const type = a["Activity Type"] ?? "Unclassified";
                    acc[type] = (acc[type] ?? 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3">
                      <div className="text-sm text-gray-700 flex-1 truncate">{type}</div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full bg-blue-400"
                          style={{
                            width: `${Math.round((count / activities.length) * 100)}px`,
                          }}
                        />
                        <div className="text-xs font-semibold text-gray-500 w-6 text-right">
                          {count}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Data health */}
          <div className="p-5 rounded-2xl border border-gray-200 bg-white">
            <h3 className="font-bold text-gray-900 mb-4">Data Health</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "With descriptions",
                  count: activities.filter((a) => a["Description"]).length,
                  total: activities.length,
                },
                {
                  label: "With age ranges",
                  count: activities.filter(
                    (a) => a["Age Minimum"] !== null || a["Age Maximum"] !== null
                  ).length,
                  total: activities.length,
                },
                {
                  label: "With categories",
                  count: activities.filter((a) => a["Primary Category"]).length,
                  total: activities.length,
                },
                {
                  label: "With source URLs",
                  count: activities.filter((a) => a["Source URL"]).length,
                  total: activities.length,
                },
              ].map((item) => {
                const pct = Math.round((item.count / item.total) * 100);
                return (
                  <div key={item.label} className="text-center">
                    <div
                      className={`text-2xl font-bold mb-0.5 ${
                        pct >= 80
                          ? "text-green-600"
                          : pct >= 50
                          ? "text-yellow-600"
                          : "text-red-500"
                      }`}
                    >
                      {pct}%
                    </div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                    <div className="text-xs text-gray-400">
                      {item.count}/{item.total}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
