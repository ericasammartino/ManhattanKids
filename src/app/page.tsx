import Image from "next/image";
import { Suspense } from "react";
import { getAfterschoolPrograms } from "@/lib/data";
import { resolveActivityFilters } from "@/lib/activity-filters";
import HeroSearch from "@/components/HeroSearch";
import FilterProgramsPanel from "@/components/FilterProgramsPanel";
import ActivitiesClient from "./activities/ActivitiesClient";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const programs = getAfterschoolPrograms();
  const initialFilters = resolveActivityFilters(params, {
    defaultType: "Afterschool Program",
    defaultNeighborhood: "all",
  });

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 md:px-6 md:pb-12 md:pt-14">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12">
          <div className="animate-fade-up">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[#E67E22] md:text-[13px]">
              Upper West Side
            </p>
            <h1 className="max-w-[18ch] text-[2.35rem] font-extrabold leading-[1.08] tracking-tight text-[#1D2B4B] md:text-[3.1rem]">
              Find Their Next Favorite Afterschool Activity.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted md:text-base">
              Discover afterschool classes and programs on the Upper West Side.
              From sports and STEM to art, music, and everything in between.
            </p>
            <div className="mt-7">
              <HeroSearch resultsPath="/" />
            </div>
          </div>

          <div
            className="animate-soft-pop relative mx-auto aspect-[4/3] w-full max-w-[480px] overflow-hidden rounded-2xl md:mx-0 md:max-w-none"
            style={{ animationDelay: "120ms" }}
          >
            <Image
              src="/uws-map.jpg"
              alt="Watercolor map of the Upper West Side"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 480px"
            />
          </div>
        </div>
      </section>

      <div className="pb-4 md:pb-6">
        <Suspense fallback={null}>
          <FilterProgramsPanel resultsPath="/" />
        </Suspense>
      </div>

      <div id="programs">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-8 text-muted">
              Loading afterschool programs…
            </div>
          }
        >
          <ActivitiesClient
            activities={programs}
            title="Afterschool Programs"
            defaultType="Afterschool Program"
            defaultNeighborhood="all"
            emptyLabel="programs on the Upper West Side"
            groupedCards
            initialFilters={initialFilters}
            showCategoryPills
          />
        </Suspense>
      </div>

      <section id="about" className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#1D2B4B]">
          About
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          Little City Life helps NYC families discover afterschool classes,
          camps, and enrichment on the Upper West Side — all in one place.
        </p>
      </section>

      <section id="favorites" className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#1D2B4B]">
          Favorites
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          Save programs you love — coming soon.
        </p>
      </section>
    </div>
  );
}
