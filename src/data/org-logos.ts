/**
 * Local logo paths for afterschool providers.
 * Kept separate so spreadsheet re-imports can re-apply without wiping branding.
 */
export const ORG_LOGOS: Record<string, string> = {
  "Marlene Meyerson JCC Manhattan": "/logos/marlene-meyerson-jcc.png",
  "West Side YMCA Y Afterschool": "/logos/ymca.jpg",
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
};

export function logoForOrganization(name: string | null | undefined): string | null {
  if (!name) return null;
  return ORG_LOGOS[name] ?? null;
}
