import Image from "next/image";
import { Suspense } from "react";
import { getAfterschoolPrograms } from "@/lib/data";
import { resolveActivityFilters } from "@/lib/activity-filters";
import SearchBar from "@/components/SearchBar";
import InterestOrbs from "@/components/InterestOrbs";
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
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 md:px-6 md:pb-10 md:pt-14">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12">
          <div className="animate-fade-up">
            <h1 className="max-w-[18ch] text-[2.35rem] font-extrabold leading-[1.08] tracking-tight text-foreground md:text-[3.1rem]">
              Find Their Next Favorite Afterschool Activity.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted md:text-base">
              Discover afterschool classes and programs on the Upper West Side.
              From sports and STEM to art, music, and everything in between.
            </p>
            <div className="mt-7">
              <SearchBar resultsPath="/" />
            </div>
          </div>

          <div
            className="animate-soft-pop relative mx-auto aspect-square w-full max-w-[440px] overflow-hidden rounded-sm md:mx-0 md:max-w-none"
            style={{ animationDelay: "120ms" }}
          >
            <Image
              src="/uws-map.jpg"
              alt="Watercolor map of the Upper West Side"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 440px"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 md:px-6">
        <h2 className="mb-7 text-center text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
          Explore by Interest
        </h2>
        <InterestOrbs resultsPath="/" />
      </section>

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
          emptyLabel="afterschool programs"
          groupedCards
          initialFilters={initialFilters}
        />
      </Suspense>
    </div>
  );
}
