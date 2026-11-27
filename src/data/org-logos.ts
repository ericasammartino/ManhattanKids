/**
 * Local logo paths for afterschool providers.
 * Kept separate so spreadsheet re-imports can re-apply without wiping branding.
 */
export const ORG_LOGOS: Record<string, string> = {
  "Marlene Meyerson JCC Manhattan": "/logos/marlene-meyerson-jcc.png",
  "West Side YMCA Y Afterschool": "/logos/ymca.png",
  "West Side YMCA": "/logos/ymca.png",
  "Children’s Aid-Frederick Douglass Community Center":
    "/logos/childrens-aid.png",
  "Children's Aid-Frederick Douglass Community Center":
    "/logos/childrens-aid.png",
  "Goddard Riverside - Lincoln Center": "/logos/goddard-riverside.png",
  "Goddard Riverside - Beacon": "/logos/goddard-riverside.png",
  "Supermud Pottery": "/logos/supermud.png",
  "Bloomingdale Library": "/logos/bloomingdale-library.png",
  "Riverside Library": "/logos/riverside-library.png",
  Robofun: "/logos/robofun.png",
  ZPlaySchool: "/logos/z-play.png",
  "Writopia Lab Upper West Side": "/logos/writopia-lab.png",
  "Tim Morehouse Fencing Club": "/logos/tim-morehouse-fencing.png",
  "NYC Elite Gymnastics": "/logos/nyc-elite-gymnastics.png",
  "Elliott’s Classes": "/logos/elliotts-classes.png",
  "Elliott's Classes": "/logos/elliotts-classes.png",
  "FunFit Kids": "/logos/funfit.png",
  "Central Park Tennis Center": "/logos/central-park-tennis.png",
  "Discovery Programs": "/logos/discovery-programs.png",
  "Harmony By Karate": "/logos/harmony-by-karate.png",
  "Broadway TaeKwonDo": "/logos/broadway-taekwondo.png",
  "Broadway Dance Center Children & Teens": "/logos/broadway-dance-center.png",
  "Play On! Studios": "/logos/play-on-studios.png",
  "The Art Farm": "/logos/the-art-farm.png",
  "PLAYDAY UWS": "/logos/playday-uws.png",
  "Spotlight Kids NY": "/logos/spotlight-kids-ny.png",
  "West Side Dance Studio": "/logos/west-side-dance-studio.png",
  "Dance with Miss Rachel": "/logos/dance-with-miss-rachel.png",
  "Chess Max Academy": "/logos/chess-max-academy.png",
  SOMATH: "/logos/school-of-math.png",
  "School of Math": "/logos/school-of-math.png",
  "Wise Wonder": "/logos/wise-wonder.png",
  Bonjour: "/logos/bonjour.png",
  "The Little Gym Upper Westside": "/logos/the-little-gym.png",
  "New York Empire Baseball": "/logos/ny-empire-baseball.png",
  "Mo’ Motion": "/logos/mo-motion.png",
  "Mo' Motion": "/logos/mo-motion.png",
  "Soccer Stars": "/logos/soccer-stars.png",
  "Super Soccer Stars": "/logos/soccer-stars.png",
  "Upper West Side Brazilian Jiu-Jitsu / Kenshikai":
    "/logos/uws-brazilian-jiu-jitsu.png",
  "Modern Martial Arts": "/logos/modern-martial-arts.png",
  "Steps on Broadway Academy": "/logos/steps-on-broadway.png",
  "Launch Math + Science Centers": "/logos/launch-math.png",
  "Launch @ FunFit": "/logos/launch-math.png",
  "Launch @ FunFit Kids": "/logos/launch-math.png",
  "Baker Piano Studio": "/logos/baker-piano-studio.png",
  "UWS Piano School": "/logos/uws-piano.png",
  "The Art Studio NY": "/logos/art-studio-ny.png",
  "Children's Art Classes – NYC": "/logos/childrens-art-classes.png",
  "Children’s Art Classes – NYC": "/logos/childrens-art-classes.png",
  "Arts in Action Visual Art Program": "/logos/arts-in-action.png",
  "West Amadeus Music Studio": "/logos/west-amadeus.png",
  "Bloomingdale School of Music": "/logos/bloomingdale-school-of-music.png",
  "Silver Music": "/logos/silver-music.png",
  "School of Rock — New York": "/logos/school-of-rock.png",
  "School of Rock - New York": "/logos/school-of-rock.png",
  "Anselmo Academy of Music and the Arts": "/logos/anselmo-academy.png",
  "For Art's Sake": "/logos/for-arts-sake.png",
  "Russian Children Studio": "/logos/russian-children-studio.png",
  SayNinja: "/logos/say-ninja.png",
  "Say Ninja": "/logos/say-ninja.png",
  "Imagine Skateboarding": "/logos/imagine-skateboarding.png",
};

function normalizeOrgName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B']/g, "'")
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
