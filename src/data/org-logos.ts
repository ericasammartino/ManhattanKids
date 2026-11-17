/**
 * Local logo paths for afterschool providers.
 * Kept separate so spreadsheet re-imports can re-apply without wiping branding.
 */
export const ORG_LOGOS: Record<string, string> = {
  "Marlene Meyerson JCC Manhattan": "/logos/marlene-meyerson-jcc.png",
  "West Side YMCA Y Afterschool": "/logos/ymca.jpg",
  "West Side YMCA": "/logos/ymca.jpg",
  "Children’s Aid-Frederick Douglass Community Center":
    "/logos/childrens-aid.png",
  "Children's Aid-Frederick Douglass Community Center":
    "/logos/childrens-aid.png",
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
  "Elliott’s Classes": "/logos/elliotts-classes.png",
  "Elliott's Classes": "/logos/elliotts-classes.png",
  "FunFit Kids": "/logos/funfit.png",
  "Central Park Tennis Center": "/logos/central-park-tennis.jpg",
  "Discovery Programs": "/logos/discovery-programs.png",
  "Harmony By Karate": "/logos/harmony-by-karate.png",
};

function normalizeOrgName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const NORMALIZED_ORG_LOGOS: Record<string, string> = Object.fromEntries(
  Object.entries(ORG_LOGOS).map(([name, path]) => [
    normalizeOrgName(name),
    path,
  ])
);

export function logoForOrganization(
  name: string | null | undefined
): string | null {
  if (!name) return null;
  return (
    ORG_LOGOS[name] ?? NORMALIZED_ORG_LOGOS[normalizeOrgName(name)] ?? null
  );
}
